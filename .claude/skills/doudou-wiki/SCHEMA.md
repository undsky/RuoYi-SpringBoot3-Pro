# doudou-wiki Schema

本文件定义 wiki 页面的规范和约定。所有 workflow 执行时必须遵守。

## 语言设置

每个知识库在 `init` 时设置语言，存在 `registries.json`（`KB_LANG`）：

- **zh**：用中文撰写所有 wiki 内容（专有名词保留原文，如 "Memex"、"Vannevar Bush"）
- **en**：Write all wiki content in English (keep proper nouns in their original language)

规则：

- 新收录的素材按 `KB_LANG` 撰写 wiki 页面，**无论素材本身是什么语言**
- 已有页面不会自动翻译，可执行 `test` 检出语言不一致的页面再批量翻译
- frontmatter 的 `title` 跟随当前语言；`tags` 始终用中文，保证一致性
- 文件名始终小写英文 + 连字符，不受语言设置影响

## Frontmatter 规范

每个 wiki 页面必须有 YAML frontmatter：

```yaml
---
title: 页面标题
aliases: [中文别名]              # Obsidian 图谱显示用；zh 填中文，en 填英文
type: source | entity | concept | analysis | overview | conventions
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [标签1, 标签2]
sources: [素材文件名1, 素材文件名2]   # entity/concept/analysis 必填：引用了哪些素材
---
```

### source 页专属字段（溯源链，必填）

素材摘要页额外要求这几个字段，`test` 会强制检查：

```yaml
raw_file: raw/interview.mp4       # 原件路径，必填。少了它无法判定素材是否已收录
derived_file: gen/interview.txt   # 中间产物路径，必填。它是本页内容的实际来源
processor: doudou-stt             # 由哪条路线产出。纯文本填 text
media_type: audio | video | image | document | text
duration: 01:23:45                # 音视频专属，可选
pages: 12                         # PDF/文档专属，可选
```

两个路径都**相对知识库根 `kb/`** 书写（`raw/...`、`gen/...`），不是相对页面自身位置。
页面正文里的 Markdown 链接才用相对页面的路径（`wiki/sources/` 下的页面即 `../../raw/x.pdf`）。

两个路径字段都不能省，但缺失的严重程度不同：

- `raw_file` 是收录判定的唯一依据（`scan.py` 靠它认出哪些素材已入库），缺失报 **P0**
- `derived_file` 是本页内容的实际来源 —— 摘要写自产物而非原件。**每份素材都有产物**，
  纯文本也有（编码归一化后的拷贝）。缺失报 **P0**
- 但 `derived_file` **指向的文件**不存在只报 P1：产物可随时重跑复原，字段本身错了才是硬伤

## 文件命名

- 全部小写英文 + 连字符：`reinforcement-learning.md`、`openai.md`
- 素材摘要页与原件同名（去扩展名）：`raw/paper-x.pdf` → `wiki/sources/paper-x.md`
- 非 ASCII 文件名的素材（中文、日文、西里尔、带音标拉丁字母等）：摘要页文件名改用**英文 slug**，原名放进 `title` 和 `aliases`
- 同名不同扩展的素材（`a.pdf` 和 `a.png`）：后者追加扩展名后缀 → `a-png.md`
- 保持 50 字符以内

`scan.py` 已按上述规则算好 `slug` 与 `source_page`，直接用它给的值，别自己另起一套。
`needs_rename: true` 表示 slug 里还留着非 ASCII 字符，需要你译成英文 slug。
slug 在 `raw/` 全集上一次性算好，不随 `--file` 的筛选范围变化 —— 同一份素材的产物落点和摘要页名始终相同。

## 交叉引用

- 用 Obsidian 双链：`[[page-name]]` 或 `[[page-name|显示文本]]`
- 每个页面底部设 `## Related` 区块，列出所有相关链接并附简短关系说明
- 新建页面后检查是否该加到已有页面的 Related 区块
- **指向 `raw/` 和 `gen/` 的链接一律用普通 Markdown 链接** `[文本](路径)`，
  不要用 `[[wikilink]]` —— 否则 Obsidian 图谱会长出虚影节点（`test` 报 P0）

## 内容规范

- 按 `KB_LANG` 撰写，专有名词保留原文
- 优先陈述事实，标注信息来源
- 新素材与已有内容矛盾时，明确标注 `> ⚠️ 矛盾：...` 并说明两边说法
- 保持页面聚焦，一个页面一个主题
- **区分事实与观点**，也区分「素材里写的」与「LLM 自己的知识」

### 转录素材的额外规范

来自音视频（doudou-stt）或扫描件（doudou-ocr）的内容，转写本身可能出错，因此：

- 引用时间点用 `[MM:SS]` 或 `[HH:MM:SS]` 标注，便于回原音频核对
- 多说话人素材保留 `SPEAKER_XX` 或用户确认过的真实姓名
- 人名、术语、数字这类容易听错/认错的信息，若上下文可疑，标 `（转写待核）`
- OCR 结果中明显的乱码、缺行不要硬猜补全，标 `（原件此处不可辨）`

## 索引格式

`wiki/index.md` 按类别组织：

```markdown
## Sources
- [素材标题](sources/filename.md) — 一句话摘要 (YYYY-MM-DD) [🎧 音频 / 📄 文档 / 🖼️ 图片]

## Entities
- [实体名](entities/filename.md) — 一句话描述 [N 个素材引用]

## Concepts
- [概念名](concepts/filename.md) — 一句话描述

## Analyses
- [分析标题](analyses/filename.md) — 一句话摘要 (YYYY-MM-DD)
```

素材条目可带媒体类型标记，便于一眼看出这条知识的来源形态。

## 日志格式

`wiki/log.md` 按时间倒序：

```markdown
## [YYYY-MM-DD] <operation> | <title>
- 具体操作描述
- 影响的页面列表
```

`operation` 取值：`add`、`query`、`test`、`update`、`init`、`clear`。

前缀格式固定，便于 `grep "^## \[" log.md | head -5` 查最近操作。

## 矛盾处理

新素材与已有 wiki 内容矛盾时：

1. **不删旧信息** — 保留双方观点
2. **标注矛盾** — 相关段落用 `> ⚠️ 矛盾：...` callout
3. **注明来源** — 分别标出两方信息的出处素材
4. **标注时间** — 各自信息的日期，便于判断时效性
5. **留给用户判断** — 矛盾涉及核心论点时，在对话中提醒用户

> 转录素材参与的矛盾要多一步：先确认不是转写错误导致的假矛盾（回查 `gen/` 或原件），
> 再按上述流程标注。
