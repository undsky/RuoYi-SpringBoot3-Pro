#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""音视频转字幕与纯文本（Speech-to-Text），支持词级时间戳转写与标准字幕生成。

支持两大 n8n 后端接口：
1. 词级转写 API (/webhook/transcribe-words): 基于 WhisperX / faster-whisper，支持音素级强制对齐、说话人分离（Diarization）与 ElevenLabs Scribe 兼容 JSON。
2. 标准字幕 API (/webhook/media-subtitle): 基于 whisper CLI，直接输出 SRT/VTT/TXT 字幕。

特性：
- 零外部依赖：纯 Python 3 标准库（urllib, json, argparse 等），开箱即用。
- 输入形态：支持本地音视频文件上传（multipart/form-data）与远程 URL 下载。
- 输出格式：支持 txt（纯文本）、srt（标准字幕）、vtt（网页字幕）、tsv、json（完整词级结构体）。
- 进阶功能：支持 WhisperX 强制对齐开关（--align）、说话人分离（--diarize）、自定义说话人数量（--num-speakers）。
- 跨平台支持：自动解决 Windows 控制台默认 GBK 导致的中文乱码问题。
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

# Windows 控制台默认 GBK，中文提示和字幕正文容易乱码。
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
ENDPOINT_WORDS = "/webhook/transcribe-words"
ENDPOINT_SUBTITLE = "/webhook/media-subtitle"

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

DEFAULT_TIMEOUT = 3600

# 和 N8N_PAYLOAD_SIZE_MAX / nginx client_max_body_size 对齐（50MB）。
# 直连 n8n 时超限不会回 413，而是读到上限后干脆不响应，所以发出前先自己拦。
MAX_UPLOAD_BYTES = 50 * 1024 * 1024

MEDIA_SUFFIXES = {
    ".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".oga", ".opus",
    ".wma", ".amr", ".aiff", ".mp4", ".mov", ".mkv", ".avi", ".webm",
    ".flv", ".wmv", ".m4v", ".mpg", ".mpeg", ".ts", ".m2ts", ".3gp", ".ogv",
}


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


def warn(msg: str):
    print("⚠️  " + msg, file=sys.stderr)


def die(msg: str, code: int = 1):
    print("✗ " + msg, file=sys.stderr)
    sys.exit(code)


def seconds_to_srt_time(sec: float) -> str:
    """将秒数转为 SRT 时间格式 HH:MM:SS,mmm"""
    if sec < 0:
        sec = 0
    total_ms = int(round(sec * 1000))
    ms = total_ms % 1000
    s = (total_ms // 1000) % 60
    m = (total_ms // 60000) % 60
    h = total_ms // 3600000
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def seconds_to_vtt_time(sec: float) -> str:
    """将秒数转为 WebVTT 时间格式 HH:MM:SS.mmm"""
    if sec < 0:
        sec = 0
    total_ms = int(round(sec * 1000))
    ms = total_ms % 1000
    s = (total_ms // 1000) % 60
    m = (total_ms // 60000) % 60
    h = total_ms // 3600000
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def format_srt_from_segments(segments: list, show_speaker: bool = False) -> str:
    """将 segments 转为 SRT 格式字幕字符串"""
    items = []
    idx = 1
    for seg in segments:
        text = str(seg.get("text", "")).strip()
        if not text:
            continue
        speaker = seg.get("speaker_id") or seg.get("speaker")
        prefix = f"[{speaker}] " if (show_speaker and speaker) else ""
        start_t = seconds_to_srt_time(float(seg.get("start", 0)))
        end_t = seconds_to_srt_time(float(seg.get("end", 0)))
        items.append(f"{idx}\n{start_t} --> {end_t}\n{prefix}{text}\n")
        idx += 1
    return "\n".join(items)


def format_vtt_from_segments(segments: list, show_speaker: bool = False) -> str:
    """将 segments 转为 WebVTT 格式字幕字符串"""
    items = ["WEBVTT\n"]
    idx = 1
    for seg in segments:
        text = str(seg.get("text", "")).strip()
        if not text:
            continue
        speaker = seg.get("speaker_id") or seg.get("speaker")
        prefix = f"[{speaker}] " if (show_speaker and speaker) else ""
        start_t = seconds_to_vtt_time(float(seg.get("start", 0)))
        end_t = seconds_to_vtt_time(float(seg.get("end", 0)))
        items.append(f"{idx}\n{start_t} --> {end_t}\n{prefix}{text}\n")
        idx += 1
    return "\n".join(items)


def format_tsv_from_segments(segments: list, show_speaker: bool = False) -> str:
    """将 segments 转为 TSV 格式"""
    lines = ["start\tend\tspeaker\ttext" if show_speaker else "start\tend\ttext"]
    for seg in segments:
        text = str(seg.get("text", "")).strip()
        speaker = seg.get("speaker_id") or seg.get("speaker") or ""
        start_ms = int(round(float(seg.get("start", 0)) * 1000))
        end_ms = int(round(float(seg.get("end", 0)) * 1000))
        if show_speaker:
            lines.append(f"{start_ms}\t{end_ms}\t{speaker}\t{text}")
        else:
            lines.append(f"{start_ms}\t{end_ms}\t{text}")
    return "\n".join(lines)


def format_txt_from_segments(segments: list, full_text: str, show_speaker: bool = False) -> str:
    """将 segments 转为 TXT 纯文本"""
    if not show_speaker:
        return full_text
    lines = []
    for seg in segments:
        text = str(seg.get("text", "")).strip()
        if not text:
            continue
        speaker = seg.get("speaker_id") or seg.get("speaker")
        prefix = f"[{speaker}] " if speaker else ""
        lines.append(f"{prefix}{text}")
    return "\n".join(lines) if lines else full_text


def build_multipart(file_path: Path, fields: dict, file_field_name: str = "file") -> tuple:
    """手搓 multipart/form-data 数据包。"""
    boundary = "----doudoustt" + uuid.uuid4().hex
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
    """构造鉴权请求头。"""
    val = normalize_key(key)
    if not val:
        return {}
    return {"X-Uuid": val, "X-Key": val}


def call_api(base_url: str, endpoint: str, source: str, fields: dict, key: str = None,
             timeout: int = DEFAULT_TIMEOUT, file_field_name: str = "file", url_origin: str = "") -> tuple:
    """发起 HTTP 请求。自动处理文件上传或 URL 请求。"""
    is_url = source.lower().startswith("http://") or source.lower().startswith("https://")
    full_url = base_url.rstrip("/") + endpoint

    headers = {"Accept": "*/*"}
    headers.update(build_auth_headers(key))

    if is_url:
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
                "超限的请求不会回错误码，只会挂着不响应。先压缩或改用 URL 形态。")
        if size == 0:
            die(f"文件是空的（0 字节）：{source}")
        if p.suffix.lower() and p.suffix.lower() not in MEDIA_SUFFIXES:
            warn(f"{p.suffix} 不像常见音视频扩展名，仍将尝试上传")
        body, ctype = build_multipart(p, fields, file_field_name=file_field_name)
        headers["Content-Type"] = ctype

    req = urllib.request.Request(full_url, data=body, method="POST", headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read(), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.headers or {})
    except urllib.error.URLError as e:
        auth_hint = f"（当前 API 根地址来自 {url_origin}）"
        die(f"连不上 API 端点 ({full_url})：{e.reason}\n"
            f"{auth_hint}\n"
            f"请检查 n8n 服务是否已启动，或使用 --base 指定地址，或在 .env 中配置 DOUDOU_API_URL。")
    except TimeoutError:
        die(f"请求等待超过 {timeout} 秒超时。\n"
            "推理耗时约为音频时长的 0.72-1.2 倍，长音频请使用 --timeout 参数加大等待时间。")


def write_out(path_str: str, content: str):
    """安全保存文本到文件，自动创建父级目录。"""
    p = Path(path_str)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(
        description="音视频转字幕与纯文本（STT），支持 WhisperX 强制对齐、说话人分离与标准字幕生成",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""示例用法：
  # 1. 词级转写（默认 WhisperX 音素级强制对齐），输出带时间轴的 SRT
  whisper.py meeting.mp4 --language Chinese -o meeting.srt

  # 2. 提取纯文本全文（TXT 格式）
  whisper.py podcast.mp3 --format txt -o podcast.txt

  # 3. 输出完整词级 JSON（包含 Scribe 兼容 words[] 数组与对齐时间戳）
  whisper.py voice.m4a --format json -o words.json

  # 4. 开启多说话人分离（Diarization）并标注说话人
  whisper.py meeting.mp4 --diarize --show-speaker -o meeting.srt

  # 5. 指定初始提示词（优化中文标点和术语识别）
  whisper.py audio.wav --prompt "以下是普通话的句子。"

  # 6. 转写远程音频 URL
  whisper.py https://example.com/audio.mp3 --language en -f srt

  # 7. 显式传用户标识（未配置 .env 时必须给）
  whisper.py meeting.mp4 --key 1a2b3c -o meeting.srt

配置（.env 或环境变量）：
  DOUDOU_API_URL=http://localhost:5678       # 服务地址
  DOUDOU_API_KEY=<uuid>                      # 用户标识，走 X-Uuid 请求头。必填，不带会被拒
"""
    )
    parser.add_argument("source", help="本地音视频文件路径，或远程音视频 URL")
    parser.add_argument("--api", choices=["words", "subtitle", "auto"], default="words",
                        help="选择使用的 API 接口：words (词级转写 WhisperX / faster-whisper，默认) / subtitle (标准字幕 whisper)")
    parser.add_argument("--language", "-l", default="auto",
                        help="语言代码或名称：Chinese / English / zh / en / auto（默认 auto）")
    parser.add_argument("--task", default="transcribe", choices=["transcribe", "translate"],
                        help="任务类型：transcribe (识别原文，默认) / translate (翻译为英文)")
    parser.add_argument("--format", "-f", dest="output_format", default="srt",
                        choices=["srt", "vtt", "txt", "tsv", "json", "words"],
                        help="输出格式：srt (字幕，默认) / vtt (网页字幕) / txt (纯文本) / tsv (制表符分隔) / json 或 words (词级结构体)")
    parser.add_argument("--prompt", "-p", default="",
                        help="初始提示词（中文建议传入「以下是普通话的句子。」以显著改善标点与数字识别）")
    parser.add_argument("--threads", type=int, default=None,
                        help="服务端推理 CPU 线程数 (1-32)，默认 4")
    parser.add_argument("--no-vad", action="store_true",
                        help="禁用 VAD 语音活动检测（默认开启 VAD 以过滤静音和幻觉）")
    parser.add_argument("--no-align", action="store_true",
                        help="禁用 WhisperX 音素级强制对齐（默认开启强制对齐以获取最高精度词级时间戳）")
    parser.add_argument("--diarize", action="store_true",
                        help="开启说话人分离（识别区分不同的说话人，如 SPEAKER_00 / SPEAKER_01）")
    parser.add_argument("--hf-token", default="",
                        help="HuggingFace Token（用于授权拉取 pyannote 说话人分离模型）")
    parser.add_argument("--num-speakers", type=int, default=None,
                        help="指定已知的说话人总数（如 2）")
    parser.add_argument("--min-speakers", type=int, default=None,
                        help="最少说话人数量")
    parser.add_argument("--max-speakers", type=int, default=None,
                        help="最多说话人数量")
    parser.add_argument("--show-speaker", action="store_true",
                        help="在字幕或文本中附带说话人前缀 [SPEAKER_XX]")
    parser.add_argument("-o", "--output", help="输出结果保存路径。如果不指定，结果直接打印到 stdout")
    parser.add_argument("--json", action="store_true", help="打印原始完整响应 JSON")
    parser.add_argument("--key", "--uuid", "-k", dest="key", default=None,
                        help="用户标识 uuid，走 X-Uuid 请求头（必填，不带会被拒；亦可配置在 .env 的 DOUDOU_API_KEY 或同名环境变量）")
    parser.add_argument("--base", default=None, help="n8n 服务根地址（默认取 .env 或 http://localhost:5678）")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT,
                        help=f"客户端超时秒数，默认 {DEFAULT_TIMEOUT}")

    args = parser.parse_args()

    default_base, url_origin, default_key, key_origin = resolve_config()
    base_url = args.base if args.base else default_base
    origin_desc = "--base 参数" if args.base else url_origin

    if args.key:
        key = normalize_key(args.key)
        key_origin = "--key 参数"
    else:
        key = default_key

    use_words_api = (args.api == "words" or (args.api == "auto" and args.output_format in ("json", "words")))

    if use_words_api:
        endpoint = ENDPOINT_WORDS
        file_field = "file"
        params = {
            "language": args.language,
            "task": args.task,
            "initial_prompt": args.prompt,
            "vad_filter": "false" if args.no_vad else "true",
            "align": "false" if args.no_align else "true",
        }
        if args.diarize:
            params["diarize"] = "true"
        if args.hf_token:
            params["hf_token"] = args.hf_token
        if args.num_speakers is not None:
            params["num_speakers"] = args.num_speakers
        if args.min_speakers is not None:
            params["min_speakers"] = args.min_speakers
        if args.max_speakers is not None:
            params["max_speakers"] = args.max_speakers
        if args.threads is not None:
            params["threads"] = args.threads
    else:
        endpoint = ENDPOINT_SUBTITLE
        file_field = "media"
        params = {
            "language": args.language,
            "task": args.task,
            "output_format": args.output_format if args.output_format in ("srt", "vtt", "txt", "tsv", "json") else "srt",
            "initial_prompt": args.prompt,
        }
        if args.threads is not None:
            params["threads"] = args.threads
        # raw=true 让服务端直接回 text/plain 字幕正文，不裹 JSON。
        # 不看有没有 -o：不落盘时也要这条正文打到 stdout，否则得靠下面从 JSON 里取键，
        # 而这个接口的 JSON 只有 subtitle 一个正文字段（没有按格式分开的 srt/vtt/tsv）。
        if not args.json and args.output_format in ("srt", "vtt", "txt", "tsv"):
            params["raw"] = "true"

    status, raw_body, headers = call_api(
        base_url=base_url,
        endpoint=endpoint,
        source=args.source,
        fields=params,
        key=key,
        timeout=args.timeout,
        file_field_name=file_field,
        url_origin=origin_desc,
    )

    ctype = headers.get("Content-Type") or headers.get("content-type") or ""

    if status != 200:
        try:
            err = json.loads(raw_body.decode("utf-8"))
        except Exception:
            die(f"API 请求失败（HTTP {status}）：{raw_body[:500].decode('utf-8', 'replace')}")

        msg = f"API 返回错误（HTTP {status}）— {err.get('error', '未知错误')}"
        if err.get("stage"):
            msg += f"\n阶段：{err['stage']}"
        if err.get("detail"):
            msg += f"\n详情：{err['detail']}"
        if err.get("hint"):
            msg += f"\n提示：{err['hint']}"
        if err.get("stage") == "auth" or status in (400, 401, 403):
            where = key_origin or "未配置"
            masked = (key[:4] + "***" + key[-4:]) if key and len(key) > 8 else (key or "空")
            msg += (f"\n本次用户标识：{masked}（来源：{where}）"
                    f"\n改用别的标识：--key <uuid>，或改 {ENV_FILE} 里的 DOUDOU_API_KEY")
        die(msg)

    if "application/json" not in ctype:
        text_content = raw_body.decode("utf-8", "replace")
        if args.output:
            write_out(args.output, text_content)
            print(f"✓ 结果已写入 {args.output}（{len(text_content)} 字符）", file=sys.stderr)
        else:
            print(text_content)
        return

    try:
        data = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        die(f"解析服务端响应 JSON 失败：{e}\n原始响应：{raw_body[:500].decode('utf-8', 'replace')}")

    if args.json:
        full_json_str = json.dumps(data, ensure_ascii=False, indent=2)
        if args.output:
            write_out(args.output, full_json_str)
            print(f"✓ 原始 JSON 已保存至 {args.output}", file=sys.stderr)
        else:
            print(full_json_str)
        return

    final_output = ""
    words_count = 0
    duration_str = "?"
    lang_str = "?"

    if use_words_api:
        text_full = data.get("text", "")
        segments = data.get("segments", [])
        words = data.get("words", [])
        lang_str = data.get("language_code", "未知")
        duration = data.get("duration") or (data.get("media") or {}).get("duration_seconds")
        duration_str = f"{duration:.2f}" if isinstance(duration, (int, float)) else str(duration or "?")
        words_count = data.get("word_count", len([w for w in words if w.get("type") == "word"]))

        if not segments and words:
            segments = [{"start": w.get("start", 0), "end": w.get("end", 0), "text": w.get("text", ""), "speaker_id": w.get("speaker_id")}
                        for w in words if w.get("type") == "word"]

        fmt = args.output_format.lower()
        if fmt in ("json", "words"):
            final_output = json.dumps(data, ensure_ascii=False, indent=2)
        elif fmt == "txt":
            final_output = format_txt_from_segments(segments, text_full, show_speaker=args.show_speaker)
        elif fmt == "vtt":
            final_output = format_vtt_from_segments(segments, show_speaker=args.show_speaker)
        elif fmt == "tsv":
            final_output = format_tsv_from_segments(segments, show_speaker=args.show_speaker)
        else:  # srt
            final_output = format_srt_from_segments(segments, show_speaker=args.show_speaker)

        engine_info = data.get("engine", "whisperx")
        align_info = "已对齐" if data.get("aligned") else "未对齐"
        diarize_info = "已分角色" if data.get("diarization") else ""
        extra_tag = f" [{engine_info} | {align_info}{' | ' + diarize_info if diarize_info else ''}]"

        print(f"✓ [词级转写{extra_tag}] 时长 {duration_str}s | 词数 {words_count} | 语种 {lang_str}", file=sys.stderr)
        if data.get("warnings"):
            for w in data["warnings"]:
                warn(w)
    else:
        # 这个接口的 JSON 只有 subtitle 一个正文字段，格式由服务端按请求的
        # output_format 生成好；没有 srt / vtt / tsv / text 这些分格式键。
        # 正常路径已经在上面走 raw=true 的 text/plain 分支，这里是 -f json 的兜底。
        subtitle = data.get("subtitle") or ""
        whisper_meta = data.get("whisper") or {}
        lang_str = whisper_meta.get("language") or "未知"
        duration_str = str((data.get("media") or {}).get("duration_seconds") or "?")

        fmt = args.output_format.lower()
        if fmt in ("json", "words"):
            final_output = json.dumps(data, ensure_ascii=False, indent=2)
        else:
            final_output = subtitle

        actual_fmt = data.get("primary_format") or ""
        if actual_fmt and fmt not in ("json", "words") and actual_fmt.lower() != fmt:
            warn(f"服务端给的是 {actual_fmt} 格式，不是请求的 {fmt}")

        print(f"✓ [标准字幕] 时长 {duration_str}s | 语种 {lang_str}", file=sys.stderr)

    if args.output:
        write_out(args.output, final_output)
        print(f"✓ 结果已写入 {args.output}（{len(final_output)} 字符）", file=sys.stderr)
    else:
        print(final_output)


if __name__ == "__main__":
    main()
