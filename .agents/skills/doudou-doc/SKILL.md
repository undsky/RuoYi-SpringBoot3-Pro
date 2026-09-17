---
name: doudou-doc
description: 把办公文档转成 Markdown（Office / 电子书 / PDF → Markdown）。支持 Word（doc/docx/odt/rtf）、PPT（ppt/pptx/odp）、表格（xlsx/ods/csv）、以及 pdf 和 epub。当用户提供本地文档文件、文档目录或远程文档 URL，并希望提取正文、转成 Markdown、喂给大模型阅读总结、抽取表格数据、或把一批合同/报表/论文批量转文本时使用此技能。注意本技能不做 OCR：扫描件与纯图片 PDF 没有文字层，那类输入走 PaddleOCR。用户没有指定文件或目录时，默认转换项目根目录下 `resources/data/` 里的文档。
---

# doudou-doc：文档转 Markdown

使用 `scripts/anydoc.py` 把本地文档、整个目录或远程文档 URL 转成 Markdown。

## 核心约定

- **脚本路径**：`scripts/anydoc.py`（位于本技能目录下）。
- **执行命令**：使用 `python3 <技能目录>/scripts/anydoc.py` 执行。
- **输出分离**：**正文走 stdout**（或由 `-o` 写入文件），**统计与诊断走 stderr**，可通过管道 `|` 直接拿到干净的 Markdown。
- **很快**：小文件约 51ms，1.8M / 5 万行 CSV 约 292ms。不用像转字幕那样等。

---

## 第零步：确定要转的文档

| 用户需求 | 处理方式 |
|---|---|
| **指定了文件或远程 URL** | 直接转 |
| **指定了目录** | 直接把目录传给脚本，它会扫描里面的文档逐个转（加 `-r` 递归子目录） |
| **未指定具体文件**（如“把这些合同转一下”） | **默认扫描项目根目录下的 `resources/data/`** |

> [!NOTE]
> 项目根目录规则：从当前工作目录向上查找，遇到 `.agents` / `.claude` / `.git` 即可认作项目根目录。

脚本一次可以接多个输入，目录、文件、URL 混着给也行 —— 比循环调用省事，也能一次拿到总的成败统计：

```bash
python3 scripts/anydoc.py ./合同/ report.docx https://x.com/paper.pdf -o resources/doc/
```

---

## 这个技能不做 OCR

**按有没有文字层分工，两边不重叠**：

| 输入 | 走哪个 |
|---|---|
| 正常导出的 docx / pptx / xlsx / pdf / epub | **本技能** |
| 扫描件、拍照的文档、纯图片 PDF、图片本身 | **PaddleOCR** |

脚本报 `[unsupported]` 或 `[garbled]` 就是踩到了后者，它会直接提示「改走 PaddleOCR」。
这两种不是重试能解决的，也不要改 `--format` 硬试。

还有一种更隐蔽的情况：**转换成功但产物是空的**。脚本会在这时打出 `产物为空` 和随附提示 ——
空且文档里有图，那也是扫描件，同样走 PaddleOCR。

---

## 第一步：参数选择

```bash
python3 scripts/anydoc.py <文件/目录/URL> [参数...]
```

### 常用参数表

| 参数 | 常用值 | 说明与使用建议 |
|---|---|---|
| `-o` / `--output` | 路径字符串 | 产物保存路径（见下方「产物存哪里」）。**多个输入时必须指向目录**（结尾加 `/`），否则脚本会拒绝 |
| `--max-chars` / `-m` | `0`（默认） / `50000` | 截断上限，`0` 不截断。**大文件必传**：1.8M CSV 会转出 2.3M Markdown，直接塞给模型会爆上下文 |
| `--no-content` | 标志位 | 不要正文，只回字数统计。想先看看多大再决定要不要读全文时用 |
| `--format` / `-f` | 留空（默认） / `csv` / `docx` … | **留空最好**，见下方「format 别乱填」 |
| `-r` / `--recursive` | 标志位 | 目录输入时递归子目录。默认只扫一层 |
| `--json` | 标志位 | 打印原始完整响应（含 `chars`、`truncated`、`empty` 等全部字段） |
| `--key` / `--uuid` | uuid 字符串 | • 一般不用传：读 `.env` 的 `DOUDOU_API_KEY` 或同名环境变量<br>• 只在用户明确给了 uuid、或报错提示缺标识时显式传 |
| `--base` | `http://localhost:5678` | 服务地址，见下方「前置配置」 |
| `--timeout` | `600`（默认） | 客户端超时秒数。转换本身很快，超时通常是大文件上传慢或远程 URL 下不动 |

### 支持的格式

文字处理 `doc` `docx` `odt` `rtf`ㅤ演示 `ppt` `pptx` `odp`
表格 `xlsx` `ods` `csv`ㅤ其他 `pdf` `epub`

`xls` `docm` `ppsx` `pptm` `xlsm` 这类别名会归一到上表。目录扫描只挑这些扩展名，
`.txt` `.md` `.png` 会被跳过（前两个本来就是文本，后者走 OCR）。

### format 别乱填

格式默认按**文件内容**判定，比扩展名可靠 —— 没扩展名的 docx 也认得出。只有两种情况需要显式给：

1. **CSV**，它没有文件签名，扩展名是唯一线索。本地文件形态下 `a.csv` 能自动认出来；
   但**走 URL 且地址里不带 `.csv`**（比如 `?export=1`）时必须传 `--format csv`。脚本会在这种情况下先警告一句。
2. 扩展名和真实格式不一致的文件。

填错不会报错，而是**静默出垃圾**：把 docx 当 `csv` 解会吐出一张乱码表格。拿不准就留空。

---

## 第二步：产物存哪里

| 场景 | 规则与说明 |
|---|---|
| **默认情况**（用户未明确指定输出路径） | 默认保存到项目根目录下的 `resources/doc/` 目录（如 `resources/doc/合同.md`）。执行前告知用户将写入该位置。 |
| **指定路径** | 用户明确指定了保存路径，则传入 `-o out/demo.md`，脚本会自动创建父目录。 |
| **批量** | `-o` 指向**目录**（结尾加 `/`），产物按原文件名命名（`report.docx` → `report.md`）。 |
| **仅查看 / 不存文件** | 用户明确表示「不用存」或「看看内容」，则**不传 `-o`**，正文直接输出到屏幕/对话中。多个输入时会以 `<!-- ===== 文件名 ===== -->` 分隔。 |

---

## 前置配置：服务地址与用户标识

两项都按 命令行 > 环境变量 > **`.env` 配置文件** 取值 ——
默认查找技能目录（`scripts/` 的上一级），如果没有，依次向上查找（最多向上找 3 级，支持 `.agents` 或工作区根目录的配置）。

| 配置项 | `.env` 键名 | 命令行 | 必需性 |
|---|---|---|---|
| 服务地址 | `DOUDOU_API_URL` | `--base` | 有兜底默认值 `http://localhost:5678`（公网/线上可配置为 `https://n8n.undsky.com`） |
| 用户标识 | `DOUDOU_API_KEY` | `--key` / `--uuid` | **必填**，不带会被拒 |

> [!IMPORTANT]
> 把 uuid 填进 `.env`（`DOUDOU_API_KEY=<uuid>`），或本次用 `--key <uuid>` 传。
> 值填纯 uuid，脚本会自动剥掉 `Bearer ` 前缀。

---

## 常用命令示例

```bash
# 1. 转单个文档，正文直接看（不存盘）
python3 scripts/anydoc.py resources/data/报告.docx

# 2. 存成 .md
python3 scripts/anydoc.py resources/data/报告.docx -o resources/doc/报告.md

# 3. 整个目录批量转
python3 scripts/anydoc.py resources/data/ -o resources/doc/

# 4. 递归子目录
python3 scripts/anydoc.py ./合同/ -r -o resources/doc/

# 5. 远程 URL
python3 scripts/anydoc.py https://example.com/paper.pdf -o resources/doc/paper.md

# 6. 大文件封顶 5 万字，免得爆模型上下文
python3 scripts/anydoc.py resources/data/big.csv --max-chars 50000 -o resources/doc/big.md

# 7. 先探大小，不要正文
python3 scripts/anydoc.py resources/data/huge.pdf --no-content

# 8. URL 不带扩展名的 CSV，必须显式给 format
python3 scripts/anydoc.py "https://api.example.com/export?id=1" --format csv

# 9. 只要干净正文，喂给别的工具
python3 scripts/anydoc.py resources/data/报告.docx 2>/dev/null | head -50

# 10. 拿完整元信息（chars / truncated / empty）
python3 scripts/anydoc.py resources/data/报告.docx --json
```

---

## 耗时与排查

- **耗时预期**：小文件约 51ms，1.8M / 5 万行 CSV 约 292ms。
  真等很久的话瓶颈在上传或远程下载，不在转换。
- **上传上限 50MB**（n8n 入口 `N8N_PAYLOAD_SIZE_MAX` / nginx `client_max_body_size`），超过改用 URL 形态。超限时不会立刻报错而是**干等到超时**
  —— 所以传大文件前自己先看一眼大小。
- **`chars` 是全文长度，不是返回内容的长度**。`--max-chars` 截断时两者不一致，
  拿 `chars` 当 `len(markdown)` 用会算错。脚本在截断时会显式说明这点。
- **常见报错排查**（错误里都带 `stage`）：
  - `auth`：标识没带上或查不到这个用户。报错里会打印本次用的标识（已打码）
    和它的来源，据此判断是取错了值还是这个 uuid 真的无权限。
  - `validate`：参数不合法（`format` 不在白名单、`url` 协议不对、`max_chars` 越界）。
  - `download`：远程 URL 下不动。内网地址、需要登录的网盘链接都不行。
  - `unsupported`：认不出这个文件 → **转 PaddleOCR**。
    也可能只是 URL 形态的 CSV 没带 `--format csv`，先排除这个再判定。
  - `garbled`：转出来大半是替换字符（常见于无 ToUnicode 映射表的 CJK PDF）→ **转 PaddleOCR**。
  - `convert`：文件启不动（损坏 / 加密）。
  - 其他 stage：服务端问题，把 `detail` 原样交给维护者。
  - `连不上 API`：检查服务地址（`.env` 的 `DOUDOU_API_URL` 或 `--base`）。
- **批量时退出码**：有任何一个失败就退 1，stderr 末尾给出「共 N 个，失败 M 个」。
  成功的那些已经落盘了，不用重跑整批。
