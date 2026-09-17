---
name: doudou-ocr
description: 从图片和 PDF 里把文字提取成文本（OCR / 文字识别）。支持截图取字、扫描件与拍照文档识别、发票与票据取数、PDF 转文本、以及日英法德等 10 种语言的识别。当用户提供图片（png/jpg/bmp/gif/tiff/webp）或 PDF，并希望读出上面的文字、抄下截图里的内容、把扫描件或拍的照片变成可编辑文本、提取表单/发票/名片信息、或者让模型「看懂」一张图上写了什么时使用此技能。用户没有指定文件或目录时，默认识别项目根目录下 `resources/data/` 里的图片与 PDF。
---

# doudou-ocr：图片与 PDF 文字识别

使用 `scripts/ocr.py` 把本地图片/PDF 或远程 URL 上的文字提取成文本。

## 核心约定

- **脚本路径**：`scripts/ocr.py`（位于本技能目录下）。
- **执行命令**：使用 `python3 <技能目录>/scripts/ocr.py` 执行。
- **输出分离**：**正文走 stdout**（或由 `-o` 写入文件），**进度与统计元信息走 stderr**，可通过管道 `|` 直接拿到干净的纯文本。
- **零依赖**：纯 Python 3 标准库，不用 `pip install`。

---

## 第零步：确定要识别的文件

| 用户需求 | 处理方式 |
|---|---|
| **指定了文件或远程 URL** | 直接对指定的文件或 URL 执行识别 |
| **指定了目录** | 直接把目录传给脚本，它会筛出目录下的图片与 PDF 逐个识别（不递归子目录） |
| **未指定具体文件**（如“识别一下这批扫描件”） | **默认扫描项目根目录下的 `resources/data/`** |

> [!NOTE]
> 项目根目录规则：从当前工作目录向上查找，遇到 `.agents` / `.claude` / `.git` 即可认作项目根目录。

认这些扩展名：`.png` `.jpg` `.jpeg` `.bmp` `.gif` `.tif` `.tiff` `.webp` `.pdf`。
其他扩展名脚本仍会尝试识别，但会先在 stderr 上给一条提醒。

> [!IMPORTANT]
> **带文字层的 PDF 传本地路径，别传它的 URL。** 同一份 PDF 传 URL 实测会漏行
> （本地路径得到 3 行、URL 只得到 2 行），还慢十几倍。手上只有 URL 就先下载到本地再传。
> 扫描件 / 纯图片 PDF 没这个差别，两种传法都一样。

> [!IMPORTANT]
> **Office 文档（docx/xlsx/pptx）、epub、csv 不要用这个技能** —— 它们有现成的文字层，
> 走 `doudou-doc` 技能又快又不丢格式。本技能只管图片，以及需要「看图认字」的 PDF。

---

## 第一步：参数选择

```bash
python3 scripts/ocr.py <文件/目录/URL> [更多输入...] [参数...]
```

### 常用参数表

| 参数 | 常用值 | 说明与使用建议 |
|---|---|---|
| `--lang` / `-l` | `ch`（默认） / `en` / `japan` / `chinese_cht` … | • **`ch` 是中英混排模型**，中文图、纯英文图都能认，绝大多数情况不用改<br>• 纯英文素材填 `en` 可略微提准<br>• 日文、繁体等**必须显式指定**，用默认 `ch` 会认不出<br>• 也认 `zh` / `中文` / `jp` 这类写法，脚本会自动映射<br>• 韩语、泰语、俄语、阿拉伯语、印地语不支持<br>• 全部可选值见下方「支持的语种」 |
| `--format` / `-f` | `txt`（默认） / `json` | • **`txt`**：识别正文，直接给人看或喂给模型<br>• **`json`**：完整响应，含 `chars`（字符数）/ `boxes`（文本行数）/ `pages`（PDF 页数，图片恒为 1），要行数页数时用 |
| `-o` / `--output` | 路径字符串 | 产物保存路径（见下方「产物存哪里」）。**单个输入时是文件路径，多个输入时当目录用** |
| `--key` / `--uuid` | uuid 字符串 | • 用户标识<br>• 一般不用传：读 `.env` 的 `DOUDOU_API_KEY` 或同名环境变量<br>• 只在用户明确给了 uuid、或报错提示缺标识时显式传 |

### 进阶参数表

| 参数 | 常用值 | 说明 |
|---|---|---|
| `--stop-on-error` | 标志位 | 批量时遇到第一个失败就停。**默认是跳过失败项把剩下跑完**，最后汇总哪几个失败、退出码给 1 |
| `--verbose` / `-v` | 标志位 | 报错时打印完整 `detail`。默认只留尾部 600 字符 |
| `--base` | `http://localhost:5678` | 服务根地址，见下方「前置配置」。默认取 `.env` 或兜底值 |
| `--timeout` | `900`（默认） | 单个输入的客户端超时秒数。页数很多的 PDF 才需要加大 |

### 支持的语种

`ch`（中英混排）、`en`、`chinese_cht`（繁体）、`japan`、`french`、`german`、
`spanish`、`portuguese`、`italian`、`vietnamese`。

只认这 10 个值，填别的脚本会直接拦住并列出可选值。
韩语、泰语、俄语、阿拉伯语、印地语**不在支持范围内** —— 引擎会退到旧版模型，
而旧版要往只读的模型缓存目录写锁文件，必然失败，所以白名单里直接不放。
一次识别只用一个语种：中日混排这种没法一次识全，分别跑两遍再拼。

---

## 第二步：产物存哪里

| 场景 | 规则与说明 |
|---|---|
| **默认情况**（用户未明确指定输出路径） | 默认保存到项目根目录下的 `resources/ocr/` 目录，文件名追加本地时间戳（如 `resources/ocr/invoice-20260826110000.txt`）。执行前告知用户将写入该位置。 |
| **指定路径** | 用户明确指定了保存路径（如 “存到 out/a.txt”），则传入 `-o out/a.txt`，脚本会自动创建父目录。 |
| **批量识别** | 传 `-o <目录>/`，脚本按原文件名逐个写进去（`a.png` → `a.txt`）。多个输入共用一个文件路径只会互相覆盖，所以多输入时 `-o` 一律当目录用。同名不同扩展（`a.png` 和 `a.pdf`）会撞成同一个 `a.txt`，脚本会把后一个改成 `a-2.txt` 并提示。 |
| **仅查看 / 不存文件** | 用户明确表示 “不用存” 或 “念给我听听”，则**不传 `-o`**，正文直接输出到屏幕/对话中。批量时每份正文前会加一行 `===== 文件名 =====` 分隔。 |

---

## 前置配置：服务地址与用户标识

脚本按 命令行 > 环境变量 > **技能目录的 `.env`** 取值 —— 默认查找技能目录，
未找到时最多向上查找 3 级（支持复用主工作区配置）。

| 配置项 | `.env` 键名 | 命令行 | 必需性 |
|---|---|---|---|
| 服务地址 | `DOUDOU_API_URL` | `--base` | 有兜底默认值 `http://localhost:5678` |
| 用户标识 | `DOUDOU_API_KEY` | `--key` / `--uuid` | **实际必填** |

> [!IMPORTANT]
> 脚本不校验标识、留空也照发请求，但**实测必须带** —— 不带或查不到会以 `stage=auth`
> 的 400 / 401 失败。把 uuid 填进技能目录的 `.env`（`DOUDOU_API_KEY=<uuid>`），
> 或本次用 `--key <uuid>` 传。值填纯 uuid（不带 `Bearer ` 前缀）。

---

## 常用命令示例

```bash
# 1. 识别一张截图，正文直接打到屏幕（不存盘）
python3 scripts/ocr.py resources/data/screenshot.png

# 2. 发票/票据取字，存成 txt
python3 scripts/ocr.py resources/data/invoice.jpg -o resources/ocr/invoice-20260826110000.txt

# 3. 纯英文素材
python3 scripts/ocr.py resources/data/receipt.png -l en -o resources/ocr/receipt.txt

# 4. 日文图片（非中英语种必须显式指定）
python3 scripts/ocr.py resources/data/manga.png -l japan

# 5. PDF（用本地路径，别用 URL）
python3 scripts/ocr.py resources/data/report.pdf -o resources/ocr/report.txt

# 6. 整个目录批量，产物按原名写进目录
python3 scripts/ocr.py resources/data -o resources/ocr/batch/

# 7. 远程图片 URL
python3 scripts/ocr.py https://cdn.undsky.com/n8n/a.png

# 8. 拿完整响应（想知道多少行多少页）
python3 scripts/ocr.py resources/data/scan.pdf -f json -o resources/ocr/scan.json

# 9. 多个文件一起识别，正文带文件名分隔打到屏幕
python3 scripts/ocr.py a.png b.jpg c.pdf
```

---

## 耗时与排查

- **耗时预期**（实测）：
  - 图片：约 **5-10 秒/张**，其中约 5 秒是固定的模型加载开销，图小也省不掉。
  - 图片 PDF / 扫描件：约 **首页 7 秒 + 每多一页 4 秒**（实测 3 页约 14.5 秒）。
  - 带文字层的 PDF：**不到 1 秒**（走文字层直抽，不用 OCR）。
  - 批量是**串行**的：并发发过去只会排队，总耗时按张数累加。
- **常见报错排查**（报错里的 `stage` 字段直接说明卡在哪一步）：
  - `auth`：uuid 没带上或查不到这个用户。报错里会打印本次用的标识（已打码）和它的来源。
  - `validate`：语种不在白名单，或 url 不是 `http(s)://` 开头 / 超过 2000 字符。
  - `download`：取不到这个 URL —— 内网地址、要登录的网盘链接、防盗链图床都不行。先下到本地再传。
  - `ocr`：多数是文件本身不是有效图片或 PDF（**扩展名对不代表内容对**，坏图会在这里挂）。
  - `local`：脚本自己就拦下了 —— 文件不存在、是 0 字节、或超过 50MB 上限。
  - `连不上 API`：检查服务地址（`.env` 的 `DOUDOU_API_URL` 或环境变量）。
- **识别结果为空但退出码是 0**：请求成功、只是没抽出字。脚本会给一条 `⚠️` 提醒。
  先确认语种选对了，再看图是不是太小/太淡；必要时把图放大或提高对比度再试。
