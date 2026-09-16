# doudou-llm-wiki-skill

LLM 驱动的个人知识库。LLM 负责所有繁重的整理 —— 摘要、交叉引用、归档、一致性维护；
你负责挑素材、提好问题、思考这一切意味着什么。

素材不限文本：**音视频、Office 文档、PDF、扫描件、图片都能收**，
分别交给 doudou-stt / doudou-doc / doudou-ocr 技能预处理成文本再入库。

> 方法论见 [LLMWiki.md](LLMWiki.md)

---

## 快速开始

### 1. 安装

```bash
# 把 skill 复制到 Claude Code 全局目录
cp -r <path>/doudou-llm-wiki-skill ~/.claude/skills/doudou-wiki

# 依赖（可选，不装也能跑）
pip install -r ~/.claude/skills/doudou-wiki/scripts/requirements.txt
```

要收非文本素材，还需装这三个技能（缺哪个只影响对应类型的素材）：

```bash
cp -r <path>/doudou-doc-skill ~/.claude/skills/doudou-doc
cp -r <path>/doudou-ocr-skill ~/.claude/skills/doudou-ocr
cp -r <path>/doudou-stt-skill ~/.claude/skills/doudou-stt
```

各技能都要在自己目录下配 `.env`（uuid 与服务地址），细节看各自的 SKILL.md。
装在别处也行 —— 在 `registries.json` 的 `processors` 里填绝对路径，或设环境变量
`DOUDOU_DOC_SKILL_DIR` / `DOUDOU_OCR_SKILL_DIR` / `DOUDOU_STT_SKILL_DIR`。

### 2. 初始化知识库

```
/doudou-wiki init
```

按提示填项目路径、名称、语言（zh/en），知识库建在该项目下的 `kb/`。
之后在这个项目里（任意子目录）执行命令都会自动找到它，不必再指定。

### 3. 收录第一份素材

```bash
cp my-article.md  ~/my-project/kb/raw/     # 文本
cp interview.mp4  ~/my-project/kb/raw/     # 音视频
cp 合同扫描件.pdf  ~/my-project/kb/raw/     # 扫描件
```

也可以不自己拷 —— 直接说「收录 D:\下载\访谈.mp3」，add 第 1 步会替你拷进 `raw/`。

```
/doudou-wiki add
```

LLM 自动分派转换、阅读素材、建摘要页、拆实体和概念页、维护交叉引用。
一次收录可能触发 10-15 个页面的创建或更新。

### 4. 查询

```
/doudou-wiki query Memex 是什么？
```

也可以直接说自然语言：`对比一下 RAG 和 Wiki 模式的优劣`

---

## 命令

| 命令 | 功能 |
|------|------|
| `/doudou-wiki init` | 创建并注册新知识库 |
| `/doudou-wiki add [文件名]` | 收录新素材（不指定则收录全部待收录素材） |
| `/doudou-wiki convert [文件名]` | 只把素材转成文本，不入库 |
| `/doudou-wiki query <问题>` | 基于知识库回答问题 |
| `/doudou-wiki test` | 健康检查 |
| `/doudou-wiki clear [子命令]` | 重置/删除（`all`｜`<关键词>`｜`gen`｜`trash`｜`restore`｜`empty-trash`） |
| `/doudou-wiki doctor` | 技能自检 |
| `/doudou-wiki help` | 帮助 |

所有命令都支持自然语言触发 —— "收录这篇文章"、"把这段录音整理进知识库"、"检查下知识库"。

---

## 四层架构

| 层 | 位置 | 谁写 | 谁读 | 说明 |
|----|------|------|------|------|
| 原始素材 | `<kb>/raw/` | 你 | 一般不读 | 不可变的信息源，LLM 只读不写、默认也不读 |
| 中间产物 | `<kb>/gen/` | 处理技能 | **LLM** | 所有素材的文本化结果，可重新生成 |
| 知识库 | `<kb>/wiki/` | LLM | 你 | LLM 完全拥有，你通过 Obsidian 浏览 |
| 规范 | 本 skill 目录 | 你 + LLM | LLM | Skill 代码、Schema、注册表 |

`<kb>` 即项目根目录下的 `kb/`，三层平级摆在里面。

**LLM 默认只读中间产物，不读 `raw/` 原件。** 每份素材入库前都先落成 `gen/` 里的文本，
LLM 拿这一层构建 wiki，好处是读取面单一（不必按素材类型分辨读哪层）、编码齐整
（统一 UTF-8 + LF）、原件真正不被触碰 —— 靠结构而非约定。

下潜 `raw/` 是例外，需要具体理由：产物疑似漏字要核对、版面本身有信息（流程图、表格结构）、
或要看图像本身。

中间产物**不是知识资产**：删掉能重跑复原，所以 `gen/` 默认进 `.gitignore`。
它是读取面，知识资产在 `wiki/`。摘要页要重新组织内容，不能把产物直接贴进 wiki。

```
~/.claude/skills/doudou-wiki/     # Skill（全局安装）
├── SKILL.md                      #   主入口，路由子命令
├── SCHEMA.md                     #   页面规范
├── LLMWiki.md                    #   方法论
├── registries.json               #   知识库注册表 + 处理技能路径覆盖
├── workflows/                    #   init / add / convert / query / test / clear / doctor
└── scripts/                      #   router.py / scan.py / derive_text.py / check.py

~/my-project/kb/                  # 知识库实例（<kb>），从子目录逐级向上自动发现
├── .gitignore                    #   忽略 gen/ 和 wiki/.trash/
├── raw/                          #   原始素材（只读）
│   ├── assets/                   #     图片附件
│   └── *.md / *.pdf / *.mp4 ...  #     素材原件
├── gen/                          #   中间产物 = LLM 读取面（自动生成，可删）
└── wiki/                         #   LLM 生成和维护的知识库
    ├── index.md                  #     内容索引
    ├── log.md                    #     操作日志
    ├── overview.md               #     总览页
    ├── conventions.md            #     使用约定（你的操作偏好）
    ├── sources/                  #     素材摘要页
    ├── entities/                 #     实体页
    ├── concepts/                 #     概念页
    ├── analyses/                 #     分析页
    └── .trash/                   #     回收站
```

---

## 素材分派

`scripts/scan.py` 按扩展名确定性判定路线，不靠猜。**每条路线都产出中间产物**：

| 素材 | 路线 | 产物 |
|------|------|------|
| `.md` `.markdown` `.txt` | `text`（自带 `derive_text.py`） | `gen/<slug>` 沿用原扩展名 |
| `.docx` `.pptx` `.xlsx` `.csv` `.epub` `.odt` `.rtf` … | **doudou-doc** | `gen/<slug>.md` |
| `.png` `.jpg` `.webp` `.tiff` …、**`.pdf`** | **doudou-ocr** | `gen/<slug>.txt` |
| `.mp3` `.wav` `.m4a` `.mp4` `.mov` `.mkv` … | **doudou-stt** | `gen/<slug>.txt` |

一个扩展名对应一条路线，**没有回落分支**。PDF 一律走 doudou-ocr：
有文字层的它走文字层直抽（不到 1 秒），扫描件才真跑识别，一条路线覆盖两种形态，
不需要先试 doudou-doc 再回落。

纯文本也要过一遍 `derive_text.py`，为的是让读取面完整落在 `gen/`，不留例外分支。
它**不是格式转换**：内容一字不改，只把编码统一成 UTF-8、行尾统一成 LF。

**非文本素材的格式转换本技能一概不做** —— 一律通过 Skill 工具调用对应技能，
参数细节由各技能的 SKILL.md 决定。Skill 工具不可用时用 `router.py` 探测到的脚本绝对路径兜底。

单独跑一下看分派结果：

```bash
python3 scripts/scan.py --raw-dir ~/my-project/kb/raw \
                        --wiki-dir ~/my-project/kb/wiki \
                        --gen-dir ~/my-project/kb/gen
```

`--gen-dir` 省略时按 `--raw-dir` 的同级 `gen/` 推定。

---

## 核心操作

### add — 收录

1. **归置** — 素材不在 `raw/` 里就先拷进去（`cp` 不是 `mv`，不动你原处的文件）
2. **发现** — `scan.py` 扫 `raw/`，按 source 页的 `raw_file` 判定哪些还没收
3. **文本化** — 每份素材都落一份产物到 `gen/`，纯文本也不例外（见 [workflows/convert.md](workflows/convert.md)）
4. **阅读** — 一律读 `gen/` 产物；版面有信息或产物可疑时才下潜原件
5. **分析决策** — 常规情况直接执行，仅这些情况问用户：矛盾、可能重复、新页 > 5 个、转写质量存疑
6. **建摘要页** — `wiki/sources/`，frontmatter 带 `raw_file` / `derived_file` / `processor` 溯源链
7. **拆实体和概念页** — 实体（人物、组织、工具）→ `entities/`；概念（理论、方法、模式）→ `concepts/`
8. **维护图谱** — 双向链接、index.md、overview.md、log.md
9. **确定性检查** — 自动跑 `check.py`，有 P0 立即修

### query — 查询

读 index.md 定位 → 读相关页面 → 综合回答（带 `[[引用]]`）→ 知识回写。

需要原话、精确引用、或摘要页没覆盖的细节时，会顺 `derived_file` 下潜到全量文本核对，
引用时带时间点 `[12:34]`。

有价值的回答可存成 `wiki/analyses/` 新页面 —— **探索本身也在给知识库复利**。

支持的输出格式：简短回答、Markdown 表格、结构化长文、时间线、Marp 幻灯片、
matplotlib 图表、Obsidian Canvas。

### test — 健康检查

两层机制。建议每收录 5-10 篇素材跑一次。

| 级别 | 脚本检查（确定性） | LLM 补充（语义） |
|------|------------------|-----------------|
| P0 | 断链、`[[raw/…]]`/`[[gen/…]]` wikilink 误用、frontmatter 完整性、索引一致性、`raw_file` 缺失/失效、`derived_file` 缺失 | — |
| P1 | `derived_file` 指向的产物已不存在、双向链接、孤岛页面、`sources` 字段 | 语言一致性、矛盾检测、缺失页面、陈旧信息、转写疑点积压 |
| P2 | 未收录的 raw 素材 | 缺失交叉引用、标签不一致、可合并页面、知识缺口（WebSearch） |

```bash
KB=~/my-project/kb
python3 scripts/check.py --wiki-dir $KB/wiki --raw-dir $KB/raw --gen-dir $KB/gen          # 人类可读
python3 scripts/check.py --wiki-dir $KB/wiki --raw-dir $KB/raw --gen-dir $KB/gen --json   # 供程序用
```

有 P0 时退出码为 1。

### clear — 删除

三层的删除语义不同：wiki 页面移入回收站（可 `restore`）；`gen/` 产物直接删
（重跑 convert 可复原）；**`raw/` 原件永不删**。

全量重置默认保留 `gen/` —— 重新 add 时不用再转一遍音视频。`clear gen` 只清产物。

---

## 页面规范

完整规范见 [SCHEMA.md](SCHEMA.md)，要点：

```yaml
---
title: 页面标题
aliases: [中文别名]              # Front Matter Title 插件显示用
type: source | entity | concept | analysis | overview | conventions
created: 2026-09-03
updated: 2026-09-03
tags: [标签1, 标签2]
sources: [引用的素材文件名]        # entity/concept/analysis 必填
# 以下为 source 页专属溯源链
raw_file: raw/interview.mp4
derived_file: gen/interview.txt
processor: doudou-stt
media_type: audio
---
```

- `raw_file` 是收录判定的唯一依据，**不能省**（`test` 报 P0）
- `derived_file` 是该页内容的实际来源，同样**不能省**（`test` 报 P0）；
  纯文本素材填归一化后的产物路径，`processor` 填 `text`
- 两个路径都相对知识库根（`kb/`）书写；正文里的 Markdown 链接则相对页面自身（`../../gen/x.txt`）
- 交叉引用用 `[[page-name]]`；**指向 `raw/` 和 `gen/` 的链接用普通 Markdown 链接**，
  否则 Obsidian 图谱会长虚影节点
- 每页底部 `## Related` 区块，双向链接由 LLM 维护
- 文件名小写英文 + 连字符；中文名素材的摘要页用英文 slug，中文名放 `title` / `aliases`

### 转录素材的额外规范

转写会出错，所以：引用时间点用 `[MM:SS]` 便于回原音频核对；
多说话人保留 `SPEAKER_XX`；可疑的人名术语数字标 `（转写待核）`；
OCR 乱码不硬猜，标 `（原件此处不可辨）`。

---

## Obsidian 集成

用 Obsidian 打开知识库目录即可浏览图谱视图、反向链接和页面内容。

| 配置项 | 设置 |
|-------|------|
| 附件路径 | Settings → Files and links → Attachment folder → `raw/assets/` |
| 推荐插件 | **Front Matter Title**（图谱显示中文标题）、Dataview、Marp Slides、Web Clipper |

图谱视图搜索栏加过滤，隐藏非知识页面：

```
-file:index -file:log -file:overview -file:conventions
```

---

## Git 版本管理

知识库可以是个 git 仓库，版本历史就是知识演化的天然记录。

- LLM 不会自动 commit，何时存版本由你决定
- 建议时机：每次 add 后、test 修复后
- `kb/.gitignore` 已预置忽略 `gen/` 和 `wiki/.trash/`（放在 `kb/` 里，
  这样知识库单独成仓库、或嵌在更大的项目仓库里都成立）

---

## 扩展：搜索工具

当前规模（< 100 页面）下 index.md + Grep 足够。wiki 长大后可接搜索引擎：

- [qmd](https://github.com/tobi/qmd) — 本地 Markdown 搜索，BM25/向量混合 + LLM 重排，有 CLI 和 MCP server
- 或自己在 `scripts/` 下写个搜索脚本

---

## 适用场景

| 场景 | 说明 |
|------|------|
| 研究 | 持续读论文/文章，逐步建起某领域的完整知识图谱 |
| 会议与访谈 | 录音直接入库，自动建人物、议题、决议的关联网络 |
| 读书 | 按章节收录，自动建角色、主题、情节线索 |
| 合同与档案 | 扫描件 OCR 后入库，条款、主体、金额可查可比 |
| 播客与课程 | 音频转逐字稿后收录，自动整理知识体系 |
| 竞品分析 | 持续跟踪竞品动态，自动维护对比分析 |

---

## 致谢

- [Andrej Karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — LLM Wiki 的原始理念（本仓库 [LLMWiki.md](LLMWiki.md)）
- [ChavesLiu/second-brain-skill](https://github.com/ChavesLiu/second-brain-skill) — 本项目的实现参考
- [Vannevar Bush](https://en.wikipedia.org/wiki/Vannevar_Bush) — 1945 年提出 Memex 构想，个人知识管理的思想源头

## License

MIT
