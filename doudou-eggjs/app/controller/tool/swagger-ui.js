/*
 * @Description: Swagger UI 页面（豆豆前端「系统接口」菜单通常指向 /swagger-ui/index.html）
 * @Author: AI Assistant
 * @Date: 2025-02-02
 */

const Controller = require('egg').Controller;
const { Route, HttpGet } = require('egg-decorator-router');

module.exports = (app) => {
  @Route('/swagger-ui')
  class SwaggerUIController extends Controller {
    /**
     * Swagger UI 页面（豆豆「系统接口」菜单入口）
     * GET /swagger-ui、GET /swagger-ui/、GET /swagger-ui/index.html
     */
    @HttpGet('/')
    @HttpGet('')
    @HttpGet('/index.html')
    async index() {
      const { ctx } = this;
      // 使用同路径下的 spec.json，避免跨路径 404（如前端代理只转发 /swagger-ui）
      const specUrl = `${ctx.request.protocol}://${ctx.request.host}/swagger-ui/spec.json`;
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
     * OpenAPI 规范（与 /tool/swagger/spec.json 同源，供本页加载）
     * GET /swagger-ui/spec.json
     */
    @HttpGet('/spec.json')
    async spec() {
      const { ctx, service } = this;
      const spec = await service.tool.swagger.getOpenApiSpec(ctx);
      ctx.type = 'application/json';
      ctx.body = spec;
    }
  }

  return SwaggerUIController;
};
