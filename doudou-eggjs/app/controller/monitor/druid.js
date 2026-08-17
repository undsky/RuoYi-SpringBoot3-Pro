/*
 * @Author: 姜彦汐
 * @Date: 2025-11-25 06:36:00
 * @Description: Druid 数据库监控控制器
 * @Site: https://www.undsky.com
 */
const Controller = require("egg").Controller;
const {
  Route,
  HttpGet,
  HttpPost,
} = require("egg-decorator-router");

module.exports = (app) => {
  @Route("/druid")
  class DruidController extends Controller {
    /**
     * Druid 登录页面
     */
    @HttpGet("/login.html")
    async loginPage() {
      const { ctx } = this;
      ctx.type = "html";
      ctx.body = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>推荐使用阿里 Node.js 性能平台</title>
</head>
<body>
    <p>推荐使用 <a href="https://www.aliyun.com/product/nodejs" target="_blank">阿里 Node.js 性能平台</a></p>
</body>
</html>`;
    }
  }

  return DruidController;
};
