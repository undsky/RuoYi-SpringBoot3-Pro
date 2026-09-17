# Init 工作流

创建并注册一个新的知识库。

## 工作流程

### 1. 收集信息

用 AskUserQuestion 问：

```json
{
  "questions": [
    {
      "question": "在哪个项目下创建知识库？（将在其中创建 kb/ 目录）",
      "header": "路径",
      "multiSelect": false,
      "options": [
        {"label": "当前目录", "description": "在当前工作目录下创建 kb/"},
        {"label": "自定义路径", "description": "指定一个绝对路径，在其下创建 kb/"}
      ]
    },
    {
      "question": "给知识库起个名称（多库切换时显示）",
      "header": "名称",
      "multiSelect": false,
      "options": [
        {"label": "AI 研究", "description": ""},
        {"label": "读书笔记", "description": ""},
        {"label": "工作知识库", "description": ""}
      ]
    },
    {
      "question": "Wiki 页面用什么语言撰写？",
      "header": "语言",
      "multiSelect": false,
      "options": [
        {"label": "zh（中文）", "description": "用中文撰写 wiki 内容，专有名词保留原文"},
        {"label": "en（English）", "description": "Write all wiki content in English"}
      ]
    }
  ]
}
```

### 2. 生成知识库 ID

从名称生成 slug 作为 ID（"AI 研究" → `ai-research`）。`registries.json` 里已存在该 ID 时提示用户改名。

### 3. 创建目录结构

用户给的 `<path>` 是**项目目录**，知识库根固定为 `<path>/kb/`（下文记作 `<kb>`）：

```bash
mkdir -p <path>/kb/raw/assets
mkdir -p <path>/kb/gen
mkdir -p <path>/kb/wiki/sources
mkdir -p <path>/kb/wiki/entities
mkdir -p <path>/kb/wiki/concepts
mkdir -p <path>/kb/wiki/analyses
```

三层平级摆在 `kb/` 下：`raw/` 原件、`gen/` 中间产物、`wiki/` 知识库。

`gen/` 存所有素材的文本化结果 —— 它是 LLM 构建知识库时的默认读取面，
纯文本素材也会在这里有一份（归一化编码后的拷贝）。

`<path>` 下已有 `kb/` 目录时按第 7 步处理，别直接往里 mkdir。

### 4. 初始化 wiki 核心文件

不存在时才创建，已存在不覆盖。

#### `<kb>/wiki/index.md`

```markdown
# Wiki Index

> 此文件由 LLM 自动维护，是 wiki 的内容目录。按类别组织所有页面，每页一行摘要。
> LLM 回答查询时优先读此文件定位相关页面。

## Overview

- [Overview](overview.md) — Wiki 总览与当前知识图谱摘要
- [使用约定](conventions.md) — 用户对本知识库的操作偏好

## Sources

## Entities

## Concepts

## Analyses
```

#### `<kb>/wiki/log.md`

```markdown
# Wiki Log

> 操作日志，按时间倒序记录所有 wiki 操作。

## [YYYY-MM-DD] init | 知识库初始化

- 创建 kb/{raw,gen,wiki} 目录结构
- 初始化 index.md、log.md、overview.md、conventions.md
```

#### `<kb>/wiki/overview.md`

```markdown
---
title: Overview
aliases: [总览]
type: overview
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [overview]
---

# 知识库总览

## 统计

| 指标 | 数量 |
|------|------|
| 原始素材 | 0 |
| 素材摘要 | 0 |
| 实体页面 | 0 |
| 概念页面 | 0 |
| 分析页面 | 0 |

## 素材构成

| 类型 | 数量 |
|------|------|
| 文本 | 0 |
| 文档 | 0 |
| 音视频 | 0 |
| 图片/扫描件 | 0 |

## 知识图谱摘要

（尚无内容，收录素材后自动更新）

## 近期活动

- [YYYY-MM-DD] 知识库初始化
```

#### `<kb>/wiki/conventions.md`

```markdown
---
title: 使用约定
aliases: [约定]
type: conventions
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [meta]
---

# 使用约定

> 此页面记录用户对本知识库操作的偏好和约定。LLM 执行任何操作前应先读此页面。

## Query

（暂无）

## Add

（暂无）

## Convert

（暂无）

## Test

（暂无）

## 通用

（暂无）
```

#### `<kb>/.gitignore`

中间产物可复现，不必进版本控制。放在 `kb/` 里而非项目根，这样知识库自己是个仓库、
或嵌在更大的项目仓库里，两种情形都成立：

```gitignore
# 中间产物：所有素材的文本化结果，删了重新文本转换即可复原
gen/

# 回收站
wiki/.trash/

.DS_Store
```

（YYYY-MM-DD 一律替换为当天日期）

### 5. 注册到 registries.json

读 skill 目录下的 `registries.json`，加新条目并把 `default` 设为新 ID。
**`path` 填知识库根，即 `kb/` 目录本身**，不是它的父项目目录：

```json
{
  "default": "<new-id>",
  "registries": {
    "<new-id>": {
      "name": "用户输入的名称",
      "path": "/absolute/path/to/project/kb",
      "language": "zh",
      "created": "YYYY-MM-DD"
    }
  },
  "processors": {}
}
```

注册只为跨项目切换用。在项目里干活时 `router.py` 会就近发现 `kb/` 并优先用它，
不依赖这份注册表。

`processors` 用于覆盖三个文件处理技能的目录（探测不到时才需要手填），格式：

```json
"processors": {
  "doudou-doc": "/path/to/doudou-doc-skill",
  "doudou-ocr": "/path/to/doudou-ocr-skill",
  "doudou-stt": "/path/to/doudou-stt-skill"
}
```

### 6. 检查文件处理技能

路由结果里没有 `processors`（init 不探测），所以这里主动跑一次探测：

```bash
python3 <skill-dir>/scripts/router.py add
```

技能探测与知识库无关，所以这条命令即便返回 `status: "no_kb"`（init 早期还没建好 kb 时）
也照样带 `processors` 字段，直接读它就行。

看 `processors` 字段，把结果告诉用户：

- 三个都 `available: true` → 报「音视频、文档、图片素材都能收」
- 有缺失 → 说明缺哪个、影响哪类素材（按 `processors.<name>.handles` 的说法），给两个补法：
  装成 skill（`~/.claude/skills/<name>/`），或在 `registries.json` 的 `processors` 里填绝对路径
- `env_configured: false` → 提醒该技能目录缺 `.env`，实际调用时会以 `auth` 失败，
  需要去对应技能目录配 uuid

**技能缺失不阻塞 init** — 纯文本素材照样能收。

### 7. 处理已存在目录

`<path>/kb/` 已含 `raw/` 或 `wiki/` 时：

```json
{
  "questions": [{
    "question": "该项目下已存在 kb/ 知识库结构。如何处理？",
    "header": "已有目录",
    "multiSelect": false,
    "options": [
      {"label": "直接注册", "description": "跳过创建，仅把已有知识库注册到配置中"},
      {"label": "补齐缺失文件", "description": "只创建缺失的目录和核心文件，已有内容不动"},
      {"label": "取消", "description": "不做任何操作"}
    ]
  }]
}
```

> 注意：没有「覆盖初始化」这一项 —— 覆盖 index.md / overview.md 会丢掉已有知识库的目录，
> 要清空请用 `clear`（有回收站可恢复）。

### 8. 输出结果

```
✅ 知识库已创建并注册

  名称: <name>
  路径: <path>/kb
  语言: zh
  ID:   <id>

  目录结构:
    <path>/kb/raw/     ← 把素材放这里
    <path>/kb/gen/     ← 中间产物（自动生成，可删，已 gitignore）
    <path>/kb/wiki/    ← LLM 维护的知识库

  文件处理技能:
    doudou-doc  ✅ 办公文档 / 电子书
    doudou-ocr  ✅ 图片 / 扫描件 / PDF
    doudou-stt  ✅ 音频 / 视频

  下一步:
    1. 把素材文件放进 <path>/kb/raw/
    2. 执行 /doudou-wiki add 开始收录

  在该项目内的任意子目录执行命令都能自动找到这个知识库。
```
