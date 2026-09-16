# Clear 工作流

清空或删除知识库内容。所有删除都经用户确认，文件移入回收站可恢复。

> 📌 **路径约定**：`raw/`、`gen/`、`wiki/` 均指当前知识库（`<project>/kb/`）下的绝对路径，
> 由 SKILL.md 路由时确定（`KB_RAW`、`KB_GEN`、`KB_WIKI`）。

## 核心原则

1. **人工确认** — 所有删除必须列出文件清单，用户确认后才执行
2. **回收站机制** — 删除 = 移入 `wiki/.trash/`，不是真删，支持恢复
3. **不动原始素材** — `raw/` 下的原件永远不动
4. **清理关联** — 删页面时同步清理 index.md、overview.md 和其他页面的 Related 链接

## 三层的删除语义不同

| 层 | 删除方式 | 可恢复性 |
|----|---------|---------|
| `wiki/` 页面 | 移入 `wiki/.trash/` | ✅ `restore` 可恢复 |
| `gen/` 产物 | 直接删 | ✅ 重跑 `convert` 可复原 |
| `raw/` 原件 | **本工作流不删** | ❌ 需用户自己动手 |

中间产物不进回收站 —— 它本身就是可重新生成的缓存，进回收站没意义。
虽然它是 LLM 的日常读取面，但知识资产在 `wiki/`，清掉产物不丢知识。

## 回收站

路径：`wiki/.trash/`

- 按原目录结构存放：`wiki/concepts/swiglu.md` → `wiki/.trash/concepts/swiglu.md`
- 同名冲突时旧文件加时间戳后缀：`swiglu.2026-09-03.md`
- 恢复时移回原路径，并重新更新 index.md、overview.md、关联页面的 Related

## 使用方式

| 命令 | 作用 |
|------|------|
| `clear` | 交互式选择操作 |
| `clear all` | 全量重置 |
| `clear <关键词>` | 删除匹配的页面 |
| `clear gen` | 只清中间产物（`gen/`） |
| `clear trash` | 查看回收站 |
| `clear restore` | 从回收站恢复 |
| `clear empty-trash` | 永久清空回收站 |

## 工作流程

### 1. 确定操作模式

无参数时交互式询问：

```json
{
  "questions": [{
    "question": "选择知识库操作：",
    "header": "操作类型",
    "multiSelect": false,
    "options": [
      {"label": "全量重置", "description": "清空所有 wiki 页面到回收站，回到初始状态（raw/ 不受影响）"},
      {"label": "删除指定素材", "description": "删除一个素材及其产生的关联页面（移入回收站）"},
      {"label": "删除指定页面", "description": "删除一个或多个 entity/concept/analysis 页面（移入回收站）"},
      {"label": "只清中间产物", "description": "清空 kb/gen/，wiki 页面不动（重跑 convert 可复原）"}
    ]
  }]
}
```

（回收站相关操作走 `trash` / `restore` / `empty-trash` 子命令）

### 2. 全量重置

#### 2a. 盘点

读 `wiki/index.md`，统计将移入回收站的文件：`wiki/sources/*.md`、`entities/`、`concepts/`、`analyses/`。
同时统计 `gen/` 下的产物数量。

#### 2b. 确认（必须）

```json
{
  "questions": [{
    "question": "确认全量重置？以下 N 个文件将移入回收站（wiki/.trash/）：\n\n素材摘要: X 个\n实体页面: X 个\n概念页面: X 个\n分析页面: X 个\n\n⚠️ 可通过 clear restore 恢复\n⚠️ raw/ 原件不受影响",
    "header": "确认重置",
    "multiSelect": false,
    "options": [
      {"label": "确认重置", "description": "所有 wiki 页面移入回收站，重置 index/overview，保留 gen/"},
      {"label": "重置并清中间产物", "description": "同上，并清空 gen/（重跑 convert 可复原）"},
      {"label": "取消", "description": "不做任何操作"}
    ]
  }]
}
```

> 默认**保留** `gen/`：重新 add 时不用再转一遍音视频，省下大量时间。

#### 2c. 执行

1. 建回收站目录：`mkdir -p wiki/.trash/{sources,entities,concepts,analyses}`
2. 移动所有内容页面进回收站（同名冲突给旧文件加时间戳后缀）：
   ```bash
   mv wiki/sources/*.md wiki/.trash/sources/
   mv wiki/entities/*.md wiki/.trash/entities/
   mv wiki/concepts/*.md wiki/.trash/concepts/
   mv wiki/analyses/*.md wiki/.trash/analyses/
   ```
3. 重置 `index.md` 为空索引模板（见 [init.md](init.md) 第 4 步）
4. 重置 `overview.md`：保留 frontmatter，统计清零，清空图谱摘要和近期活动
5. 用户选了「重置并清中间产物」→ 清空 `KB_GEN` 下的文件（删目录内容，保留 `gen/` 目录本身）
6. `log.md` 顶部追加：
   ```markdown
   ## [YYYY-MM-DD] clear | 全量重置

   - 移入回收站: 素材摘要 X 个, 实体 X 个, 概念 X 个, 分析 X 个
   - 中间产物: 保留 / 已清空 N 个
   - 重置 index.md 和 overview.md
   - 可通过 clear restore 恢复
   ```
7. 输出：
   ```
   ✅ 知识库已重置
      移入回收站: N 个页面
      中间产物: 保留 M 个（重新 add 时不用再转一遍）
      raw/ 保留: K 个素材可随时重新 add
      💡 clear restore 可恢复
   ```

### 3. 选择性删除

#### 3a. 确定目标

**按素材删**：
1. 读 `wiki/index.md` 列出素材供选择（或按关键词匹配）
2. 找到摘要页 `wiki/sources/xxx.md`，读其 frontmatter 拿 `raw_file` / `derived_file`
3. 分析影响范围：
   - **将删除**：只由该素材产生的页面（`sources` 字段仅含该素材）
   - **将更新**：还有其他素材引用的页面（保留但移除关联）
   - **中间产物**：该素材的 `derived_file`（`gen/` 下那一份，可选删）

**按页面删**：
1. 用户指定或从列表选
2. 分析哪些其他页面的 Related 引用了目标页

#### 3b. 确认（必须）

```json
{
  "questions": [{
    "question": "删除《目标》将产生以下影响：\n\n🗑️ 移入回收站:\n- wiki/sources/xxx.md\n- wiki/entities/yyy.md（仅此素材引用）\n\n✏️ 将更新（移除关联）:\n- wiki/concepts/zzz.md（还有其他素材引用，保留）\n\n📦 中间产物: gen/xxx.txt\n\n确认执行？",
    "header": "确认删除",
    "multiSelect": false,
    "options": [
      {"label": "确认删除（保留中间产物）", "description": "执行删除和更新，gen/ 产物留着，重新收录时不用再转"},
      {"label": "删除并清中间产物", "description": "同上，并删掉该素材的 gen/ 产物"},
      {"label": "仅删除摘要页", "description": "只删 source 页，保留所有 entity/concept"},
      {"label": "取消", "description": "不做任何操作"}
    ]
  }]
}
```

#### 3c. 执行

1. 移动目标页面到回收站（按原目录结构）
2. 更新受影响页面：
   - 从 `sources` frontmatter 移除被删素材
   - 从 Related 移除指向已删页面的链接
   - 更新 `updated` 日期
3. 更新 `index.md` — 移除已删条目
4. 更新 `overview.md` — 统计和图谱摘要
5. 按用户选择决定是否删 `gen/` 里那一份产物
6. `log.md` 顶部追加记录
7. 跑检查看是否产生新断链或孤岛：
   ```bash
   python3 <skill-dir>/scripts/check.py --wiki-dir <KB_WIKI> --raw-dir <KB_RAW> --gen-dir <KB_GEN>
   ```
8. 输出：
   ```
   ✅ 删除完成
      移入回收站: N 个页面
      更新: M 个页面（移除关联）
      检查: 通过
      💡 clear restore 可恢复
   ```

### 4. 只清中间产物（`clear gen`）

盘点 `gen/` 下的文件和总大小，确认后直接删（不进回收站）。

```json
{
  "questions": [{
    "question": "确认清空中间产物？\n\nkb/gen/ 共 N 个文件，约 X MB\n\n✅ wiki 页面完全不受影响\n✅ 重跑 convert 可完全复原（音视频需重新转写，较慢）",
    "header": "清中间产物",
    "multiSelect": false,
    "options": [
      {"label": "确认清空", "description": "删除所有中间产物，释放磁盘空间"},
      {"label": "取消", "description": "不做任何操作"}
    ]
  }]
}
```

清完在 log.md 记一条，并提醒：之后若要下潜原话或重新收录，需先重跑 convert。

### 5. 回收站操作

#### `clear trash` — 查看

扫 `wiki/.trash/`，按类别列出所有文件及删除前的原路径。空则提示「回收站为空」。

#### `clear restore` — 恢复

1. 列出回收站文件供选择（支持多选）
2. 确认恢复清单
3. 执行：
   - 文件从 `wiki/.trash/` 移回原路径
   - 重新在 index.md 加条目
   - 重新在相关页面 Related 加链接
   - 更新 overview.md 统计
   - log.md 追加恢复记录
4. 跑检查确认恢复后的一致性

> 恢复的摘要页若其 `derived_file` 已被清，`test` 会报 `derived_file_missing` —— 按提示重跑 convert 即可。

#### `clear empty-trash` — 永久清空

1. 列出回收站所有文件
2. 确认：⚠️ 此操作不可逆（除非 git 恢复）
3. 确认后 `rm -rf wiki/.trash/*`

## 注意事项

- **永远不删 `raw/` 原件** — 那是知识库的源头，只读。用户想清 `raw/` 需自己动手，
  本工作流可以提示但不代执行
- **别删 `kb/` 目录本身** — 删掉它等于连原件一起删。清理只发生在 `wiki/` 和 `gen/` 内部
- **log.md 只追加不清空** — 重置历史本身有价值
- `wiki/.trash/` 和 `gen/` 建议加进 `.gitignore`（[init.md](init.md) 已预置）
- 删除后一定跑一次 `test` —— 断链和孤岛往往是删除的副作用
