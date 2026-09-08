/*
 * @Description: Helper 扩展
 * @Author: AI Assistant
 * @Date: 2025-10-23
 */

const bcrypt = require("bcryptjs");
const dayjs = require("dayjs");

module.exports = {
  /**
   * 安全工具类
   */
  security: {
    /**
     * 加密密码
     * @param {string} password - 明文密码
     * @return {string} 加密后的密码
     */
    async encryptPassword(password) {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    },

    /**
     * 比对密码
     * @param {string} password - 明文密码
     * @param {string} hash - 加密后的密码
     * @return {boolean} 是否匹配
     */
    async comparePassword(password, hash) {
      return await bcrypt.compare(password, hash);
    },
  },

  /**
   * 分页参数处理
   * @param {object} params - 请求参数
   * @return {array} [offset, limit]
   */
  page(params = {}) {
    const pageNum = parseInt(params.pageNum) || 1;
    const pageSize = parseInt(params.pageSize) || 10;
    const offset = (pageNum - 1) * pageSize;
    return [offset, pageSize];
  },

  /**
   * 日期格式化
   * @param {Date|string} date - 日期
   * @param {string} format - 格式
   * @return {string} 格式化后的日期
   */
  formatDate(date, format = "YYYY-MM-DD HH:mm:ss") {
    if (!date) return "";
    return dayjs(date).format(format);
  },

  /**
   * 构建树形结构
   * @param {array} list - 列表数据
   * @param {string} idKey - ID 字段名
   * @param {string} parentKey - 父ID 字段名
   * @param {number} parentId - 父ID
   * @return {array} 树形结构
   */
  buildTree(list, idKey = "id", parentKey = "parentId", parentId = 0) {
    const tree = [];

    list.forEach((item) => {
      if (item[parentKey] === parentId) {
        const children = this.buildTree(list, idKey, parentKey, item[idKey]);
        if (children.length > 0) {
          item.children = children;
        }
        tree.push(item);
      }
    });

    return tree;
  },

  /**
   * 获取客户端 IP
   * @param {object} ctx - 上下文
   * @return {string} IP 地址
   */
  getClientIP(ctx) {
    return (
      ctx.request.ip ||
      ctx.get("x-forwarded-for") ||
      ctx.get("x-real-ip") ||
      "0.0.0.0"
    );
  },

  /**
   * 判断是否为管理员
   * @param {number} userId - 用户ID
   * @return {boolean}
   */
  isAdmin(userId) {
    return userId === 1;
  },

  /**
   * 剔除用户对象中的敏感字段（密码哈希等），供 API 响应使用。
   * 不修改原对象，避免影响后续还需要 password 的内部逻辑（如改密校验）。
   * @param {object} user - 用户对象
   * @return {object|null}
   */
  sanitizeUser(user) {
    if (!user) {
      return user;
    }
    const { password, ...safeUser } = user;
    return safeUser;
  },

  /**
   * 获取数据库访问对象（基于配置，自动读写分离）
   * @param {import('egg').Context} ctx - 上下文对象
   * @param {boolean} [forWrite=false] - 是否用于写操作，默认 false（读操作）
   * @returns {import('egg').IService['db']['mysql']['doudou']} 数据库访问对象（包含所有 Mapper）
   * @example
   * // 读操作（从库）- 支持 IDE 自动跳转
   * const db = ctx.helper.getDB(ctx);
   * const users = await db.sysUserMapper.selectUserList([0, 10], {});
   * 
   * // 写操作（主库）- 支持 IDE 自动跳转
   * const db = ctx.helper.getDB(ctx, true);
   * await db.sysUserMapper.insertUser([userData]);
   */
  getDB(ctx, forWrite = false) {
    const { master, slave, readWriteSplit } = ctx.app.config.database;
    
    // 如果启用读写分离，根据操作类型选择主从库
    if (readWriteSplit && !forWrite) {
      // 读操作使用从库
      const { driver, instance } = slave;
      return /** @type {import('egg').IService['db']['mysql']['doudou']} */ (ctx.service.db[driver][instance]);
    }
    
    // 写操作或未启用读写分离，使用主库
    const { driver, instance } = master;
    return /** @type {import('egg').IService['db']['mysql']['doudou']} */ (ctx.service.db[driver][instance]);
  },

  /**
   * 获取主库数据库访问对象（写操作）
   * @param {import('egg').Context} ctx - 上下文对象
   * @returns {import('egg').IService['db']['mysql']['doudou']} 主库数据库访问对象
   * @example
   * // 支持 IDE 自动跳转到 Mapper 方法
   * const db = ctx.helper.getMasterDB(ctx);
   * await db.sysUserMapper.updateUser([userData]);
   */
  getMasterDB(ctx) {
    return this.getDB(ctx, true);
  },

  /**
   * 获取从库数据库访问对象（读操作）
   * @param {import('egg').Context} ctx - 上下文对象
   * @returns {import('egg').IService['db']['mysql']['doudou']} 从库数据库访问对象
   * @example
   * // 支持 IDE 自动跳转到 Mapper 方法
   * const db = ctx.helper.getSlaveDB(ctx);
   * const list = await db.sysRoleMapper.selectRoleList([0, 10], {});
   */
  getSlaveDB(ctx) {
    return this.getDB(ctx, false);
  },

  /**
   * 分页查询封装
   * @param {string} sql - SQL 语句
   * @param {object} params - 查询参数
   * @param {object} db - 数据库连接
   * @return {object} { code, msg, rows, total }
   */
  async pageQuery(sql, params, db) {
    // 分页参数
    const pageNum = parseInt(params.pageNum) || 1;
    const pageSize = parseInt(params.pageSize) || 10;
    const offset = (pageNum - 1) * pageSize;

    // 并行执行 count 和 list 查询
    // 分页使用标准 SQL 的 LIMIT n OFFSET m 写法，MySQL / PostgreSQL / SQLite 三种驱动均兼容
    // （不能用 limit offset,size 逗号语法，PostgreSQL 不支持）
    const [countResult, rows] = await Promise.all([
      db.select("select count(*) as count from (" + sql + ") as t"),
      db.selects(sql + " limit " + pageSize + " offset " + offset),
    ]);

    // PostgreSQL 的 count(*) 返回 bigint，pg 驱动会解析成字符串，统一转成数字
    return {
      rows: rows || [],
      total: countResult ? Number(countResult.count) || 0 : 0,
    };
  },
};
