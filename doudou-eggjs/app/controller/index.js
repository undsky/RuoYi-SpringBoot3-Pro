/*
 * @Author: 姜彦汐
 * @Date: 2023-12-22 20:01:21
 * @LastEditors: 姜彦汐
 * @LastEditTime: 2023-12-23 21:34:08
 * @Description:
 * @Site: https://www.undsky.com
 */
const Controller = require("egg").Controller;
const dayjs = require("dayjs");
const { nanoid } = require("nanoid");

const {
  Route,
  HttpGet,
  HttpPost,
  HttpAll,
  Middleware,
} = require("egg-decorator-router");

module.exports = (app) => {
  const { secret, expiresIn } = app.config.jwt;

  @Route("")
  class IndexController extends Controller {
    @HttpAll("/version")
    async version() {
      const { ctx, service } = this;

      ctx.body = {
        ip: ctx.request.ip,
        version: "1.0.0",
      };
    }
  }

  return IndexController;
};
