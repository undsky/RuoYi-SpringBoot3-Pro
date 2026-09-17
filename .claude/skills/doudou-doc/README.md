<h1 align="center">doudou-doc-skill</h1>

<p align="center">
  <b>简体中文</b> | <a href="README_EN.md">English</a>
</p>

<p align="center">
  高效 Office、PDF 与电子书转 Markdown 工具。<br>
  支持 <b>Word (<code>doc</code>/<code>docx</code>/<code>odt</code>/<code>rtf</code>)</b>、<b>PPT (<code>ppt</code>/<code>pptx</code>/<code>odp</code>)</b>、<b>表格 (<code>xlsx</code>/<code>ods</code>/<code>csv</code>)</b>、<b><code>PDF</code></b> 与 <b><code>EPUB</code></b>，支持<b>本地文件、目录批量及远程 URL</b> 的快速纯文本与表格提取。
</p>

<p align="center">
  <img src="./assets/cover.png" alt="doudou-doc-skill Banner" width="100%" />
</p>

---

## 📑 目录导航

- [📖 技能使用指南](#-技能使用指南)
  - [一、安装](#一安装)
  - [二、使用](#二使用)
- [⚙️ 接口配置](#️-接口配置)
- [💬 交流与支持](#-交流与支持)
- [📄 许可证](#-许可证)

---

## 📖 技能使用指南

本技能库作为 **AI Agent 的文档转 Markdown 提取助手**（原生支持 Antigravity、Claude Code、OpenCode 等平台）。

---

### 一、安装

在任何目标工程根目录下，通过命令行一键安装：

```bash
npx skills add undsky/doudou-doc-skill --yes
```

---

### 二、使用

```text
帮我把这份产品需求文档转成 Markdown 格式：./resources/data/prd.docx
```

或者批量将目录中的所有合同与报表提取为 Markdown：

```text
将这个目录下的所有文档批量转换为 Markdown：./resources/data/contracts/
```

或者解析远程文档并提取正文：

```text
读取这个在线技术白皮书并提取 Markdown 纯文本：https://example.com/whitepaper.pdf
```

---

## ⚙️ 接口配置

将 `.env.example` 重命名为 `.env` 放到技能或项目根目录下

```ini
# https://ai.undsky.com/ai/agent 登录后点击头像 -> 个人信息获取
DOUDOU_API_KEY=你的UUID
DOUDOU_API_URL=https://n8n.undsky.com
```

---

## 💬 交流与支持

|                    公众号                    |              QQ群（1095058701）               |
| :------------------------------------------: | :-------------------------------------------: |
| ![公众号](https://cdn.undsky.com/img/gh.jpg) | ![QQ群](https://cdn.undsky.com/img/qqqun.jpg) |

---

## 📄 许可证

本项目采用 [CC BY-NC 4.0](LICENSE) 许可证。

- 个人使用、学习、研究与非商业项目可以直接使用。
- 公开发布衍生作品时，请注明来源。
- 商业用途需要单独授权，请联系作者。
