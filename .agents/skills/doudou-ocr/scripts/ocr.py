#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""图片与 PDF 文字识别（OCR）。

调用 OCR 接口：POST /webhook/paddle-ocr。

特性：
- 零外部依赖：纯 Python 3 标准库（urllib, json, argparse 等），开箱即用。
- 输入形态：本地图片/PDF 上传（multipart/form-data）、远程 URL、目录批量、多文件批量。
- 输出：识别正文走 stdout（或 -o 落盘），统计与诊断走 stderr。
- 跨平台支持：自动解决 Windows 控制台默认 GBK 导致的中文乱码问题。
- 正文归一：响应里的 text / markdown 统一取成一个字符串，调用方不用分情况处理。
- 带文字层的 PDF 传本地路径，别传它的 URL —— 传 URL 实测会漏行，还慢十几倍。
"""

import argparse
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

# Windows 控制台默认 GBK，中文提示和识别正文容易乱码。
# 强制将标准流转为 UTF-8，errors="replace" 避免个别特殊字符中断识别。
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

# 环境变量键名
ENV_URL_KEY = "DOUDOU_API_URL"
# 用户标识（uuid）
ENV_KEY_KEY = "DOUDOU_API_KEY"

FALLBACK_BASE = "http://localhost:5678"
ENDPOINT = "/webhook/paddle-ocr"

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

DEFAULT_TIMEOUT = 900

# 上限 50MB，和 N8N_PAYLOAD_SIZE_MAX / nginx client_max_body_size 对齐。
# 超了不会回 413 —— 请求直接没响应，客户端只能干等到超时，所以这里先自己拦一道。
MAX_UPLOAD_BYTES = 50 * 1024 * 1024

# 支持的语种白名单。本地先校验，省下一趟白跑的请求。
# 只留 PP-OCRv6 覆盖的语种：korean / thai / russian / arabic / hindi 会退到 v5，
# 而 v5 要往只读的模型缓存目录写锁文件，必然 PermissionError，所以不放进来。
LANGS = ["ch", "en", "chinese_cht", "japan", "french", "german", "spanish",
         "portuguese", "italian", "vietnamese"]

# 常见写法映射到认的值。只认上面那 10 个，传 zh / 中文 会被挡回来。
LANG_ALIASES = {
    "zh": "ch", "zh-cn": "ch", "zh_cn": "ch", "cn": "ch", "chinese": "ch", "中文": "ch", "简体": "ch",
    "zh-tw": "chinese_cht", "zh_tw": "chinese_cht", "zh-hk": "chinese_cht", "tw": "chinese_cht",
    "cht": "chinese_cht", "traditional": "chinese_cht", "繁体": "chinese_cht", "繁體": "chinese_cht",
    "en-us": "en", "english": "en", "eng": "en", "英文": "en",
    "ja": "japan", "jp": "japan", "japanese": "japan", "日文": "japan", "日语": "japan",
    "fr": "french", "de": "german", "ger": "german", "es": "spanish", "spa": "spanish",
    "pt": "portuguese", "it": "italian", "vi": "vietnamese",
}

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tif", ".tiff", ".webp"}
# 认的扩展名集合。目录批量时按这个集合筛文件。
DOC_SUFFIXES = IMAGE_SUFFIXES | {".pdf"}

# 各失败阶段能做的动作。
STAGE_HINTS = {
    "auth": "用户标识没带上或查不到这个用户。",
    "validate": "参数没过校验（语言不在白名单、url 不是 http(s):// 开头或过长）。",
    "download": "取不到这个 URL —— 内网地址、要登录的网盘链接、限速或防盗链的图床"
                "都会走到这里。可以先把文件下到本地再上传。",
    "ocr": "识别执行失败。多数是文件本身不是有效图片或 PDF（扩展名对不代表内容对，"
           "先用别的工具打开确认），也可能是文件太大导致内存不足。",
    "parse": "服务端处理失败，不是本地参数的问题，可以重试。",
    "build": "服务端处理失败，不是本地参数的问题，可以重试。",
    "response": "对面回的不是这个接口该有的 JSON —— 多半是服务地址打到了别的服务上"
                f"（{ENDPOINT} 走错端口、前面挡了别的网关）。先核对 --base / {ENV_URL_KEY}。",
}

# 客户端自己造的失败阶段。它们的 hint 是本地写的，标成「服务端提示」会误导。
LOCAL_STAGES = {"local", "connect", "timeout", "response"}

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
    """规整用户标识：去掉首尾空白。"""
    return str(raw or "").strip()


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


def info(msg: str):
    print(msg, file=sys.stderr)


def warn(msg: str):
    print("⚠️  " + msg, file=sys.stderr)


def die(msg: str, code: int = 1):
    print("✗ " + msg, file=sys.stderr)
    sys.exit(code)


def normalize_lang(raw: str) -> str:
    """把常见语言写法映射成认的值；认不出就原样返回，交给下面的白名单判定。"""
    v = str(raw or "").strip()
    if not v:
        return "ch"
    low = v.lower()
    if low in LANGS:
        return low
    return LANG_ALIASES.get(low, LANG_ALIASES.get(v, v))


def is_url(source: str) -> bool:
    low = str(source).lower()
    return low.startswith("http://") or low.startswith("https://")


def build_multipart(file_path: Path, fields: dict, file_field_name: str = "file") -> tuple:
    """手搓 multipart/form-data 数据包。"""
    boundary = "----doudouocr" + uuid.uuid4().hex
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

    走请求头而不是表单字段或 query：multipart 上传时不占表单字段，
    URL 也不必带明文标识。
    """
    val = normalize_key(key)
    if not val:
        return {}
    return {"X-Uuid": val, "X-Key": val}


def timeout_payload(timeout: int) -> dict:
    return {"ok": False, "stage": "timeout",
            "error": f"请求等待超过 {timeout} 秒超时",
            "hint": "单张图约 5-10 秒、PDF 每页再加 3-5 秒。页数很多的 PDF 用 --timeout 加大等待。"}


def call_api(base_url: str, source: str, fields: dict, key: str = None,
             timeout: int = DEFAULT_TIMEOUT, url_origin: str = "") -> tuple:
    """发起一次识别请求。本地文件走 multipart 上传，http(s) 地址走 JSON。

    返回 (got, err)：成功时 got 是 (status, body, headers)，失败时 err 是错误负载。
    """
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
            return None, {"ok": False, "stage": "local", "error": f"找不到本地文件：{source}"}
        size = p.stat().st_size
        if size > MAX_UPLOAD_BYTES:
            return None, {"ok": False, "stage": "local",
                          "error": f"文件 {size / 1048576:.1f}MB 超过 50MB 上限",
                          "hint": "超限的请求不会回错误码，只会挂着不响应。先压缩或拆页再传。"}
        if size == 0:
            return None, {"ok": False, "stage": "local", "error": f"文件是空的（0 字节）：{source}"}
        body, ctype = build_multipart(p, fields)
        headers["Content-Type"] = ctype

    req = urllib.request.Request(full_url, data=body, method="POST", headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return (resp.status, resp.read(), dict(resp.headers)), None
    except urllib.error.HTTPError as e:
        return (e.code, e.read(), dict(e.headers or {})), None
    except urllib.error.URLError as e:
        # 连接阶段超时被 urllib 包成 URLError，读取阶段超时才直接抛 TimeoutError。
        # 都归到 timeout，否则等了半小时只看到一句「连不上」会去查地址配置。
        if isinstance(e.reason, TimeoutError):
            return None, timeout_payload(timeout)
        return None, {"ok": False, "stage": "connect",
                      "error": f"连不上 API 端点 ({full_url})：{e.reason}",
                      "hint": f"当前 API 根地址来自 {url_origin}。检查服务是否已启动，"
                              f"或用 --base 指定地址，或在 .env 中配置 {ENV_URL_KEY}。"}
    except TimeoutError:
        return None, timeout_payload(timeout)


def extract_text(data: dict) -> str:
    """把正文归一到一个字符串。

    响应可能给 text，也可能只给 markdown（PDF 直抽文字层时）。
    只认其中一个的话，另一种形状会拿到空字符串。
    """
    for field in ("text", "markdown"):
        v = data.get(field)
        if isinstance(v, str) and v:
            return v
    return ""


def summarize(data: dict, elapsed: float) -> str:
    """拼一行统计信息给 stderr。"""
    method = data.get("method") or "?"
    chars = data.get("chars")
    if chars is None:
        chars = len(extract_text(data))
    bits = [f"{chars} 字符"]
    if data.get("boxes") is not None:
        bits.append(f"{data['boxes']} 行")
    if data.get("pages") is not None:
        bits.append(f"{data['pages']} 页")
    if data.get("language"):
        bits.append(f"语种 {data['language']}")
    tag = "文字层直抽" if method == "anydoc" else "OCR 识别"
    return f"✓ [{tag}] " + " | ".join(bits) + f" | 耗时 {elapsed:.1f}s"


def format_error(err: dict, status=None, key: str = None, key_origin: str = "",
                 verbose: bool = False) -> str:
    """把错误负载拼成人能看懂的多行报错。"""
    head = f"识别失败 — {err.get('error') or '未知错误'}"
    if status:
        head = f"识别失败（HTTP {status}）— {err.get('error') or '未知错误'}"
    lines = [head]

    stage = err.get("stage")
    if stage:
        lines.append(f"阶段：{stage}")

    detail = err.get("detail")
    if detail:
        detail = str(detail)
        # 报错详情前面往往全是加载模型的噪声，有用的在尾部。
        # 默认只留尾部，全文用 --verbose 看。
        if not verbose and len(detail) > 600:
            detail = "…" + detail[-600:]
        lines.append(f"详情：{detail}")
        if not verbose and len(str(err.get('detail'))) > 600:
            lines.append("（详情已截断，完整报错加 --verbose）")

    if err.get("hint"):
        label = "提示" if stage in LOCAL_STAGES else "服务端提示"
        lines.append(f"{label}：{err['hint']}")
    if stage in STAGE_HINTS:
        lines.append(f"怎么办：{STAGE_HINTS[stage]}")

    # 鉴权失败单独补一句本地配置来源，否则不知道这次到底发出去的是哪个 uuid、从哪读到的。
    # 只按 stage 判定：光看 400 会把「地址打错、对面是别的服务」也说成鉴权问题，
    # 反倒把人引去查 uuid。
    if stage == "auth" or (not stage and status in (401, 403)):
        where = key_origin or "未配置"
        masked = (key[:4] + "***" + key[-4:]) if key and len(key) > 8 else (key or "空")
        lines.append(f"本次用户标识：{masked}（来源：{where}）")
        lines.append(f"改用别的标识：--key <uuid>，或改 {ENV_FILE} 里的 {ENV_KEY_KEY}")

    return "\n".join(lines)


def collect_sources(raw_sources: list) -> list:
    """展开命令行给的输入：URL 原样保留，文件原样保留，目录按扩展名筛出图片与 PDF。"""
    out = []
    for s in raw_sources:
        if is_url(s):
            out.append(s)
            continue
        p = Path(s)
        if p.is_dir():
            found = sorted(
                (f for f in p.iterdir() if f.is_file() and f.suffix.lower() in DOC_SUFFIXES),
                key=lambda f: f.name.lower(),
            )
            if not found:
                warn(f"目录里没有可识别的图片或 PDF：{p}（认这些扩展名："
                     + " ".join(sorted(DOC_SUFFIXES)) + "）")
            out.extend(str(f) for f in found)
            continue
        if p.is_file() and p.suffix.lower() not in DOC_SUFFIXES:
            warn(f"{p.suffix or '无扩展名'} 不在认的图片/PDF 扩展名里，仍将尝试识别：{p.name}")
        out.append(s)
    return out


def source_label(source: str) -> str:
    """给批量输出和默认文件名用的短标识。"""
    if is_url(source):
        base = source.split("?")[0].split("#")[0].rstrip("/").split("/")[-1]
        return base or "url"
    return Path(source).name


def write_out(path_str: str, content: str):
    """安全保存文本到文件，自动创建父级目录。"""
    p = Path(path_str)
    if p.parent and str(p.parent) not in ("", "."):
        p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def run_one(source: str, base_url: str, fields: dict, key: str, timeout: int,
            url_origin: str) -> tuple:
    """跑一个输入。返回 (data, err, elapsed)，err 是本地或服务端的失败负载。"""
    started = time.time()
    got, local_err = call_api(base_url, source, fields, key=key, timeout=timeout,
                              url_origin=url_origin)
    elapsed = time.time() - started
    if local_err is not None:
        return None, local_err, elapsed

    status, raw_body, headers = got
    try:
        data = json.loads(raw_body.decode("utf-8"))
    except Exception:
        body = raw_body[:500].decode("utf-8", "replace")
        return None, {"ok": False, "stage": "response", "status": status,
                      "error": f"服务端返回的不是 JSON（HTTP {status}）", "detail": body}, elapsed

    if status != 200 or data.get("ok") is False:
        data["status"] = status
        return None, data, elapsed
    return data, None, elapsed


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="图片与 PDF 文字识别（OCR）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""示例用法：
  # 1. 识别一张图（正文打到屏幕）
  ocr.py invoice.png

  # 2. 中文截图存成 txt
  ocr.py screenshot.png -o out/screenshot.txt

  # 3. 英文图片
  ocr.py receipt.jpg -l en

  # 4. PDF（用本地路径，别用 URL）
  ocr.py report.pdf -o out/report.txt

  # 5. 整个目录批量，产物按原名写进目录
  ocr.py ./scans -o out/

  # 6. 远程图片 URL
  ocr.py https://cdn.example.com/a.png

  # 7. 拿完整响应（含 chars / boxes / pages）
  ocr.py invoice.png -f json

配置（.env 或环境变量）：
  DOUDOU_API_URL=http://localhost:5678       # 服务地址
  DOUDOU_API_KEY=<uuid>                      # 用户标识
"""
    )
    parser.add_argument("sources", nargs="+",
                        help="图片/PDF 路径、包含它们的目录，或远程 http(s) URL，可给多个")
    parser.add_argument("--lang", "-l", default="ch",
                        help="识别语种：ch（中英混排，默认）/ en / chinese_cht / japan / "
                             "french / german / spanish / portuguese / italian / "
                             "vietnamese。也认 zh、中文、jp 这类常见写法")
    parser.add_argument("--format", "-f", dest="output_format", default="txt",
                        choices=["txt", "json"],
                        help="输出格式：txt（识别正文，默认）/ json（完整响应负载）")
    parser.add_argument("-o", "--output",
                        help="产物保存路径。单个输入时是文件路径；多个输入时当目录用，"
                             "按原文件名写进去。不给就打到 stdout")
    parser.add_argument("--key", "--uuid", "-k", dest="key", default=None,
                        help=f"用户标识 uuid（亦可配置在 .env 的 {ENV_KEY_KEY}）")
    parser.add_argument("--base", default=None,
                        help=f"服务根地址（默认取 .env 或 {FALLBACK_BASE}）")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT,
                        help=f"单个输入的客户端超时秒数，默认 {DEFAULT_TIMEOUT}")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="报错时打印完整 detail（默认只留尾部 600 字符）")
    parser.add_argument("--stop-on-error", action="store_true",
                        help="批量时遇到第一个失败就停（默认跳过失败项、把剩下的跑完）")
    return parser


def main():
    args = build_parser().parse_args()

    default_base, url_origin, default_key, key_origin = resolve_config()
    base_url = args.base if args.base else default_base
    origin_desc = "--base 参数" if args.base else url_origin

    # 用户标识：--key/--uuid > 环境变量 / .env
    if args.key:
        key = normalize_key(args.key)
        key_origin = "--key 参数"
    else:
        key = default_key

    # 标识留空不在本地拦：服务端可能配成免鉴权，这时不带标识也照过。
    # 真被拒时 format_error 会给出怎么配。

    lang = normalize_lang(args.lang)
    if lang not in LANGS:
        die(f"不支持的语种：{args.lang}\n只认这些值：" + ", ".join(LANGS))

    sources = collect_sources(args.sources)
    if not sources:
        die("没有可识别的输入。给图片/PDF 路径、含它们的目录，或 http(s) URL。")

    # 单输入且指定了文件路径时写入该文件；多输入、或 -o 以斜杠结尾、或已是存在目录时作为目录处理。
    multi = len(sources) > 1
    out_dir = None
    if args.output:
        raw_out = args.output
        if multi or raw_out.endswith(("/", "\\")) or Path(raw_out).is_dir():
            out_dir = Path(raw_out)
            out_dir.mkdir(parents=True, exist_ok=True)

    fields = {"lang": lang}
    ext = ".json" if args.output_format == "json" else ".txt"
    # 产物按去掉扩展名的原名命名，a.png 和 a.pdf 会撞成同一个 a.txt。
    # 不管的话后跑的那个把先跑的悄悄盖掉，所以这里记账并让后来者改名。
    used_targets = set()

    if multi:
        info(f"共 {len(sources)} 个输入，语种 {lang}，逐个识别（并发只会排队，所以串行）")

    failures = []
    for idx, source in enumerate(sources, start=1):
        label = source_label(source)
        if multi:
            info(f"[{idx}/{len(sources)}] {label}")

        data, err, elapsed = run_one(source, base_url, fields, key, args.timeout, origin_desc)

        if err is not None:
            failures.append((label, err))
            msg = format_error(err, status=err.get("status"), key=key,
                               key_origin=key_origin, verbose=args.verbose)
            print("✗ " + (f"[{label}] " if multi else "") + msg, file=sys.stderr)
            # 连不上服务是基础设施问题，不是这一个文件的问题：接着跑只会把同一条
            # 报错刷 N 遍，直接停。
            if err.get("stage") == "connect":
                die(f"服务连不上，停在第 {idx}/{len(sources)} 个输入。", code=2)
            if args.stop_on_error:
                die(f"已停在第 {idx} 个输入（--stop-on-error）。", code=2)
            continue

        text = extract_text(data)
        content = json.dumps(data, ensure_ascii=False, indent=2) \
            if args.output_format == "json" else text

        info(("  " if multi else "") + summarize(data, elapsed))
        if data.get("empty") is True or not text:
            warn(("  " if multi else "") +
                 "没识别出任何文字。可能图里本来就没有字，也可能字太小、太淡、太模糊，"
                 "或者语种选错了（如日文图用了默认的 ch）。")

        if out_dir is not None:
            stem = Path(label).stem or "ocr"
            target = out_dir / (stem + ext)
            if str(target).lower() in used_targets:
                n = 2
                while str(out_dir / f"{stem}-{n}{ext}").lower() in used_targets:
                    n += 1
                target = out_dir / f"{stem}-{n}{ext}"
                warn(f"  {stem + ext} 已被本次另一个输入占用，改写 {target.name}")
            used_targets.add(str(target).lower())
            write_out(str(target), content)
            info(f"  已保存至：{target}")
        elif args.output:
            write_out(args.output, content)
            info(f"  已保存至：{args.output}")
        else:
            # 批量打屏时加一行分隔，不然几份正文糊在一起分不出哪段属于哪个文件
            if multi:
                print(f"===== {label} =====")
            print(content)

    if failures:
        # 单个输入失败时上面那行 ✗ 已经说全了，再汇总一次纯属重复
        if multi:
            info(f"\n共 {len(failures)}/{len(sources)} 个输入失败：" +
                 ", ".join(lbl for lbl, _ in failures))
        sys.exit(1)


if __name__ == "__main__":
    main()
