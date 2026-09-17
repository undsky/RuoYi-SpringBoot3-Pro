---
name: doudou-wiki
description: |
  LLM 驱动的个人知识库（LLM Wiki）。把素材编译成一份持续复利的结构化 wiki：
  收录素材、基于知识库回答问题、健康检查、重置删除。素材不限文本 —— 音视频、Office 文档、
  PDF、扫描件、图片都能收，分别交给 doudou-stt / doudou-doc / doudou-ocr 技能预处理成文本再收录。
  TRIGGER when: 用户提到「收录」「加到知识库」「归档这个」「add」，或让「把这段录音/这份合同/
  这张截图整理进知识库」，或提出知识库中可能有答案的问题（如「XX 是什么」「对比 XX 和 YY」
  「整理一下 XX 的信息」），或要求「检查知识库」「体检」，或要求「清空」「删除」「重置」知识库，
  或给出对知识库操作方式的反馈/偏好。
  DO NOT TRIGGER when: 问题与知识库无关（纯代码任务、文件操作、通用对话），或用户只想单纯地
  转个字幕/转个文档而不入库（那种直接用 doudou-stt / doudou-doc / doudou-ocr），
  或用户明确说不需要查知识库。
user-invocable: true
---

# doudou-wiki：LLM 知识库

知识库的统一管理入口。支持命令式调用（`/doudou-wiki <cmd>`）和自然语言触发。

方法论见 [LLMWiki.md](LLMWiki.md)：**wiki 是一份持续复利的产物**，不是每次提问都重新检索的 RAG。
你负责挑素材、提好问题；LLM 负责摘要、交叉引用、归档、一致性维护这些繁重的簿记工作。

## 目录布局

知识库默认是项目根目录下的 `kb/`，三层各占一个平级目录：

```
<project>/kb/           ← 知识库根（<kb>），从当前目录逐级向上自动发现
├── raw/                原始素材：你往里丢文件
├── gen/                中间产物：素材文本化的成果，LLM 的读取面
└── wiki/               知识库：LLM 写的页面
```

`scripts/router.py` 会从当前目录向上最多找 8 层，命中含 `raw/` 或 `wiki/` 的 `kb/` 即用它，
**本地 `kb/` 优先于 `registries.json` 的注册项** —— 在项目里干活不必先注册。
就近发现的 `kb/` 若也在注册表里，`name` / `language` 取注册项的值（init 时选的语言据此生效）。

## 四层架构

|      层      | 位置          |   谁写   |   谁读   | 说明                                 |
| :----------: | ------------- | :------: | :------: | ------------------------------------ |
| **原始素材** | `<kb>/raw/`   |    你    | 一般不读 | 不可变。你只管往里丢文件             |
| **中间产物** | `<kb>/gen/`   | 处理技能 | **LLM**  | 所有素材的文本化结果，可随时重新生成 |
|  **知识库**  | `<kb>/wiki/`  |   LLM    | 你 + LLM | 摘要、实体、概念、分析、交叉引用     |
|   **规范**   | 本 skill 目录 | 你 + LLM |   LLM    | SCHEMA、workflows、scripts           |

**你默认只读中间产物，不读 `raw/` 原件。** 每份素材入库前都先落成 `gen/` 里的文本，
你拿这一层构建 wiki —— 读取面单一（不必按素材类型分辨该读哪层）、编码齐整（统一 UTF-8 + LF）、
原件真正不被触碰。

只在这几种情形才下潜到 `raw/`：需要看原始版式或图像本身、怀疑产物漏字要核对原件、
或产物明显不对要查证。**这是例外，不是常规路径**，且同样只读不改。

## 文件处理技能分工

每条路线都产出 `gen/` 中间产物。**非文本素材的格式转换本技能一律不做**，通过技能调用派出去：

| 素材类型                        | 交给                             | 产物                    |
| ------------------------------- | -------------------------------- | ----------------------- |
| `.md` `.txt` 等纯文本           | `scripts/derive_text.py`（自带） | `gen/<slug>.md`\|`.txt` |
| Word / PPT / Excel / CSV / epub | **doudou-doc**                   | `gen/<slug>.md`         |
| 图片、扫描件、**PDF**           | **doudou-ocr**                   | `gen/<slug>.txt`        |
| 音频 / 视频                     | **doudou-stt**                   | `gen/<slug>.txt`        |

路线由 `scripts/scan.py` 按扩展名一对一确定，不靠猜，**没有回落分支**。
PDF 一律走 doudou-ocr —— 它对有文字层的 PDF 会走文字层直抽（不到 1 秒），
扫描件才真跑识别，一条路线覆盖两种形态。

纯文本走本技能自带的 `derive_text.py`，它**不是格式转换**：内容一字不改，只统一编码
（GBK / UTF-16 → UTF-8）、行尾（CRLF → LF），再拷进 `gen/`。之所以连纯文本也要过一遍，
是为了让读取面完整落在 `gen/`，不留例外分支。详见 [workflows/convert.md](workflows/convert.md)。

## 自然语言路由

当 skill 被自然语言触发（非 `/doudou-wiki` 命令格式）时，先判断意图再映射子命令：

| 用户意图            | 映射子命令            | 示例                                                           |
| ------------------- | --------------------- | -------------------------------------------------------------- |
| 收录/添加/转换素材 | `add`                 | "收录这篇文章"、"把这段录音整理进知识库"、"转换并收录这个文件" |
| 提问/查询/对比/整理 | `query`               | "Memex 是什么"、"对比 RAG 和 Wiki 模式"、"整理一下 XX 的信息"  |
| 反馈/偏好/纠正      | `query`（走反馈分支） | "回答要标注来源"、"你上次说错了"                               |
| 检查/审计           | `test`                | "检查下知识库有没有问题"                                       |
| 删除/清空/重置      | `clear`               | "删掉 XX 相关的页面"、"重置知识库"                             |
| 初始化              | `init`                | "创建一个新的知识库"                                           |

确定子命令后，将用户原始输入作为 `args`，进入下方执行步骤。

## 执行步骤

### 1. 运行路由脚本

```bash
python3 <skill-dir>/scripts/router.py <子命令> [参数]
```

`<skill-dir>` 为本文件所在目录的绝对路径。自然语言触发时，先按上表映射出子命令再调用。

> Windows 上若 `python3` 不可用，换 `py -3`。

### 2. 根据路由结果执行

路由输出 JSON，按 `status` 分支：

#### `status: "ok"` — 正常执行

```
路由结果字段:
  subcommand         — 子命令名
  args               — 子命令参数
  workflow           — 工作流文件路径（相对 skill 目录）
  schema             — SCHEMA.md 路径（需要时非 null）
  kb                 — 知识库信息（id, name, root, raw, gen, wiki, lang, source）
                       source 为 "local" 表示就近发现的 kb/，"registry" 表示注册项
  processors         — 三个文件处理技能的可用性（add/doctor 时出现）
  processors_missing — 未探测到的处理技能列表（可选）
  skill_dir          — skill 目录绝对路径
  multiple_kbs       — 是否有多个知识库（可选）
  kb_list            — 知识库列表（可选，multiple_kbs 时出现）
```

执行顺序：

1. 如果 `schema` 非 null → 读取 `<skill_dir>/<schema>` 了解页面规范
2. 如果 `<kb.wiki>/conventions.md` 存在 → 读取，作为本次操作的额外约束（用户对该知识库的操作偏好）
3. 读取 `<skill_dir>/<workflow>` 获取工作流
4. 用 `kb` 中的路径和语言替换 workflow 中的 `KB_ROOT`、`KB_RAW`、`KB_GEN`、`KB_WIKI`、`KB_LANG`
5. 按工作流执行，`args` 作为子命令参数传入，遵守 conventions.md 中的约定
6. 如果 `multiple_kbs` 为 true，先告知用户当前用的是哪个知识库（`kb.name`），提示可在 `registries.json` 改 `default`
7. 如果 `processors_missing` 非空，在遇到需要该技能的素材时才提示（见下）

#### `status: "select"` — 需要用户选择知识库

用 AskUserQuestion 展示 `kb_list` 让用户选择，然后用选中的知识库继续执行，
并把 `registries.json` 的 `default` 更新为所选 ID。

#### `status: "no_kb"` — 无知识库

输出 `⚠️ {message}`，引导用户运行 `/doudou-wiki init`。

#### `status: "error"` — 错误

输出错误信息。

#### `subcommand: "help"` — 帮助

直接输出：

```
doudou-wiki — LLM 驱动的知识库

命令:
  /doudou-wiki init                在当前项目下创建 kb/ 知识库
  /doudou-wiki add [文件]          收录新素材（不指定则收录 raw/ 中全部未收的）
  /doudou-wiki query <问题>        基于知识库回答问题
  /doudou-wiki test                知识库健康检查
  /doudou-wiki clear [子命令]      重置/删除（all | <关键词> | gen | trash | restore | empty-trash）
  /doudou-wiki doctor              技能自检
  /doudou-wiki help                显示本帮助

知识库是项目根目录下的 kb/：raw/ 放原件、gen/ 放转换产物、wiki/ 是知识库本体。
在项目内任意子目录执行命令都会自动找到它。

add 可以直接给知识库外的文件路径，会先拷进 raw/ 再收录。

素材不限文本：音视频、Office 文档、PDF、扫描件、图片都能收，
分别由 doudou-stt / doudou-doc / doudou-ocr 技能预处理。

首次使用请先运行 /doudou-wiki init
```

## 调用处理技能的规矩

需要转换素材时，**优先用 Skill 工具调用**对应技能（`doudou-doc` / `doudou-ocr` / `doudou-stt`），
让技能自己的 SKILL.md 决定参数细节 —— 那里写着各自的语种、格式、超时、排错约定，本技能不重复。

Skill 工具不可用（未安装为 skill）时，用路由结果 `processors.<name>.script` 给出的
绝对路径直接执行脚本兜底。两条路都不通时，如实告诉用户缺哪个技能、它负责哪类素材，
把该类素材标为跳过，**继续处理其余素材**，不要卡住整批。

调用时必须遵守的四条：

1. **产物落到 `KB_GEN`**，文件名用 `scan.py` 给出的 `derived_file`（或直接用它给的绝对路径 `derived_path`），别让技能写到它的默认 `resources/` 目录
2. **不改 `raw/` 里的原件**
3. **收录时读产物、不读原件** —— 摘要素材一律取自 `derived_file`；要下潜 `raw/` 先说明理由
4. 转换失败时按 [workflows/convert.md](workflows/convert.md) 记账跳过，既不反复重试同一条路线，也不改走别的技能硬试
