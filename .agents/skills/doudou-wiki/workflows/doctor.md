# Doctor 工作流

自动化测试知识库的核心工作流（convert、add、query、test），验证架构完整性。

> 📌 **路径约定**：`raw/`、`gen/`、`wiki/` 均指当前知识库（`<project>/kb/`）下的绝对路径，
> 由 SKILL.md 路由时确定（`KB_RAW`、`KB_GEN`、`KB_WIKI`）。测试前需先选定知识库或跑 `init`。

## 测试前须知

测试会往知识库写测试数据，最后询问是否清理。**不要在重要知识库上跑**，
建议先 `init` 一个临时知识库。

## Test 1: 架构完整性

用 Glob / Read 逐项验证：

```
知识库结构（KB 根为 <project>/kb/）:
- [ ] 根目录名为 kb
- [ ] raw/ 存在
- [ ] raw/assets/ 存在
- [ ] gen/ 存在（与 raw/ 平级，不在 raw/ 内部）
- [ ] .gitignore 存在且含 gen/
- [ ] wiki/ 存在
- [ ] wiki/sources/ 存在
- [ ] wiki/entities/ 存在
- [ ] wiki/concepts/ 存在
- [ ] wiki/analyses/ 存在
- [ ] wiki/index.md 存在且含正确的分类标题
- [ ] wiki/log.md 存在且含初始记录
- [ ] wiki/overview.md 存在且含 frontmatter
- [ ] wiki/conventions.md 存在

Skill 结构:
- [ ] <skill-dir>/SKILL.md 存在
- [ ] <skill-dir>/SCHEMA.md 存在
- [ ] <skill-dir>/registries.json 存在且是合法 JSON
- [ ] <skill-dir>/workflows/{init,add,convert,query,test,clear,doctor}.md 全部存在
- [ ] <skill-dir>/scripts/{router,scan,check,derive_text}.py 全部存在
```

## Test 2: 脚本自检

四个脚本都能跑通且输出合法 JSON：

```bash
python3 <skill-dir>/scripts/router.py help
python3 <skill-dir>/scripts/router.py convert
python3 <skill-dir>/scripts/scan.py --raw-dir <KB_RAW> --wiki-dir <KB_WIKI> --gen-dir <KB_GEN> --json
python3 <skill-dir>/scripts/check.py --wiki-dir <KB_WIKI> --raw-dir <KB_RAW> --gen-dir <KB_GEN> --json
```

```
- [ ] router.py help 返回 subcommand: "help"
- [ ] router.py convert 返回 processors 字段，含三个技能的探测结果
- [ ] 在不含 kb/ 的目录下跑 router.py convert，status 为 no_kb 但仍带 processors 字段
      （init.md 第 6 步就是在还没有 kb 时靠它探测的）
- [ ] router.py 未知子命令返回 status: "error"
- [ ] kb 字段含 root / raw / gen / wiki 四个路径，且 gen 与 raw 平级
- [ ] scan.py 输出合法 JSON，含 pending / already_added / counts / gen_dir
- [ ] check.py 输出合法 JSON，含 stats / issues
- [ ] check.py 有 P0 时退出码为 1，无 P0 时为 0
```

## Test 2b: 知识库自动发现

在项目内的深层子目录（如 `<project>/src/a/b/`）下跑一次 router：

```bash
cd <project>/src/a/b && python3 <skill-dir>/scripts/router.py add
```

```
- [ ] status: "ok"，kb.source 为 "local"
- [ ] kb.root 指向 <project>/kb，不是子目录里的路径
- [ ] 在不含 kb/ 的目录下跑，返回 status: "no_kb"，message 里提到 kb/ 和当前目录
- [ ] 该 kb 已注册且 language 为 en 时，kb.lang 为 "en"、kb.name 为注册的名称
      （就近发现不该把 init 时选的语言顶成默认的 zh）
- [ ] registries.json 里有条目漏写 path 时，返回合法 JSON（不是 KeyError 栈），
      该 id 出现在 malformed_registries 中
- [ ] 注册项路径不存在时返回 status: "error"，单库与多库带 default 两种情形都要报
```

这条验证的是「不必注册也能用」——注册表只服务跨项目切换，但已注册的元数据仍然生效。

## Test 3: 分派逻辑

不实际调用处理技能，只验证 `scan.py` 的路线判定。在 `raw/` 下建空测试文件：

```bash
# 在 KB_RAW 下创建
test-sample.md  test-doc.docx  test-img.png  test-av.mp4  test-scan.pdf  test-weird.xyz
```

跑 `scan.py --json` 后验证：

```
- [ ] test-sample.md   → route: text（走本技能自带的 derive_text.py）
- [ ] test-doc.docx    → route: doudou-doc
- [ ] test-img.png     → route: doudou-ocr
- [ ] test-av.mp4      → route: doudou-stt
- [ ] test-scan.pdf    → route: doudou-ocr（PDF 不走 doudou-doc）
- [ ] test-weird.xyz   → 落在 unknown[] 里
- [ ] derived_file 扩展名正确（doc→.md，ocr/stt→.txt，text→沿用原扩展名）
- [ ] pending[] 里**每一项**都有 derived_file，无一为 null
- [ ] derived_file 一律以 `gen/` 开头，derived_path 落在 KB_GEN 下
- [ ] unknown[] 里的 derived_file 为 null
- [ ] raw/assets/ 下的文件未出现在结果中
- [ ] gen/ 下的产物未被当成素材扫进来
- [ ] 同名不同扩展（如 a.pdf + a.png）后者 slug 带扩展名后缀
- [ ] `--file a.png` 给出的 slug / derived_file 与全量扫描时该文件的相同（不随筛选范围变化）
```

再单跑一次纯文本归一化，验证 `text` 路线：

```bash
python3 <skill-dir>/scripts/derive_text.py \
    --raw <KB_RAW>/test-sample.md --out <KB_GEN>/test-sample.md --json
```

```
- [ ] 产物出现在 gen/ 且内容与原件一致
- [ ] 行尾为 LF（原件即使是 CRLF）
- [ ] 原件未被修改
- [ ] --out 指向原件本身时报 error（stage: write），原件不被覆盖
```

编码判定单独验一轮。造四份同内容、不同编码的原件（含**无 BOM 的 UTF-16 大端**，
它最容易被按本机端序解成乱码），逐个归一化：

```
- [ ] GB18030          → source_encoding: gb18030，产物中文正确
- [ ] UTF-16 带 BOM    → source_encoding: utf-16，产物中文正确
- [ ] UTF-16-LE 无 BOM → source_encoding: utf-16-le，产物中文正确
- [ ] UTF-16-BE 无 BOM → source_encoding: utf-16-be，产物中文正确
- [ ] 四份产物内容完全一致，均不含 NUL 字符
```

纯汉字且无换行的样本也要覆盖 —— 这种字节流里 NUL 很少，靠 NUL 位置分布判端序会失效。

验证完删掉这些测试文件（`test-sample.md` 留着给 Test 4 用）。

## Test 4: Add 工作流

1. 确保 `raw/test-sample.md` 存在，内容：
   ```markdown
   # Vannevar Bush 与 Memex 的构想

   1945 年，Vannevar Bush 在《As We May Think》中提出了 Memex 的概念，
   设想一台能存储个人全部书籍笔记并按关联路径检索的机器。
   ```
   （含实体 Vannevar Bush、概念 Memex 与关联记忆）

2. 走 [add.md](add.md) 收录它

3. 验证：
   ```
   - [ ] gen/test-sample.md 已生成（纯文本也过归一化）
   - [ ] wiki/sources/test-sample.md 已创建
   - [ ] frontmatter 完整，含 raw_file: raw/test-sample.md
   - [ ] frontmatter 含 derived_file: gen/test-sample.md（相对 KB 根）
   - [ ] 正文的中间产物链接为 ../../gen/test-sample.md（相对页面自身）
   - [ ] processor: text
   - [ ] 至少创建了 1 个 entity 页和 1 个 concept 页
   - [ ] 各页 Related 区块双向链接完整
   - [ ] wiki/index.md 已更新，含新条目
   - [ ] wiki/log.md 已更新，含 add 记录
   - [ ] wiki/overview.md 统计已更新
   - [ ] check.py 无 P0
   ```

4. **再跑一次 scan.py**，验证增量判定：
   ```
   - [ ] test-sample.md 出现在 already_added[] 而非 pending[]
   ```

5. **验证 add 第 1 步的归置**：在知识库外（如系统临时目录）放一个 `test-outside.md`，
   让 add 收录它：
   ```
   - [ ] raw/test-outside.md 已出现（被拷进来）
   - [ ] 知识库外的原文件仍在原处（是 cp 不是 mv）
   - [ ] gen/test-outside.md 已生成，摘要页 raw_file 为 raw/test-outside.md
   ```
   验证完连同 `raw/test-outside.md` 一起清掉。

## Test 5: Query 工作流

1. 查询「Memex 是什么？」
2. 验证：
   ```
   - [ ] 回答引用了 wiki 中的相关页面
   - [ ] 回答含 [[页面名]] 格式的引用
   - [ ] 回答基于知识库内容而非 LLM 自身知识
   - [ ] 按 4a 规则做了自动回写（如补了交叉引用）
   ```

## Test 6: Test 工作流（知识库健康检查）

1. 故意制造一个问题：在某个页面加一条 `[[nonexistent-page-xyz]]`
2. 跑 [test.md](test.md)
3. 验证：
   ```
   - [ ] 检出该断链，级别 P0
   - [ ] 生成了结构化报告，含统计数据
   - [ ] 报告按 P0/P1/P2 分级
   ```
4. 修掉这条断链，重跑确认 P0 清零

## Test 7: 处理技能连通性（可选）

**需要三个技能都可用且配好 `.env`，会实际发请求。** 用户明确要求时才跑。

准备一份小素材（一张带字的截图、一个短音频、一个小 docx），各跑一次 convert：

```
- [ ] doudou-doc  产物落在 gen/ 且非空
- [ ] doudou-ocr  产物落在 gen/ 且非空
- [ ] doudou-stt  产物落在 gen/ 且非空
- [ ] 产物路径与 scan.py 给出的 derived_path 一致
- [ ] 三个技能的默认 resources/ 目录里没有多出产物（-o 生效了）
- [ ] raw/ 下原件未被修改（比对修改时间）
```

`text` 路线不发请求，已在 Test 3 里验证过，此处不重复。

技能不可用或 `.env` 未配时，此项标为 `⏭️ 跳过` 并说明原因，不算失败。

## Test 8: 清理

询问是否保留测试数据：

```json
{
  "questions": [{
    "question": "测试完成，如何处理测试数据？",
    "header": "清理",
    "multiSelect": false,
    "options": [
      {"label": "清理（推荐）", "description": "删除测试产生的所有页面和文件，恢复 index/overview"},
      {"label": "保留", "description": "测试素材留在知识库中作为示例"}
    ]
  }]
}
```

清理时删掉：`raw/test-*`、`gen/test-*`、`wiki/sources/test-sample.md`
及本次测试新建的 entity/concept 页，并回滚 index.md、overview.md 的对应条目。
log.md 保留测试记录（日志只追加）。

## 结果汇总

```
========================================
  doudou-wiki 自动化测试报告
========================================
  架构完整性:      ✅/❌ (N/M 通过)
  脚本自检:        ✅/❌ (N/M 通过)
  知识库自动发现:  ✅/❌ (N/M 通过)
  分派逻辑:        ✅/❌ (N/M 通过)
  Add 工作流:      ✅/❌ (N/M 通过)
  Query 工作流:    ✅/❌ (N/M 通过)
  Test 工作流:     ✅/❌ (N/M 通过)
  处理技能连通性:  ✅/❌/⏭️ (N/M 通过)
========================================
  总计: N/M 通过
========================================
```

失败项要给出具体原因和修复建议，不要只报数字。
