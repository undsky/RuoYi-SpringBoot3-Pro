/*
 * @Description: Swagger OpenAPI 规范生成服务（供 /tool/swagger 与 /swagger-ui 共用）
 * @Author: AI Assistant
 * @Date: 2025-02-02
 */

const Service = require('egg').Service;

class SwaggerService extends Service {
  /**
   * 生成 OpenAPI 3.0 规范 JSON
   * @param {object} ctx - 上下文
   * @return {object} OpenAPI spec
   */
  async getOpenApiSpec(ctx) {
    const host = ctx.request.host;
    const protocol = ctx.request.protocol;
    const basePath = ctx.app.config.apiPrefix || '';

    const paths = {};
    const skipPrefixes = [ '/public', '/tool/swagger', '/swagger-ui', '/favicon' ];
    const httpMethods = [ 'get', 'post', 'put', 'patch', 'delete', 'head', 'options' ];

    const addPathOperation = (path, method, summary, tag) => {
      if (!httpMethods.includes(method)) return;
      if (!paths[path]) paths[path] = {};
      paths[path][method] = {
        summary: summary || `${method.toUpperCase()} ${path}`,
        tags: [ tag || path.split('/').filter(Boolean).slice(0, 2).join('/') || 'api' ],
        responses: { 200: { description: 'OK' } },
      };
      if ([ 'post', 'put', 'patch' ].includes(method)) {
        paths[path][method].requestBody = {
          content: { 'application/json': { schema: { type: 'object' } } },
        };
      }
      if (path !== '/login' && path !== '/register' && path !== '/captchaImage') {
        paths[path][method].security = [ { bearerAuth: [] } ];
      }
    };

    try {
      const decoratorState = require('egg-decorator-router/lib/state');
      const routes = decoratorState.routes || {};
      for (const key of Object.keys(routes)) {
        const item = routes[key];
        const fullpath = item.route && item.route[1];
        const method = (item.method || '').toLowerCase();
        if (!fullpath || typeof fullpath !== 'string') continue;
        if (skipPrefixes.some(p => fullpath.startsWith(p))) continue;
        addPathOperation(fullpath, method, `${method.toUpperCase()} ${fullpath}`, fullpath.split('/').filter(Boolean).slice(0, 2).join('/') || 'api');
      }
    } catch (e) {
      ctx.app.coreLogger.warn('[swagger] decorator state.routes not available:', e.message);
    }

    if (Object.keys(paths).length === 0 && ctx.app.router && ctx.app.router.stack) {
      for (const layer of ctx.app.router.stack) {
        let path = layer.path;
        if (path && typeof path !== 'string') path = path.toString();
        if (!path || skipPrefixes.some(p => path.startsWith(p))) continue;
        let methods = layer.methods;
        if (methods && typeof methods === 'object' && !Array.isArray(methods)) {
          methods = Object.keys(methods).filter(m => m !== '_matchedLayer' && m !== 'HEAD');
        }
        methods = methods || [];
        for (const m of methods) {
          const method = String(m).toLowerCase();
          addPathOperation(path, method, `${method.toUpperCase()} ${path}`, path.split('/').filter(Boolean).slice(0, 2).join('/') || 'api');
        }
      }
    }

    return {
      openapi: '3.0.0',
      info: {
        title: 'DouDou-EggJS API',
        description: '豆豆 Egg.js 后端接口文档（系统接口列表由路由自动生成）',
        version: '1.0.0',
      },
      servers: [
        { url: `${protocol}://${host}${basePath}`, description: '当前服务' },
      ],
      paths,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    };
  }
}

module.exports = SwaggerService;
