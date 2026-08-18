# DouDou-Eggjs

> 豆豆（DouDou）Node.js 版本，基于 Egg.js 企业级框架

> 打造面向小中型企业的 AI 全流程开发平台。平替产品、设计、开发、测试、运维岗位的生产力工具。
> 以快速开发、快速交付、快速迭代为核心理念。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![Egg](https://img.shields.io/badge/egg-%5E3-blue.svg)](https://eggjs.org)

## 📑 目录导航

- [平台简介](#平台简介)
- [演示项目](#演示项目)
- [前端项目](#前端项目)
- [特性](#-特性)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [部署说明](#-部署说明)
- [请我喝杯咖啡](#请我喝杯咖啡)
- [参与贡献](#-参与贡献)
- [开源协议](#-开源协议)
- [鸣谢](#-鸣谢)
- [联系方式](#-联系方式)
- [友情链接](#友情链接)

## 平台简介

基于 Egg.js 框架开发的企业级后台管理系统。采用 MyBatis XML 风格编写 SQL。

| 公众号                                       | QQ群                                          |
| -------------------------------------------- | --------------------------------------------- |
| ![公众号](https://cdn.undsky.com/img/gh.jpg) | ![QQ群](https://cdn.undsky.com/img/qqqun.jpg) |

## 演示项目

- 🖥️ Element Plus 版本：http://ry.undsky.com/admin/login?redirect=/index
- 🎨 Vue3 Prettier 版本：http://ry2.undsky.com/login?redirect=/index
- 🐻 BearJia Vue3 版本：http://ry1.undsky.com/login3

## 前端项目

**DouDou-Vue3**: [https://gitee.com/mc-springboot/doudou-vue3](https://gitee.com/mc-springboot/doudou-vue3)

**配置后端接口**：

在前端项目的 `vite.config.js` 中设置后端接口地址：

```javascript
const baseUrl = "http://localhost:7001"; // 后端接口
```

## ✨ 特性

### 核心特性

- 🗄️ **MyBatis XML 编写 SQL** - 业务逻辑与 SQL 分离，支持动态 SQL（[文档](https://github.com/undsky/doudou-eggjs-mybatis)）
- 🔌 **多数据库支持** - 支持 MySQL、PostgreSQL、SQLite 等多种数据库，支持多数据源配置（[MySQL](https://github.com/undsky/doudou-eggjs-mysql) | [PostgreSQL](https://github.com/undsky/doudou-eggjs-pgsql) | [SQLite](https://github.com/undsky/doudou-eggjs-sqlite)）
- 🤖 **代码自动生成** - 基于 XML Mapper 自动生成 Service 层代码（[文档](https://github.com/undsky/doudou-eggjs-cli)）
- 🌐 **内网穿透** - 内置 FRP 客户端，快速将本地服务暴露到公网（[文档](https://github.com/undsky/doudou-eggjs-cli#frp-内网穿透)）
- 🎯 **路由注解** - 使用装饰器定义路由，简洁优雅（[文档](https://github.com/fyl080801/egg-decorator-router)）
- ⏰ **定时任务调度** - 基于 egg-bull 实现动态定时任务，支持从数据库读取 cron 表达式、手动执行、失败重试、分布式支持、任务日志记录和可视化监控（[文档](https://github.com/brickyang/egg-bull)）
- 🚀 **缓存支持** - 多层级缓存策略（内存、文件、Redis）（[文档](https://github.com/undsky/doudou-eggjs-cache)）
- 🛡️ **限流保护** - API 请求频率限制，防止恶意攻击（[文档](https://github.com/undsky/doudou-eggjs-ratelimiter)）
- 🔐 **JWT 认证** - 基于 JWT 的用户认证和权限控制（[文档](https://github.com/okoala/egg-jwt)）
- 🔒 **权限控制** - 类似 Spring Boot `@PreAuthorize` 的权限装饰器，支持通配符、AND/OR 逻辑
- 💡 **IDE 智能提示** - 完整的 TypeScript 类型定义，支持代码跳转、智能提示和参数提示

### 技术栈

| 技术                          | 版本     | 说明                |
| ----------------------------- | -------- | ------------------- |
| [Node.js](https://nodejs.org) | >=20.0.0 | JavaScript 运行时   |
| [Egg.js](https://eggjs.org)   | ^3       | 企业级 Node.js 框架 |

### 自研插件

| 插件                                                                           | 说明                       | 文档                                                         |
| ------------------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------ |
| [doudou-eggjs-mybatis](https://github.com/undsky/doudou-eggjs-mybatis)         | MyBatis XML SQL 映射       | [README](https://github.com/undsky/doudou-eggjs-mybatis)     |
| [doudou-eggjs-mysql](https://github.com/undsky/doudou-eggjs-mysql)             | MySQL 数据库操作           | [README](https://github.com/undsky/doudou-eggjs-mysql)       |
| [doudou-eggjs-pgsql](https://github.com/undsky/doudou-eggjs-pgsql)             | PostgreSQL 数据库操作      | [README](https://github.com/undsky/doudou-eggjs-pgsql)       |
| [doudou-eggjs-sqlite](https://github.com/undsky/doudou-eggjs-sqlite)           | SQLite 数据库操作          | [README](https://github.com/undsky/doudou-eggjs-sqlite)      |
| [doudou-eggjs-cache](https://github.com/undsky/doudou-eggjs-cache)             | 多层级缓存                 | [README](https://github.com/undsky/doudou-eggjs-cache)       |
| [doudou-eggjs-ratelimiter](https://github.com/undsky/doudou-eggjs-ratelimiter) | API 限流                   | [README](https://github.com/undsky/doudou-eggjs-ratelimiter) |
| [doudou-eggjs-cli](https://github.com/undsky/doudou-eggjs-cli)                 | 代码生成工具、FRP 内网穿透 | [README](https://github.com/undsky/doudou-eggjs-cli)         |
| [doudou-eggjs-handlebars](https://github.com/undsky/doudou-eggjs-handlebars)   | Handlebars 模板引擎        | [README](https://github.com/undsky/doudou-eggjs-handlebars)  |

## 📦 项目结构

```
doudou-eggjs/
├── app/
│   ├── controller/          # 控制器
│   │   ├── system/         # 系统模块控制器
│   │   │   ├── user.js    # 用户管理
│   │   │   ├── role.js    # 角色管理
│   │   │   ├── menu.js    # 菜单管理
│   │   │   ├── dept.js    # 部门管理
│   │   │   ├── post.js    # 岗位管理
│   │   │   ├── dictType.js # 字典类型
│   │   │   ├── dictData.js # 字典数据
│   │   │   ├── config.js  # 参数配置
│   │   │   ├── notice.js  # 通知公告
│   │   │   ├── profile.js # 个人中心
│   │   │   └── login.js   # 登录认证
│   │   ├── monitor/        # 监控模块控制器
│   │   │   ├── online.js  # 在线用户
│   │   │   ├── logininfor.js # 登录日志
│   │   │   ├── operlog.js # 操作日志
│   │   │   ├── server.js  # 服务监控
│   │   │   ├── cache.js   # 缓存监控
│   │   │   ├── job.js     # 定时任务
│   │   │   └── jobLog.js  # 任务日志
│   │   ├── tool/           # 工具模块控制器
│   │   ├── common.js       # 公共接口（上传/下载）
│   │   └── index.js        # 首页控制器
│   ├── service/            # 服务层
│   │   ├── db/            # 数据库服务（自动生成）
│   │   │   └── mysql/
│   │   │       └── doudou/ # 豆豆系统表服务
│   │   ├── system/        # 系统模块服务
│   │   ├── monitor/       # 监控模块服务
│   │   ├── tool/          # 工具模块服务
│   │   ├── doudouTask.js  # 定时任务执行类
│   │   └── upload.js      # 文件上传服务
│   ├── decorator/          # 装饰器
│   │   ├── permission.js  # 权限控制装饰器
│   │   └── log.js         # 操作日志装饰器
│   ├── middleware/         # 中间件
│   │   ├── permission.js  # 权限验证中间件
│   │   └── formatBody.js  # 响应格式化
│   ├── queue/             # 队列处理器
│   │   └── doudouTask.js  # 定时任务队列
│   ├── extend/            # 框架扩展
│   ├── constant/          # 常量定义
│   ├── util/              # 工具类
│   ├── templates/         # 代码生成模板
│   └── public/            # 静态资源
│       └── uploads/       # 上传文件目录
├── config/
│   ├── config.default.js  # 默认配置
│   ├── config.local.js    # 本地开发配置
│   ├── config.prod.js     # 生产环境配置
│   └── plugin.js          # 插件配置
├── mapper/                # MyBatis XML 映射文件
│   └── mysql/
│       └── doudou/        # 豆豆系统表 Mapper
│           ├── SysUserMapper.xml
│           ├── SysRoleMapper.xml
│           ├── SysMenuMapper.xml
│           └── ...
├── sql/                   # SQL 脚本文件
├── docs/                  # 文档目录
├── typings/               # TypeScript 类型定义
├── cache/                 # 文件缓存目录
├── logs/                  # 日志目录
├── run/                   # 运行时文件
├── app.js                 # 应用启动配置
├── package.json
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 20.0.0
- 数据库（三选一）：MySQL >= 5.7 / PostgreSQL >= 10 / SQLite >= 3
- Redis >= 5.0

### 1. 克隆项目

```bash
git clone https://github.com/undsky/doudou-eggjs.git
cd doudou-eggjs
```

### 2. 安装依赖

```bash
npm install
```

### 3. 导入数据库

项目支持 MySQL、PostgreSQL、SQLite 三种数据库，SQL 脚本位于 `sql/` 目录下：

```
sql/
├── mysql/     # MySQL 初始化脚本
├── pgsql/     # PostgreSQL 初始化脚本
└── sqlite/    # SQLite 初始化脚本
```

#### MySQL

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS doudou DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_general_ci;

-- 导入数据表和数据
mysql -u root -p doudou < sql/mysql/doudou.sql
```

#### PostgreSQL

```sql
-- 创建数据库
CREATE DATABASE doudou;
\c doudou

-- 导入数据表和数据
psql -U doudou -d doudou -f sql/pgsql/doudou.sql
```

#### SQLite

SQLite 无需创建数据库，直接导入脚本即可：

```bash
sqlite3 doudou.db < sql/sqlite/doudou.sql
```

### 4. 配置数据库和 Redis

根据选择的数据库类型，在 `config/config.local.js` 中配置：

#### MySQL 配置

```javascript
config.mysql = {
  camelCase: true, // 启用驼峰命名转换：user_name -> userName
  clients: {
    doudou: {
      host: "127.0.0.1",
      user: "root",
      password: "your_password",
      database: "doudou",
    },
  },
};
```

#### PostgreSQL 配置

```javascript
config.pgsql = {
  camelCase: true,
  clients: {
    doudou: {
      host: "127.0.0.1",
      user: "doudou",
      password: "your_password",
      database: "doudou",
    },
  },
};
```

#### SQLite 配置

```javascript
config.sqlite = {
  camelCase: true,
  clients: {
    doudou: {
      database: "./doudou.db", // 数据库文件路径
    },
  },
};
```

#### Redis 配置

```javascript
const redis = {
  port: 6379,
  host: "127.0.0.1",
  password: "",
  db: 5,
};
```

### 5. 运行项目

#### 开发模式

开发模式会自动启动 Mapper 代码生成器和调试服务：

```bash
npm run dev
```

#### 生产模式

```bash
# 启动
npm start

# 停止
npm stop
```

#### 命令说明

```bash
# 开发模式（自动生成 Mapper + 调试）
npm run dev

# 仅生成 Mapper 代码
npm run mapper

# 仅启动调试服务
npm run debug

# 生产模式启动
npm start

# 停止服务
npm stop
```

### 6. 访问应用

打开浏览器访问：[http://localhost:7001](http://localhost:7001)

测试接口：

- 版本信息：`GET http://localhost:7001/version`

## 🚢 部署说明

### 使用 egg-scripts 部署

```bash
# 安装依赖
npm install --production

# 启动服务（后台运行）
npm start

# 停止服务
npm stop
```

### 使用 PM2 部署

参考
[如何使用 PM2 启动应用](https://eggjs.org/zh-CN/community/faq#%E8%BF%9B%E7%A8%8B%E7%AE%A1%E7%90%86%E4%B8%BA%E4%BB%80%E4%B9%88%E6%B2%A1%E6%9C%89%E9%80%89%E5%9E%8B-pm2)

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端项目
    location / {
			root   /www/wwwroot/项目目录;
			try_files $uri $uri/ /index.html;
            index  index.html index.htm;
        }

# 后端接口
    location /prod-api/ {
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header REMOTE-HOST $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_pass http://localhost:项目运行端口/;
            # ai stream
            proxy_buffering off;
            proxy_cache off;
            proxy_set_header Connection '';
            proxy_http_version 1.1;
            chunked_transfer_encoding off;
        }
}
```

## 请我喝杯咖啡

如果项目对你有帮助，可以请我喝杯咖啡 ☕️

<img src="https://cdn.undsky.com/img/weixin10.jpg" max-width="300" height="500" /> <img src="https://cdn.undsky.com/img/zhifubao10.jpg" max-width="300" height="500" />

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 开源协议

本项目基于 [MIT](LICENSE) 协议开源。

## 🙏 鸣谢

- [Egg.js](https://eggjs.org) - 企业级 Node.js 框架
- 所有贡献者

## 📞 联系方式

- 网站：[https://www.undsky.com](https://www.undsky.com)
- GitHub：[https://github.com/undsky/doudou-eggjs](https://github.com/undsky/doudou-eggjs)
- Issues：[https://github.com/undsky/doudou-eggjs/issues](https://github.com/undsky/doudou-eggjs/issues)

## 友情链接

- [LINUX DO - 新的理想型社区](https://linux.do/)
