/*
 * @Description: 操作日志装饰器
 * @Author: AI Assistant
 * @Date: 2025-11-21
 */

const { BusinessType, OperatorType } = require('../constant');

/**
 * 操作日志装饰器 - 类似 Spring Boot 的 @Log
 * 
 * 用法示例：
 * @Log({ title: '用户管理', businessType: BusinessType.INSERT })
 * @Log({ title: '角色管理', businessType: BusinessType.UPDATE })
 * @Log({ title: '菜单管理', businessType: BusinessType.DELETE })
 * 
 * @param {object} options - 配置选项
 *   - title: 模块名称
 *   - businessType: 业务类型（BusinessType 枚举值）
 *   - operatorType: 操作人类别（OperatorType 枚举值）
 *   - isSaveRequestData: 是否保存请求参数（默认 true）
 *   - isSaveResponseData: 是否保存响应参数（默认 true）
 *   - excludeParamNames: 排除的请求参数名称数组
 */
function Log(options = {}) {
  const {
    title = '',
    businessType = BusinessType.OTHER,
    operatorType = OperatorType.MANAGE,
    isSaveRequestData = true,
    isSaveResponseData = true,
    excludeParamNames = []
  } = options;

  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const ctx = this.ctx;
      const startTime = Date.now();
      
      let operLog = {
        title,
        businessType,
        operatorType,
        method: `${ctx.request.path}`,
        requestMethod: ctx.method,
        operUrl: ctx.url,
        operIp: ctx.helper.getClientIP(ctx),
        operName: ctx.state.user ? ctx.state.user.userName : '',
        operParam: '',
        jsonResult: '',
        status: '0',
        errorMsg: '',
        costTime: 0
      };

      try {
        // 保存请求参数
        if (isSaveRequestData) {
          const requestData = getRequestData(ctx, excludeParamNames);
          operLog.operParam = requestData;
        }

        // 执行原方法
        const result = await originalMethod.apply(this, args);

        // 保存响应参数
        if (isSaveResponseData && ctx.body) {
          operLog.jsonResult = JSON.stringify(ctx.body).substring(0, 2000);
        }

        // 判断操作状态
        if (ctx.body && ctx.body.code) {
          operLog.status = ctx.body.code === 200 ? '0' : '1';
        }

        // 计算执行时间
        operLog.costTime = Date.now() - startTime;

        // 异步记录日志
        recordLog(ctx, operLog);

        return result;
      } catch (err) {
        // 记录错误信息
        operLog.status = '1';
        operLog.errorMsg = err.message || '操作失败';
        operLog.costTime = Date.now() - startTime;

        // 异步记录日志
        recordLog(ctx, operLog);

        // 继续抛出错误
        throw err;
      }
    };

    return descriptor;
  };
}

/**
 * 获取请求参数
 * @param {Context} ctx - Egg.js Context
 * @param {array} excludeParamNames - 排除的参数名称
 * @return {string} 请求参数 JSON 字符串
 */
function getRequestData(ctx, excludeParamNames = []) {
  try {
    let requestData = {};

    // 合并 query 和 body 参数
    requestData = {
      ...ctx.query,
      ...ctx.request.body,
      ...ctx.params
    };

    // 排除敏感参数
    const sensitiveFields = ['password', 'oldPassword', 'newPassword', 'confirmPassword', ...excludeParamNames];
    
    for (const field of sensitiveFields) {
      if (requestData[field]) {
        requestData[field] = '******';
      }
    }

    // 限制长度，避免超大参数
    const jsonStr = JSON.stringify(requestData);
    return jsonStr.length > 2000 ? jsonStr.substring(0, 2000) + '...' : jsonStr;
  } catch (err) {
    return '';
  }
}

/**
 * 异步记录操作日志
 * @param {Context} ctx - Egg.js Context
 * @param {object} operLog - 操作日志对象
 */
function recordLog(ctx, operLog) {
  // 使用 setImmediate 异步记录，不阻塞请求响应
  setImmediate(async () => {
    try {
      await ctx.service.monitor.operlog.recordOperLog(operLog);
    } catch (err) {
      ctx.logger.error('记录操作日志失败:', err);
    }
  });
}

/**
 * 业务类型常量导出（方便使用）
 */
module.exports = {
  Log,
  BusinessType,
  OperatorType
};
