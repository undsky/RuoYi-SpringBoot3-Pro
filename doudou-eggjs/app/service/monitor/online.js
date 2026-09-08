/*
 * @Description: 在线用户服务层
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Service = require("egg").Service;
const { CacheConstants } = require("../../constant");

class OnlineService extends Service {
  /**
   * 历史缓存可能把完整 JWT 存在 tokenId。列表接口只回 jti，避免泄露。
   * @param {string} tokenId
   * @return {string}
   */
  normalizeTokenId(tokenId) {
    if (!tokenId || typeof tokenId !== "string") {
      return tokenId || "";
    }
    if (tokenId.split(".").length === 3) {
      try {
        const payload = this.app.jwt.decode(tokenId);
        if (payload && payload.jti) {
          return payload.jti;
        }
      } catch (err) {
        // 解码失败则原样返回，强退仍可按原值匹配缓存
      }
    }
    return tokenId;
  }

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

      userOnlineList.push({
        tokenId: this.normalizeTokenId(onlineUser.tokenId),
        userId: onlineUser.userId,
        userName: onlineUser.userName,
        deptName: onlineUser.deptName,
        ipaddr: onlineUser.ipaddr,
        loginTime: onlineUser.loginTime,
        expireTime: onlineUser.expireTime,
      });
    }

    // 按登录时间倒序排列
    userOnlineList.sort((a, b) => {
      return new Date(b.loginTime) - new Date(a.loginTime);
    });

    return userOnlineList;
  }

  /**
   * 强退用户
   * @param {string} tokenId - 会话标识（jti；兼容历史完整 JWT）
   * @return {boolean} 是否成功
   */
  async forceLogout(tokenId) {
    const { app } = this;

    if (!tokenId) {
      return true;
    }

    let jti = tokenId;
    if (typeof tokenId === "string" && tokenId.split(".").length === 3) {
      try {
        const jwtPayload = app.jwt.decode(tokenId);
        if (jwtPayload && jwtPayload.jti) {
          jti = jwtPayload.jti;
        }
      } catch (err) {
        // 非法 JWT 按原值处理
      }
    }

    await app.cache.default.set(jti, "revoked", {
      ttl: 7 * 24 * 60 * 60,
    });

    await app.cache.default.del(CacheConstants.LOGIN_TOKEN_KEY + jti);
    if (jti !== tokenId) {
      await app.cache.default.del(CacheConstants.LOGIN_TOKEN_KEY + tokenId);
    }

    const onlineKeys = await app.cache.default.keys(
      CacheConstants.LOGIN_TOKEN_KEY + "*"
    );

    for (const key of onlineKeys) {
      const onlineUser = await app.cache.default.get(key);
      if (!onlineUser) {
        continue;
      }
      const stored = this.normalizeTokenId(onlineUser.tokenId);
      if (onlineUser.tokenId === tokenId || stored === jti || stored === tokenId) {
        await app.cache.default.del(key);
        break;
      }
    }

    return true;
  }
}

module.exports = OnlineService;
