#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""文档转 Markdown（Office / 电子书 / PDF → Markdown）。

对接 n8n 后端「文档转换 API (anydoc)」：POST /webhook/document-markdown。

特性：
- 零外部依赖：纯 Python 3 标准库（urllib, json, argparse 等），开箱即用。
- 输入形态：本地文件上传（multipart/form-data）、远程 URL、目录批量、多文件批量。
- 输出：Markdown 正文走 stdout（或 -o 落盘），统计与诊断走 stderr。
- 跨平台支持：自动解决 Windows 控制台默认 GBK 导致的中文乱码问题。

anydoc 纯 CPU 解析、不联网、不加载模型，所以很快（小文件约 51ms）。
它**不做 OCR** —— 扫描件与纯图片 PDF 会以 stage=unsupported 退出，那类输入走 PaddleOCR。
"""

import argparse
import json
import mimetypes
import os
import socket
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

# Windows 控制台默认 GBK，中文提示和 Markdown 正文容易乱码。
# 强制将标准流转为 UTF-8，errors="replace" 避免个别特殊字符中断转换。
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

# 环境变量键名
ENV_URL_KEY = "DOUDOU_API_URL"
# 用户标识（uuid），走 X-Uuid 请求头
ENV_KEY_KEY = "DOUDOU_API_KEY"

FALLBACK_BASE = "http://localhost:5678"
ENDPOINT = "/webhook/document-markdown"

# 技能目录（scripts/ 的上一级）
SKILL_DIR = Path(__file__).resolve().parent.parent


def find_env_file() -> Path:
    """查找 .env 配置文件：默认查找技能目录（scripts/ 的上一级），如果没有，依次向上查找（最多向上找 3 级）。"""
    candidate = SKILL_DIR / ".env"
    if candidate.is_file():
        return candidate
    current = SKILL_DIR
    for _ in range(3):
        current = current.parent
        parent_candidate = current / ".env"
        if parent_candidate.is_file():
            return parent_candidate
    return candidate


ENV_FILE = find_env_file()

DEFAULT_TIMEOUT = 600

# 上限 50MB，和 N8N_PAYLOAD_SIZE_MAX / nginx client_max_body_size 对齐。
# 超了不会回 413 —— 请求直接没响应，客户端只能干等到超时，所以发出前先自己拦。
MAX_UPLOAD_BYTES = 50 * 1024 * 1024

# 后端 format 白名单（校验参数节点里的 FORMATS + ALIASES）。
# 本地先拦一道，省下一趟白跑的请求。
FORMATS = ["doc", "docx", "odt", "pdf", "ppt", "pptx", "rtf", "epub",
           "xlsx", "ods", "odp", "csv"]
ALIASES = ["xls", "xlsm", "xlsb", "docm", "dotx", "pps", "ppsx", "pptm", "pot"]

# 目录扫描时认的文档扩展名。与后端能处理的范围保持一致：
# 图片和扫描件不在内 —— anydoc 不做 OCR，那类输入走 PaddleOCR。
DOC_SUFFIXES = {"." + e for e in FORMATS + ALIASES}

# 需要显式给 format 才认得出的格式：没有文件签名，扩展名是唯一线索。
# 走 URL 且地址里不带扩展名时（如 ?export=1）必须补 format。
NO_SIGNATURE = {"csv"}

# 拿到这两个 stage 说明该转去 OCR，不是重试能解决的
OCR_STAGES = {"unsupported", "garbled"}

def _parse_env_file(path: Path) -> dict:
    """从 .env 文件中解析键值对。"""
    res = {}
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except (OSError, UnicodeError):
        return res
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        key, sep, val = line.partition("=")
        if not sep:
            continue
        key = key.strip()
        val = val.split(" #", 1)[0].strip()
        if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
            val = val[1:-1]
        if val:
            res[key.upper()] = val
            res[key.lower()] = val
    return res


def normalize_key(raw) -> str:
    """规整用户标识：去掉首尾空白，剥掉 Bearer 前缀。

    n8n 凭据导出的值自带 `Bearer ` 前缀，原样透传会当成 uuid 的一部分发出去。
    """
    val = str(raw or "").strip()
    if val.lower().startswith("bearer "):
        val = val[7:].strip()
    return val


def resolve_config():
    """按 真实环境变量 -> .env -> 兜底默认值 的顺序取配置。

    .env 查找逻辑：默认查找技能目录（scripts/ 的上一级），如果没有，依次向上查找（最多向上找 3 级）。

    返回 (base_url, url_origin, key, key_origin)。
    """
    env_file = find_env_file()
    env_map = _parse_env_file(env_file) if env_file.is_file() else {}

    # 1. 服务地址
    v = os.environ.get(ENV_URL_KEY) or os.environ.get(ENV_URL_KEY.lower())
    if v and v.strip():
        base_url, url_origin = v.strip(), f"${ENV_URL_KEY}"
    elif env_map.get(ENV_URL_KEY):
        base_url, url_origin = env_map[ENV_URL_KEY], str(env_file)
    elif env_map.get(ENV_URL_KEY.lower()):
        base_url, url_origin = env_map[ENV_URL_KEY.lower()], str(env_file)
    else:
        base_url, url_origin = FALLBACK_BASE, "内置默认值"

    # 2. 用户标识（uuid）
    v = os.environ.get(ENV_KEY_KEY) or os.environ.get(ENV_KEY_KEY.lower())
    if normalize_key(v):
        key, key_origin = normalize_key(v), f"${ENV_KEY_KEY}"
    elif normalize_key(env_map.get(ENV_KEY_KEY)):
        key, key_origin = normalize_key(env_map[ENV_KEY_KEY]), f"{env_file} 的 {ENV_KEY_KEY}"
    elif normalize_key(env_map.get(ENV_KEY_KEY.lower())):
        key, key_origin = normalize_key(env_map[ENV_KEY_KEY.lower()]), f"{env_file} 的 {ENV_KEY_KEY.lower()}"
    else:
        key, key_origin = None, ""

    return base_url, url_origin, key, key_origin


def warn(msg: str):
    print("⚠️  " + msg, file=sys.stderr)


def die(msg: str, code: int = 1):
    print("✗ " + msg, file=sys.stderr)
    sys.exit(code)


def build_multipart(file_path: Path, fields: dict, file_field_name: str = "document") -> tuple:
    """手搓 multipart/form-data 数据包。"""
    boundary = "----doudoudoc" + uuid.uuid4().hex
    crlf = b"\r\n"
    out = bytearray()

    for name, value in fields.items():
        if value is None or value == "":
            continue
        out += b"--" + boundary.encode() + crlf
        disp = f'Content-Disposition: form-data; name="{name}"'
        out += disp.encode("utf-8") + crlf + crlf
        out += str(value).encode("utf-8") + crlf

    mime = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    out += b"--" + boundary.encode() + crlf
    disp = f'Content-Disposition: form-data; name="{file_field_name}"; filename="{file_path.name}"'
    out += disp.encode("utf-8") + crlf
    out += f"Content-Type: {mime}".encode("utf-8") + crlf + crlf
    out += file_path.read_bytes() + crlf
    out += b"--" + boundary.encode() + b"--" + crlf

    return bytes(out), "multipart/form-data; boundary=" + boundary


def build_auth_headers(key: str) -> dict:
    """构造鉴权请求头。

    后端 8 个对外 webhook 统一走 `[Tool] 用户鉴权` 子工作流，认 `X-Uuid`
    （也认 `uuid` / `X-Key` / `key`，请求头 / query / body 三处任一）。
    这里用请求头：multipart 上传时不占表单字段，URL 也不必带明文标识。
    """
    val = normalize_key(key)
    if not val:
        return {}
    return {"X-Uuid": val, "X-Key": val}


def is_url(source: str) -> bool:
    low = str(source).lower()
    return low.startswith("http://") or low.startswith("https://")


def call_api(base_url: str, source: str, fields: dict, key: str = None,
             timeout: int = DEFAULT_TIMEOUT, url_origin: str = "") -> tuple:
    """发起 HTTP 请求。自动处理文件上传或 URL 请求。"""
    full_url = base_url.rstrip("/") + ENDPOINT

    headers = {"Accept": "*/*"}
    headers.update(build_auth_headers(key))

    if is_url(source):
        req_data = dict(fields)
        req_data["url"] = source
        body = json.dumps(req_data).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    else:
        p = Path(source)
        if not p.is_file():
            die(f"找不到本地文件：{source}")
        size = p.stat().st_size
        if size > MAX_UPLOAD_BYTES:
            die(f"文件 {size / 1048576:.1f}MB 超过 50MB 上限。\n"
                "超限的请求不会回错误码，只会挂着不响应。改用 URL 形态，或先拆页。")
        if size == 0:
            die(f"文件是空的（0 字节）：{source}")
        body, ctype = build_multipart(p, fields)
        headers["Content-Type"] = ctype

    req = urllib.request.Request(full_url, data=body, method="POST", headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read(), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.headers or {})
    except urllib.error.URLError as e:
        if isinstance(e.reason, (socket.timeout, TimeoutError)) or "timed out" in str(e.reason).lower():
            die(f"请求等待超过 {timeout} 秒超时。\n"
                "anydoc 本身很快（小文件约 51ms），超时通常是大文件上传慢或远程 URL 下不动。\n"
                "可用 --timeout 加大等待时间。")
        die(f"连不上 API 端点 ({full_url})：{e.reason}\n"
            f"（当前 API 根地址来自 {url_origin}）\n"
            f"请检查 n8n 服务是否已启动，或使用 --base 指定地址，或在 .env 中配置 {ENV_URL_KEY}。")
    except (TimeoutError, socket.timeout):
        die(f"请求等待超过 {timeout} 秒超时。\n"
            "anydoc 本身很快（小文件约 51ms），超时通常是大文件上传慢或远程 URL 下不动。\n"
            "可用 --timeout 加大等待时间。")


def write_out(path_str: str, content: str):
    """安全保存文本到文件，自动创建父级目录。"""
    p = Path(path_str)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def scan_dir(d: Path, recursive: bool = False) -> list:
    """扫描目录下的文档文件，按名字排序。"""
    it = d.rglob("*") if recursive else d.glob("*")
    found = [p for p in it if p.is_file() and p.suffix.lower() in DOC_SUFFIXES]
    return sorted(found, key=lambda p: str(p).lower())


def expand_sources(raw_sources: list, recursive: bool = False) -> list:
    """把命令行给的 source 展开成待转换列表。

    URL 原样保留；目录扫描出里面的文档；文件直接用。
    """
    out = []
    for s in raw_sources:
        if is_url(s):
            out.append(s)
            continue
        p = Path(s)
        if p.is_dir():
            hits = scan_dir(p, recursive=recursive)
            if not hits:
                warn(f"目录里没有可转换的文档：{s}"
                     f"（认这些扩展名：{' '.join(sorted(DOC_SUFFIXES))}）")
            out.extend(str(h) for h in hits)
        else:
            out.append(s)
    return out


def precheck_format(source: str, fmt: str):
    """发请求前的本地提醒。拦不住的交给后端，这里只省下白跑的往返。"""
    if fmt and fmt not in FORMATS and fmt not in ALIASES:
        die(f"format 不在白名单内：{fmt}\n"
            f"可选 {' / '.join(FORMATS)}（{' / '.join(ALIASES[:3])} 这类别名也认）。\n"
            "留空让 anydoc 按文件内容判定，通常比手填更准。")

    # CSV 没有文件签名，扩展名是唯一线索。URL 地址里不带扩展名时后端认不出来，
    # 会以 stage=unsupported 回 415 —— 那个报错看起来像「格式不支持」，
    # 实际只是判不出来，很容易误判成该转去 OCR。
    if is_url(source) and not fmt:
        base = source.split("?")[0].split("#")[0].split("/")[-1]
        ext = base.rsplit(".", 1)[-1].lower() if "." in base else ""
        if ext not in FORMATS and ext not in ALIASES:
            warn(f"URL 地址里看不出扩展名（{source[:60]}...），"
                 f"若是 {' / '.join(sorted(NO_SIGNATURE))} 请显式传 --format，否则可能回 415")


def convert_one(source: str, args, base_url: str, key: str, url_origin: str,
                key_origin: str) -> dict:
    """转换单个文档，返回后端解析出的 dict（失败时带 ok=False）。"""
    precheck_format(source, args.format)

    if not is_url(source):
        p = Path(source)
        if not p.is_file():
            return {
                "ok": False,
                "stage": "validate",
                "_source": source,
                "error": f"找不到本地文件：{source}",
            }
        size = p.stat().st_size
        if size == 0:
            return {
                "ok": False,
                "stage": "validate",
                "_source": source,
                "error": f"文件是空的（0 字节）：{source}",
            }
        if size > MAX_UPLOAD_BYTES:
            return {
                "ok": False,
                "stage": "validate",
                "_source": source,
                "error": f"文件 {size / 1048576:.1f}MB 超过 50MB 上限",
                "hint": "超限的请求不会回错误码，只会挂着不响应。改用 URL 形态，或先拆页。",
            }

    fields = {
        "format": args.format,
        "max_chars": args.max_chars,
        "include_content": "false" if args.no_content else "true",
    }

    status, raw_body, headers = call_api(
        base_url=base_url, source=source, fields=fields, key=key,
        timeout=args.timeout, url_origin=url_origin,
    )

    try:
        data = json.loads(raw_body.decode("utf-8"))
    except Exception:
        body_txt = raw_body[:500].decode("utf-8", "replace")
        return {"ok": False, "stage": "client", "_source": source,
                "error": f"解析服务端响应 JSON 失败（HTTP {status}）",
                "detail": body_txt}

    data["_source"] = source
    data["_http"] = status

    if status != 200 or data.get("ok") is False:
        # 鉴权失败补一句本地配置来源，否则只能看到服务端的通用提示，
        # 不知道这次到底发出去的是哪个 uuid、从哪读到的。
        if data.get("stage") == "auth" or status in (400, 401, 403):
            where = key_origin or "未配置"
            masked = (key[:4] + "***" + key[-4:]) if key and len(key) > 8 else (key or "空")
            data["_auth_note"] = (f"本次用户标识：{masked}（来源：{where}）\n"
                                  f"改用别的标识：--key <uuid>，或改 {find_env_file()} 里的 {ENV_KEY_KEY}")
        return data

    return data


def report(data: dict, label: str):
    """把统计与诊断打到 stderr。正文不走这里。"""
    if data.get("ok") is False:
        stage = data.get("stage", "?")
        print(f"✗ {label} — [{stage}] {data.get('error', '未知错误')}", file=sys.stderr)
        for field in ("detail", "hint"):
            if data.get(field):
                print(f"  {field}: {str(data[field])[:400]}", file=sys.stderr)
        if data.get("_auth_note"):
            print("  " + data["_auth_note"].replace("\n", "\n  "), file=sys.stderr)
        if stage in OCR_STAGES:
            print("  → 这类输入 anydoc 处理不了（没有文字层），改走 PaddleOCR", file=sys.stderr)
        return

    chars = data.get("chars", "?")
    bits = [f"{chars} 字符", f"{data.get('bytes', '?')} 字节"]
    if data.get("truncated"):
        # chars 是全文长度，不是返回内容的长度 —— 截断时两者不一致
        bits.append(f"已按 max_chars 截断（chars={chars} 仍是全文长度）")
    if data.get("empty"):
        bits.append("产物为空")
    print(f"✓ {label} — " + " | ".join(bits), file=sys.stderr)

    if data.get("empty") and data.get("hint"):
        print(f"  {data['hint']}", file=sys.stderr)


def out_name(source: str) -> str:
    """由 source 推出产物文件名（不含目录）。"""
    if is_url(source):
        base = source.split("?")[0].split("#")[0].split("/")[-1] or "document"
    else:
        base = Path(source).name
    stem = base.rsplit(".", 1)[0] if "." in base else base
    safe = "".join(c for c in stem if c.isalnum() or c in "-_.()[]") or "document"
    return safe[:80] + ".md"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="文档转 Markdown（Office / 电子书 / PDF → Markdown）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""示例用法：
  # 1. 转单个文档，正文直接打到屏幕
  anydoc.py report.docx

  # 2. 存成 .md
  anydoc.py report.docx -o resources/doc/report.md

  # 3. 远程 URL
  anydoc.py https://example.com/paper.pdf -o paper.md

  # 4. 整个目录批量转，产物写进目录（文件名按原名）
  anydoc.py ./合同/ -o resources/doc/

  # 5. 大 CSV 只要前 5 万字，别爆模型上下文
  anydoc.py big.csv --max-chars 50000

  # 6. 只要落盘路径和字数，不要正文（省上下文）
  anydoc.py huge.pdf --no-content

  # 7. URL 不带扩展名的 CSV，必须显式给 format
  anydoc.py "https://api.example.com/export?id=1" --format csv

配置（.env 或环境变量）：
  DOUDOU_API_URL=http://localhost:5678       # 服务地址
  DOUDOU_API_KEY=<uuid>                      # 用户标识，走 X-Uuid 请求头
"""
    )
    parser.add_argument("source", nargs="+",
                        help="本地文档路径、目录、或远程文档 URL，可给多个")
    parser.add_argument("--format", "-f", default="",
                        help=f"输入格式，留空按文件内容判定（推荐）。可选 {' / '.join(FORMATS)}")
    parser.add_argument("--max-chars", "-m", dest="max_chars", type=int, default=0,
                        help="Markdown 截断上限字符数，0 = 不截断（默认）")
    parser.add_argument("--no-content", action="store_true",
                        help="不要正文，只回落盘路径与字数统计（大文档省上下文）")
    parser.add_argument("-o", "--output",
                        help="产物保存路径。多个输入或目录输入时当作目录处理")
    parser.add_argument("-r", "--recursive", action="store_true",
                        help="目录输入时递归子目录")
    parser.add_argument("--json", action="store_true", help="打印原始完整响应 JSON")
    parser.add_argument("--key", "--uuid", "-k", dest="key", default=None,
                        help=f"用户标识 uuid，走 X-Uuid 请求头（亦可配置在 .env 的 {ENV_KEY_KEY}）")
    parser.add_argument("--base", default=None,
                        help=f"n8n 服务根地址（默认取 .env 或 {FALLBACK_BASE}）")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT,
                        help=f"客户端超时秒数，默认 {DEFAULT_TIMEOUT}")
    return parser


def main():
    args = build_parser().parse_args()

    if args.max_chars < 0 or args.max_chars > 20000000:
        die(f"max_chars 必须是 0-20000000 的整数，收到：{args.max_chars}（0 表示不截断）")

    args.format = args.format.strip().lower().lstrip(".")

    default_base, url_origin, default_key, key_origin = resolve_config()
    base_url = args.base if args.base else default_base
    origin_desc = "--base 参数" if args.base else url_origin

    if args.key:
        key = normalize_key(args.key)
        key_origin = "--key 参数"
    else:
        key = default_key

    # 标识实际是必填的（后端鉴权子工作流里的 [测试] 始终返回成功 节点是关的），
    # 但这由部署侧决定，客户端不预判 —— 真被拒时错误分支会打出用了哪个标识、从哪读的。
    sources = expand_sources(args.source, recursive=args.recursive)
    if not sources:
        die("没有待转换的文档。检查路径是否存在，或目录里是否有支持的格式。")

    # -o 是目录还是文件：已存在的目录、或结尾带分隔符 → 目录。
    # 注意别把 multi 折进来当充分条件 —— 那样下面「批量却指向单文件」就永远拦不住，
    # `-o one.md` 会被 mkdir 成一个叫 one.md 的目录，里面塞满产物。
    multi = len(sources) > 1
    out_is_dir = bool(args.output) and (
        args.output.endswith(("/", "\\")) or Path(args.output).is_dir()
    )

    if multi and args.output and not out_is_dir:
        die(f"有 {len(sources)} 个待转文档，但 -o 看起来是单个文件（{args.output}）。\n"
            "批量转请把 -o 指向目录（结尾加 / ，或先把目录建出来），产物按原文件名命名。")

    failures = 0
    for i, src in enumerate(sources, 1):
        label = f"[{i}/{len(sources)}] {src}" if multi else src
        data = convert_one(src, args, base_url, key, origin_desc, key_origin)
        report(data, label)

        if data.get("ok") is False:
            failures += 1
            continue

        if args.json:
            body = json.dumps(data, ensure_ascii=False, indent=2)
        else:
            md = data.get("markdown")
            if md is None:
                # --no-content：后端回 null，正文本来就没要
                if not args.json:
                    print(f"  产物留在容器内：{data.get('markdown_path')}"
                          f"（宿主 {data.get('host_path')}）", file=sys.stderr)
                continue
            body = md

        if args.output:
            target = str(Path(args.output) / out_name(src)) if out_is_dir else args.output
            write_out(target, body)
            print(f"  已保存至：{target}", file=sys.stderr)
        else:
            if multi:
                print(f"\n<!-- ===== {src} ===== -->")
            print(body)

    if failures:
        print(f"\n共 {len(sources)} 个，失败 {failures} 个。", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
