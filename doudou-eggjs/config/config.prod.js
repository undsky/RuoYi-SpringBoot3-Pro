/*
 * @Author: 姜彦汐
 * @Date: 2023-12-22 20:01:21
 * @LastEditors: 姜彦汐
 * @LastEditTime: 2023-12-23 22:00:16
 * @Description:
 * @Site: https://www.undsky.com
 */
/* eslint valid-jsdoc: "off" */

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = (appInfo) => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  // https://eggjs.org/zh-cn/tutorials/proxy.html
  config.proxy = true;
  config.ipHeaders = "X-Real-Ip, X-Forwarded-For";
  config.maxIpsCount = 1;

  config.security = {
    domainWhiteList: ["*.undsky.com"],
    xframe: {
      ignore: [],
    },
  };

  config.mysql = {
    // 启用驼峰命名转换：数据库字段 user_name -> userName
    camelCase: true,
    clients: {
      doudou: {
        host: "127.0.0.1",
        user: "root",
        password: "jyx123",
        database: "doudou",
      },
    },
  };

  const redis = {
    port: 6379,
    host: "127.0.0.1",
    password: "",
    db: 7,
  };

  config.cache = { redis };

  config.ratelimiter = { redis };

  // egg-bull 配置
  config.bull = {
    client: redis,
    // 默认队列配置
    default: {
      // 任务失败后重试次数
      attempts: 3,
      // 失败后延迟重试时间（毫秒）
      backoff: {
        type: "fixed",
        delay: 5000,
      },
      // 移除已完成的任务
      removeOnComplete: true,
      // 移除已失败的任务（保留最近100个）
      removeOnFail: 100,
    },
  };

  // 生产环境日志配置
  config.logger = {
    level: "ERROR", // 改为 ERROR 级别，减少日志量（只记录错误）
    consoleLevel: "NONE", // 禁用控制台日志输出
    disableConsoleAfterReady: true,
  };

  return config;
};
