/*
 * @Description: 缓存监控服务层
 * @Author: 姜彦汐
 * @Date: 2025-11-21
 */

const Service = require("egg").Service;
const { CacheConstants } = require("../../constant");

class CacheService extends Service {
  /**
   * 获取缓存信息（Redis INFO、DBSIZE、COMMANDSTATS）
   * @return {object} 缓存信息
   */
  async getCacheInfo() {
    const { app } = this;

    try {
      // 使用专门的监控客户端获取 Redis 信息
      const redis = app.cache.default.store.getClient();

      // 获取 Redis INFO 信息
      const infoStr = await redis.info();
      const info = this.parseRedisInfo(infoStr);

      // 获取 DBSIZE（键数量）
      const dbSize = await redis.dbsize();

      // 获取 COMMANDSTATS 信息
      const commandStatsStr = await redis.info("commandstats");
      const commandStats = this.parseCommandStats(commandStatsStr);

      return {
        info,
        dbSize,
        commandStats,
      };
    } catch (err) {
      this.ctx.logger.error("获取 Redis 信息失败：", err);
      throw err;
    }
  }

  /**
   * 解析 Redis INFO 信息
   * @param {string} infoStr - INFO 命令返回的字符串
   * @return {object} 解析后的信息对象
   */
  parseRedisInfo(infoStr) {
    const info = {};
    const lines = infoStr.split("\r\n");

    lines.forEach((line) => {
      // 跳过注释和空行
      if (line && !line.startsWith("#")) {
        const [key, value] = line.split(":");
        if (key && value !== undefined) {
          info[key] = value;
        }
      }
    });

    return info;
  }

  /**
   * 解析 Redis COMMANDSTATS 信息
   * @param {string} statsStr - COMMANDSTATS 信息字符串
   * @return {array} 命令统计数组
   */
  parseCommandStats(statsStr) {
    const commandStats = [];
    const lines = statsStr.split("\r\n");

    lines.forEach((line) => {
      // 匹配 cmdstat_xxx:calls=123,usec=456,usec_per_call=3.80
      if (line.startsWith("cmdstat_")) {
        const [cmdKey, statsValue] = line.split(":");
        const cmdName = cmdKey.replace("cmdstat_", "");

        // 提取 calls 值
        const callsMatch = statsValue.match(/calls=(\d+)/);
        if (callsMatch) {
          commandStats.push({
            name: cmdName,
            value: callsMatch[1],
          });
        }
      }
    });

    return commandStats;
  }

  /**
   * 获取缓存名称列表
   * @return {array} 缓存名称列表
   */
  getCacheNames() {
    return [
      { cacheName: CacheConstants.LOGIN_TOKEN_KEY, remark: "用户信息" },
      { cacheName: CacheConstants.SYS_CONFIG_KEY, remark: "配置信息" },
      { cacheName: CacheConstants.SYS_DICT_KEY, remark: "数据字典" },
      { cacheName: CacheConstants.CAPTCHA_CODE_KEY, remark: "验证码" },
      { cacheName: CacheConstants.REPEAT_SUBMIT_KEY, remark: "防重提交" },
      { cacheName: CacheConstants.RATE_LIMIT_KEY, remark: "限流处理" },
      { cacheName: CacheConstants.PWD_ERR_CNT_KEY, remark: "密码错误次数" },
    ];
  }

  /**
   * 获取缓存键名列表
   * @param {string} cacheName - 缓存名称（前缀）
   * @return {array} 缓存键名列表
   */
  async getCacheKeys(cacheName) {
    const { app } = this;

    try {
      // 查询指定前缀的所有键
      const pattern = cacheName.endsWith("*") ? cacheName : `${cacheName}*`;
      const keys = await app.cache.default.keys(pattern);

      // 排序并去重
      return Array.from(new Set(keys)).sort();
    } catch (err) {
      this.ctx.logger.error("获取缓存键名列表失败：", err);
      throw err;
    }
  }

  /**
   * 获取缓存值
   * @param {string} cacheName - 缓存名称
   * @param {string} cacheKey - 缓存键名
   * @return {object} 缓存信息
   */
  async getCacheValue(cacheName, cacheKey) {
    const { app } = this;

    try {
      // 获取缓存值
      const cacheValue = await app.cache.default.get(cacheKey);

      // 如果是对象，转换为 JSON 字符串
      let displayValue = "";
      if (cacheValue !== null && cacheValue !== undefined) {
        displayValue =
          typeof cacheValue === "object"
            ? JSON.stringify(cacheValue)
            : cacheValue;
      }

      return {
        cacheName,
        cacheKey,
        cacheValue: displayValue,
      };
    } catch (err) {
      this.ctx.logger.error("获取缓存值失败：", err);
      throw err;
    }
  }

  /**
   * 清空指定缓存名称（删除匹配前缀的所有键）
   * @param {string} cacheName - 缓存名称（前缀）
   */
  async clearCacheName(cacheName) {
    const { app } = this;

    try {
      // 查询指定前缀的所有键
      const pattern = cacheName.endsWith("*") ? cacheName : `${cacheName}*`;
      const keys = await app.cache.default.keys(pattern);

      // 逐个删除
      if (keys && keys.length > 0) {
        for (const key of keys) {
          await app.cache.default.del(key);
        }
      }
    } catch (err) {
      this.ctx.logger.error("清空缓存名称失败：", err);
      throw err;
    }
  }

  /**
   * 清空指定缓存键
   * @param {string} cacheKey - 缓存键名
   */
  async clearCacheKey(cacheKey) {
    const { app } = this;

    try {
      // 删除指定键
      await app.cache.default.del(cacheKey);
    } catch (err) {
      this.ctx.logger.error("清空缓存键失败：", err);
      throw err;
    }
  }

  /**
   * 清空所有缓存
   */
  async clearCacheAll() {
    const { app } = this;

    try {
      // 获取所有键
      const keys = await app.cache.default.keys("*");

      // 逐个删除
      if (keys && keys.length > 0) {
        for (const key of keys) {
          await app.cache.default.del(key);
        }
      }
    } catch (err) {
      this.ctx.logger.error("清空所有缓存失败：", err);
      throw err;
    }
  }
}

module.exports = CacheService;
