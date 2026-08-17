/*
 * @Description: Swagger API 文档控制器
 * @Author: AI Assistant
 * @Date: 2025-02-02
 */

const Controller = require('egg').Controller;
const { Route, HttpGet } = require('egg-decorator-router');

module.exports = (app) => {
  @Route('/tool/swagger')
  class SwaggerController extends Controller {
    /**
     * Swagger UI 页面
     * GET /tool/swagger 或 GET /tool/swagger/
     */
    @HttpGet('/')
    @HttpGet('')
    async index() {
      const { ctx } = this;
      const basePath = ctx.app.config.apiPrefix || '';
      const specUrl = `${basePath}/tool/swagger/spec.json`;

      ctx.type = 'html';
      ctx.body = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DouDou-EggJS API 文档</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
    }

    /**
     * OpenAPI 3.0 规范（JSON）- 优先从 egg-decorator-router 的 state.routes 收集系统接口
     * GET /tool/swagger/spec.json
     */
    @HttpGet('/spec.json')
    async spec() {
      const { ctx, service } = this;
      const spec = await service.tool.swagger.getOpenApiSpec(ctx);
      ctx.type = 'application/json';
      ctx.body = spec;
    }
  }

  return SwaggerController;
};
