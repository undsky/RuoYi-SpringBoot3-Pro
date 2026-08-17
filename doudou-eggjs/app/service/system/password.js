/*
 * @Description: 密码服务层 - 登录密码错误次数限制
 * @Author: AI Assistant
 * @Date: 2025-11-24
 */

const Service = require("egg").Service;
const { CacheConstants } = require("../../constant");

class PasswordService extends Service {
  /**
   * 获取缓存 Key
   * @param {string} userName - 用户名
   * @return {string} 缓存键
   */
  getCacheKey(userName) {
    return CacheConstants.PWD_ERR_CNT_KEY + userName;
  }

  /**
   * 验证用户登录密码
   * @param {object} user - 用户信息
   * @param {string} password - 输入的密码
   * @throws {Error} 密码错误次数超限或密码不匹配
   */
  async validate(user, password) {
    const { app, ctx } = this;
    const { maxRetryCount, lockTime } = app.config.user.password;
    const userName = user.userName;

    // 1. 获取当前错误次数
    const cacheKey = this.getCacheKey(userName);
    let retryCount = await app.cache.default.get(cacheKey);

    if (retryCount === null || retryCount === undefined) {
      retryCount = 0;
    }

    // 2. 检查是否超过最大错误次数
    if (retryCount >= maxRetryCount) {
      throw new Error(
        `密码输入错误${maxRetryCount}次，账户锁定${lockTime}分钟`
      );
    }

    // 3. 验证密码
    const security = ctx.helper.security;
    const isMatch = await security.comparePassword(password, user.password);

    if (!isMatch) {
      // 密码错误，增加错误次数
      retryCount = retryCount + 1;
      await app.cache.default.set(cacheKey, retryCount, {
        ttl: lockTime * 60, // 转换为秒
      });
      throw new Error(`用户不存在或密码错误`);
    } else {
      // 密码正确，清除错误记录
      await this.clearLoginRecordCache(userName);
    }
  }

  /**
   * 密码匹配验证
   * @param {object} user - 用户信息
   * @param {string} rawPassword - 原始密码
   * @return {boolean} 是否匹配
   */
  async matches(user, rawPassword) {
    const { ctx } = this;
    const security = ctx.helper.security;
    return await security.comparePassword(rawPassword, user.password);
  }

  /**
   * 清除登录记录缓存
   * @param {string} userName - 用户名
   */
  async clearLoginRecordCache(userName) {
    const { app } = this;
    const cacheKey = this.getCacheKey(userName);
    
    // 检查缓存是否存在
    const exists = await app.cache.default.get(cacheKey);
    if (exists !== null && exists !== undefined) {
      await app.cache.default.del(cacheKey);
    }
  }

  /**
   * 记录登录失败
   * @param {string} userName - 用户名
   */
  async recordLoginFail(userName) {
    const { app } = this;
    const { maxRetryCount, lockTime } = app.config.user.password;
    const cacheKey = this.getCacheKey(userName);

    // 获取当前错误次数
    let retryCount = await app.cache.default.get(cacheKey);
    if (retryCount === null || retryCount === undefined) {
      retryCount = 0;
    }

    // 增加错误次数
    retryCount = retryCount + 1;
    await app.cache.default.set(cacheKey, retryCount, {
      ttl: lockTime * 60, // 转换为秒
    });

    return {
      retryCount,
      maxRetryCount,
      lockTime,
    };
  }

  /**
   * 获取剩余重试次数
   * @param {string} userName - 用户名
   * @return {number} 剩余次数
   */
  async getRemainingRetries(userName) {
    const { app } = this;
    const { maxRetryCount } = app.config.user.password;
    const cacheKey = this.getCacheKey(userName);

    let retryCount = await app.cache.default.get(cacheKey);
    if (retryCount === null || retryCount === undefined) {
      retryCount = 0;
    }

    return Math.max(0, maxRetryCount - retryCount);
  }
}

module.exports = PasswordService;
