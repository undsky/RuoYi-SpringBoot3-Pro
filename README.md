<p align="center">
	<img alt="logo" src="https://oscimg.oschina.net/oscnet/up-d3d0a9303e11d522a06cd263f3079027715.png">
</p>
<h1 align="center" style="margin: 30px 0 30px; font-weight: bold;">RuoYi SpringBoot3 Pro v3.9.0</h1>
<h4 align="center">基于 SpringBoot 3 + MyBatis-Plus 的企业级快速开发框架</h4>

## 平台简介

RuoYi SpringBoot3 Pro 是在 [RuoYi-Vue-springboot3](https://gitee.com/y_project/RuoYi-Vue) 基础上的企业级增强版本，保留了原有的所有功能，并新增了多项企业级特性，全部开源免费。

本项目采用最新技术栈，提供 **Cursor AI 智能开发**、**代码加密保护**、**三级等保支持**、**AI 对话能力**、更强大的 ORM 支持、多数据库适配、低代码开发能力等企业级功能，适合中大型项目和政企系统快速开发。

## 联系方式

- 🌐 **官方网站**：https://www.undsky.com

## 相关项目

### UniApp 移动端
- 📱 https://github.com/undsky/RuoYi-SpringBoot3-UniApp

### 前端项目
- 🖥️ Element Plus 版本：https://github.com/undsky/RuoYi-SpringBoot3-ElementPlus
- 🎨 Vue3 Prettier 版本：https://github.com/undsky/ruoyi-vue3-prettier
（fork from https://gitee.com/codelm/ruoyi-vue3-lmw）
- 🐻 BearJia Vue3 使用文档：https://github.com/undsky/BearJia-Vue3/blob/master/docs/ruoyi-usage.md
（fork from https://gitee.com/javaxiaobear_admin/bear-jia-vue3）

## ✨ 核心新特性（16 项重大升级）

### 1. 🎯 Cursor AI 智能开发

内置 Cursor Rules 开发规则，AI 辅助编码体验：

- **自动代码建议**：AI 按项目规范自动生成代码
- **代码质量审查**：实时检测代码问题并提供改进建议
- **最佳实践应用**：自动应用简洁代码原则和设计模式
- **智能注释**：生成有意义的代码注释
- **快速重构**：一键重构代码符合规范
- **团队协作**：统一的编码标准和规范
- **Context7 集成**：自动获取最新技术文档
- **开箱即用**：在 Cursor IDE 中打开即可使用

### 2. 🛡️ ClassFinal 代码加密

集成 ClassFinal Maven 插件，保护核心业务代码不被反编译：

- **字节码加密**：对编译后的 class 文件进行深度加密
- **防反编译**：即使被反编译也无法查看源代码
- **选择性加密**：可指定需要加密的包（如 `com.ruoyi.biz`）
- **配置文件保护**：支持对 yml、properties 等配置文件加密
- **排除机制**：可排除第三方库（如 `org.spring`）
- **密码保护**：使用密码保护加密的代码，防止未授权运行
- **Maven 集成**：打包时自动加密，无需额外操作
- **企业级方案**：适合商业项目代码保护

### 3. 🔒 三级等保支持

满足国家信息安全等级保护三级要求，内置完善的安全策略：

- **密码更新周期**：可配置密码有效期（0-365天），超期强制修改
- **登录失败锁定**：支持 N 次失败锁定 M 分钟策略（如 5-30 表示5次失败锁定30分钟）
- **初始密码强制修改**：首次登录强制修改初始密码
- **密码过期提醒**：登录时自动检测密码是否过期，提示用户更新
- **IP 黑名单**：支持 IP 黑名单配置，支持通配符和网段匹配
- **失败次数跟踪**：数据库记录登录失败次数，自动锁定/解锁
- **可配置化管理**：所有安全策略通过系统配置表动态管理，无需重启
- **Redis 缓存支持**：失败次数缓存到 Redis，提升性能

### 4. 🤖 AI 能力集成

内置 OpenAI 工具类，快速集成 AI 对话能力：

- **OpenAI SDK 集成**：基于官方 OpenAI Java SDK 封装
- **同步对话**：支持标准的请求-响应模式
- **流式对话**：支持 SSE 流式输出，实时展示生成内容
- **多角色支持**：支持 User、System、Assistant 三种角色
- **代理支持**：支持 HTTP/SOCKS 代理配置
- **自定义 API**：支持配置自定义 API 地址（兼容 OpenAI 协议的 API）
- **开箱即用**：提供完整的工具类和示例代码

### 5. 🚀 MyBatis-Plus 集成

- 替换原有 MyBatis，提供更强大的 ORM 功能
- **分页插件**：自动识别数据库类型，无需手动配置
- **乐观锁插件**：防止并发修改数据丢失
- **防全表更新删除插件**：避免误操作造成数据丢失
- **多租户插件**：企业级 SaaS 应用必备能力
- Lambda 查询语法，更优雅的代码风格

### 6. 🎨 Magic API 低代码开发

- **可视化接口开发**：通过 Web 界面快速开发 REST API
- **无需编译**：接口修改即时生效，大幅提升开发效率
- **数据库持久化**：接口脚本存储在数据库，支持版本控制
- **Redis 缓存支持**：内置 Redis 插件，轻松实现接口缓存
- **历史记录**：支持接口变更历史记录和回滚
- 访问地址：`http://localhost:8087/magic/web`（默认账号：jyx / jyx_692483）

### 7. 🗄️ 多数据库支持

支持国内外主流数据库，满足不同场景需求：

| 数据库 | 支持版本 | 配置文件 | 初始化脚本 |
|--------|---------|---------|-----------|
| **MySQL** | 8.0+ | application-devmy.yml | ruoyi-mysql.sql |
| **PostgreSQL** | 12+ | application-devpg.yml | ruoyi-pgsql.sql |
| **达梦数据库** | DM8+ | application-devdm.yml | ruoyi-dm8.dmp |
| **瀚高数据库** | 6.2+ | application-devhg.yml | ruoyi-highgo.sql |
| **高斯数据库** | GaussDB | application-devgs.yml | ruoyi-gauss.sql |

> 💡 切换数据库只需修改 `application.yml` 中的 `spring.profiles.active` 配置

### 8. 🏢 多租户支持

- **基于字段隔离**：通过 `tenant_id` 字段自动隔离租户数据
- **自动过滤**：SQL 自动注入租户条件，无需手动处理
- **灵活配置**：支持配置忽略表和忽略用户
- **透明化使用**：业务代码无感知，框架自动处理
- 配置开关：`tenant.enable: true/false`

### 9. 🔐 Token 增强配置

相比原版，Token 配置更加灵活：

- **单点登录控制**：`singleLogin` 配置支持多端登录或单端登录
- **超长有效期**：默认 1 年有效期（525600 分钟），适合企业应用
- **自定义密钥**：更安全的 Token 密钥配置
- **灵活过期时间**：可根据业务需求调整

### 10. 📦 ruoyi-biz 业务模块

新增独立业务模块，提供标准化开发示例：

- **模块化设计**：业务代码与系统代码分离
- **标准化结构**：Controller → Service → Mapper 标准分层
- **Excel 导入导出**：内置自定义 Excel 处理器示例
- **定时任务示例**：提供定时任务开发模板
- 包含地区管理等完整功能示例

### 11. 🚢 Maven 自动部署

集成 wagon-maven-plugin，支持一键部署：

- **FTP 部署**：支持 FTP 服务器自动上传
- **SFTP 部署**：支持 SFTP 安全文件传输
- **配置简单**：在 `pom.xml` 中配置服务器信息
- **部署命令**：`mvn clean package deploy`

### 12. 🔧 Redis 可选配置

Redis 不再是必须的依赖：

- **灵活选择**：可选择是否启用 Redis
- **注释配置**：默认 Redis 配置为注释状态
- **本地开发友好**：无需安装 Redis 即可启动项目
- **生产环境推荐**：生产环境建议开启 Redis 提升性能

### 13. 🌐 多环境配置文件

提供多种数据库、多种环境的配置文件：

```
application-devmy.yml     # 开发环境 MySQL
application-devpg.yml     # 开发环境 PostgreSQL
application-prodmy.yml    # 生产环境 MySQL
application-prodpg.yml    # 生产环境 PostgreSQL
...更多数据库配置
```

### 14. 🎯 代码生成模板优化

针对 MyBatis-Plus 优化代码生成模板：

- **MyBatis-Plus 适配**：生成的 Mapper 继承 BaseMapper，自动拥有 CRUD 方法
- **Lambda 查询支持**：生成的代码支持 Lambda 表达式查询
- **多数据库兼容**：生成的 SQL 和实体类适配多种数据库
- **注解增强**：自动添加 `@TableName`、`@TableId` 等 MyBatis-Plus 注解
- **分页优化**：使用 MyBatis-Plus Page 对象，无需手动配置
- **代码更精简**：减少样板代码，提高开发效率
- **低代码结合**：可配合 Magic API 快速开发，双管齐下

### 15. 📈 依赖版本升级

采用最新稳定版本，提升性能和安全性：

| 依赖 | 原版本 | Pro版本 |
|------|--------|---------|
| Spring Boot | 3.5.4 | 3.3.5 |
| MyBatis | 3.0.4 | MyBatis-Plus 3.5+ |
| OpenAI SDK | ❌ | Latest ⭐ |
| PageHelper | 2.1.1 | 2.1.0 |
| FastJson2 | 2.0.58 | 2.0.57 |
| Oshi | 6.8.3 | 6.8.1 |
| Springdoc | 2.8.9 | 2.6.0 |

### 16. 🎨 三套前端模版

提供三套不同风格的前端解决方案，满足不同项目需求：

- **Element Plus 版本**：基于 Element Plus UI 组件库的经典后台管理系统
  - 地址：https://github.com/undsky/RuoYi-SpringBoot3-ElementPlus
  - 特点：成熟稳定、组件丰富、开箱即用
  - 适用场景：企业级后台管理系统、传统管理平台
  
- **Vue3 Prettier 版本**：采用 Prettier 代码格式化的现代化前端
  - 地址：https://github.com/undsky/ruoyi-vue3-prettier
  - 特点：代码规范统一、格式化自动、开发体验好
  - 适用场景：注重代码质量的团队项目、多人协作开发
  
- **BearJia Vue3 版本**：更现代化的设计风格和交互体验
  - 地址：https://github.com/undsky/BearJia-Vue3
  - 文档：https://github.com/undsky/BearJia-Vue3/blob/master/docs/ruoyi-usage.md
  - 特点：UI 精美、交互流畅、用户体验优秀
  - 适用场景：注重用户体验的项目、现代化管理系统

所有前端模版均：
- ✅ 完美对接后端 API 接口
- ✅ 支持所有后端功能（用户管理、权限管理、代码生成等）
- ✅ 开箱即用，无需额外配置
- ✅ 响应式布局，支持多终端访问
- ✅ 定期更新维护

## 🎯 Cursor Rules 智能开发

项目内置 Cursor AI 开发规则，提升开发效率和代码质量：

### 规则配置

项目在 `.cursor/rules/` 目录下配置了以下规则文件：

| 规则文件 | 说明 | 应用范围 |
|---------|------|---------|
| `common.mdc` | 通用开发规则 | 全局应用 |
| `clean-code.mdc` | 简洁代码指南 | 所有代码文件 |
| `codequality.mdc` | 代码质量规范 | 所有代码文件 |
| `project.mdc` | 项目特定规则 | 全局应用 |

### 规则内容

**通用规则（common.mdc）**
- 角色定位：经验丰富的 SpringBoot3 专家
- 技术栈：JDK17/21、Spring Boot、MyBatis-Plus、Hutool 等
- 工作流程：初步评估 → 实施 → 完成总结
- Context7 集成：自动获取最新技术文档

**简洁代码指南（clean-code.mdc）**
- ✅ 使用常量替代魔法数字
- ✅ 有意义的命名
- ✅ 智能注释（解释原因而非内容）
- ✅ 单一职责原则
- ✅ DRY 原则（不重复代码）
- ✅ 清晰的代码结构
- ✅ 封装实现细节
- ✅ 持续重构

**代码质量规范（codequality.mdc）**
- ✅ 验证信息后再呈现
- ✅ 逐文件修改代码
- ✅ 不做多余的空格建议
- ✅ 不总结变更内容
- ✅ 保留现有代码结构
- ✅ 单次提供完整编辑
- ✅ 提供真实文件链接

### 使用方式

**自动应用**

在 Cursor IDE 中打开项目，规则会自动生效：

1. **智能代码建议**
   - AI 助手会遵循项目规范生成代码
   - 自动应用最佳实践和设计模式

2. **代码审查**
   - AI 会根据规则检查代码质量
   - 提供符合规范的改进建议

3. **快速开发**
   - 使用 `Ctrl+K`（或 `Cmd+K`）唤起 AI 助手
   - 描述需求，AI 会按规则生成代码

**手动触发**

在 Cursor 中与 AI 对话时，提及规则名称：

```
请按照 clean-code 规则重构这段代码
遵循 codequality 规范实现用户登录功能
```

### 规则优势

| 优势 | 说明 |
|------|------|
| 🎯 **一致性** | 团队成员使用统一的编码规范 |
| ⚡ **效率** | AI 自动遵循最佳实践，减少返工 |
| 📚 **知识传承** | 新成员快速了解项目标准 |
| 🔍 **质量保障** | 代码审查自动化，减少低级错误 |
| 🚀 **快速上手** | 开箱即用的智能开发体验 |

### 自定义规则

如需自定义规则，编辑 `.cursor/rules/` 下的文件：

```yaml
---
description: 自定义规则说明
globs: "**/*.java"  # 应用的文件类型
alwaysApply: true   # 是否全局应用
---

# 你的规则内容
- 规则1
- 规则2
```

重启 Cursor 或重新加载项目后生效。

## 技术栈

### 后端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| Spring Boot | 3.3.5 | 容器 + MVC 框架 |
| Spring Security | 6.x | 认证和授权框架 |
| MyBatis-Plus | 3.5+ | ORM 框架（增强版） |
| OpenAI Java SDK | Latest | AI 对话能力 |
| Magic API | 2.2.2 | 低代码快速开发平台 |
| Redis | - | 分布式缓存（可选） |
| JWT | 0.9.1 | JWT 令牌 |
| Druid | 1.2.23 | 数据库连接池 |
| Springdoc | 2.6.0 | API 文档 |
| Quartz | - | 定时任务 |
| Velocity | 2.3 | 代码生成模板 |

### 数据库支持

- MySQL 8.0+
- PostgreSQL 12+
- 达梦数据库 DM8
- 瀚高数据库 6.2+
- 高斯数据库 GaussDB

## 内置功能

1.  ✅ 用户管理：用户是系统操作者，该功能主要完成系统用户配置。
2.  ✅ 部门管理：配置系统组织机构（公司、部门、小组），树结构展现支持数据权限。
3.  ✅ 岗位管理：配置系统用户所属担任职务。
4.  ✅ 菜单管理：配置系统菜单，操作权限，按钮权限标识等。
5.  ✅ 角色管理：角色菜单权限分配、设置角色按机构进行数据范围权限划分。
6.  ✅ 字典管理：对系统中经常使用的一些较为固定的数据进行维护。
7.  ✅ 参数管理：对系统动态配置常用参数。
8.  ✅ 通知公告：系统通知公告信息发布维护。
9.  ✅ 操作日志：系统正常操作日志记录和查询；系统异常信息日志记录和查询。
10. ✅ 登录日志：系统登录日志记录查询包含登录异常。
11. ✅ 在线用户：当前系统中活跃用户状态监控。
12. ✅ 定时任务：在线（添加、修改、删除）任务调度包含执行结果日志。
13. ✅ 代码生成：前后端代码的生成（java、html、xml、sql）支持 CRUD 下载。
14. ✅ 系统接口：根据业务代码自动生成相关的 API 接口文档。
15. ✅ 服务监控：监视当前系统 CPU、内存、磁盘、堆栈等相关信息。
16. ✅ 缓存监控：对系统的缓存信息查询，命令统计等。
17. ✅ 连接池监视：监视当前系统数据库连接池状态，可进行分析 SQL 找出系统性能瓶颈。
18. ✨ **三套前端模版**：Element Plus、Vue3 Prettier、BearJia Vue3 三种风格前端（新增）。
19. ✨ **Cursor Rules**：内置 AI 开发规则，智能代码建议和质量保障（新增）。
20. ✨ **ClassFinal 代码加密**：字节码加密保护，防止核心业务代码被反编译（新增）。
21. ✨ **三级等保支持**：密码更新周期、登录失败锁定、IP黑名单等安全策略（新增）。
22. ✨ **AI 对话能力**：内置 OpenAI 工具类，支持同步和流式对话（新增）。
23. ✨ **代码生成优化**：针对 MyBatis-Plus 优化的代码生成模板（优化）。
24. ✨ **地区管理**：省市区三级联动数据管理（新增）。
25. ✨ **Magic API**：可视化接口开发平台（新增）。
26. ✨ **多租户管理**：SaaS 多租户数据隔离（新增）。

## 快速开始

### 环境要求

- JDK 17 或 JDK 21
- Maven 3.6+
- 选择以下数据库之一：
  - MySQL 8.0+
  - PostgreSQL 12+
  - 达梦数据库 DM8
  - 瀚高数据库 6.2+
  - 高斯数据库 GaussDB
- Redis（可选，生产环境推荐）

### 安装步骤

1. **导入数据库脚本**

```bash
# MySQL 示例
mysql -u root -p < sql/ruoyi-mysql.sql
mysql -u root -p < sql/magic-api-mysql.sql
mysql -u root -p < sql/region-mysql.sql

# PostgreSQL 示例
psql -U postgres -d ruoyi < sql/ruoyi-pgsql.sql
psql -U postgres -d ruoyi < sql/magic-api-pgsql.sql
psql -U postgres -d ruoyi < sql/region-pgsql.sql
```

2. **修改配置文件**

编辑 `ruoyi-admin/src/main/resources/application.yml`：

```yaml
spring:
  profiles:
    active: devmy  # 选择对应的数据库配置文件
```

然后编辑对应的配置文件（如 `application-devmy.yml`），修改数据库连接信息。

3. **编译打包**

```bash
# 使用 Maven 编译
mvn clean package

# 或使用提供的脚本（Windows）
bin\package.bat
```

4. **启动项目**

```bash
# 方式一：直接运行 jar
java -jar ruoyi-admin/target/ruoyi-admin.jar

# 方式二：使用 Maven 运行
mvn spring-boot:run -pl ruoyi-admin

# 方式三：使用提供的脚本（Windows）
bin\run.bat
```

5. **访问系统**

- 系统地址：http://localhost:8087
- 接口文档：http://localhost:8087/doc.html
- Magic API：http://localhost:8087/magic/web
- 默认账号：admin / admin123

6. **启动前端（可选）**

选择以下任意一套前端模版启动：

**Element Plus 版本（推荐企业级应用）：**
```bash
# 克隆项目
git clone https://github.com/undsky/RuoYi-SpringBoot3-ElementPlus.git
cd RuoYi-SpringBoot3-ElementPlus

# 安装依赖
npm install

# 启动项目
npm run dev

# 访问地址：http://localhost:80
```

**Vue3 Prettier 版本（推荐团队协作）：**
```bash
# 克隆项目
git clone https://github.com/undsky/ruoyi-vue3-prettier.git
cd ruoyi-vue3-prettier

# 安装依赖
pnpm install

# 启动项目
pnpm dev

# 访问地址：http://localhost:80
```

**BearJia Vue3 版本（推荐现代化UI）：**
```bash
# 克隆项目
git clone https://github.com/undsky/BearJia-Vue3.git
cd BearJia-Vue3

# 安装依赖
npm install

# 启动项目
npm run dev

# 访问地址：http://localhost:5173
```

## 使用说明

### 前端模版选择指南

根据项目需求选择合适的前端模版：

**Element Plus 版本**
- ✅ 适合：企业级后台管理、政府系统、传统管理平台
- ✅ 优势：成熟稳定、组件丰富、文档完善
- ✅ 技术栈：Vue3 + Element Plus + Vite

**Vue3 Prettier 版本**
- ✅ 适合：注重代码质量的团队、多人协作项目
- ✅ 优势：代码格式统一、开发规范、易于维护
- ✅ 技术栈：Vue3 + Element Plus + Vite + Prettier

**BearJia Vue3 版本**
- ✅ 适合：注重用户体验、现代化管理系统
- ✅ 优势：UI精美、交互流畅、用户体验好
- ✅ 技术栈：Vue3 + Ant Design Vue + Vite

> 💡 所有前端模版功能完全一致，仅 UI 风格和代码规范不同，可根据团队喜好选择。

### ClassFinal 代码加密使用

Pro 版本集成了 ClassFinal 代码加密插件，保护核心业务代码：

**加密配置（ruoyi-admin/pom.xml）：**

```xml
<plugin>
    <groupId>com.gitee.lcm742320521</groupId>
    <artifactId>classfinal-maven-plugin</artifactId>
    <version>1.4.1</version>
    <configuration>
        <!-- 需要加密的包，多个用逗号分隔 -->
        <packages>com.ruoyi.biz</packages>
        
        <!-- 需要加密的配置文件 -->
        <cfgfiles>*.yml</cfgfiles>
        
        <!-- 排除的包，不进行加密 -->
        <excludes>org.spring</excludes>
        
        <!-- 加密密码，运行时需要此密码 -->
        <password>RuoyiSpringBoot3@123456!</password>
    </configuration>
</plugin>
```

**使用步骤：**

1. **打包加密**

```bash
# 执行 Maven 打包，自动触发加密
mvn clean package

# 加密后的 jar 文件在 target 目录
```

2. **运行加密的 jar**

```bash
# 需要提供密码参数才能运行
java -jar RuoyiSpringBoot3.jar -pwd=RuoyiSpringBoot3@123456!
```

**注意事项：**

- ⚠️ 加密后的代码无法反编译，请妥善保管源代码
- ⚠️ 密码一定要保存好，丢失无法恢复
- ✅ 建议只加密核心业务模块（如 `com.ruoyi.biz`）
- ✅ 不要加密第三方库，会导致启动失败
- ✅ 生产环境使用更复杂的密码

**适用场景：**

- 商业项目代码保护
- 交付给客户的项目
- 防止核心算法泄露
- 知识产权保护

### 三级等保安全配置

Pro 版本内置完善的等保三级安全策略，通过系统参数配置即可启用：

**1. 密码更新周期配置**

在系统管理 → 参数设置中配置 `sys.account.passwordValidateDays`：

```
参数名称：用户管理-账号密码更新周期
参数键名：sys.account.passwordValidateDays
参数键值：90  （90天强制修改密码，0表示不限制）
```

配置后效果：
- 用户密码超过 90 天未更新，登录时会强制提示修改密码
- 系统自动检测 `pwd_update_date` 字段判断密码是否过期

**2. 登录失败锁定策略**

配置 `sys.account.tryLoginCount` 参数：

```
参数名称：用户管理-账号密码尝试登录次数
参数键名：sys.account.tryLoginCount
参数键值：5-30  （5次失败后锁定30分钟，格式：次数-锁定时长）
```

配置后效果：
- 连续 5 次登录失败后，账号自动锁定 30 分钟
- 锁定期间无法登录，提示"连续5次登录失败，请30分钟后再试"
- 锁定时间到期或管理员手动解锁后恢复

**3. 初始密码强制修改**

配置 `sys.account.initPasswordModify` 参数：

```
参数名称：用户管理-初始密码修改策略
参数键名：sys.account.initPasswordModify
参数键值：1  （1表示启用，0表示关闭）
```

配置后效果：
- 新用户首次登录时，强制修改初始密码
- 直到修改密码后才能正常使用系统

**4. IP 黑名单配置**

配置 `sys.login.blackIPList` 参数：

```
参数名称：用户登录-黑名单列表
参数键名：sys.login.blackIPList
参数键值：192.168.1.*;10.0.0.0/8  （多个用分号分隔，支持通配符和网段）
```

配置后效果：
- 黑名单中的 IP 无法登录系统
- 支持通配符匹配（如 192.168.1.*）
- 支持网段匹配（如 10.0.0.0/8）

**数据库支持**

系统会自动跟踪：
- `sys_user.try_count`：记录用户登录失败次数
- `sys_user.pwd_update_date`：记录密码最后更新时间

### AI 对话功能使用

Pro 版本内置了 OpenAI 工具类，可快速集成 AI 对话能力：

**同步对话示例：**

```java
import com.ruoyi.common.utils.ai.*;
import com.openai.client.OpenAIClient;
import java.util.Arrays;

// 1. 创建客户端
OpenAIClient client = OpenAI.chatClient(
    "your-api-key",
    "https://api.openai.com/v1",
    null  // 如需代理，传入 Proxy 对象
);

// 2. 构建消息列表
List<AIMessage> messages = Arrays.asList(
    new AIMessage(AIRole.SYSTEM, "你是一个有帮助的助手"),
    new AIMessage(AIRole.USER, "介绍一下 Spring Boot")
);

// 3. 创建对话参数
ChatCompletionCreateParams params = OpenAI.chatParams("gpt-3.5-turbo", messages);

// 4. 发送请求并获取响应
String response = OpenAI.chat(client, params);
System.out.println(response);
```

**流式对话示例（SSE）：**

```java
// Controller 中使用
@PostMapping("/chat/stream")
public ResponseEntity<StreamingResponseBody> chatStream(@RequestBody ChatRequest request) {
    OpenAIClient client = OpenAI.chatClient("your-api-key", "https://api.openai.com/v1", null);
    
    List<AIMessage> messages = Arrays.asList(
        new AIMessage(AIRole.USER, request.getMessage())
    );
    
    ChatCompletionCreateParams params = OpenAI.chatParams("gpt-3.5-turbo", messages);
    
    return OpenAI.chatStream(client, params, new OpenAI.StreamContentListener() {
        @Override
        public void onContent(String content) {
            // 每次接收到增量内容时调用
            System.out.print(content);
        }
        
        @Override
        public void onComplete(String fullContent) {
            // 流式输出完成后调用
            System.out.println("\n完整内容：" + fullContent);
        }
    });
}
```

**支持自定义 API（如国内大模型）：**

```java
// 使用兼容 OpenAI 协议的其他 API
OpenAIClient client = OpenAI.chatClient(
    "your-api-key",
    "https://your-custom-api.com/v1",  // 自定义 API 地址
    null
);
```

### MyBatis-Plus 使用示例

```java
// 1. 实体类继承 BaseEntity
@TableName("sys_user")
public class SysUser extends BaseEntity {
    @TableId(type = IdType.AUTO)
    private Long userId;
    private String userName;
    // ...
}

// 2. Mapper 继承 BaseMapper
public interface SysUserMapper extends BaseMapper<SysUser> {
    // 无需写任何代码，已自动拥有 CRUD 方法
}

// 3. Service 使用
// Lambda 查询
List<SysUser> users = userMapper.selectList(
    new LambdaQueryWrapper<SysUser>()
        .eq(SysUser::getStatus, "0")
        .like(SysUser::getUserName, "admin")
);

// 分页查询
Page<SysUser> page = new Page<>(1, 10);
userMapper.selectPage(page, 
    new LambdaQueryWrapper<SysUser>()
        .orderByDesc(SysUser::getCreateTime)
);
```

### Magic API 使用

1. 访问 Magic API 管理界面：`http://localhost:8087/magic/web`
2. 使用账号登录：jyx / jyx_692483
3. 创建接口分组和接口
4. 编写接口脚本（支持 SQL、JavaScript 等）
5. 测试接口
6. 发布接口，前端即可调用

### 代码生成器使用

Pro 版本的代码生成器已针对 MyBatis-Plus 优化：

1. 访问系统管理 → 代码生成
2. 选择需要生成代码的表
3. 生成的代码特点：
   - Mapper 继承 `BaseMapper<T>`，自带 CRUD 方法
   - 实体类添加 `@TableName`、`@TableId` 等注解
   - Service 层支持 MyBatis-Plus 的 Lambda 查询
   - 自动适配当前使用的数据库类型
   - 支持 MyBatis-Plus 分页对象

生成的 Mapper 示例：

```java
public interface UserMapper extends BaseMapper<User> {
    // 无需编写基础 CRUD，已由 BaseMapper 提供
    // 只需编写复杂的自定义查询
}
```

### 多租户配置

在 `application.yml` 中配置：

```yaml
tenant:
  enable: true              # 是否启用多租户
  column: tenant_id         # 租户字段名
  ignoreTables:             # 忽略的表（不进行租户隔离）
    - sys_user
    - sys_role
  ignoreLoginNames:         # 忽略的用户（不进行租户隔离）
    - admin
```

### 切换数据库

1. 修改 `application.yml` 中的 `spring.profiles.active`
2. 选择对应的配置文件：
   - `devmy`：开发环境 MySQL
   - `devpg`：开发环境 PostgreSQL
   - `devdm`：开发环境达梦数据库
   - `devhg`：开发环境瀚高数据库
   - 等等...

## 项目结构

```
RuoYi-SpringBoot3-Pro
├── bin                     # 启动脚本
│   ├── clean.bat          # 清理脚本
│   ├── package.bat        # 打包脚本
│   └── run.bat            # 启动脚本
├── sql                     # SQL脚本
│   ├── ruoyi-mysql.sql    # MySQL 初始化脚本
│   ├── ruoyi-pgsql.sql    # PostgreSQL 初始化脚本
│   ├── ruoyi-dm8.dmp      # 达梦数据库脚本
│   ├── magic-api-*.sql    # Magic API 脚本
│   └── region-*.sql       # 地区数据脚本
├── ruoyi-admin             # 管理后台模块
├── ruoyi-framework         # 框架核心模块
├── ruoyi-system            # 系统模块
├── ruoyi-common            # 通用模块
├── ruoyi-biz               # ⭐ 业务模块（新增）
├── ruoyi-quartz            # 定时任务模块
└── ruoyi-generator         # 代码生成模块
```

## 与原版对比

| 特性 | RuoYi-Vue-springboot3 | RuoYi-SpringBoot3-Pro |
|------|----------------------|----------------------|
| Spring Boot | 3.5.4 | 3.3.5 |
| ORM 框架 | MyBatis | MyBatis-Plus ⭐ |
| 前端模版 | 1套 | 3套（Element Plus/Prettier/BearJia）⭐ |
| AI 智能开发 | ❌ | Cursor Rules ⭐ |
| 代码加密保护 | ❌ | ClassFinal 加密 ⭐ |
| 三级等保 | 部分支持 | 完整支持 ⭐ |
| AI 能力 | ❌ | OpenAI 集成 ⭐ |
| 低代码开发 | ❌ | Magic API ⭐ |
| 多数据库支持 | MySQL | MySQL/PostgreSQL/达梦/瀚高/高斯 ⭐ |
| 多租户 | ❌ | ✅ ⭐ |
| Redis | 必须 | 可选 ⭐ |
| Token 有效期 | 30 分钟 | 525600 分钟（1年）⭐ |
| 单点登录控制 | ❌ | ✅ ⭐ |
| Maven 自动部署 | ❌ | FTP/SFTP ⭐ |
| 业务示例模块 | ❌ | ruoyi-biz ⭐ |
| 代码生成模板 | MyBatis | MyBatis-Plus 适配 ⭐ |
| 文件上传大小 | 10MB/20MB | 100MB/200MB ⭐ |

## 常见问题

### 1. 如何使用 ClassFinal 代码加密？

**启用加密：**
- 代码加密插件默认已配置在 `ruoyi-admin/pom.xml` 中
- 执行 `mvn clean package` 打包时会自动加密指定的包
- 加密的包在配置中的 `<packages>` 标签中指定

**运行加密的程序：**
```bash
java -jar RuoyiSpringBoot3.jar -pwd=RuoyiSpringBoot3@123456!
```

**临时禁用加密：**
- 注释掉 pom.xml 中的 classfinal-maven-plugin 配置
- 或者删除 `<executions>` 部分

**密码忘记了怎么办？**
- 加密密码在 `<password>` 标签中，查看 pom.xml 即可
- 默认密码：`RuoyiSpringBoot3@123456!`
- ⚠️ 生产环境建议修改为更复杂的密码

### 2. 如何配置三级等保安全策略？

Pro 版本的等保功能通过系统参数配置：

**密码更新周期**：系统管理 → 参数设置 → `sys.account.passwordValidateDays`，设置天数（如90）

**登录失败锁定**：配置 `sys.account.tryLoginCount` 参数，格式为"次数-分钟"（如 5-30）

**初始密码修改**：配置 `sys.account.initPasswordModify` 参数，设置为1启用

**IP黑名单**：配置 `sys.login.blackIPList` 参数，支持通配符和网段

详细配置见"使用说明"章节的三级等保安全配置部分。

### 3. 加密后的代码能反编译吗？

不能。ClassFinal 使用了以下加密技术：
- 字节码深度加密
- JNI 本地代码保护
- 运行时动态解密

即使使用 JD-GUI、Jadx 等反编译工具，也无法还原源代码。

### 4. 密码过期后如何处理？

当密码超过配置的有效期后：
- 用户登录时系统会自动检测并提示密码已过期
- 前端会弹出修改密码对话框
- 用户必须修改密码后才能继续使用系统
- 修改密码后 `pwd_update_date` 字段自动更新

### 5. 如何手动解锁被锁定的账号？

管理员可以通过以下方式解锁：
1. 等待锁定时间自动到期
2. 在系统中重置用户的 `try_count` 字段为0
3. 清除 Redis 中对应的锁定缓存

### 6. 如何使用 AI 对话功能？

Pro 版本内置了 OpenAI 工具类，使用步骤：
1. 准备 OpenAI API Key（或兼容 OpenAI 协议的其他 API）
2. 参考"使用说明"章节的 AI 对话示例代码
3. 支持同步对话和流式对话两种模式
4. 可配置代理和自定义 API 地址

工具类位置：`com.ruoyi.common.utils.ai.OpenAI`

### 7. Magic API 无法访问？

确保在 `application.yml` 中正确配置了 Magic API：

```yaml
magic-api:
  web: /magic/web
  prefix: /magic/api
```

### 8. 多租户不生效？

检查以下配置：
- `tenant.enable` 是否设置为 `true`
- 数据库表是否包含 `tenant_id` 字段
- 表是否在 `ignoreTables` 中

### 9. 如何禁用 Redis？

将 `application.yml` 中的 Redis 配置注释即可，系统会自动使用内存存储。

### 10. 数据库连接失败？

- 检查对应的配置文件（如 `application-devmy.yml`）
- 确认数据库地址、端口、用户名、密码是否正确
- 确认数据库已启动并可访问

## 部署说明

### Docker 部署

```bash
# 构建镜像
docker build -t ruoyi-springboot3-pro .

# 运行容器
docker run -d -p 8087:8087 --name ruoyi ruoyi-springboot3-pro
```

### Maven 自动部署

配置 `pom.xml` 中的 FTP/SFTP 信息：

```xml
<configuration>
    <serverId>RuoyiSpringBoot3</serverId>
    <fromFile>ruoyi-admin/target/RuoyiSpringBoot3.jar</fromFile>
    <toFile>RuoyiSpringBoot3.jar</toFile>
    <url>ftp://your-server-ip:21</url>
</configuration>
```

然后执行：

```bash
mvn clean package deploy
```

## 开源协议

本项目遵循 [MIT 协议](LICENSE) 开源，可免费用于个人和企业项目。

## 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 新建 Feat_xxx 分支
3. 提交代码
4. 新建 Pull Request

## 技术支持

- 官方文档：http://doc.ruoyi.vip
- Gitee：https://gitee.com/y_project/RuoYi-Vue
- GitHub：https://github.com/yangzongzhuan/RuoYi-Vue

---

⭐ 如果觉得项目不错，请点个 Star 支持一下！

