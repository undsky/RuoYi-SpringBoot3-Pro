#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把文档转成 Markdown，走 n8n 的文档转换 API。

本地文件走 multipart 上传。
只用标准库，装完 Python 就能跑。

用法见 --help，或 SKILL.md。
"""

import argparse
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

# Windows 控制台默认 GBK，中文提示和 Markdown 正文都会输出成乱码。
# Python 3.7+ 可以直接把两个流改成 UTF-8，errors="replace" 保证不会因为
# 个别字符直接抛异常把整次转换的结果丢掉。
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ENV_KEY = "doudou_any2api_url"
FALLBACK_BASE = "http://localhost:5678"
ENDPOINT = "/webhook/document-markdown"

# 技能目录 = 本脚本的上一级（scripts/ 的父目录）
SKILL_DIR = Path(__file__).resolve().parent.parent
# 认作项目根的标志物。从当前工作目录往上找，命中即停，避免一路走到磁盘根。
ROOT_MARKERS = (".agents", ".claude")

# 地址是从哪来的（环境变量 / 哪个 .env / 默认值），连不上时要报给用户
BASE_ORIGIN = "内置默认值"

# anydoc 解析纯 CPU、不联网，小文件几十毫秒，大 CSV 几百毫秒。
# 给 300s 足够宽裕。
DEFAULT_TIMEOUT = 300

# 服务端 multipart 上传上限
MAX_UPLOAD_MB = 100

# 与服务端 DOC_EXT 白名单保持一致。扩展名不在表里也照样上传（anydoc 按内容
# 二次判定），只是先给个提示，帮用户尽早发现分派走错了链路。
DOC_SUFFIXES = {
    ".doc", ".docx", ".docm", ".dotx", ".odt", ".rtf",
    ".ppt", ".pptx", ".pptm", ".pps", ".ppsx", ".pot", ".odp",
    ".xls", ".xlsx", ".xlsm", ".xlsb", ".ods", ".csv", ".pdf", ".epub",
}


def warn(msg):
    print("⚠️  " + msg, file=sys.stderr)


def die(msg, code=1):
    print("✗ " + msg, file=sys.stderr)
    sys.exit(code)


def write_out(path, text):
    """写文件，顺手把上层目录建出来。

    用户指定的输出目录第一次用时可能不存在；
    裸文件名的 parent 是 "."，mkdir(exist_ok=True) 对它是空操作。
    """
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def _parse_env_file(path):
    """从 .env 里取 ENV_KEY，取到就返回，取不到返回 None。

    只认 KEY=VALUE，容忍 export 前缀、# 注释、以及值两侧的引号。
    键名大小写不敏感 —— Windows 上环境变量本来就不区分，让两边行为一致。
    """
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except (OSError, UnicodeError):
        return None
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        key, sep, val = line.partition("=")
        if not sep or key.strip().lower() != ENV_KEY.lower():
            continue
        val = val.split(" #", 1)[0].strip()
        if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
            val = val[1:-1]
        if val:
            return val
    return None


def resolve_base():
    """按 真环境变量 → .env 文件 → 兜底默认值 的顺序定位 API 地址。

    .env 找两处：技能目录自己，以及从当前工作目录往上找到的项目根。
    先看项目根 —— 用户在自己项目里配的地址应该盖住技能自带的默认配置。

    这套顺序和 whisper.py 完全一致：三条链路共用一个 n8n，配一次就该都生效。
    """
    for name in (ENV_KEY, ENV_KEY.upper()):
        val = os.environ.get(name)
        if val and val.strip():
            return val.strip(), "$" + name

    candidates = []
    cwd = Path.cwd().resolve()
    for d in (cwd,) + tuple(cwd.parents):
        if any((d / m).exists() for m in ROOT_MARKERS):
            candidates.append(d / ".env")
            break
    candidates.append(SKILL_DIR / ".env")

    seen = set()
    for env_path in candidates:
        if env_path in seen:
            continue
        seen.add(env_path)
        if not env_path.is_file():
            continue
        val = _parse_env_file(env_path)
        if val:
            return val, str(env_path)

    return FALLBACK_BASE, "内置默认值"


def api_url(base):
    return base.rstrip("/") + ENDPOINT


def build_multipart(file_path, fields):
    """手搓 multipart/form-data。

    所有文本一律 UTF-8 编码：中文文件名如果按系统默认编码发（Windows 上是 GBK），
    服务端按 UTF-8 解会得到乱码。

    filename 必须原样带上：服务端要靠它的扩展名判断格式。CSV 没有文件签名，
    扩展名是唯一线索 —— 丢了它，CSV 会直接被判成"无法识别"。
    """
    boundary = "----doudou" + uuid.uuid4().hex
    crlf = b"\r\n"
    out = bytearray()

    for name, value in fields.items():
        if value is None or value == "":
            continue
        out += b"--" + boundary.encode() + crlf
        disp = 'Content-Disposition: form-data; name="%s"' % name
        out += disp.encode("utf-8") + crlf + crlf
        out += str(value).encode("utf-8") + crlf

    p = Path(file_path)
    mime = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    out += b"--" + boundary.encode() + crlf
    disp = 'Content-Disposition: form-data; name="document"; filename="%s"' % p.name
    out += disp.encode("utf-8") + crlf
    out += ("Content-Type: %s" % mime).encode("utf-8") + crlf + crlf
    out += p.read_bytes() + crlf
    out += b"--" + boundary.encode() + b"--" + crlf

    return bytes(out), "multipart/form-data; boundary=" + boundary


def call_api(base, source, params, timeout, want_raw):
    fields = dict(params)
    if want_raw:
        fields["raw"] = "true"

    p = Path(source)
    if not p.is_file():
        die("找不到文件：%s" % source)
    size_mb = p.stat().st_size / 1048576.0
    if size_mb > MAX_UPLOAD_MB:
        die("文件 %.1fMB，超过上传上限 %dMB。" % (size_mb, MAX_UPLOAD_MB))
    if p.suffix.lower() and p.suffix.lower() not in DOC_SUFFIXES:
        warn("%s 不像文档扩展名，仍然上传试试" % p.suffix)
    body, content_type = build_multipart(p, fields)

    return _post(base, body, content_type, timeout)


def _post(base, body, content_type, timeout):
    """发一次 POST，把 4xx/5xx 也当正常返回交给调用方解读。"""
    req = urllib.request.Request(
        api_url(base), data=body, method="POST",
        headers={"Content-Type": content_type, "Accept": "*/*"},
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read(), dict(resp.headers)
    except urllib.error.HTTPError as e:
        # 4xx/5xx 的 body 里有 error / hint / stage，比状态码有用得多
        return e.code, e.read(), dict(e.headers or {})
    except urllib.error.URLError as e:
        die("连不上 API（%s）：%s\n"
            "当前地址来自 %s。确认 n8n 在跑，或用 --base 指定，"
            "或设环境变量 %s，或在项目根 / 技能目录的 .env 里写 %s=..."
            % (api_url(base), e.reason, BASE_ORIGIN, ENV_KEY, ENV_KEY))
    except TimeoutError:
        die("等了 %ds 还没结果。可用 --timeout 加大超时时间。" % timeout)


def report_error(status, raw_body):
    """把服务端的 stage / detail / hint 原样转述出来。

    stage 直接指向问题归属，比 HTTP 状态码有用。特别是 unsupported —— 那不是
    故障，是文件没有文字层，该走 OCR 链路。
    """
    try:
        err = json.loads(raw_body.decode("utf-8"))
    except Exception:
        die("API 返回 %d：%s" % (status, raw_body[:500].decode("utf-8", "replace")))

    msg = "API 返回 %d — %s" % (status, err.get("error", "未知错误"))
    if err.get("stage"):
        msg += "\n阶段：%s" % err["stage"]
    if err.get("detail"):
        msg += "\n详情：%s" % err["detail"]
    if err.get("hint"):
        msg += "\n提示：%s" % err["hint"]
    if err.get("stage") == "unsupported":
        msg += ("\n\n这个文件没有可提取的文字层（扫描件、纯图片 PDF）。"
                "不是故障，需要走 OCR 链路。")
    die(msg)


def main():
    ap = argparse.ArgumentParser(
        description="文档转 Markdown（走 n8n 文档转换 API）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""示例：
  # 本地文件转 Markdown，直接看内容
  anydoc.py 报告.docx

  # 存成文件
  anydoc.py 财报.xlsx -o 财报.md

  # 大表格截断，避免撑爆上下文
  anydoc.py 明细.csv --max-chars 20000
""")
    ap.add_argument("source", metavar="SOURCE",
                    help="本地文件路径。一次一份，多份就多跑几次这个命令")
    ap.add_argument("-o", "--output",
                    help="Markdown 写到这个文件；不给则正文进 stdout")
    ap.add_argument("--format", "-f", dest="doc_format", default="",
                    help="强制指定格式。**通常留空**，服务端按内容自动判定；"
                         "只有没扩展名的文件才需要填")
    ap.add_argument("--max-chars", type=int, default=None,
                    help="Markdown 超过这个字符数就截断。大表格喂模型前用得上")
    ap.add_argument("--json", action="store_true",
                    help="打印完整 JSON 响应（含服务端产物路径、字符数）")
    ap.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT,
                    help="客户端超时秒数，默认 %d" % DEFAULT_TIMEOUT)
    ap.add_argument("--base", default=None,
                    help="API 根地址。不给则取环境变量 %s，再找项目根 / 技能目录的 "
                         ".env，最后退到 %s" % (ENV_KEY, FALLBACK_BASE))
    args = ap.parse_args()

    global BASE_ORIGIN
    if args.base:
        BASE_ORIGIN = "--base 参数"
    else:
        args.base, BASE_ORIGIN = resolve_base()

    params = {}
    if args.doc_format:
        params["format"] = args.doc_format
    if args.max_chars is not None:
        params["max_chars"] = args.max_chars

    # raw 模式直接拿 Markdown 文件本体，省一次 JSON 解析和转义；要 JSON 就不能用 raw
    want_raw = bool(args.output) and not args.json

    status, raw_body, headers = call_api(
        args.base, args.source, params, args.timeout, want_raw)

    if status != 200:
        report_error(status, raw_body)

    ctype = (headers.get("Content-Type") or headers.get("content-type") or "")

    # raw 模式服务端直接回 Markdown 文件本体
    if "application/json" not in ctype:
        text = raw_body.decode("utf-8", "replace")
        write_out(args.output, text)
        print("✓ Markdown 已存到 %s（%d 字符）"
              % (args.output, len(text)), file=sys.stderr)
        return

    data = json.loads(raw_body.decode("utf-8"))

    if args.json:
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return

    markdown = data.get("markdown") or ""
    doc = data.get("document") or {}

    # format 为 null 表示 anydoc 按文件内容自己判定的（没人手动指定），
    # 这种情况下 format_source 里是人话说明，比打印 "None" 有用
    fmt = doc.get("format") or doc.get("format_source") or "?"

    # 元信息走 stderr，Markdown 正文走 stdout —— 管道里拿到的就是纯 Markdown
    print("✓ %s | %d 字符" % (fmt, len(markdown)), file=sys.stderr)

    # 退出码 0 但没内容：anydoc 对残缺文档采取"尽量恢复"策略，转不出东西也会
    # 正常退出。这种情况必须说清楚，否则会被当成"文档内容就是空的"。
    if data.get("empty"):
        warn("转换成功但没有提取到任何文字。文档可能本身是空的，"
             "或者只有图片没有文字层（那种要走 OCR）。别当成文档内容为空。")

    # 服务端的 chars 恒为全文长度（截断时也不变），截断后的长度自己数
    if data.get("truncated"):
        warn("内容已截断到 %d 字符（全文 %s 字符）。"
             "服务端产物是完整的，需要全文就调大 --max-chars 或去掉它。"
             % (len(markdown), data.get("chars", "?")))

    # host_path 是宿主机上的相对路径，比容器内的 /data/... 更容易直接打开
    if data.get("host_path"):
        print("  服务端产物留在 %s" % data["host_path"], file=sys.stderr)
    elif data.get("markdown_path"):
        print("  服务端产物留在 %s" % data["markdown_path"], file=sys.stderr)

    if args.output:
        write_out(args.output, markdown)
        print("  已存到 %s" % args.output, file=sys.stderr)
    else:
        print(markdown)


if __name__ == "__main__":
    main()
