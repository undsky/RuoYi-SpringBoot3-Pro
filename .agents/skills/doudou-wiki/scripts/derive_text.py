#!/usr/bin/env python3
"""
doudou-wiki 纯文本素材归一化脚本。

把 kb/raw/ 下的纯文本素材（.md / .txt 等）归一化后拷进 kb/gen/，让 LLM 的读取面
统一落在产物层 —— 不必再按素材类型分辨该读 raw/ 还是 gen/。

**这不是格式转换**：内容一字不改，只做三件事
  1. 编码统一成 UTF-8（原件可能是 GBK / GB18030 / UTF-16）
  2. 行尾统一成 LF，去掉 BOM
  3. 拷到 scan.py 指定的 derived_path

外部素材（Office / PDF / 图片 / 音视频）不走这里，交给 doudou-doc / doudou-ocr /
doudou-stt。本技能自己不做任何格式转换。

用法:
    python3 derive_text.py --raw <原件绝对路径> --out <产物绝对路径>
    python3 derive_text.py --raw kb/raw/a.md --out kb/gen/a.md --json

零依赖：仅用 Python 3 标准库。
"""

import argparse
import json
import sys
from pathlib import Path

# 依次尝试的编码。utf-8-sig 放最前以吃掉 UTF-8 BOM；
# 无 BOM 的 UTF-16 不在此列 —— 它由 looks_like_utf16 按端序打分挑，
# 放进来只会按本机端序解，BE 文本会被静默解成乱码；
# gb18030 是 GBK 超集，覆盖简体中文 Windows 环境产出的绝大多数文本；
# latin-1 永不失败，兜底用。
ENCODINGS = ("utf-8-sig", "utf-8", "gb18030", "latin-1")

# BOM → 编码。带 BOM 的一律直接认出来，不进试解流程。
BOMS = (
    (b"\x00\x00\xfe\xff", "utf-32"),
    (b"\xff\xfe\x00\x00", "utf-32"),
    (b"\xef\xbb\xbf", "utf-8-sig"),
    (b"\xff\xfe", "utf-16"),
    (b"\xfe\xff", "utf-16"),
)


def sniff_bom(data: bytes) -> str | None:
    """按 BOM 认编码。UTF-32 的 BOM 要先于 UTF-16 判，前者以后者的 BOM 开头。"""
    for bom, enc in BOMS:
        if data.startswith(bom):
            return enc
    return None


def _common_script(o: int) -> bool:
    """个人知识库里真正会出现的文字：拉丁、西里尔、希腊、阿拉伯、希伯来、
    泰文、汉字、假名、谚文，外加通用标点。误解端序解出的码位几乎都落在这
    些区段之外（加拿大原住民音节、私用区、未分配），靠这个拉开差距。"""
    return (
        0x20 <= o <= 0x24F
        or 0x370 <= o <= 0x3FF
        or 0x400 <= o <= 0x52F
        or 0x590 <= o <= 0x6FF
        or 0xE00 <= o <= 0xE7F
        or 0x2000 <= o <= 0x206F
        or 0x3000 <= o <= 0x30FF
        or 0x3400 <= o <= 0x4DBF
        or 0x4E00 <= o <= 0x9FFF
        or 0xAC00 <= o <= 0xD7AF
        or 0xFF00 <= o <= 0xFFEF
    )


def text_quality(text: str) -> int:
    """给解码结果打分。分越高越像正常文本。

    误解 UTF-16 端序会把每个字的两个字节颠倒，解出的码位散落在冷僻区段；
    正确端序解出的是上面那些常用文字。西里尔文若只给汉字 +2、其它字母 +1，
    误解端序落到加拿大原住民音节（仍是字母）几乎打平，所以常用文字一视同仁。
    """
    score = 0
    for ch in text:
        o = ord(ch)
        if ch in "\n\r\t":
            score += 3
        elif o == 0 or o < 32 or 0xD800 <= o <= 0xDFFF or o in (0xFFFE, 0xFFFF):
            score -= 8  # NUL、控制字符、代理项、非字符：正常文本里不该出现
        elif _common_script(o):
            score += 2
        elif ch.isprintable():
            score += 1
        else:
            score -= 1
    return score


def looks_like_utf16(data: bytes) -> str | None:
    """无 BOM 的 UTF-16 嗅探：含 NUL 字节就试两种端序，按打分挑。

    单字节编码（gb18030 / latin-1）和 utf-8 能把 UTF-16 字节流「成功」解成带 NUL 的
    乱码且不抛异常，光靠试解顺序认不出来，必须先嗅探。

    判据是「字节流里有 NUL」而非 NUL 的位置分布：纯汉字的 UTF-16 两个字节都非零
    （合 U+5408 → 54 08），按位置统计根本到不了阈值，于是 BE 文本会被原生序的
    utf-16 解成乱码。两种端序和 utf-8 / gb18030 一起打分，UTF-16 胜出才认 ——
    这样 UTF-8 文件里偶尔夹个 NUL 也不会被误判。
    """
    if len(data) < 2 or b"\x00" not in data:
        return None
    # 两种端序都试，也跟 utf-8 / gb18030 比一把：UTF-8 文件里偶尔夹个 NUL
    # 时，字节编码的分数会明显高于乱解的 UTF-16，避免误判。
    best: tuple[int, str] | None = None
    for enc in ("utf-16-le", "utf-16-be", "utf-8", "gb18030"):
        try:
            text = data.decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue
        score = text_quality(text)
        if best is None or score > best[0]:
            best = (score, enc)
    if best and best[1].startswith("utf-16"):
        return best[1]
    return None


def decode_text(data: bytes) -> tuple[str, str]:
    """解码字节流，返回 (文本, 实际使用的编码)。"""
    enc = sniff_bom(data) or looks_like_utf16(data)
    if enc:
        try:
            return data.decode(enc), enc
        except (UnicodeDecodeError, LookupError):
            pass  # BOM/嗅探不作准，退回逐个试解
    # 首个「解得开但含 NUL」的结果留作兜底：原件本身真带 NUL 时（少见但存在），
    # 内容是好的，不该因为这条规则被丢到 replace 去，那样标签会谎称发生了替换。
    fallback: tuple[str, str] | None = None
    for enc in ENCODINGS:
        try:
            text = data.decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue
        # utf-8-sig 对无 BOM 的 UTF-8 也解得开，据实汇报以免误导
        if enc == "utf-8-sig" and not data.startswith(b"\xef\xbb\xbf"):
            enc = "utf-8"
        # 单字节编码把 UTF-16 解成带 NUL 的乱码时会走到这里；先记下，换下一个
        if "\x00" in text:
            if fallback is None:
                fallback = (text, enc)
            continue
        return text, enc
    if fallback:
        return fallback
    # ENCODINGS 以 latin-1 结尾，理论上到不了这里
    return data.decode("utf-8", errors="replace"), "utf-8/replace"


def normalize(text: str) -> str:
    """行尾统一成 LF，去掉残留 BOM，保证结尾恰好一个换行。"""
    text = text.lstrip("﻿")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text.rstrip("\n") + "\n" if text.strip() else ""


def derive(raw: Path, out: Path) -> dict:
    if not raw.is_file():
        return {"status": "error", "stage": "read", "message": f"原件不存在: {raw}"}

    # raw/ 下的原件只读，绝不能被产物写回覆盖
    if out == raw or (out.exists() and out.samefile(raw)):
        return {
            "status": "error",
            "stage": "write",
            "message": f"产物路径与原件相同，拒绝覆盖原件: {raw}（--out 应指向 gen/ 下）",
        }

    try:
        data = raw.read_bytes()
    except OSError as e:
        return {"status": "error", "stage": "read", "message": f"读不了原件: {e}"}

    text, encoding = decode_text(data)
    text = normalize(text)

    try:
        out.parent.mkdir(parents=True, exist_ok=True)
        # newline="" 阻止 Windows 上把 \n 又写回 \r\n
        out.write_text(text, encoding="utf-8", newline="")
    except OSError as e:
        return {"status": "error", "stage": "write", "message": f"写不了产物: {e}"}

    return {
        "status": "ok",
        "raw_file": str(raw),
        "derived_file": str(out),
        "source_encoding": encoding,
        "chars": len(text),
        "lines": text.count("\n"),
        "converted": encoding not in ("utf-8", "utf-8-sig"),
        "empty": not text,
    }


def main() -> None:
    # Windows 控制台默认 GBK，强制 UTF-8 避免中文输出乱码
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, OSError):
            pass

    ap = argparse.ArgumentParser(description="doudou-wiki 纯文本素材归一化")
    ap.add_argument("--raw", required=True, help="raw/ 下原件的绝对路径")
    ap.add_argument("--out", required=True,
                    help="产物绝对路径，用 scan.py 给出的 derived_file")
    ap.add_argument("--json", action="store_true", dest="as_json", help="输出 JSON")
    args = ap.parse_args()

    result = derive(Path(args.raw).resolve(), Path(args.out).resolve())

    if args.as_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif result["status"] == "ok":
        note = f"，原编码 {result['source_encoding']} → UTF-8" if result["converted"] else ""
        warn = "  ⚠️ 内容为空" if result["empty"] else ""
        print(f"✅ {result['derived_file']}（{result['chars']} 字{note}）{warn}")
    else:
        print(f"❌ [{result['stage']}] {result['message']}", file=sys.stderr)

    sys.exit(0 if result["status"] == "ok" else 1)


if __name__ == "__main__":
    main()
