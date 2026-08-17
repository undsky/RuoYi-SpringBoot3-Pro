# AGENT 指南 · doudou-eggjs 核心功能

面向 AI 编码助手的项目说明：本项目基于 Egg.js 3，SQL 全部写在 MyBatis 风格的 XML 里，Service 层由 CLI 从 XML 自动生成。改动代码前先读本文，避免破坏既有约定。

## 一、核心依赖

框架层（[package.json:28-31](package.json#L28-L31)）：

| 依赖                   | 作用                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `egg`                  | 企业级框架本体，约定式目录加载（controller / service / middleware / extend）                     |
| `egg-cors`             | 跨域，白名单在 [config/config.default.js:29-40](config/config.default.js#L29-L40) 用正则限定域名 |
| `egg-decorator-router` | 装饰器路由 `@Route` / `@HttpGet` 等，不写 `app/router.js`                                        |
| `egg-jwt`              | JWT 认证，通过 `match` 正则决定哪些路径需要鉴权                                                  |

自研插件（[package.json:37-42](package.json#L37-L42)，均在 [config/plugin.js](config/plugin.js) 开启）：

| 插件                       | 作用                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `doudou-eggjs-mybatis`     | 提供 `app.mapper(namespace, sqlid, values, params)`，把 XML 动态 SQL 渲染成可执行 SQL |
| `doudou-eggjs-mysql`       | `app.mysql.get(instance)`，支持 `camelCase` 下划线转驼峰                              |
| `doudou-eggjs-pgsql`       | 同上，PostgreSQL 驱动                                                                 |
| `doudou-eggjs-sqlite`      | 同上，SQLite 驱动                                                                     |
| `doudou-eggjs-cache`       | 多层缓存 `app.cache.memory / fs / redis / default`                                    |
| `doudou-eggjs-ratelimiter` | 全局中间件式 IP 限流，仅需配置，无需在业务代码中调用                                  |
| `doudou-eggjs-cli`（dev）  | `rec mapper` 生成 Service、`rec build` 打包                                           |

另外：`@hackycy/egg-bull` + `bull` 承载定时任务，`velocityjs` 渲染代码生成模板，`xlsx` 做导出，`bcryptjs` 存密码，`trek-captcha` 出验证码。

## 二、请求链路

```
请求 → ratelimiter(插件中间件) → formatBody → permission → egg-jwt(按 match) → 装饰器路由 → Controller → Service → Mapper Service → 数据库
```

- [app/middleware/formatBody.js](app/middleware/formatBody.js)：响应体若没有 `code` 字段，自动包装成 `{ code, msg, data }`。Controller 里手写 `ctx.body = { code: 200, ... }` 时不会被二次包装，这是前端要求 `rows/total/token` 平铺在顶层的原因。Swagger spec 路径被显式跳过。
- [app/middleware/permission.js](app/middleware/permission.js) 目前只是放行占位，真正的权限校验在装饰器里做。
- JWT 白名单集中在 `config.accessControl.match`（[config/config.default.js:42-46](config/config.default.js#L42-L46)），`/version`、`/login`、`/register`、`/captchaImage`、Swagger 相关路径与根路径免鉴权；`isRevoked` 用缓存里的 `jti` 做黑名单，登出接口特殊放行。新增公开接口必须同步改这个正则。

## 三、三层调用约定

这是本项目最需要遵守的部分。

### 1. Mapper XML（手写）

`mapper/{driver}/{instance}/XxxMapper.xml`，`namespace` 就是文件相对路径。标签决定生成的方法语义：

- `<select>` → 单条（`db().select`）
- `<selects>` → 多条（`db().selects`）
- `<insert>` / `<update>` / `<delete>` → `insert` / `update` / `del`
- `<sql>` → `run`

三套驱动的 XML 各自独立维护（`mapper/mysql`、`mapper/pgsql`、`mapper/sqlite`），改一处 SQL 记得同步另外两处，日期函数、`concat`、`limit` 语法各不相同。

### 2. Mapper Service（自动生成，不要手改）

`app/service/db/{driver}/{instance}/XxxMapper.js` 由 `npm run mapper` 从 XML 生成，每个 sqlid 生成两个方法：`xxxMapper(values, params)` 只返回 SQL，`xxx(values, params)` 执行 SQL。前者用于分页拼装，后者用于直接查询。

### 3. 业务 Service

统一通过 helper 拿数据库对象，不要直接 `app.mysql`：

```js
const db = ctx.helper.getDB(ctx); // 读，按配置走从库
const db = ctx.helper.getMasterDB(ctx); // 写，必定主库
await db.sysUserMapper.selectUserById([], { userId });
```

`getDB` 依据 `config.database` 的 `master/slave/readWriteSplit` 选择 driver 与 instance（[app/extend/helper.js:120-133](app/extend/helper.js#L120-L133)），所以切换数据库只改配置，业务代码零改动。

参数约定：第一个入参 `values` 是位置参数数组（通常传 `[]`），第二个 `params` 是 XML 里 `#{}` 引用的对象。`<foreach collection="array">` 传 `{ array: [...] }`，`collection="list"` 传 `{ list: [...] }` —— 传错会静默生成错误 SQL。

分页统一用 `ctx.helper.pageQuery(sqlString, params, db)`，它并行跑 count 和 list：

```js
const mapper = ctx.helper.getDB(ctx).sysConfigMapper;
return await ctx.helper.pageQuery(
  mapper.selectConfigListMapper([], params), // 注意是 ...Mapper 后缀，只取 SQL
  params,
  mapper.db(),
);
```

### 4. Controller

装饰器组合，顺序自下而上生效：

```js
@Log({ title: '参数管理', businessType: BusinessType.INSERT })
@RequiresPermissions('system:config:add')
@HttpPost('/')
async add() { ... }
```

- [app/decorator/permission.js](app/decorator/permission.js)：`@RequiresPermissions` / `@RequiresRoles` / `@RequiresAuth`，支持数组 + `'AND'|'OR'`、`system:*:*` 通配符，`*:*:*` 视为超管；权限与角色查询结果缓存 10 分钟。
- [app/decorator/log.js](app/decorator/log.js)：写 `sys_oper_log`，用 `setImmediate` 异步落库不阻塞响应，`password` 等字段自动脱敏为 `******`。
- [app/decorator/dataScope.js](app/decorator/dataScope.js)：`@DataScope({ deptAlias, userAlias })` 根据角色的 `data_scope` 生成 `params.dataScope` 片段拼进 XML；进入时先清空 `dataScope` 防注入，`userId === 1` 直接放行。

Controller 内部普遍是 `try/catch` + `ctx.logger.error` + 返回 `{ code: 500, msg }`，不向外抛异常。新增接口保持同样风格。

## 四、基础能力

**缓存**：`app.cache.default.get/set/del/wrap/reset`，键前缀集中定义在 [app/constant/index.js](app/constant/index.js) 的 `CacheConstants`（`sys_config:`、`sys_dict:`、`captcha_codes:`、`login_tokens:`、`pwd_err_cnt:` 等）。字典与参数配置在 [app.js](app.js) 的 `didReady` 里预热。

**限流**：只在 `config.ratelimiter` 配置 `points/duration/redis`，插件自动挂中间件。

**认证与密码**：登录见 [app/service/system/login.js](app/service/system/login.js)，密码 bcrypt 存储，错误次数限制在 `app/service/system/password.js`，参数取自 `config.user.password`。Token 用 `jwtid: ${Date.now()}_${userId}`，登出把 `jti` 写入黑名单。

**定时任务**：数据库 `sys_job` 存 cron，[app/service/monitor/job.js](app/service/monitor/job.js) 用 `app.queue.ryTask` 的 repeatable job 落地调度，`jobId:invokeTarget` 作唯一 key；实际业务方法在 [app/service/ryTask.js](app/service/ryTask.js)，`invokeTarget` 只允许 `ryTask.*` 这类白名单前缀。执行结果写 `sys_job_log`。

**代码生成**：[app/service/tool/gen.js](app/service/tool/gen.js) + `app/templates/vm/**` velocity 模板，可产出 Controller、Service、Mapper XML、Vue 页面、api.js 与菜单 SQL，按驱动分目录。

**常量**：`Constants`、`UserConstants`、`HttpStatus`、`BusinessType`、`OperatorType`、`DataScopeType`、`CacheConstants` 全在 [app/constant/index.js](app/constant/index.js)，不要在业务代码里写魔法字符串。

## 五、写代码时的注意事项

1. 新接口 = 装饰器路由 + 权限装饰器 + 需要审计则加 `@Log`；不要新建 `router.js`。
2. 不直接调 `app.mysql` / `app.pgsql` / `app.sqlite`，一律走 `ctx.helper.getDB / getMasterDB`。
3. 不手改 `app/service/db/**`，改 XML 再生成。
4. 加 SQL 时三套驱动 XML 同步；跨库写法优先用标准 SQL（参考 `dataScope.js` 里用 `LIKE` 兼容三库的部门树查询）。
5. 响应结构与前端强耦合：列表返回 `{ code, msg, rows, total }`，详情返回 `{ code, msg, data }`，登录返回顶层 `token`。
6. 公开接口要同时改 `config.accessControl.match`，否则会被 JWT 拦截。
7. 敏感信息不进日志，`@Log` 的 `excludeParamNames` 可追加脱敏字段。
