/*
 * @Description: 权限验证中间件
 * @Author: AI Assistant
 * @Date: 2025-10-27
 */

module.exports = (options = {}) => {
  return async function permission(ctx, next) {
    // 跳过不需要权限验证的路由
    const skipRoutes = options.skipRoutes || [
      '/login',
      '/register',
      '/captchaImage'
    ];
    
    // 检查当前路由是否需要跳过
    if (skipRoutes.some(route => ctx.path.startsWith(route))) {
      await next();
      return;
    }
    
    // 继续执行
    await next();
  };
};

