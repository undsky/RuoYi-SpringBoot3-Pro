---
name: doudou-stt
description: 音频/视频转成字幕或纯文本（Speech-to-Text / STT）。基于 WhisperX / faster-whisper，支持生成带时间轴的字幕（SRT/VTT）、提取逐字稿纯文本（TXT）、音素级强制对齐词级时间戳（JSON）、以及多说话人分离（Diarization）。当用户提供本地音视频文件或远程音频 URL，并希望获取语音内容、转录文本、提取字幕、生成 SRT/VTT、制作会议纪要逐字稿、区分说话人角色、或者获取词级时间戳时使用此技能。用户没有指定文件或目录时，默认转换项目根目录下 `resources/data/` 里的音视频文件。
---

# doudou-stt：音视频转字幕与纯文本

使用 `scripts/whisper.py` 将本地音视频文件或远程音视频 URL 转为字幕（SRT/VTT）、纯文本逐字稿（TXT）或词级时间戳（JSON）。支持 WhisperX 音素级强制对齐与说话人角色分离。

## 核心约定

- **脚本路径**：`scripts/whisper.py`（位于本技能目录下）。
- **执行命令**：使用 `python3 <技能目录>/scripts/whisper.py` 执行。
- **输出分离**：**正文走 stdout**（或由 `-o` 写入文件），**进度与统计元信息走 stderr**，可通过管道 `|` 直接获取干净的纯文本或字幕。

---

## 第零步：确定要转写的音视频

| 用户需求 | 处理方式 |
|---|---|
| **指定了文件或远程 URL** | 直接对指定的文件或 URL 执行转写 |
| **指定了目录** | 扫描该目录下所有音视频文件（`.mp3`, `.wav`, `.m4a`, `.mp4`, `.mov`, `.mkv`, `.aac`, `.flac` 等）逐个转写 |
| **未指定具体文件**（如“转一下录音”、“提取这批视频字幕”） | **默认扫描项目根目录下的 `resources/data/`** |

> [!NOTE]
> 项目根目录规则：从当前工作目录向上查找，遇到 `.agents` / `.claude` / `.git` 即可认作项目根目录。

---

## 第一步：参数选择

```bash
python3 scripts/whisper.py <文件路径或URL> [参数...]
```

### 常用参数表

| 参数 | 常用值 | 说明与使用建议 |
|---|---|---|
| `--format` / `-f` | `srt`（默认） / `txt` / `vtt` / `tsv` / `json` / `words` | • **`srt`**：视频字幕，带序号与时间轴（默认）<br>• **`txt`**：纯文本全文，适合交给模型总结或改写<br>• **`vtt`**：Web 网页播放器用字幕<br>• **`tsv`**：制表符分隔的 `start`/`end`（毫秒整数）/`text` 三列，方便喂表格或脚本<br>• **`json`** / **`words`**（同义）：完整词级结构体，见下方「词级 JSON 怎么读」 |
| `--language` / `-l` | `Chinese` / `English` / `zh` / `en` / `auto`（默认） | • **推荐明确指定**（如中文填 `Chinese` 或 `zh`）<br>• `auto` 为自动检测（会略微增加耗时），中文素材实测判得准 |
| `--prompt` / `-p` | `"以下是普通话的句子。"` | • **中文音频必传**：不传不是「标点略差」，而是**整篇没有标点**，只以空格断词<br>• 有特定人名、术语、品牌名时填入可提升识别准确率 |
| `--diarize` | 标志位 | • **开启说话人分离**（Diarization），区分 `SPEAKER_00`、`SPEAKER_01` 等角色 |
| `--show-speaker` | 标志位 | • 在字幕（SRT/VTT）或纯文本（TXT）中自动显示 `[SPEAKER_XX]` 前缀 |
| `--task` | `transcribe`（默认） / `translate` | • `transcribe`：原文转写（保留原本语言）<br>• `translate`：直接翻译为英文输出 |
| `-o` / `--output` | 路径字符串 | 产物保存路径（见下方“产物存哪里”） |
| `--json` | 标志位 | 打印原始完整响应数据 |
| `--key` / `--uuid` | uuid 字符串 | • 用户标识，一般不用传：默认读 `.env` 的 `DOUDOU_API_KEY` 或同名环境变量<br>• 只在用户明确给了 uuid、或报错提示缺标识时显式传 |

### 进阶参数表

平时都不用传，下面这些是需要调对齐、分离角色或挑接口时才动的。

| 参数 | 常用值 | 说明与使用建议 |
|---|---|---|
| `--api` | `words`（默认） / `subtitle` / `auto` | • **`words`**：基于 WhisperX / faster-whisper，返回**音素级强制对齐**的词级时间戳与分段。默认值<br>• **`subtitle`**：标准 whisper CLI，时间轴**只到整秒**，只在特殊调试时用<br>• 做卡点剪辑、逐词对齐必须用 `words` |
| `--no-align` | 标志位 | 禁用 WhisperX 音素级强制对齐（默认开启，强制对齐可大幅提升词级时间戳准确度） |
| `--num-speakers` | `2` / `3` 等 | 已知录音中准确的说话人人数时传入，可提升说话人分离准确率 |
| `--hf-token` | 字符串 | HuggingFace Token（用于授权拉取 pyannote 说话人分离权重） |
| `--no-vad` | 标志位 | 禁用 VAD 语音活动检测。**默认开启 VAD**，用于过滤静音段与模型幻觉。只在怀疑 VAD 把微弱声音切掉时才关 |
| `--threads` | 留空（默认） / `1`-`32` | 推理 CPU 线程数。**留空最好**（默认 4） |
| `--base` | `http://localhost:5678` | 服务根地址，见下方「前置配置」。默认取 `.env` 或兜底值 |
| `--timeout` | `3600`（默认） | 客户端超时秒数。长音频不用改，默认已经等一小时 |

### 词级 JSON 怎么读

`-f json` 的顶层给 `text`（全文）、`segments`（分句，字幕就是拿它渲的）、`words`（逐词）、
`language_code`、`duration`、`engine`、`aligned` 与 `word_count`。

> [!IMPORTANT]
> `words[]` 的长度 **大于** `word_count`：数组里混了 `type: "spacing"` 的间隔项。
> 要逐词处理请先按 `type == "word"` 过滤，否则词数和时间轴都会算错。

每个词项形如 `{"text": "这是", "start": 0.0, "end": 0.18, "type": "word", "speaker_id": "SPEAKER_00", "logprob": 0.823}`：
- `start`/`end` 是秒（浮点数，经 WhisperX 音素级对齐）。
- `speaker_id` 为说话人标识（开启 `--diarize` 时填充）。
- `logprob` 可用来挑出低置信度的词做人工复核。

---

## 第二步：产物存哪里

| 场景 | 规则与说明 |
|---|---|
| **默认情况**（用户未明确指定输出路径） | 默认保存到项目根目录下的 `resources/stt/` 目录，文件名追加本地时间戳（如 `resources/stt/meeting-20260824110000.srt`）。执行前告知用户将写入该位置。 |
| **指定路径** | 用户明确指定了保存路径（如 “存到 out/demo.txt”），则传入 `-o out/demo.txt`，脚本会自动创建父目录。 |
| **仅查看 / 不存文件** | 用户明确表示 “不用存” 或 “看看内容”，则**不传 `-o`**，正文将直接输出到屏幕/对话中。 |

---

## 前置配置：服务地址与用户标识

脚本按 命令行 > 环境变量 > **技能目录的 `.env`** 取值 ——
只读技能目录那一个，不向上找项目根（和第零步找音视频文件的规则不同，别混）。

| 配置项 | `.env` 键名 | 命令行 | 必需性 |
|---|---|---|---|
| 服务地址 | `DOUDOU_API_URL` | `--base` | 有兜底默认值 `http://localhost:5678` |
| 用户标识 | `DOUDOU_API_KEY` | `--key` / `--uuid` | **实际必填** |

> [!IMPORTANT]
> 脚本不校验标识、留空也照发请求，但**实测必须带** —— 不带或查不到会以 `stage=auth`
> 的 400 / 401 失败。把 uuid 填进技能目录的 `.env`（`DOUDOU_API_KEY=<uuid>`），
> 或本次用 `--key <uuid>` 传。值填纯 uuid（不带 `Bearer ` 前缀）。
>
> **上传上限 50MB**（n8n 入口 `N8N_PAYLOAD_SIZE_MAX` / nginx `client_max_body_size`）。
> 超限的请求不回 413、只会挂着不响应，所以脚本发出前就会拦；大文件先压缩或改用 URL 形态。

---

## 常用命令示例

```bash
# 1. 本地音视频转中文 SRT 字幕（默认 WhisperX 音素强制对齐）
python3 scripts/whisper.py resources/data/recording.m4a -l Chinese -p "以下是普通话的句子。" -o resources/stt/recording.srt

# 2. 区分多说话人角色（会议纪要/访谈对话）
python3 scripts/whisper.py resources/data/interview.mp4 -l Chinese --diarize --show-speaker -o resources/stt/interview.srt

# 3. 提取纯文本逐字稿（用于大模型总结或阅读）
python3 scripts/whisper.py resources/data/podcast.mp3 -l Chinese -f txt -o resources/stt/podcast.txt

# 4. 获取 ElevenLabs Scribe 兼容的毫秒级词级时间戳 JSON（供剪辑对齐）
python3 scripts/whisper.py resources/data/vlog.mp4 -l Chinese -f json -o resources/stt/vlog-words.json

# 5. 转写远程 URL 音频
python3 scripts/whisper.py https://example.com/interview.mp3 -l English -f srt -o resources/stt/interview.srt

# 6. 仅查看内容（不存盘，正文直接走 stdout）
python3 scripts/whisper.py resources/data/memo.wav -l Chinese -f txt

# 7. 导出分段时间轴表格（tsv，毫秒起止 + 说话人 + 文本列）
python3 scripts/whisper.py resources/data/talk.mp3 -l Chinese --diarize --show-speaker -f tsv -o resources/stt/talk.tsv
```

---

## 耗时与排查

- **耗时预期**：实测 CPU 处理耗时约为音频时长的 **0.72× ~ 1.2×**（例如 10 分钟音频约需 7~10 分钟；开启说话人分离时需额外加载 pyannote 耗时稍增）。长音频脚本默认等待 3600 秒。
- **常见报错排查**：
  - `auth` / HTTP 400、401：uuid 没带上或查不到这个用户。
  - `validate`：参数格式有误（如语种包含非法字符）。
  - `probe`：文件损坏或没有有效音轨。
  - `download`：远程 URL 无法访问。
  - `连不上 API`：检查服务地址配置是否正确（`.env` 或环境变量 `DOUDOU_API_URL`，或用 `--base` 指定）。
