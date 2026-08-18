#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""图片/扫描件 OCR，走 n8n 的 PaddleOCR API。

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

# Windows 控制台默认 GBK，中文提示和 OCR 文本都会输出成乱码。
# Python 3.7+ 可以直接把两个流改成 UTF-8，errors="replace" 保证不会因为
# 个别字符直接抛异常把整次识别的结果丢掉。
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ENV_KEY = "doudou_any2api_url"
FALLBACK_BASE = "http://localhost:5678"
ENDPOINT = "/webhook/paddle-ocr"

# 技能目录 = 本脚本的上一级（scripts/ 的父目录）
SKILL_DIR = Path(__file__).resolve().parent.parent
# 认作项目根的标志物。从当前工作目录往上找，命中即停，避免一路走到磁盘根。
ROOT_MARKERS = (".agents", ".claude")

# 地址是从哪来的（环境变量 / 哪个 .env / 默认值），连不上时要报给用户
BASE_ORIGIN = "内置默认值"

# PaddleOCR 单张图 0.5-3s，PDF 每页 2-5s，首次调用有模型加载（5-10s）。
# 给 300s 足够宽裕。
DEFAULT_TIMEOUT = 300

# 服务端 multipart 上传上限
MAX_UPLOAD_MB = 100

# 支持的图片和 PDF 扩展名
IMAGE_SUFFIXES = {
    ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif", ".svg", ".pdf"
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


def _find_project_root():
    """从当前工作目录往上找，直到遇到 .agents 或 .claude 就停。"""
    cwd = Path.cwd().resolve()
    for parent in [cwd] + list(cwd.parents):
        for marker in ROOT_MARKERS:
            if (parent / marker).exists():
                return parent
    return None


def get_base_url(cli_base):
    """按优先级查找 API 地址：CLI 参数 > 环境变量 > 项目根 .env > 技能 .env > 默认值。"""
    global BASE_ORIGIN

    if cli_base:
        BASE_ORIGIN = "--base 参数"
        return cli_base.rstrip("/")

    env_val = os.getenv(ENV_KEY)
    if env_val:
        BASE_ORIGIN = f"环境变量 {ENV_KEY}"
        return env_val.rstrip("/")

    project_root = _find_project_root()
    if project_root:
        env_file = project_root / ".env"
        val = _parse_env_file(env_file)
        if val:
            BASE_ORIGIN = f"{env_file} 的 {ENV_KEY}"
            return val.rstrip("/")

    skill_env = SKILL_DIR / ".env"
    val = _parse_env_file(skill_env)
    if val:
        BASE_ORIGIN = f"{skill_env} 的 {ENV_KEY}"
        return val.rstrip("/")

    BASE_ORIGIN = "内置默认值"
    return FALLBACK_BASE


def api_url(base):
    return base.rstrip("/") + ENDPOINT


def check_file_size(path):
    """检查本地文件大小，超过上限提前报错。"""
    size_mb = path.stat().st_size / (1024 * 1024)
    if size_mb > MAX_UPLOAD_MB:
        die(f"文件 {path.name} 大小 {size_mb:.1f} MB 超过上限 {MAX_UPLOAD_MB} MB。"
            f"\n提示：可尝试压缩图片分辨率或拆分 PDF。")


def build_multipart(file_path, fields):
    """手搓 multipart/form-data。所有文本一律 UTF-8 编码。"""
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
    disp = 'Content-Disposition: form-data; name="file"; filename="%s"' % p.name
    out += disp.encode("utf-8") + crlf
    out += ("Content-Type: %s" % mime).encode("utf-8") + crlf + crlf
    out += p.read_bytes() + crlf
    out += b"--" + boundary.encode() + b"--" + crlf

    return bytes(out), "multipart/form-data; boundary=" + boundary


def call_api(base_url, source, lang, timeout, as_json):
    """调用 PaddleOCR API，返回 JSON 对象。"""
    url = api_url(base_url)

    fields = {}
    if lang:
        fields["lang"] = lang

    path = Path(source).resolve()
    if not path.is_file():
        die(f"文件不存在：{source}")

    check_file_size(path)
    body, content_type = build_multipart(path, fields)

    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": content_type, "Accept": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return json.loads(raw.decode("utf-8", errors="replace"))
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8", errors="replace")
            return json.loads(body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            die(f"服务端返回 HTTP {e.code}，但响应体不是 JSON：\n{body[:500]}")
    except urllib.error.URLError as e:
        die("连不上 API（%s）：%s\n"
            "当前地址来自 %s。确认 n8n 在跑，或用 --base 指定，"
            "或设环境变量 %s，或在项目根 / 技能目录的 .env 里写 %s=..."
            % (url, e.reason, BASE_ORIGIN, ENV_KEY, ENV_KEY))
    except Exception as e:
        die(f"请求失败：{e}")


def main():
    parser = argparse.ArgumentParser(
        description="图片/扫描件 OCR（PaddleOCR）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例：
  %(prog)s screenshot.png
  %(prog)s invoice_en.jpg --lang en
  %(prog)s scan.pdf -o out/scan.txt
  %(prog)s image.jpg --json

PDF 会自动先尝试 anydoc 提取文字层，失败时降级到 OCR。
支持语言：ch / en / chinese_cht / japan / korean / french / german / spanish 等 15 种。
        """
    )
    parser.add_argument("source", help="图片或 PDF 文件路径")
    parser.add_argument("-o", "--output", metavar="PATH",
                        help="保存识别结果到文件（不指定则输出到 stdout）")
    parser.add_argument("-l", "--lang", "--language", dest="lang", default="ch",
                        help="识别语言（默认 ch，可选 en / chinese_cht / japan / korean / french / german 等）")
    parser.add_argument("--base", metavar="URL",
                        help="API 地址（单次覆盖，不改配置文件）")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT,
                        help=f"请求超时（秒，默认 {DEFAULT_TIMEOUT}）")
    parser.add_argument("--json", action="store_true",
                        help="输出完整 JSON 响应（含字符数、文本框数等元信息）")

    args = parser.parse_args()

    source = args.source
    path_obj = Path(source)

    # 扩展名提示
    if path_obj.suffix.lower() not in IMAGE_SUFFIXES:
        warn(f"扩展名 {path_obj.suffix} 不在常见图片/PDF 列表里，可能走错了链路")

    base_url = get_base_url(args.base)

    # 进度提示（stderr）
    size_mb = path_obj.stat().st_size / (1024 * 1024)
    print(f"→ 识别本地文件: {path_obj.name} ({size_mb:.2f} MB)", file=sys.stderr)

    result = call_api(base_url, source, args.lang, args.timeout, args.json)

    # 处理结果
    if not result.get("ok"):
        stage = result.get("stage", "unknown")
        error = result.get("error", "未知错误")
        detail = result.get("detail", "")
        hint = result.get("hint", "")

        print(f"阶段: {stage}", file=sys.stderr)
        print(f"详情: {error}", file=sys.stderr)
        if detail:
            print(f"      {detail[:500]}", file=sys.stderr)
        if hint:
            print(f"提示: {hint}", file=sys.stderr)
        sys.exit(1)

    # 成功：兼容 OCR 结果 (text) 与 anydoc 提取结果 (markdown)
    method = result.get("method", "unknown")
    text = result.get("text") if result.get("text") is not None else result.get("markdown", "")
    chars = result.get("chars", len(text))
    boxes = result.get("boxes")

    if boxes is not None:
        print(f"✓ 识别完成（{method}）：{chars} 字符，{boxes} 个文本框", file=sys.stderr)
    else:
        print(f"✓ 提取完成（{method}）：{chars} 字符", file=sys.stderr)

    if args.json:
        output_content = json.dumps(result, ensure_ascii=False, indent=2)
    else:
        output_content = text

    if args.output:
        write_out(args.output, output_content)
        print(f"✓ 已保存: {args.output}", file=sys.stderr)
    else:
        print(output_content)


if __name__ == "__main__":
    main()
