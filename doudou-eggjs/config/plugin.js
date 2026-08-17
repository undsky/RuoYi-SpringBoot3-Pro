/*
 * @Author: 姜彦汐
 * @Date: 2023-12-22 20:01:21
 * @LastEditors: 姜彦汐
 * @LastEditTime: 2023-12-23 22:00:22
 * @Description:
 * @Site: https://www.undsky.com
 */
/** @type Egg.EggPlugin */
module.exports = {
  cache: {
    enable: true,
    package: "doudou-eggjs-cache",
  },
  cors: {
    enable: true,
    package: "egg-cors",
  },
  decoratorRouter: {
    enable: true,
    package: "egg-decorator-router",
  },
  jwt: {
    enable: true,
    package: "egg-jwt",
  },
  mybatis: {
    enable: true,
    package: "doudou-eggjs-mybatis",
  },
  mysql: {
    enable: true,
    package: "doudou-eggjs-mysql",
  },
  sqlite: {
    enable: true,
    package: "doudou-eggjs-sqlite",
  },
  pgsql: {
    enable: true,
    package: "doudou-eggjs-pgsql",
  },
  ratelimiter: {
    enable: true,
    package: "doudou-eggjs-ratelimiter",
  },
  static: {
    enable: true,
  },
  bull: {
    enable: true,
    package: "@hackycy/egg-bull",
  },
};
