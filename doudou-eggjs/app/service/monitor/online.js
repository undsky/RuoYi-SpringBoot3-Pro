/*
 * @Description: 在线用户服务层
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Service = require("egg").Service;
const { CacheConstants } = require("../../constant");

class OnlineService extends Service {
  /**
   * 查询在线用户列表
   * @param {object} params - 查询参数
   * @return {array} 在线用户列表
   */
  async selectOnlineList(params = {}) {
    const { app } = this;

    // 获取所有在线用户缓存键
    const keys = await app.cache.default.keys(
      CacheConstants.LOGIN_TOKEN_KEY + "*"
    );

    const userOnlineList = [];

    for (const key of keys) {
      let onlineUser;
      try {
        onlineUser = await app.cache.default.get(key);
      } catch (error) {
        continue;
      }

      if (!onlineUser) {
        continue;
      }

      // 过滤条件
      if (params.ipaddr && !onlineUser.ipaddr.includes(params.ipaddr)) {
        continue;
      }

      if (params.userName && !onlineUser.userName.includes(params.userName)) {
        continue;
      }

      userOnlineList.push(onlineUser);
    }

    // 按登录时间倒序排列
    userOnlineList.sort((a, b) => {
      return new Date(b.loginTime) - new Date(a.loginTime);
    });

    return userOnlineList;
  }

  /**
   * 强退用户
   * @param {string} tokenId - Token ID (从 URL 参数中获取，已经是纯 token，不包含前缀)
   * @return {boolean} 是否成功
   */
  async forceLogout(tokenId) {
    const { app } = this;

    // 删除登录 Token 缓存（这是主要逻辑）
    const loginTokenKey = CacheConstants.LOGIN_TOKEN_KEY + tokenId;
    await app.cache.default.del(loginTokenKey);

    // 将 Token 加入黑名单，防止 Token 再次使用
    // 对应 JWT 配置中的 isRevoked 检查
    const jwtPayload = app.jwt.decode(tokenId);
    if (jwtPayload && jwtPayload.jti) {
      await app.cache.default.set(jwtPayload.jti, "revoked", {
        ttl: 7 * 24 * 60 * 60,
      });
    }

    // 删除在线用户信息
    // 通过 tokenId 反查 userId
    const onlineKeys = await app.cache.default.keys(
      CacheConstants.LOGIN_TOKEN_KEY + "*"
    );

    for (const key of onlineKeys) {
      const onlineUser = await app.cache.default.get(key);

      if (onlineUser && onlineUser.tokenId === tokenId) {
        await app.cache.default.del(key);
        break;
      }
    }

    return true;
  }
}

module.exports = OnlineService;
