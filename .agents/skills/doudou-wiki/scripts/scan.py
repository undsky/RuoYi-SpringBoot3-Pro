#!/usr/bin/env python3
"""
doudou-wiki 素材扫描与分派脚本。

扫描知识库 kb/raw/ 目录，找出尚未收录的素材，并为每份素材决定预处理路线
（text / doudou-doc / doudou-ocr / doudou-stt），输出 JSON 供 add 工作流消费。

路线按扩展名一对一确定：办公文档走 doudou-doc，图片与 PDF 走 doudou-ocr，
音视频走 doudou-stt，纯文本走 text（归一化拷贝）。没有回落分支。

**每条路线都产出 kb/gen/ 下的产物，包括纯文本。** LLM 默认只读 gen/ 构建知识库，
不读 raw/ 原件 —— 读取面因此是单一、齐整、编码统一的，原件保持不可变。

目录布局:
    <project>/kb/
    ├── raw/   本脚本扫描这里
    ├── gen/   产物写到这里（derived_file 即相对 kb/ 的路径 gen/xxx）
    └── wiki/  已收录判定读这里的 sources/*.md

用法:
    python3 scan.py --raw-dir <KB_RAW> --wiki-dir <KB_WIKI>
    python3 scan.py --raw-dir <KB_RAW> --wiki-dir <KB_WIKI> --file interview.mp4
    python3 scan.py --raw-dir <KB_RAW> --wiki-dir <KB_WIKI> --all
    python3 scan.py --raw-dir <KB_RAW> --wiki-dir <KB_WIKI> --json

输出 JSON 的 pending[] 每项含 route 与 derived_file 字段：route 指明交给谁预处理，
derived_file 既是产物写入路径，也是 add 阶段的读取目标。
零依赖：仅用 Python 3 标准库。
"""

import argparse
import json
import re
import sys
from pathlib import Path

GEN_DIRNAME = "gen"
# 产物路径写成相对 KB 根（kb/）的形式：gen/xxx.txt
GEN_PREFIX = f"{GEN_DIRNAME}/"
# raw/ 内扫描时跳过的目录名。gen/ 已是 raw/ 的平级目录，不会被扫到。
SKIP_DIRS = {"assets", ".trash", ".obsidian", ".git"}

# 纯文本：不需要外部技能，由 derive_text.py 归一化编码后拷进 gen/
TEXT_EXTS = {".md", ".markdown", ".txt", ".text"}

# doudou-doc：有文字层的办公文档与电子书
DOC_EXTS = {
    ".doc", ".docx", ".docm", ".odt", ".rtf",
    ".ppt", ".pptx", ".pptm", ".ppsx", ".odp",
    ".xls", ".xlsx", ".xlsm", ".ods", ".csv",
    ".epub",
}

# doudou-ocr：图片，需要看图认字
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".gif", ".tif", ".tiff", ".webp"}

# PDF 也归 doudou-ocr：它对有文字层的 PDF 会走文字层直抽，扫描件才真跑识别，
# 一条路线同时覆盖两种形态，不需要先试 doc 再回落。
PDF_EXTS = {".pdf"}

# doudou-stt：音视频
AV_EXTS = {
    ".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".opus", ".wma", ".amr",
    ".mp4", ".mov", ".mkv", ".avi", ".wmv", ".flv", ".webm", ".m4v", ".ts",
}

# 产物扩展名沿用原件扩展名的占位符（纯文本路线用）
KEEP_EXT = "<keep>"

# 路线元信息。skill 为技能名（优先用 Skill 工具调用），
# script 为该技能仓库内的脚本相对路径（Skill 工具不可用时的兜底）。
# derived_ext 为 None 表示该路线不产出中间产物（仅 unknown 会走到）。
ROUTES = {
    "text": {
        "skill": None,
        "script": "scripts/derive_text.py",  # 本技能自带，非外部技能
        "derived_ext": KEEP_EXT,
        "note": "纯文本素材，本技能归一化编码后拷入 gen/，不做格式转换",
    },
    "doudou-doc": {
        "skill": "doudou-doc",
        "script": "scripts/anydoc.py",
        "derived_ext": ".md",
        "note": "办公文档/电子书，转 Markdown",
    },
    "doudou-ocr": {
        "skill": "doudou-ocr",
        "script": "scripts/ocr.py",
        "derived_ext": ".txt",
        "note": "图片与 PDF，OCR 取字（有文字层的 PDF 走文字层直抽）",
    },
    "doudou-stt": {
        "skill": "doudou-stt",
        "script": "scripts/whisper.py",
        "derived_ext": ".txt",
        "note": "音视频，转纯文本逐字稿",
    },
}


# ---------- frontmatter（零依赖，正则提取需要的字段） ----------

FM_RE = re.compile(r"^---\s*\n(.*?\n)---\s*\n", re.DOTALL)


def parse_fm_block(block: str) -> dict:
    """解析 frontmatter 文本块：标量、单行列表、多行列表。

    多行列表必须支持 —— 否则本脚本读不到 `raw_file:\\n  - raw/a.pdf` 这种写法，
    会把已收录的素材重新判为待收录，而 check.py（有 PyYAML 时）认为溯源完整，
    两个脚本对同一份文件给出相反结论，重跑 add 就多出一个摘要页。

    与 check.py 的 _fallback_parse 行为保持一致，改动请同步两处。
    """
    fm: dict = {}
    current: str | None = None  # 正在累积多行列表的键
    for line in block.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        stripped = line.strip()
        # 多行列表项：归到上一个键名下
        if stripped.startswith("- "):
            if current is not None:
                fm[current].append(stripped[2:].strip().strip("'\""))
            continue
        if line[:1] in (" ", "\t"):  # 其他嵌套结构，这里不需要
            continue
        km = re.match(r"^([A-Za-z_][\w-]*)\s*:\s*(.*)$", line)
        if not km:
            current = None
            continue
        key, raw = km.group(1), km.group(2).strip()
        if raw.startswith("[") and raw.endswith("]"):
            items = [i.strip().strip("'\"") for i in raw[1:-1].split(",")]
            fm[key] = [i for i in items if i]
            current = None
        elif raw == "":
            # 值为空：可能是多行列表的开头，先占一个空列表等后续 - 项
            fm[key] = []
            current = key
        else:
            fm[key] = raw.strip("'\"")
            current = None
    # 键后既没值也没列表项的，还原成空字符串（保持旧行为）
    return {k: ("" if v == [] else v) for k, v in fm.items()}


def read_frontmatter(path: Path) -> dict:
    """提取 frontmatter 的标量、单行列表与多行列表字段。解析不出来返回 {}。"""
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return {}
    m = FM_RE.match(text)
    if not m:
        return {}
    return parse_fm_block(m.group(1))


# ---------- slug ----------

def needs_rename(slug: str) -> bool:
    """slug 里有非 ASCII 字符就该由 LLM 译成英文 slug。

    判据不能只看 CJK：slugify 里的 `\\w` 在 Python 3 是 Unicode-aware 的，
    西里尔、希腊、阿拉伯、泰文、带音标拉丁字母（café）全都原样留在 slug 里。
    只认 CJK 会让这些素材拿不到改名信号，违反 SCHEMA「文件名始终小写英文」。
    """
    return not slug.isascii()


def slugify(stem: str) -> str:
    """文件名 → 小写连字符 slug。非 ASCII 字符保留（由 LLM 决定是否改英文名）。"""
    s = stem.strip().lower()
    s = re.sub(r"[^\w㐀-䶿一-鿿぀-ヿ가-힯]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-_")
    return s[:60] or "untitled"


def decide_route(ext: str) -> str:
    """按扩展名决定预处理路线。"""
    if ext in TEXT_EXTS:
        return "text"
    if ext in DOC_EXTS:
        return "doudou-doc"
    # PDF 统一走 OCR：有文字层的它会直抽文字层（不到 1 秒），扫描件才真跑识别
    if ext in IMAGE_EXTS or ext in PDF_EXTS:
        return "doudou-ocr"
    if ext in AV_EXTS:
        return "doudou-stt"
    return "unknown"


# ---------- 已收录判定 ----------

def strip_raw_prefix(p: str) -> str:
    """把 frontmatter 里的 raw_file 归一成相对 raw/ 的路径。

    容忍这些写法：raw/a.pdf、../../raw/a.pdf、kb/raw/a.pdf、./a.pdf
    """
    p = p.replace("\\", "/").strip().strip("'\"")
    while p.startswith(("../", "./")):
        p = p[3:] if p.startswith("../") else p[2:]
    for prefix in ("kb/raw/", "raw/"):
        if p.startswith(prefix):
            return p[len(prefix):]
    return p


def as_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, (list, tuple)):
        return [str(v).strip() for v in value if str(v).strip()]
    return [str(value).strip()] if str(value).strip() else []


def collect_added(wiki_dir: Path) -> dict:
    """扫描 wiki/sources/，返回已收录素材的 raw_file 相对路径 → 摘要页相对路径。"""
    added = {}
    sources_dir = wiki_dir / "sources"
    if not sources_dir.is_dir():
        return added
    for page in sorted(sources_dir.rglob("*.md")):
        fm = read_frontmatter(page)
        raw_files = as_list(fm.get("raw_file"))
        rel_page = page.relative_to(wiki_dir).as_posix()
        if raw_files:
            for rf in raw_files:
                added[strip_raw_prefix(rf)] = rel_page
        else:
            # 没写 raw_file 的旧页面，退化成按文件名匹配（check.py 会报 P0）
            added.setdefault(f"__stem__{page.stem}", rel_page)
    return added


def iter_raw_files(raw_dir: Path) -> list[Path]:
    """遍历 raw/ 下的素材文件，跳过 assets/ 等目录和隐藏文件。"""
    files = []
    for p in sorted(raw_dir.rglob("*")):
        if not p.is_file():
            continue
        rel_parts = p.relative_to(raw_dir).parts
        if any(part in SKIP_DIRS or part.startswith(".") for part in rel_parts[:-1]):
            continue
        if p.name.startswith(".") or p.name.lower() in ("readme.md", ".gitkeep"):
            continue
        files.append(p)
    return files


# ---------- 扫描 ----------

def build_entry(path: Path, raw_dir: Path, gen_dir: Path, slug: str) -> dict:
    ext = path.suffix.lower()
    route = decide_route(ext)
    meta = ROUTES.get(route, {})
    derived_ext = meta.get("derived_ext")
    # 纯文本产物沿用原件扩展名：a.md → gen/a.md，b.txt → gen/b.txt
    if derived_ext == KEEP_EXT:
        derived_ext = ext or ".txt"
    rel = path.relative_to(raw_dir).as_posix()
    try:
        size = path.stat().st_size
    except OSError:
        size = 0
    # derived_file 是相对 KB 根（kb/）的路径，与 frontmatter 写法一致；
    # derived_path 是绝对路径，转换时直接当 -o 用。
    derived_file = f"{GEN_PREFIX}{slug}{derived_ext}" if derived_ext else None
    entry = {
        "raw_file": rel,
        "raw_path": str(path),
        "ext": ext,
        "size_bytes": size,
        "size_human": human_size(size),
        "slug": slug,
        "source_page": f"sources/{slug}.md",
        "route": route,
        "route_skill": meta.get("skill"),
        "route_script": meta.get("script"),
        "route_note": meta.get("note", "扩展名未识别，需人工判断如何处理"),
        "derived_file": derived_file,
        "derived_path": str(gen_dir / f"{slug}{derived_ext}") if derived_ext else None,
        "needs_rename": needs_rename(slug),
    }
    # 100MB 是处理技能的上传上限；text 路线是本地拷贝，不受限
    if size > 100 * 1024 * 1024 and route not in ("text", "unknown"):
        entry["warning"] = "超过 100MB 上传上限，需先压缩或改用 URL 形态"
    return entry


def human_size(n: int) -> str:
    size = float(n)
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{size:.0f}{unit}" if unit == "B" else f"{size:.1f}{unit}"
        size /= 1024.0
    return f"{size:.1f}GB"


def assign_slugs(files: list[Path]) -> dict[Path, str]:
    """给素材分配 slug，同 slug 的第二个起追加扩展名，再冲突追加序号。

    **必须在 raw/ 的全集上调用**，不能只在 --file 筛出的子集上跑：slug 是产物落点
    （gen/<slug>.<ext>）和摘要页名（sources/<slug>.md）的依据，若随筛选范围变化，
    `--file a.png` 会把 a.png 的产物写到 a.pdf 的落点上，静默覆盖后者的产物。
    """
    used, slugs = {}, {}
    for f in files:
        base = slugify(f.stem)
        slug = base
        if base in used:
            slug = f"{base}-{f.suffix.lstrip('.').lower()}"
            n = 2
            while slug in used:
                slug = f"{base}-{n}"
                n += 1
        used[slug] = f
        slugs[f] = slug
    return slugs


def match_only(files: list[Path], raw_dir: Path, only: str) -> list[Path]:
    """按 --file 的值筛素材。接受相对 raw/ 的路径、裸文件名，或绝对路径。"""
    raw = only.replace("\\", "/").strip().strip("'\"")
    # 只剥开头的 ./ 段，不用 lstrip("./") —— 那是逐字符剥除，
    # 会把 /abs/a.png 变成 abs/a.png、..a.png 变成 a.png
    while raw.startswith("./"):
        raw = raw[2:]

    # 绝对路径：换算成相对 raw/ 的形式
    target = raw
    cand = Path(raw)
    if cand.is_absolute():
        try:
            target = cand.resolve().relative_to(raw_dir).as_posix()
        except (ValueError, OSError):
            target = raw

    exact = [f for f in files if f.relative_to(raw_dir).as_posix() == target]
    if exact:
        return exact
    name = Path(target).name
    return [f for f in files if f.name == name]


def scan(raw_dir: Path, wiki_dir: Path, gen_dir: Path,
         only: str | None, want_all: bool) -> dict:
    added = collect_added(wiki_dir)
    all_files = iter_raw_files(raw_dir)

    # slug 先在全集上定好，再按 --file 收窄，保证同一份素材的 slug
    # 不随扫描范围改变
    slugs = assign_slugs(all_files)

    files = all_files
    if only:
        files = match_only(all_files, raw_dir, only)
        if not files:
            return {
                "status": "error",
                "message": f"raw/ 下找不到指定素材: {only}",
                "raw_dir": str(raw_dir),
            }

    pending, done, unknown = [], [], []
    for f in files:
        rel = f.relative_to(raw_dir).as_posix()
        entry = build_entry(f, raw_dir, gen_dir, slugs[f])
        hit = added.get(rel) or added.get(f"__stem__{slugs[f]}")
        if hit and not want_all:
            entry["source_page"] = hit
            done.append(entry)
            continue
        if entry["route"] == "unknown":
            unknown.append(entry)
        else:
            pending.append(entry)

    return {
        "status": "ok",
        "raw_dir": str(raw_dir),
        "wiki_dir": str(wiki_dir),
        "gen_dir": str(gen_dir),
        "counts": {
            "raw_total": len(files),
            "pending": len(pending),
            "already_added": len(done),
            "unknown_ext": len(unknown),
        },
        "by_route": {
            r: sum(1 for e in pending if e["route"] == r)
            for r in sorted({e["route"] for e in pending})
        },
        "pending": pending,
        "unknown": unknown,
        "already_added": [
            {"raw_file": e["raw_file"], "source_page": e["source_page"]} for e in done
        ],
    }


# ---------- main ----------

def print_human(result: dict) -> None:
    if result["status"] != "ok":
        print(f"错误: {result['message']}", file=sys.stderr)
        return
    c = result["counts"]
    print(f"素材扫描 — {result['raw_dir']}")
    print(
        f"共 {c['raw_total']} 份：待收录 {c['pending']}，"
        f"已收录 {c['already_added']}，未识别 {c['unknown_ext']}\n"
    )
    if result["pending"]:
        print("待收录:")
        for e in result["pending"]:
            warn = f"  ⚠️ {e['warning']}" if e.get("warning") else ""
            print(f"  [{e['route']}] {e['raw_file']} ({e['size_human']})")
            print(f"      → {e['source_page']}{warn}")
    if result["unknown"]:
        print("\n未识别扩展名（需人工判断）:")
        for e in result["unknown"]:
            print(f"  {e['raw_file']} ({e['ext'] or '无扩展名'})")
    if not result["pending"] and not result["unknown"]:
        print("✅ 没有待收录的新素材。")


def main() -> None:
    # Windows 控制台默认 GBK，强制 UTF-8 避免中文输出乱码
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, OSError):
            pass

    ap = argparse.ArgumentParser(description="doudou-wiki 素材扫描与分派")
    ap.add_argument("--raw-dir", required=True, help="kb/raw 目录绝对路径")
    ap.add_argument("--wiki-dir", required=True, help="kb/wiki 目录绝对路径")
    ap.add_argument("--gen-dir", help="kb/gen 目录绝对路径。省略则取 raw/ 的平级 gen/")
    ap.add_argument("--file", dest="only", help="仅处理指定素材（相对 raw/ 的路径或文件名）")
    ap.add_argument("--all", action="store_true", help="忽略已收录判定，列出全部素材")
    ap.add_argument("--json", action="store_true", dest="as_json", help="输出 JSON")
    args = ap.parse_args()

    raw_dir = Path(args.raw_dir).resolve()
    wiki_dir = Path(args.wiki_dir).resolve()
    # 标准布局下 gen/ 与 raw/ 同在 kb/ 内，据此推定即可
    gen_dir = (Path(args.gen_dir).resolve() if args.gen_dir
               else raw_dir.parent / GEN_DIRNAME)

    if not raw_dir.is_dir():
        msg = {"status": "error", "message": f"raw 目录不存在: {raw_dir}"}
        print(json.dumps(msg, ensure_ascii=False, indent=2) if args.as_json
              else f"错误: {msg['message']}", file=sys.stderr)
        sys.exit(2)

    result = scan(raw_dir, wiki_dir, gen_dir, args.only, args.all)
    if args.as_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print_human(result)
    sys.exit(0 if result["status"] == "ok" else 1)


if __name__ == "__main__":
    main()
