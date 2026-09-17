<h1 align="center">doudou-ocr-skill</h1>

<p align="center">
  <a href="README.md">简体中文</a> | <b>English</b>
</p>

<p align="center">
  High-precision OCR engine and smart PDF text extraction tool.<br>
  Supports <b>screenshot text extraction</b>, <b>scanned / photographed document recognition</b>, <b>ultra-fast native text extraction from searchable PDFs</b>, and <b>text extraction across 10 languages</b>, supporting export to <b>plain TXT and structured JSON formats</b>.
</p>

<p align="center">
  <img src="./assets/cover.png" alt="doudou-ocr-skill Banner" width="100%" />
</p>

---

## 📑 Table of Contents

- [📖 Skill User Guide](#-skill-user-guide)
  - [1. Installation](#1-installation)
  - [2. Usage](#2-usage)
- [⚙️ API Configuration](#️-api-configuration)
- [💬 Community & Support](#-community--support)
- [📄 License](#-license)

---

## 📖 Skill User Guide

This skill library serves as an **AI Agent assistant for image and PDF optical character recognition (OCR)** (natively supports Antigravity, Claude Code, OpenCode, and other platforms).

---

### 1. Installation

Install in any target project root directory with one command:

```bash
npx skills add undsky/doudou-ocr-skill --yes
```

---

### 2. Usage

Simply instruct the AI in plain language to recognize images, extract scanned PDFs, or perform multilingual OCR:

```text
Help me recognize all text content from this invoice image: ./resources/data/invoice.png
```

Or extract text from scanned or photographed PDF documents:

```text
Extract the full text content from this scanned contract PDF: ./resources/data/scanned_contract.pdf
```

Or perform multilingual recognition (such as Japanese or English materials):

```text
Recognize this screenshot of a Japanese manual and extract the text: ./resources/data/manual_jp.jpg
```

---

## ⚙️ API Configuration

Rename `.env.example` to `.env` and place it in the skill or project root directory:

```ini
# https://ai.undsky.com/ai/agent Log in and click profile avatar -> Profile to get UUID
DOUDOU_API_KEY=your_uuid_here
DOUDOU_API_URL=https://n8n.undsky.com
```

---

## 💬 Community & Support

|               Official Account               |             QQ Group (1095058701)             |
| :------------------------------------------: | :-------------------------------------------: |
| ![Official Account](https://cdn.undsky.com/img/gh.jpg) | ![QQ Group](https://cdn.undsky.com/img/qqqun.jpg) |

---

## 📄 License

This project is licensed under the [CC BY-NC 4.0](LICENSE) License.

- Free for personal use, learning, research, and non-commercial projects.
- When publishing derivative works publicly, please attribute the source.
- Commercial use requires separate authorization; please contact the author.
