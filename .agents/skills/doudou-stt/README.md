<h1 align="center">doudou-stt-skill</h1>

<p align="center">
  <b>简体中文</b> | <a href="README_EN.md">English</a>
</p>

<p align="center">
  基于 WhisperX / faster-whisper 的音视频转写与字幕生成工具。<br>
  支持<b>音素级强制对齐词级时间戳</b>、<b>多说话人角色分离</b>与 <b>SRT / VTT / TXT / TSV / JSON 全格式导出</b>。
</p>

<p align="center">
  <img src="./assets/cover.png" alt="doudou-stt-skill Banner" width="100%" />
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

本技能库作为 **AI Agent 的音视频转字幕与逐字稿提取助手**（原生支持 Antigravity、Claude Code、OpenCode 等平台）。

---

### 一、安装

在任何目标工程根目录下，通过命令行一键安装：

```bash
npx skills add undsky/doudou-stt-skill --yes
```

---

### 二、使用

```text
帮我把这段采访录音转成中文 SRT 字幕，并区分说话人角色：./resources/data/interview.mp4
```

或者提取全文用于大模型总结阅读：

```text
将会议录音文件提取为纯文本逐字稿：./resources/data/meeting.m4a
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
