#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把音频/视频转成字幕或纯文本，走 n8n 的字幕转换 API。

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

# Windows 控制台默认 GBK，中文提示和字幕正文都会输出成乱码。
# Python 3.7+ 可以直接把两个流改成 UTF-8，errors="replace" 保证不会因为
# 个别字符直接抛异常把整次转写的结果丢掉。
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ENV_KEY = "doudou_any2api_url"
FALLBACK_BASE = "http://localhost:5678"
ENDPOINT = "/webhook/media-subtitle"

# 技能目录 = 本脚本的上一级（scripts/ 的父目录）
SKILL_DIR = Path(__file__).resolve().parent.parent
# 认作项目根的标志物。从当前工作目录往上找，命中即停，避免一路走到磁盘根。
ROOT_MARKERS = (".agents", ".claude")


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

# 服务端 whisper 是 CPU 推理，实测耗时约为音频时长的 0.72-0.95 倍。
# nginx 侧 proxy_read_timeout 是 3600s，所以默认顶到那里，别让客户端先断。
DEFAULT_TIMEOUT = 3600

MEDIA_SUFFIXES = {
    ".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".oga", ".opus",
    ".wma", ".amr", ".aiff", ".mp4", ".mov", ".mkv", ".avi", ".webm",
    ".flv", ".wmv", ".m4v", ".mpg", ".mpeg", ".ts", ".m2ts", ".3gp", ".ogv",
}


def api_url(base):
    return base.rstrip("/") + ENDPOINT


def build_multipart(file_path, fields):
    """手搓 multipart/form-data。

    所有文本一律 UTF-8 编码：中文文件名和中文 initial_prompt 如果按系统默认
    编码发（Windows 上是 GBK），服务端按 UTF-8 解会得到乱码 —— 实测踩过。
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
    # filename 用 UTF-8 原样写入。服务端只把它用于响应头里的下载名，
    # 真正的落盘文件名由服务端自己生成，所以这里不需要做路径转义。
    disp = 'Content-Disposition: form-data; name="media"; filename="%s"' % p.name
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
    if p.suffix.lower() and p.suffix.lower() not in MEDIA_SUFFIXES:
        warn("%s 不像音视频扩展名，仍然上传试试" % p.suffix)
    body, content_type = build_multipart(p, fields)

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
        die("等了 %ds 还没结果。CPU 推理约为音频时长的 0.72-0.95 倍，"
            "长音频请用 --timeout 加大。\n"
            "注意：超时只是客户端放弃了，服务端很可能还在跑，"
            "字幕仍会落到容器的 /data/subtitles" % timeout)


# 地址是从哪来的（环境变量 / 哪个 .env / 默认值），连不上时要报给用户
BASE_ORIGIN = "内置默认值"


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


def main():
    ap = argparse.ArgumentParser(
        description="音视频转字幕（走 n8n 字幕转换 API）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""示例：
  # 本地文件转 SRT，中文
  whisper.py talk.mp4 --language Chinese

  # 存成文件
  whisper.py talk.mp4 --language Chinese -o talk.srt
""")
    ap.add_argument("source", help="本地音视频文件路径")
    ap.add_argument("--language", "-l", default="auto",
                    help="Chinese / English / auto（默认 auto，会多花一次前向）")
    ap.add_argument("--task", default="transcribe",
                    choices=["transcribe", "translate"],
                    help="transcribe 出原文（默认）/ translate 译成英文")
    ap.add_argument("--format", "-f", dest="output_format", default="srt",
                    choices=["srt", "vtt", "txt", "tsv", "json", "all"],
                    help="srt 带时间轴（默认）/ txt 纯文本 / all 全出")
    ap.add_argument("--model", default="",
                    help="留空用服务端预置的 medium（推荐，换别的可能触发下载）")
    ap.add_argument("--threads", type=int, default=None, help="CPU 线程数 1-32，默认 4")
    ap.add_argument("--prompt", default="",
                    help="初始提示。中文建议传「以下是普通话的句子。」，能明显改善标点")
    ap.add_argument("-o", "--output", help="把字幕写到这个文件")
    ap.add_argument("--json", action="store_true", help="打印完整 JSON 响应")
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

    params = {
        "language": args.language,
        "task": args.task,
        "output_format": args.output_format,
        "model": args.model,
        "initial_prompt": args.prompt,
    }
    if args.threads is not None:
        params["threads"] = args.threads

    # raw 模式直接拿字幕文件，省一次 JSON 解析和转义；要 JSON 就不能用 raw
    want_raw = bool(args.output) and not args.json

    status, raw_body, headers = call_api(
        args.base, args.source, params, args.timeout, want_raw)

    ctype = (headers.get("Content-Type") or headers.get("content-type") or "")

    if status != 200:
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
        die(msg)

    # raw 模式服务端直接回字幕文件本体
    if "application/json" not in ctype:
        text = raw_body.decode("utf-8", "replace")
        write_out(args.output, text)
        print("✓ 字幕已存到 %s（%d 字符）" % (args.output, len(text)), file=sys.stderr)
        return

    data = json.loads(raw_body.decode("utf-8"))

    if args.json:
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return

    subtitle = data.get("subtitle") or ""
    media = data.get("media") or {}
    wh = data.get("whisper") or {}

    # 元信息走 stderr，字幕正文走 stdout —— 这样管道里拿到的就是纯字幕
    print("✓ %s | 时长 %ss | %d 字符"
          % (data.get("primary_format", "?"),
             media.get("duration_seconds", "?"),
             data.get("chars", len(subtitle))), file=sys.stderr)
    print("  语种 %s | 服务端字幕留在 %s"
          % (wh.get("language", "?"), data.get("subtitle_path", "?")), file=sys.stderr)

    if args.output:
        write_out(args.output, subtitle)
        print("  已存到 %s" % args.output, file=sys.stderr)
    else:
        print(subtitle)


if __name__ == "__main__":
    main()
