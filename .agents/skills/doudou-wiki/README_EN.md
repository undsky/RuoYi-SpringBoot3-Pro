<h1 align="center">doudou-llm-wiki-skill</h1>

<p align="center">
  <a href="README.md">简体中文</a> | <b>English</b>
</p>

<p align="center">
  An LLM-driven personal knowledge base. The LLM handles all the heavy lifting — summarization, cross-referencing, archiving, and consistency maintenance;<br>
  You feed the source materials, ask great questions, and contemplate what it all means.
</p>

<p align="center">
  <img src="./assets/cover.png" alt="doudou-llm-wiki-skill Banner" width="100%" />
</p>

Not limited to plain text: **Audio/video, Office documents, PDFs, scanned documents, and images are all supported**.
They are preprocessed into text by [doudou-stt](https://github.com/undsky/doudou-stt-skill), [doudou-doc](https://github.com/undsky/doudou-doc-skill), and [doudou-ocr](https://github.com/undsky/doudou-ocr-skill) skills before being ingested into the knowledge base.

> For methodology, see [LLMWiki.md](LLMWiki.md)

---

## 📑 Table of Contents

- [🔄 Workflow Diagram](#-workflow-diagram)
- [📖 Skill Guide](#-skill-guide)
  - [1. Installation](#1-installation)
  - [2. Initialize Knowledge Base](#2-initialize-knowledge-base)
  - [3. Ingest Your First Material](#3-ingest-your-first-material)
  - [4. Query](#4-query)
- [🛠️ Commands](#️-commands)
- [📚 Four-Layer Architecture](#-four-layer-architecture)
- [🗂️ Material Routing](#️-material-routing)
- [🗄️ Obsidian Integration](#️-obsidian-integration)
- [💬 Community & Discussion](#-community--discussion)
- [🙏 Acknowledgements](#-acknowledgements)
- [📄 License](#-license)

---

## 🔄 Workflow Diagram

<p align="center">
  <img src="./assets/workflow.gif" alt="doudou-llm-wiki-skill Workflow" width="100%" />
</p>

---

## 📖 Skill Guide

This project provides project-level knowledge base support for https://github.com/undsky/doudou-ai-coding (compatible with Antigravity, Claude Code, OpenCode, and other platforms).

### 1. Installation

```bash
npx skills add undsky/doudou-llm-wiki-skill --yes
```

Audio & Video processing (optional):

```bash
npx skills add undsky/doudou-stt-skill --yes
```

Office document processing (optional):

```bash
npx skills add undsky/doudou-doc-skill --yes
```

Scanned files, images, and PDF document processing (optional):

```bash
npx skills add undsky/doudou-ocr-skill --yes
```

### 2. Initialize Knowledge Base

```
/doudou-wiki init
```

### 3. Ingest Your First Material

```bash
/doudou-wiki add [filename]
```

You don't even need to copy files manually — just say "Add D:\Downloads\interview.mp3 to knowledge base".

The LLM will automatically dispatch conversions, read materials, generate summary pages, extract entity and concept pages, and maintain cross-references.

### 4. Query

```
/doudou-wiki query What is xxx?
```

Or simply ask in natural language: `Compare the pros and cons of RAG and Wiki models`

---

## 🛠️ Commands

| Command | Description |
| --- | --- |
| `/doudou-wiki init` | Create and register a new knowledge base |
| `/doudou-wiki add [filename]` | Ingest new material (ingests all pending materials if none specified) |
| `/doudou-wiki query <question>` | Answer questions based on the knowledge base |
| `/doudou-wiki test` | Health check |
| `/doudou-wiki clear [subcommand]` | Reset / delete (`all` \| `<keyword>` \| `gen` \| `trash` \| `restore` \| `empty-trash`) |
| `/doudou-wiki doctor` | Skill self-diagnosis |
| `/doudou-wiki help` | Show help |

All commands support natural language triggers — "Ingest this article", "Organize this audio into the knowledge base", "Check knowledge base status".

---

## 📚 Four-Layer Architecture

| Layer | Location | Written By | Read By | Description |
| --- | --- | --- | --- | --- |
| Raw Materials | `<kb>/raw/` | You | Rarely read | Immutable source of truth; LLM is read-only and ignores by default |
| Intermediate | `<kb>/gen/` | Processing skills | **LLM** | Text representations of all materials; fully reproducible |
| Knowledge Base | `<kb>/wiki/` | LLM | You | Fully owned by the LLM; browsed by you via Obsidian |
| Specifications | This skill dir | You + LLM | LLM | Skill code, schema, registry |

**The LLM reads intermediate products by default and does not read raw files in `raw/`.** Every piece of material is converted into text under `gen/` first, which the LLM then uses to build the wiki.

---

## 🗂️ Material Routing

`scripts/scan.py` deterministically determines routes by file extension without guessing. **Every route produces intermediate artifacts**:

| Material | Route | Output |
| --- | --- | --- |
| `.md` `.markdown` `.txt` | `text` (built-in `derive_text.py`) | `gen/<slug>` preserves original extension |
| `.docx` `.pptx` `.xlsx` `.csv` `.epub` `.odt` `.rtf` … | **[doudou-doc](https://github.com/undsky/doudou-doc-skill)** | `gen/<slug>.md` |
| `.png` `.jpg` `.webp` `.tiff` …、**`.pdf`** | **[doudou-ocr](https://github.com/undsky/doudou-ocr-skill)** | `gen/<slug>.txt` |
| `.mp3` `.wav` `.m4a` `.mp4` `.mov` `.mkv` … | **[doudou-stt](https://github.com/undsky/doudou-stt-skill)** | `gen/<slug>.txt` |

---

## 🗄️ Obsidian Integration

Open the knowledge base directory in Obsidian to browse the graph view, backlinks, and page contents.

If you prefer not to use Obsidian, you can use the [Foam](https://marketplace.visualstudio.com/items?itemName=foam.foam-vscode) extension for VS Code instead.

---

## 💬 Community & Discussion

| WeChat Official Account | QQ Group (1095058701) |
| --- | --- |
| ![Official Account](https://cdn.undsky.com/img/gh.jpg) | ![QQ Group](https://cdn.undsky.com/img/qqqun.jpg) |

---

## 🙏 Acknowledgements

- [Andrej Karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — Original concept of LLM Wiki (see [LLMWiki.md](LLMWiki.md) in this repo)
- [Vannevar Bush](https://en.wikipedia.org/wiki/Vannevar_Bush) — Proposed the Memex concept in 1945, the foundational origin of personal knowledge management

## 📄 License

This project is licensed under [CC BY-NC 4.0](LICENSE).

- Free for personal use, learning, research, and non-commercial projects.
- Please attribute the source when publishing derivative works publicly.
- Commercial use requires separate authorization; please contact the author.
