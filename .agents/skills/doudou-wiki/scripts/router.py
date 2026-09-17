#!/usr/bin/env python3
"""
doudou-wiki 确定性路由脚本。

解析子命令、选择知识库、探测三个文件处理技能（doudou-doc / doudou-ocr / doudou-stt）
的可用性，输出路径变量，让 LLM 跳过路由直接进入工作流。

知识库布局（一律收在 kb/ 下）:
    <project>/kb/
    ├── raw/     原始素材，不可变
    ├── gen/     文本化产物，LLM 的默认读取面，可重新生成
    └── wiki/    LLM 拥有的知识库页面

**默认用当前项目根目录的 `kb/`**：从工作目录逐级向上找到第一个 `kb/` 即用它，
不需要注册。找不到才回落到 registries.json 里注册过的知识库。
就近发现的 kb/ 若也在注册表里，name / language 取注册项的值（init 时用户选的语言据此生效）。

用法:
    python3 router.py add
    python3 router.py add interview.mp4
    python3 router.py query "Memex 是什么？"
    python3 router.py test
    python3 router.py clear all
    python3 router.py doctor
    python3 router.py init
    python3 router.py help

输出 JSON:
    {
      "status": "ok",
      "subcommand": "add",
      "args": "interview.mp4",
      "workflow": "workflows/add.md",
      "schema": "SCHEMA.md",
      "kb": {"id": ..., "name": ..., "root": ..., "raw": ..., "gen": ...,
             "wiki": ..., "lang": ..., "source": "local" | "registry"},
      "processors": {"doudou-doc": {...}, "doudou-ocr": {...}, "doudou-stt": {...}},
      "skill_dir": "..."
    }

多知识库且无 default 时输出 status=select，附候选列表让 LLM 询问用户。
registries.json 里漏写 path 的条目会被跳过，其 id 列在 malformed_registries 中。
零依赖：仅用 Python 3 标准库。
"""

import json
import os
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
REGISTRIES_FILE = SKILL_DIR / "registries.json"

# 知识库目录名：项目根下的 kb/，内含 raw/ gen/ wiki/
KB_DIRNAME = "kb"
RAW_DIRNAME = "raw"
GEN_DIRNAME = "gen"
WIKI_DIRNAME = "wiki"

# 向上找 kb/ 时最多爬几层，避免在深目录里一路走到盘根
MAX_UPWARD_LEVELS = 8

#   add     收录素材      test    知识库健康检查
#   clear   重置/删除     doctor  技能自检（架构、脚本、分派、端到端）
VALID_SUBCOMMANDS = {"init", "add", "query", "test", "clear", "doctor", "help"}

# 不需要选知识库的子命令
NO_KB_REQUIRED = {"init", "help"}

# 需要读 SCHEMA.md 的子命令（会创建/修改 wiki 页面）
NEEDS_SCHEMA = {"add", "query", "test", "clear"}

# 需要探测文件处理技能可用性的子命令
NEEDS_PROCESSORS = {"add", "doctor"}

# 三个外部文件处理技能：技能名 → (入口脚本相对路径, 环境变量名, 处理对象)
# 纯文本不在此列 —— 它走本技能自带的 scripts/derive_text.py，无需探测。
PROCESSORS = {
    "doudou-doc": ("scripts/anydoc.py", "DOUDOU_DOC_SKILL_DIR", "办公文档 / 电子书"),
    "doudou-ocr": ("scripts/ocr.py", "DOUDOU_OCR_SKILL_DIR", "图片 / 扫描件 / PDF"),
    "doudou-stt": ("scripts/whisper.py", "DOUDOU_STT_SKILL_DIR", "音频 / 视频"),
}


def load_registries() -> dict:
    if not REGISTRIES_FILE.exists():
        return {"default": None, "registries": {}}
    try:
        with open(REGISTRIES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        return {"default": None, "registries": {}}
    return data if isinstance(data, dict) else {"default": None, "registries": {}}


def processor_candidates(name: str, env_var: str, overrides: dict) -> list[Path]:
    """按优先级给出技能目录候选：registries 覆盖 > 环境变量 > 全局安装 > 同级仓库。"""
    cands = []
    if overrides.get(name):
        cands.append(Path(str(overrides[name])).expanduser())
    if os.environ.get(env_var):
        cands.append(Path(os.environ[env_var]).expanduser())
    home = Path.home()
    cands += [
        home / ".claude" / "skills" / name,
        home / ".agents" / "skills" / name,
    ]
    # 开发形态：与本技能仓库平级的 doudou-xxx-skill 目录
    repo_root = SKILL_DIR  # <repo>
    for parent in (repo_root.parent, repo_root):
        cands += [parent / f"{name}-skill", parent / name]
    return cands


def detect_processors(overrides: dict) -> dict:
    """探测三个文件处理技能是否就位，返回可用性与兜底脚本路径。"""
    found = {}
    for name, (script_rel, env_var, handles) in PROCESSORS.items():
        info = {
            "skill": name,
            "handles": handles,
            "available": False,
            "dir": None,
            "script": None,
            "env_configured": None,
        }
        for cand in processor_candidates(name, env_var, overrides):
            script = cand / script_rel
            if script.is_file():
                info["available"] = True
                info["dir"] = str(cand.resolve())
                info["script"] = str(script.resolve())
                info["env_configured"] = (cand / ".env").is_file()
                break
        found[name] = info
    return found


def kb_paths(root: str) -> dict:
    """由 KB 根目录推出三个子目录。root 即 <project>/kb。"""
    root = str(root).rstrip("/\\")
    return {
        "root": root,
        "raw": f"{root}/{RAW_DIRNAME}",
        "gen": f"{root}/{GEN_DIRNAME}",
        "wiki": f"{root}/{WIKI_DIRNAME}",
    }


def kb_path_of(kb_data) -> str | None:
    """取注册条目的 path。条目结构不对、或 path 缺失/为空时返回 None。

    本脚本的全部契约是「输出 JSON 让 LLM 分支」，裸取 kb_data["path"] 会在
    条目写漏 path 时抛 KeyError 打破契约，四个 status 分支都接不住。
    """
    if not isinstance(kb_data, dict):
        return None
    path = kb_data.get("path")
    if path is None or not str(path).strip():
        return None
    return str(path)


def make_kb_info(kb_id: str, kb_data: dict, source: str = "registry") -> dict:
    path = kb_path_of(kb_data) or ""
    # expanduser 让 registries.json 里写 ~/... 也能用
    info = kb_paths(str(Path(path).expanduser()) if path else "")
    info.update({
        "id": kb_id,
        "name": kb_data.get("name", kb_id),
        "lang": kb_data.get("language", "zh"),
        "source": source,
    })
    return info


def kb_list_of(kbs: dict, default_id: str | None = None) -> list[dict]:
    """候选知识库列表，供 select 分支和多库提示用。"""
    items = []
    for k, v in kbs.items():
        item = {"id": k, "name": v.get("name", k), "path": kb_path_of(v)}
        if default_id is not None:
            item["is_default"] = k == default_id
        items.append(item)
    return items


def path_error(kb_id: str, kb_data: dict, extra: dict | None = None) -> dict | None:
    """知识库路径不存在时给出 error 结果，正常返回 None。"""
    path = kb_path_of(kb_data)
    if path and not Path(path).expanduser().exists():
        return {
            "status": "error",
            "message": f"知识库路径不存在: {path}（registries.json 中的 '{kb_id}'）",
            "skill_dir": str(SKILL_DIR),
            **(extra or {}),
        }
    return None


def find_local_kb() -> Path | None:
    """从工作目录逐级向上找 kb/ 目录，找到第一个就用它。"""
    try:
        cwd = Path.cwd().resolve()
    except OSError:
        return None
    for parent in [cwd, *cwd.parents][:MAX_UPWARD_LEVELS + 1]:
        cand = parent / KB_DIRNAME
        # 认定条件放宽到「kb/ 存在且含 raw/ 或 wiki/」，
        # 只有空 kb/ 时不算 —— 那可能是别的用途的同名目录
        if cand.is_dir() and (
            (cand / RAW_DIRNAME).is_dir() or (cand / WIKI_DIRNAME).is_dir()
        ):
            return cand
    return None


def lookup_registered(root: Path, kbs: dict) -> tuple[str, dict] | None:
    """按解析后的路径在注册表里反查这个 kb，命中返回 (id, 条目)。"""
    try:
        target = root.resolve()
    except OSError:
        return None
    for kb_id, kb_data in kbs.items():
        path = kb_path_of(kb_data)
        if not path:
            continue
        try:
            if Path(path).expanduser().resolve() == target:
                return kb_id, kb_data
        except OSError:
            continue
    return None


def local_kb_info(registries: dict | None = None) -> dict | None:
    """当前项目里的 kb/ 若存在，包装成 kb 信息。

    就近发现的 kb/ 优先于注册项，但**元数据仍从注册表取** —— 同一个 kb/ 若已注册过，
    它的 name / language 就是 init 时用户选定的值。少了这一步反查，init 选的
    language: "en" 会被默认值 "zh" 顶掉，SCHEMA 的语言设置形同虚设。
    """
    root = find_local_kb()
    if root is None:
        return None
    kbs = (registries or {}).get("registries", {}) or {}
    hit = lookup_registered(root, kbs)
    if hit:
        kb_id, kb_data = hit
        # path 用就近发现的实际路径，其余元数据取注册项
        merged = dict(kb_data)
        merged["path"] = str(root)
        return make_kb_info(kb_id, merged, source="local")
    return make_kb_info(
        kb_id="local",
        kb_data={"path": str(root), "name": f"{root.parent.name}/{KB_DIRNAME}"},
        source="local",
    )


def route(argv: list[str]) -> dict:
    registries = load_registries()
    overrides = registries.get("processors", {}) or {}

    if not argv:
        return {
            "status": "ok",
            "subcommand": "help",
            "args": "",
            "workflow": None,
            "schema": None,
            "kb": None,
            "skill_dir": str(SKILL_DIR),
        }

    # 兼容带技能名的调用（例如 /doudou-wiki add 或 doudou-wiki add）
    first = argv[0].lower().lstrip("/")
    if first in ("doudou-wiki", "wiki"):
        if len(argv) > 1:
            argv = argv[1:]
            subcommand = argv[0].lower().lstrip("/")
        else:
            subcommand = "help"
    else:
        subcommand = first

    # 兼容历史 convert 命令，平滑重定向至 add
    if subcommand == "convert":
        subcommand = "add"

    remaining = " ".join(argv[1:]) if len(argv) > 1 else ""

    if subcommand not in VALID_SUBCOMMANDS:
        return {
            "status": "error",
            "message": f"未知子命令: {subcommand}",
            "valid_subcommands": sorted(VALID_SUBCOMMANDS),
            "skill_dir": str(SKILL_DIR),
        }

    result = {
        "status": "ok",
        "subcommand": subcommand,
        "args": remaining,
        "workflow": None if subcommand == "help" else f"workflows/{subcommand}.md",
        "schema": "SCHEMA.md" if subcommand in NEEDS_SCHEMA else None,
        "kb": None,
        "skill_dir": str(SKILL_DIR),
    }

    # 探测结果与知识库无关，即便后面走 no_kb / error 也要带上 ——
    # init.md 第 6 步正是在还没有 kb 的时候跑 `router.py add` 来探测技能的
    proc_fields = {}
    if subcommand in NEEDS_PROCESSORS:
        procs = detect_processors(overrides)
        proc_fields["processors"] = procs
        missing = [n for n, i in procs.items() if not i["available"]]
        if missing:
            proc_fields["processors_missing"] = missing
    result.update(proc_fields)

    if subcommand in NO_KB_REQUIRED:
        # init 也报一下本地有没有 kb/，好让工作流知道是新建还是补齐
        local = local_kb_info(registries)
        if local:
            result["local_kb"] = local
        return result

    # 优先用当前项目的 kb/ —— 就在手边的知识库比全局默认更可能是用户的意图
    local = local_kb_info(registries)
    if local:
        result["kb"] = local
        return result

    all_kbs = registries.get("registries", {}) or {}
    # 结构不对或漏写 path 的条目挑出去，别让它们污染后面的分支
    kbs = {k: v for k, v in all_kbs.items() if kb_path_of(v)}
    malformed = sorted(set(all_kbs) - set(kbs))

    if not kbs:
        if malformed:
            return {
                "status": "error",
                "message": (
                    f"registries.json 里的知识库条目都缺少可用的 path 字段: "
                    f"{', '.join(malformed)}。path 应填知识库根（即 {KB_DIRNAME}/ 目录本身）的绝对路径。"
                ),
                "malformed_registries": malformed,
                "skill_dir": str(SKILL_DIR),
                **proc_fields,
            }
        return {
            "status": "no_kb",
            "message": (
                f"当前目录及其上级都没有 {KB_DIRNAME}/ 知识库，registries.json 里也没注册过。"
                f"请先运行 /doudou-wiki init 在项目根目录创建 {KB_DIRNAME}/。"
            ),
            "cwd": str(Path.cwd()),
            "skill_dir": str(SKILL_DIR),
            **proc_fields,
        }

    if malformed:
        result["malformed_registries"] = malformed

    if len(kbs) == 1:
        kb_id = next(iter(kbs))
        err = path_error(kb_id, kbs[kb_id], proc_fields)
        if err:
            return err
        result["kb"] = make_kb_info(kb_id, kbs[kb_id])
        return result

    default_id = registries.get("default")
    if default_id and default_id in kbs:
        # 单库分支校验了路径存在性，这里同样要校验 —— 否则工作流会拿着
        # 不存在的目录往下走，直到某一步读文件才失败
        err = path_error(default_id, kbs[default_id], proc_fields)
        if err:
            return err
        result["kb"] = make_kb_info(default_id, kbs[default_id])
        result["multiple_kbs"] = True
        result["kb_list"] = kb_list_of(kbs, default_id)
        return result

    result["status"] = "select"
    result["message"] = "有多个知识库，请询问用户选择。"
    result["kb_list"] = kb_list_of(kbs)
    return result


def main() -> None:
    # Windows 控制台默认 GBK，强制 UTF-8 避免中文输出乱码
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, OSError):
            pass
    print(json.dumps(route(sys.argv[1:]), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
