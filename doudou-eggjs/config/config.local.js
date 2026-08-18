/*
 * @Author: 姜彦汐
 * @Date: 2023-12-22 20:01:21
 * @LastEditors: 姜彦汐
 * @LastEditTime: 2023-12-23 22:00:09
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

  // sqlite 配置
  config.sqlite = {
    clients: {
      doudou: {
        path: "./cache/doudou.db",
      },
    },
    // 启用驼峰命名转换
    camelCase: true,
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

  // pgsql 配置
  config.pgsql = {
    // 启用驼峰命名转换：数据库字段 user_name -> userName
    camelCase: true,
    clients: {
      doudou: {
        host: "127.0.0.1",
        port: 5432,
        user: "postgres",
        password: "jyx123",
        database: "doudou",
        options: "-c search_path=doudou,public",
      },
    },
  };

  const redis = {
    port: 6379,
    host: "127.0.0.1",
    password: "",
    db: 0,
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

  // 本地开发环境日志配置（只记录错误日志）
  config.logger = {
    level: "ERROR", // 只记录 ERROR 级别到文件
    consoleLevel: "INFO", // 控制台使用 INFO 级别
    disableConsoleAfterReady: false, // 保持控制台输出
  };

  return config;
};
