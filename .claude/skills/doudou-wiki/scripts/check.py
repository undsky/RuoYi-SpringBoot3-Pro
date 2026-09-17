#!/usr/bin/env python3
"""
doudou-wiki 确定性健康检查脚本。

用代码检测结构性问题，输出人类可读报告或 JSON 供 test 工作流使用。
覆盖：断链、raw/gen wikilink 误用、frontmatter 完整性、索引一致性、双向链接、
孤岛页面、sources 字段、以及四层架构特有的 raw_file / derived_file 溯源检查
（两个字段都必填 —— 每份素材都有 gen/ 产物，摘要内容取自产物而非原件）。

frontmatter 里的路径按 KB 根（kb/）解析：raw/xxx → kb/raw/xxx，gen/xxx → kb/gen/xxx。

用法:
    python3 check.py --wiki-dir <KB_WIKI> --raw-dir <KB_RAW>
    python3 check.py --wiki-dir <KB_WIKI> --raw-dir <KB_RAW> --gen-dir <KB_GEN> --json

零依赖：有 PyYAML 就用，没有就退回内置的正则解析。
"""

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:
    yaml = None

REQUIRED_FRONTMATTER = {"title", "type", "created", "updated", "tags"}
VALID_TYPES = {"source", "entity", "concept", "analysis", "overview", "conventions"}
SPECIAL_PAGES = {"index.md", "log.md"}
CONTENT_DIRS = ("sources/", "entities/", "concepts/", "analyses/")
RAW_DIRNAME = "raw"
GEN_DIRNAME = "gen"

# main() 会按命令行参数重设这三个。给出初值而非只写注解，
# 否则被 import 后直接调 run_all_checks() 会 NameError（注解不创建绑定）。
WIKI_DIR: Path = Path(".")
RAW_DIR: Path = Path("raw")
GEN_DIR: Path = Path(GEN_DIRNAME)

# ---------- helpers ----------

FM_RE = re.compile(r"^---\s*\n(.*?\n)---\s*\n?(.*)", re.DOTALL)


def _fallback_parse(block: str) -> dict:
    """PyYAML 不在时的极简 frontmatter 解析：标量 + 单行列表 + 多行列表。

    与 scan.py 的 parse_fm_block 行为保持一致 —— 两个脚本对同一份 frontmatter
    必须得出相同结论，否则会出现「check 说溯源完整、scan 说尚未收录」这类矛盾。
    改动请同步两处。
    """
    fm: dict = {}
    current: str | None = None  # 正在累积多行列表的键
    for line in block.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        stripped = line.strip()
        if stripped.startswith("- "):
            if current is not None:
                fm[current].append(stripped[2:].strip().strip("'\""))
            continue
        if line[:1] in (" ", "\t"):
            continue
        m = re.match(r"^([A-Za-z_][\w-]*)\s*:\s*(.*)$", line)
        if not m:
            current = None
            continue
        key, raw = m.group(1), m.group(2).strip()
        if raw.startswith("[") and raw.endswith("]"):
            items = [i.strip().strip("'\"") for i in raw[1:-1].split(",")]
            fm[key] = [i for i in items if i]
            current = None
        elif raw == "":
            fm[key] = []
            current = key
        else:
            fm[key] = raw.strip("'\"")
            current = None
    return {k: ("" if v == [] else v) for k, v in fm.items()}


def parse_frontmatter(filepath: Path) -> tuple[dict | None, str]:
    """返回 (frontmatter, body)。解析失败返回 (None, 全文)。"""
    text = filepath.read_text(encoding="utf-8", errors="replace")
    m = FM_RE.match(text)
    if not m:
        return None, text
    block, body = m.group(1), m.group(2)
    if yaml is not None:
        try:
            fm = yaml.safe_load(block)
            if isinstance(fm, dict):
                return fm, body
        except Exception:
            pass
    fm = _fallback_parse(block)
    return (fm or None), body


FENCE_RE = re.compile(r"^\s*(```+|~~~+)")


def strip_code(text: str) -> str:
    """去掉围栏代码块与行内代码。

    代码块里举例写的 `[[xxx]]` 不是真链接，算进去会让讲规范的页面误报断链。
    """
    out, fence = [], None
    for line in text.splitlines():
        m = FENCE_RE.match(line)
        if fence is None:
            if m:
                fence = m.group(1)
                continue
            out.append(re.sub(r"`[^`\n]*`", "", line))
        else:
            # 收尾围栏至少与开头一样长（四个反引号开的块，三个关不掉）
            if m and m.group(1).startswith(fence):
                fence = None
            continue
    return "\n".join(out)


def extract_wikilinks(text: str) -> list[str]:
    """提取所有 [[target]] / [[target|alias]] 中的 target，忽略代码块内的。"""
    raw_targets = re.findall(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]", strip_code(text))
    return [t.strip() for t in raw_targets if t.strip()]


_TEXT_CACHE: dict[Path, str] = {}


def page_text(page: Path) -> str:
    """页面正文（已去掉代码块），多个检查项共用，避免重复读盘。"""
    if page not in _TEXT_CACHE:
        _TEXT_CACHE[page] = strip_code(
            page.read_text(encoding="utf-8", errors="replace")
        )
    return _TEXT_CACHE[page]


def get_wiki_pages() -> list[Path]:
    """所有 wiki 页面，排除 index.md / log.md 与回收站。"""
    pages = []
    for f in WIKI_DIR.rglob("*.md"):
        rel = f.relative_to(WIKI_DIR)
        if any(p.startswith(".") for p in rel.parts):
            continue
        if f.name not in SPECIAL_PAGES:
            pages.append(f)
    return sorted(pages)


def as_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, (list, tuple)):
        return [str(v).strip() for v in value if str(v).strip()]
    return [str(value).strip()] if str(value).strip() else []


def _clean_rel(p: str) -> str:
    """去掉引号、反斜杠与开头的 ./ ../ 段，得到相对 KB 根的路径。"""
    p = p.replace("\\", "/").strip().strip("'\"")
    while p.startswith(("../", "./")):
        p = p[3:] if p.startswith("../") else p[2:]
    # 容忍多写了一层 kb/
    if p.startswith("kb/"):
        p = p[3:]
    return p


def strip_raw_prefix(p: str) -> str:
    """归一成相对 raw/ 的路径（供 raw_file 用）。"""
    p = _clean_rel(p)
    prefix = f"{RAW_DIRNAME}/"
    return p[len(prefix):] if p.startswith(prefix) else p


def resolve_ref(p: str) -> Path | None:
    """把 frontmatter 里的 raw_file / derived_file 解析成实际文件路径。

    raw/xxx → RAW_DIR/xxx，gen/xxx → GEN_DIR/xxx。
    没写前缀的裸文件名按 raw/ 处理。远程 URL 返回 None，调用方跳过。
    """
    if p.strip().startswith(("http://", "https://")):
        return None
    rel = _clean_rel(p)
    if rel.startswith(f"{GEN_DIRNAME}/"):
        return GEN_DIR / rel[len(GEN_DIRNAME) + 1:]
    if rel.startswith(f"{RAW_DIRNAME}/"):
        return RAW_DIR / rel[len(RAW_DIRNAME) + 1:]
    # 到这里只剩裸文件名，按 raw/ 处理
    return RAW_DIR / rel


def issue(level: str, kind: str, file: str, detail: str) -> dict:
    return {"level": level, "type": kind, "file": file, "detail": detail}


def rel(page: Path) -> str:
    return page.relative_to(WIKI_DIR).as_posix()


# ---------- checks ----------

def check_broken_links(pages: list[Path]) -> list[dict]:
    """P0: [[link]] 指向不存在的页面。"""
    issues = []
    all_ids = {p.stem for p in pages} | {Path(s).stem for s in SPECIAL_PAGES}
    for page in pages:
        for raw_target in extract_wikilinks(page_text(page)):
            # 素材/产物路径交给 check_raw_wikilinks 单独报，避免同一处重复计两条
            if raw_target.startswith((f"{RAW_DIRNAME}/", f"{GEN_DIRNAME}/")):
                continue
            # 支持锚点 [[page#heading]] 与路径形式 [[sources/page]]
            page_target = raw_target.split("#")[0].strip()
            if not page_target:
                continue
            stem_target = Path(page_target).stem
            if stem_target not in all_ids:
                issues.append(issue("P0", "broken_link", rel(page),
                                    f"[[{raw_target}]] 指向不存在的页面"))
    return issues


def check_raw_wikilinks(pages: list[Path]) -> list[dict]:
    """P0: [[raw/...]] / [[gen/...]] 应改为普通 Markdown 链接，否则图谱出现虚影节点。"""
    issues = []
    pat = re.compile(r"\[\[((?:raw|gen)/[^\]|]+)(?:\|[^\]]+)?\]\]")
    for page in pages:
        for m in pat.findall(page_text(page)):
            issues.append(issue("P0", "raw_wikilink", rel(page),
                                f"[[{m}]] 应改为普通 Markdown 链接，避免图谱虚影节点"))
    return issues


def check_frontmatter(pages: list[Path]) -> list[dict]:
    """P0: frontmatter 完整性；P1: type 合法性。"""
    issues = []
    for page in pages:
        fm, _ = parse_frontmatter(page)
        if fm is None:
            issues.append(issue("P0", "no_frontmatter", rel(page), "缺少 YAML frontmatter"))
            continue
        missing = REQUIRED_FRONTMATTER - set(fm.keys())
        if missing:
            issues.append(issue("P0", "incomplete_frontmatter", rel(page),
                                f"缺少字段: {', '.join(sorted(missing))}"))
        ptype = fm.get("type")
        if ptype and ptype not in VALID_TYPES:
            issues.append(issue("P1", "invalid_type", rel(page),
                                f"type '{ptype}' 不在合法值 {sorted(VALID_TYPES)} 中"))
    return issues


def check_index_consistency(pages: list[Path]) -> list[dict]:
    """P0: index.md 与实际文件互相对得上。"""
    issues = []
    index_path = WIKI_DIR / "index.md"
    if not index_path.exists():
        return [issue("P0", "missing_index", "index.md", "index.md 不存在")]

    index_text = index_path.read_text(encoding="utf-8", errors="replace")
    # 提取 Markdown 链接中的 .md 路径，容忍锚点与标题等后缀
    raw_refs = re.findall(r"\]\(([^)#\s]+\.md)(?:[#\s][^)]*)?\)", index_text)
    index_refs = {_clean_rel(ref) for ref in raw_refs if not ref.startswith(("http://", "https://"))}

    for ref in index_refs:
        if not (WIKI_DIR / ref).exists():
            issues.append(issue("P0", "index_dangling", "index.md",
                                f"索引引用 {ref} 但文件不存在"))

    for page in pages:
        r = rel(page)
        if r.startswith(CONTENT_DIRS) and r not in index_refs:
            issues.append(issue("P0", "index_missing", "index.md",
                                f"文件 {r} 存在但未在索引中列出"))
    return issues


def check_bidirectional_links(pages: list[Path]) -> list[dict]:
    """P1: A 的 Related 链到 B，B 的 Related 也应链回 A。"""
    issues = []
    page_map = {p.stem: p for p in pages}
    related = {}
    for page in pages:
        text = page_text(page)
        m = re.search(r"##\s+Related\s*\n(.*?)(?:\n##\s|\Z)", text, re.DOTALL)
        if m:
            raw_targets = extract_wikilinks(m.group(1))
            related[page.stem] = {Path(t.split("#")[0].strip()).stem for t in raw_targets if t.strip()}

    checked = set()
    for pid, targets in related.items():
        for target in targets:
            pair = tuple(sorted((pid, target)))
            if pair in checked:
                continue
            checked.add(pair)
            if target in page_map and pid not in related.get(target, set()):
                issues.append(issue("P1", "missing_reverse_link", rel(page_map[target]),
                                    f"Related 缺少到 [[{pid}]] 的反向链接（{pid} 已链到此页）"))
    return issues


def check_orphan_pages(pages: list[Path]) -> list[dict]:
    """P1: 没有任何其他内容页链入的孤岛页面。"""
    issues = []
    incoming = defaultdict(set)
    for page in pages:
        for target in extract_wikilinks(page_text(page)):
            page_target = target.split("#")[0].strip()
            stem_target = Path(page_target).stem
            incoming[stem_target].add(page.stem)
    for page in pages:
        r = rel(page)
        if r in ("overview.md", "conventions.md"):
            continue
        if not (incoming.get(page.stem, set()) - {page.stem}):
            issues.append(issue("P1", "orphan_page", r, "孤岛页面，没有其他 wiki 页面链接到此"))
    return issues


def check_sources_field(pages: list[Path]) -> list[dict]:
    """P1: entity/concept/analysis 页面应标注引用的素材。"""
    issues = []
    for page in pages:
        fm, _ = parse_frontmatter(page)
        if not fm:
            continue
        ptype = fm.get("type", "")
        if ptype in ("entity", "concept", "analysis") and not fm.get("sources"):
            issues.append(issue("P1", "missing_sources", rel(page),
                                f"type={ptype} 但缺少 sources 字段（应标注引用的原始素材）"))
    return issues


def check_provenance(pages: list[Path]) -> list[dict]:
    """四层架构溯源检查：source 页必须能追回 raw/ 原件与 gen/ 中间产物。"""
    issues = []
    for page in pages:
        fm, _ = parse_frontmatter(page)
        if not fm or fm.get("type") != "source":
            continue
        r = rel(page)

        raw_files = as_list(fm.get("raw_file"))
        if not raw_files:
            issues.append(issue("P0", "missing_raw_file", r,
                                "source 页缺少 raw_file 字段，无法判定该素材是否已收录"))
        for rf in raw_files:
            target = resolve_ref(rf)
            if target is not None and not target.exists():
                issues.append(issue("P0", "raw_file_missing", r,
                                    f"raw_file 指向的原件不存在: {rf}"))

        for df in as_list(fm.get("derived_file")):
            target = resolve_ref(df)
            if target is not None and not target.exists():
                issues.append(issue("P1", "derived_file_missing", r,
                                    f"derived_file 指向的产物不存在: {df}"
                                    "（可按 convert.md 重转再生成）"))

        # 每份素材都该有中间产物 —— 纯文本也经 derive_text.py 归一化后落进 gen/。
        # 摘要内容取自产物，缺了这个字段就等于溯源链断在读取面这一环，故为 P0。
        if raw_files and not as_list(fm.get("derived_file")):
            issues.append(issue("P0", "missing_derived_file", r,
                                "source 页缺少 derived_file 字段。每份素材都有 gen/ 产物"
                                "（纯文本亦经 derive_text.py 归一化），摘要内容应取自该产物"))
    return issues


def check_pending_raw(pages: list[Path]) -> list[dict]:
    """P2: raw/ 中存在但没有任何 source 页引用的素材。"""
    if not RAW_DIR.is_dir():
        return []
    referenced = set()
    for page in pages:
        fm, _ = parse_frontmatter(page)
        if not fm:
            continue
        # 只看 raw_file —— derived_file 指向 gen/，归一成相对 raw/ 的路径没有意义，
        # 混进来还会让 raw/ 下真有个叫 gen 的子目录时误判为已引用
        for v in as_list(fm.get("raw_file")):
            if _clean_rel(v).startswith(f"{GEN_DIRNAME}/"):
                continue
            referenced.add(strip_raw_prefix(v))

    # gen/ 已是 raw/ 的平级目录，不会被扫到
    skip = {"assets", ".trash", ".obsidian", ".git"}
    issues = []
    for f in sorted(RAW_DIR.rglob("*")):
        if not f.is_file():
            continue
        parts = f.relative_to(RAW_DIR).parts
        if any(p in skip or p.startswith(".") for p in parts[:-1]):
            continue
        if f.name.startswith(".") or f.name.lower() in ("readme.md", ".gitkeep"):
            continue
        r = f.relative_to(RAW_DIR).as_posix()
        if r not in referenced:
            issues.append(issue("P2", "pending_raw", f"{RAW_DIRNAME}/{r}",
                                "素材尚未收录，可执行 add"))
    return issues


# ---------- main ----------

def run_all_checks() -> list[dict]:
    _TEXT_CACHE.clear()  # 同一进程内换知识库再跑时不复用旧内容
    pages = get_wiki_pages()
    issues = []
    issues += check_broken_links(pages)
    issues += check_raw_wikilinks(pages)
    issues += check_frontmatter(pages)
    issues += check_index_consistency(pages)
    issues += check_provenance(pages)
    issues += check_bidirectional_links(pages)
    issues += check_orphan_pages(pages)
    issues += check_sources_field(pages)
    issues += check_pending_raw(pages)
    order = {"P0": 0, "P1": 1, "P2": 2}
    issues.sort(key=lambda x: (order.get(x["level"], 9), x["file"], x["type"]))
    return issues


def page_stats(pages: list[Path]) -> dict:
    stats = {"total": len(pages), "sources": 0, "entities": 0, "concepts": 0, "analyses": 0}
    for p in pages:
        r = rel(p)
        for key, prefix in (("sources", "sources/"), ("entities", "entities/"),
                            ("concepts", "concepts/"), ("analyses", "analyses/")):
            if r.startswith(prefix):
                stats[key] += 1
    return stats


def main() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, OSError):
            pass

    ap = argparse.ArgumentParser(description="doudou-wiki 健康检查")
    ap.add_argument("--wiki-dir", required=True, help="kb/wiki 目录绝对路径")
    ap.add_argument("--raw-dir", required=True, help="kb/raw 目录绝对路径")
    ap.add_argument("--gen-dir", help="kb/gen 目录绝对路径。省略则取 raw/ 的平级 gen/")
    ap.add_argument("--json", action="store_true", dest="as_json", help="输出 JSON")
    args = ap.parse_args()

    global WIKI_DIR, RAW_DIR, GEN_DIR
    WIKI_DIR = Path(args.wiki_dir).resolve()
    RAW_DIR = Path(args.raw_dir).resolve()
    # 标准布局下 gen/ 与 raw/ 同在 kb/ 内
    GEN_DIR = (Path(args.gen_dir).resolve() if args.gen_dir
               else RAW_DIR.parent / GEN_DIRNAME)

    if not WIKI_DIR.is_dir():
        print(f"错误: wiki 目录不存在: {WIKI_DIR}", file=sys.stderr)
        sys.exit(2)

    issues = run_all_checks()
    pages = get_wiki_pages()
    stats = page_stats(pages)

    if args.as_json:
        print(json.dumps({"stats": stats, "issues": issues},
                         ensure_ascii=False, indent=2))
        sys.exit(1 if any(i["level"] == "P0" for i in issues) else 0)

    buckets = {lv: [i for i in issues if i["level"] == lv] for lv in ("P0", "P1", "P2")}
    print(f"Wiki 健康检查 — {WIKI_DIR}")
    if not GEN_DIR.is_dir():
        print(f"⚠️  产物目录不存在: {GEN_DIR}（derived_file 检查会全部报 P1）")
    print(f"共 {stats['total']} 个页面（素材 {stats['sources']} / 实体 {stats['entities']} "
          f"/ 概念 {stats['concepts']} / 分析 {stats['analyses']}）\n")

    if not issues:
        print("✅ 未发现问题！")
        return

    labels = {"P0": "🔴 P0 — 需要修复", "P1": "🟡 P1 — 建议改进", "P2": "🟢 P2 — 可选优化"}
    for lv in ("P0", "P1", "P2"):
        if buckets[lv]:
            print(f"{labels[lv]} ({len(buckets[lv])})")
            for i in buckets[lv]:
                print(f"  [{i['type']}] {i['file']}: {i['detail']}")
            print()

    print(f"总计: {len(buckets['P0'])} P0 / {len(buckets['P1'])} P1 / {len(buckets['P2'])} P2")
    if buckets["P0"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
