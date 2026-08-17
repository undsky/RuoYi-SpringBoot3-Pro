/*
 * @Author: 姜彦汐
 * @Date: 2023-12-22 20:01:21
 * @LastEditors: 姜彦汐
 * @LastEditTime: 2023-12-23 21:59:26
 * @Description:
 * @Site: https://www.undsky.com
 */
module.exports = (options, app) => {
  return async function formatBody(ctx, next) {
    await next();

    if (ctx.response.type && "application/json" != ctx.response.type) return;

    // OpenAPI spec 需返回原始 JSON，不包装为 { code, msg, data }
    if (ctx.path === "/tool/swagger/spec.json" || ctx.path === "/swagger-ui/spec.json") return;

    if (ctx.body) {
      if (!ctx.body.code) {
        ctx.body = {
          code: ctx.status,
          msg: "",
          data: ctx.body,
        };
      }
    } else {
      ctx.body = {
        code: ctx._matchedRoute ? 200 : ctx.status,
        msg: "",
        data: null,
      };
    }
  };
};
