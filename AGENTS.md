# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库结构

本仓库包含三个可独立运行的应用，而非根级工作区：

- `doudou-eggjs/`：基于 Node.js 20+ 和 Egg.js 3 的 API 与后台管理后端。支持 MySQL、PostgreSQL 和 SQLite，使用 Redis 提供缓存与定时任务能力，开发环境监听 7001 端口。
- `doudou-vue3/`：基于 Vue 3.5、Vite 和 Element Plus 的后台管理 Web UI。Vite 开发代理会将 `/api/*` 映射至 `http://localhost:7001/*`。
- `doudou-uniapp/`：面向 H5、小程序和原生端的 UniApp 移动客户端。没有 `package.json` 或仓库定义的 CLI 脚本；应通过 `manifest.json` 与 `pages.json` 配置的 UniApp/HBuilderX 工作流进行开发。

仓库根目录没有统一的构建、检查或测试命令；请在对应应用目录中运行命令。

## 常用命令

### 后端（`doudou-eggjs/`）

```bash
cd doudou-eggjs
npm install                    # 安装依赖（Node.js >= 20）
npm run dev                    # 并行生成 Mapper 并启动调试服务器
npm run mapper                 # 根据 Mapper XML 重新生成 Mapper Service 文件
npm run debug                  # 仅启动开发服务器
npm run build                  # 使用 rec 打包至 dist/
npm start                      # 以守护进程方式在 7001 端口启动生产服务
npm stop                       # 停止生产守护进程
```

后端未定义 npm 测试或 lint 脚本。启动前，请从 `sql/` 中选择并初始化 MySQL、PostgreSQL 或 SQLite，再在 `config/config.local.js` 中配置所选数据库和 Redis。

### 管理端（`doudou-vue3/`）

```bash
cd doudou-vue3
pnpm install                   # 必须使用 pnpm；preinstall 会拒绝其他包管理器
pnpm dev                       # 启动 Vite 开发服务器（默认端口为 80）
pnpm build:prod                # 构建生产产物
pnpm preview                   # 在本地预览生产构建
pnpm prettier                  # 使用 Prettier 格式化项目
```

管理端同样未定义测试或 lint 脚本。环境对应的构建输出配置位于 `.env.development` 和 `.env.production`；Vite 将 `@` 解析为 `src/`。

## 后端架构（`doudou-eggjs/`）

修改后端前，请先阅读 `doudou-eggjs/CLAUDE.md`（内容也同步存在于 `AGENT.md`）。其中的约定对保持数据访问和安全模型至关重要。

### 请求与业务分层

Egg 会按约定从 `app/` 加载控制器、服务、中间件、辅助方法和扩展。路由通过控制器中的 `egg-decorator-router` 装饰器声明；不要新增传统的 `app/router.js`。

请求处理链路：

```text
限流器 → formatBody 中间件 → permission 中间件 → JWT 匹配 → 装饰器路由 → 控制器 → 业务服务 → 自动生成的 Mapper Service → 数据库
```

- `config/config.default.js` 配置中间件、CORS、JWT、文件上传、主从数据库选择，以及 JWT 保护路径的正则表达式。新增公开接口时，必须将其排除在 `config.accessControl.match` 之外，否则会被 JWT 拦截。
- `app/middleware/formatBody.js` 会将非结构化响应包装为 `{ code, msg, data }`。保持现有接口约定：分页列表在顶层返回 `rows` 和 `total`，详情在 `data` 中返回，登录在顶层返回 `token`。
- 控制器使用路由装饰器及 `@RequiresPermissions`/`@RequiresRoles`；需要审计的变更还应使用 `@Log`。权限检查、操作日志和数据权限范围构造位于 `app/decorator/`。
- `app/service/system/`、`app/service/monitor/` 和 `app/service/tool/` 分别承载系统管理、监控/任务与代码生成业务服务。`app.js` 会在应用启动后预热字典和参数缓存。

### 数据库与 Mapper 生成

SQL 手写于 `mapper/{mysql,pgsql,sqlite}/doudou/` 下的 MyBatis 风格 XML 文件。每种驱动都有独立 XML 文件，因为 SQL 方言可能不同。变更公共行为时，请保持所有已支持数据库的等价查询同步。

`app/service/db/{driver}/doudou/` 由 `npm run mapper` 自动生成；不得手动编辑。每个 XML 查询 ID 会生成仅返回 SQL 的 `xxxMapper()` 方法和执行查询的 `xxx()` 方法。分页时请将前者与 `ctx.helper.pageQuery()` 配合使用。

业务服务读取数据时必须通过 `ctx.helper.getDB(ctx)` 获取连接，写入数据时必须使用 `ctx.helper.getMasterDB(ctx)`，不要直接访问驱动插件。这些辅助方法会遵循 `config.database` 和可选的读写分离配置。

### 后端横切能力

- 缓存键和领域常量集中定义在 `app/constant/index.js`；请复用它们，避免新增重复字面量。
- 身份认证和密码策略位于 `app/service/system/login.js` 与 `password.js`；令牌撤销状态保存在缓存中。
- 基于数据库的定时任务通过 `app/queue/ryTask.js` 中的 Bull 实现，并由 `app/service/ryTask.js` 执行允许调用的目标方法。
- `app/service/tool/gen.js` 通过 `app/templates/vm/` 中的 Velocity 模板生成后端工件、Vue 页面、API 文件和菜单 SQL。

## Vue 管理端架构（`doudou-vue3/`）

`src/main.js` 创建 Vue 应用，并安装带持久化能力的 Pinia、Vue Router、Element Plus、指令、SVG 图标及 `BaseForm`、`BaseTable`、`PageContent`、`PageDialog`、`PageSearch` 等共享组件。

- `src/api/` 存放接口封装，按系统、监控、配置、业务和工具领域组织。
- `src/router/` 定义固定路由和受权限保护的动态路由。导航行为和服务端菜单路由由路由拦截器处理。
- `src/store/` 包含 Pinia 状态；特性状态位于 `store/modules/`，共享列表页状态位于 `store/business/`。
- `src/views/` 包含登录、系统管理、监控、配置和生成器工具页面；`src/layout/` 实现应用外壳和导航。
- 标准的查询、列表、弹窗 CRUD 页面应复用 `src/BaseComponent/` 与 `src/components/HsjComponent/` 中的配置驱动组件。通用列表组件以唯一的 `pageName` 作为状态键，不能在无关页面间复用。
- API 请求必须保留现有的 `/api` 前缀，才能在开发环境中被 Vite 代理至 Egg 后端。

## UniApp 客户端架构（`doudou-uniapp/`）

`main.js` 创建 Vue SSR 应用，安装 Pinia 和共享插件，并加载权限配置。`pages.json` 是路由和底部标签栏的唯一声明来源。页面实现位于 `pages/`，涵盖登录、首页、工作台、个人中心和通用网页/文本视图。

- `api/` 存放接口封装；`utils/request.js` 注入 Bearer 令牌并统一处理服务端错误。
- Pinia 中的用户和配置状态位于 `store/modules/`；认证及存储辅助逻辑位于 `utils/` 和 `plugins/`。
- API 基础地址和应用元数据位于 `config.js`；应针对目标部署环境谨慎修改。
- `uni_modules/` 包含内置的 Uni UI 模块；避免对其中内容进行大范围、无关的修改。
