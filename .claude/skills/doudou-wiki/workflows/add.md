# Add 工作流

收录新素材到知识库。默认全自动执行，仅在需要人工判断时才询问用户。

> 📌 **路径约定**：`raw/`、`gen/`、`wiki/` 均指当前知识库（`<project>/kb/`）下的绝对路径，
> 由 SKILL.md 路由时确定（`KB_RAW`、`KB_GEN`、`KB_WIKI`）。`KB_LANG` 为该知识库的语言设置。

## 核心原则

1. **默认自动化** — 常规收录不打断用户，直接跑完整流程
2. **需要时才问** — 只在矛盾、歧义、边界判断时用 AskUserQuestion
3. **结构化存放** — 页面严格按类型入对应目录，交叉引用形成完整图谱
4. **溯源可查** — 每个摘要页都能顺 `raw_file` / `derived_file` 追回原件
5. **读产物不读原件** — 摘要素材一律取自 `gen/`，`raw/` 只在核对时才碰

收录的固定次序：**素材进 `raw/` → 文本化出 `gen/` → 读 `gen/` 入库**。三步不跳、不换序。

## 工作流程

### 1. 把素材归置到 raw/

用户指名的素材若不在 `KB_RAW` 下（例如「收录 D:\\下载\\访谈.mp3」或刚下载到别处的文件），
先**拷**进 `KB_RAW`，再往下走：

```bash
cp <用户给的路径> <KB_RAW>/
```

- 用 `cp` 不用 `mv` —— 别动用户原处的文件；同名已存在时问用户是覆盖、改名还是跳过
- 素材本就在 `raw/` 里（用户只说「收录新素材」或给了 `raw/` 内的文件名）→ 跳过本步
- 附带的图片资源放 `raw/assets/`，它不作为独立素材被收录
- 归置进来的文件从此按原件对待：**只读，永不修改**

远程素材（用户给的是 URL）分两种：处理技能支持直传 URL 的（见 convert.md）可以不落地，
但那样 `raw/` 里就没有原件、溯源链断在 `raw_file` 上 —— 因此**默认先下载到 `raw/`**，
除非用户明确说不要留原件。

### 2. 发现新素材

```bash
python3 <skill-dir>/scripts/scan.py --raw-dir <KB_RAW> --wiki-dir <KB_WIKI> --gen-dir <KB_GEN> --json
```

用户指定了文件名就加 `--file <文件名>`。脚本已排除 `assets/` 等辅助目录，
并通过各 source 页的 `raw_file` 字段判定哪些素材已收录 —— 直接用 `pending[]`，不必自己再比对一遍。

每条 `pending` 都带好了产物落点：相对路径 `derived_file`（`gen/<slug>.<ext>`，写进 frontmatter）
和绝对路径 `derived_path`（传给处理技能）。

`pending` 为空 → 告知「没有待收录的新素材」并结束。

### 3. 素材文本化

`pending[]` 里的**每一份**素材都按 [convert.md](convert.md) 落一份产物到 `gen/`，
纯文本也不例外（走本技能自带的 `derive_text.py`，只归一化编码，不改内容）。

转换是 add 里唯一的耗时环节（音视频尤其），开始前给用户一行预告：

```
发现 4 份新素材（1 音频 / 2 文档 / 1 扫描件），先转文本，音频约需 8 分钟...
```

被跳过的素材（技能缺失、转换失败、扩展名不认识）不进入后续步骤，在最后的汇总里如实列出。

### 4. 阅读素材

**Read 每份素材的 `derived_file`，不读 `raw/` 原件。** 四条路线的产物都在 `gen/`，
读取方式完全一致，不需要按素材类型分辨。

读之前先看文件大小，超长素材（长视频逐字稿、大表格）分段读，别一次性灌进上下文。

什么时候才该下潜 `raw/`：

| 情形 | 做法 |
|------|------|
| 产物文字明显缺漏、串行、乱码 | Read 原件核对，在摘要页注明产物质量问题 |
| 版面本身有信息（流程图、架构图、图表） | 见下方图片处理流程 |
| 需要引用原始版式（合同条款编号、表格结构） | Read 原件确认后再写进摘要页 |

下潜是例外，得有具体理由，且**同样只读不改**。产物够用就别下潜 —— 那是白烧上下文。

#### 图片处理流程

LLM 无法在一次读取中同时处理 Markdown 文本和内嵌图片。含图片的素材分两步：

1. **先读文本**：理解主体内容
2. **再看图片**：扫描文本中的图片引用（`![](path)` / `![[path]]`），逐张用 Read 工具查看，
   提取补充信息（图表数据、架构图、流程图）

图里的关键信息（数据点、结构、流程）要整合进 wiki 页面的**文本描述**，不能只靠图片传达。
图片本身重要时（架构图、实验结果图）在页面里用普通 Markdown 语法引用：
`![描述](../../raw/assets/图片名)`。

> 图片素材（`route: doudou-ocr`）走的是另一条路：OCR 已把文字取出来了，
> 但 OCR 不理解版面语义。如果这张图的**布局本身有信息**（流程图、架构图、图表），
> 除了读 OCR 文本，再用 Read 工具直接看一眼原图，两边信息合起来写。

### 5. 分析与决策

阅读后分析：

- 核心要点（3-5 个）
- 该创建/更新哪些实体页和概念页
- 与已有知识的关联
- 是否存在矛盾

**据此决定是否需要询问用户：**

#### 自动执行（不询问）— 需同时满足

- 无矛盾：新素材与已有 wiki 内容不冲突
- 分类清晰：每个实体/概念的类型（entity vs concept）和归属目录无歧义
- 无合并歧义：新识别的实体/概念与已有页面不存在「可能是同一个但不确定」
- 规模合理：计划创建的新页面 ≤ 5 个

自动执行时，创建页面前给一段简短告知（不阻塞）：

```
收录《素材标题》— 计划创建 N 个新页面、更新 M 个已有页面，自动执行中...
```

#### 需要询问的场景 — 满足任一

**场景 A：矛盾**

```json
{
  "questions": [{
    "question": "《素材标题》与已有内容存在矛盾:\n\n· 已有: <已有页面的说法>\n· 新素材: <新素材的说法>\n\n如何处理？",
    "header": "内容矛盾",
    "multiSelect": false,
    "options": [
      {"label": "标注矛盾并保留双方", "description": "用 ⚠️ 矛盾标记，保留两种说法（推荐）"},
      {"label": "以新素材为准", "description": "更新已有内容为新素材的说法"},
      {"label": "保留旧内容", "description": "忽略新素材中矛盾的部分"}
    ]
  }]
}
```

**场景 B：合并歧义**

```json
{
  "questions": [{
    "question": "新素材提到的「XX」与已有页面 [[yy]] 可能是同一概念。\n\n· XX: <新素材的描述>\n· yy: <已有页面的描述>\n\n是否合并？",
    "header": "页面合并",
    "multiSelect": false,
    "options": [
      {"label": "合并到已有页面", "description": "将新信息整合进 [[yy]]"},
      {"label": "创建独立页面", "description": "XX 和 yy 是不同概念，分别维护"},
      {"label": "合并并重命名", "description": "合并内容，使用更准确的名称"}
    ]
  }]
}
```

**场景 C：大规模收录**（计划创建 > 5 个新页面）

```json
{
  "questions": [{
    "question": "《素材标题》内容丰富，计划创建较多页面:\n\n新建: <列表>\n更新: <列表>\n\n选择收录范围：",
    "header": "收录范围",
    "multiSelect": false,
    "options": [
      {"label": "全部收录（推荐）", "description": "创建上述所有页面"},
      {"label": "仅核心页面", "description": "只创建最重要的 3-5 个页面"},
      {"label": "仅创建摘要页", "description": "只建 source 页，暂不拆分实体和概念"}
    ]
  }]
}
```

**场景 D：转写质量存疑** — 逐字稿/OCR 文本里的关键信息可疑（人名听错、数字残缺、大段乱码）

```json
{
  "questions": [{
    "question": "《素材标题》的转写结果有可疑之处:\n\n· <位置/时间点>: <可疑内容>\n\n如何处理？",
    "header": "转写质量",
    "multiSelect": false,
    "options": [
      {"label": "标注待核并收录", "description": "照转写内容收录，可疑处标 （转写待核）（推荐）"},
      {"label": "换参数重转", "description": "如换 OCR 语种、给 STT 补术语 prompt 后重跑"},
      {"label": "跳过可疑段落", "description": "只收录可信部分"}
    ]
  }]
}
```

**多个场景可组合**：同时存在矛盾和合并歧义时，在一次 AskUserQuestion 里提多个问题（最多 4 个）。

### 6. 创建素材摘要页

在 `wiki/sources/` 下创建，文件名用 `scan.py` 给的 `slug`（`needs_rename: true` 时先译成英文 slug）。

```markdown
---
title: 素材标题
aliases: [中文别名]
type: source
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [相关标签]
raw_file: raw/原始文件名
derived_file: gen/产物文件名     # 必填，每份素材都有产物；用 scan.py 给的 derived_file 原值
processor: doudou-stt | doudou-doc | doudou-ocr | text
media_type: audio | video | image | document | text
---

# 素材标题

## 来源信息

- **原始文件**: [raw/文件名](../../raw/文件名)
- **中间产物**: [gen/产物名](../../gen/产物名)
- **类型**: 访谈录音 / 论文 / 报告 / 扫描合同 / ...
- **日期**: 素材日期（如有）
- **作者/说话人**: 作者或 SPEAKER_XX（如有）
- **时长/页数**: 音视频填时长，文档填页数

## 核心内容

[3-5 段关键内容摘要]

## 关键要点

- 要点 1
- 要点 2

## 引用与数据

[重要的数据点、引用、统计。转录素材标时间点，如 [12:34]]

## Related

- [[相关页面]]
```

**注意**：
- frontmatter 里的 `raw_file` / `derived_file` 相对**知识库根**写（`raw/x.pdf`、`gen/x.txt`）；
  正文的 Markdown 链接相对**页面自身**写 —— `wiki/sources/` 在根下两层，故为 `../../raw/`、`../../gen/`
- 指向 `raw/` 和 `gen/` 的链接一律用普通 Markdown 链接 `[text](path)`，
  不要用 `[[wikilink]]`，避免 Obsidian 图谱出现虚影节点

### 7. 创建/更新实体和概念页

#### 目录结构规范

| 类型 | 目录 | 判断标准 | 示例 |
|------|------|---------|------|
| 实体 | `wiki/entities/` | 有具体名称的「东西」：人物、组织、工具、项目、产品、数据集 | vannevar-bush, openai, forge-benchmark |
| 概念 | `wiki/concepts/` | 抽象的思想、方法、技术、模式、理论 | memex, knowledge-management, reinforcement-learning |

**判断原则**：能用专有名词指代的是实体，需要解释「是什么」的是概念。边界模糊时偏向概念。

#### 创建/更新规则

**新建页面**：素材中被重点讨论（非一笔带过）的实体/概念才值得建页。
只提 1-2 次且非核心的，在相关页面里带一句就够。

**更新已有页面**：
- 在对应段落**追加**新信息，不覆盖已有内容
- 更新 frontmatter 的 `sources` 列表和 `updated` 日期
- 在 Related 区块补新的关联链接

```markdown
---
title: 名称
aliases: [中文别名]
type: entity 或 concept
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [标签]
sources: [引用的素材文件名]
---

# 名称

[概述段落]

## 详细信息

[按主题组织的详细内容]

## Related

- [[相关页面]] — 关系说明
```

### 8. 维护图谱完整性

这是最关键的一步：

**双向链接规则**
- A 的 Related 链到 B，则 B 的 Related **必须**链回 A
- 每个 entity/concept 页的 Related **必须**含到对应 source 摘要页的反向链接
- 新建页面后，扫一遍**已有页面**：讨论了新页面主题但没链接的，补上

**交叉引用规则**
- 正文首次提及其他 wiki 页面的主题时，用 `[[wikilink]]`
- Related 区块列出所有相关页面，附简短关系说明（如 `— 提出者`、`— 来源素材`）

### 9. 更新索引和日志

- `wiki/index.md` 对应分类下加新条目（素材条目可带 🎧/📄/🖼️ 媒体标记）
- `wiki/overview.md` 更新统计数据和近期活动
- `wiki/log.md` 在 `# Wiki Log` 标题之后追加记录：

```markdown
## [YYYY-MM-DD] add | 素材标题

- 素材: raw/interview.mp4（doudou-stt 转写，1h23m）
- 新建: entities/xx.md, concepts/yy.md
- 更新: concepts/zz.md, index.md, overview.md
```

### 10. 运行确定性检查

```bash
python3 <skill-dir>/scripts/check.py --wiki-dir <KB_WIKI> --raw-dir <KB_RAW> --gen-dir <KB_GEN>
```

报出 P0 就立即修完再结束 add。

完成后输出汇总：

```
✅ 收录完成《素材标题》
   素材: raw/interview.mp4 → gen/interview.txt (doudou-stt)
   新建: entities/xx.md, concepts/yy.md
   更新: concepts/zz.md
   检查: 通过
   ⏭️ 跳过: archive.7z（扩展名未识别）
```

## 注意事项

- **语言**：按 `KB_LANG`（zh/en）撰写所有新页面，专有名词保留原文。素材是什么语言不影响这一点
- **aliases**：每个页面都要填，zh 填中文别名、en 填英文。这是 Obsidian Front Matter Title 插件显示标题的依据
- **原件只读** — `raw/` 下的文件永不修改，包括第 1 步刚拷进来的
- **中间产物不算知识** — `gen/` 只是转换缓存（且已 gitignore），摘要页要重新组织内容，
  不能直接把逐字稿贴进去
- 摘要保持客观中立，区分事实与观点，也区分「素材说的」和「LLM 知道的」
- 新素材与已有内容矛盾时用 `> ⚠️ 矛盾` 标记；转录素材参与的矛盾先排除转写错误
