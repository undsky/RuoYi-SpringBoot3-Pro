/**
 * 定时任务
 * @Author: 姜彦汐
 * @Date: 2025-11-08
 */

const { Service } = require('egg');

class RyTask extends Service {
  /**
   * 无参数任务
   */
  async ryNoParams() {
    const { ctx } = this;
    ctx.logger.info('执行无参方法');
    
    return {
      success: true,
      message: '执行无参方法成功'
    };
  }

  /**
   * 单参数任务
   * @param {string} params - 参数
   */
  async ryParams(params) {
    const { ctx } = this;
    ctx.logger.info(`执行有参方法：${params}`);
    
    return {
      success: true,
      message: `执行有参方法成功，参数: ${params}`
    };
  }

  /**
   * 多参数任务
   * @param {string} s - 字符串参数
   * @param {boolean} b - 布尔参数
   * @param {number} l - 长整型参数
   * @param {number} d - 浮点型参数
   * @param {number} i - 整型参数
   */
  async ryMultipleParams(s, b, l, d, i) {
    const { ctx } = this;
    ctx.logger.info(
      `执行多参方法： 字符串类型${s}，布尔类型${b}，长整型${l}，浮点型${d}，整形${i}`
    );
    
    return {
      success: true,
      message: `执行多参方法成功`,
      params: { s, b, l, d, i }
    };
  }

  /**
   * 执行指定的任务方法
   * @param {string} invokeTarget - 调用目标字符串，格式：ryTask.methodName 或 ryTask.methodName(params)
   */
  async execute(invokeTarget) {
    const { ctx } = this;
    
    try {
      // 解析调用目标字符串
      const result = this.parseInvokeTarget(invokeTarget);
      
      if (!result) {
        throw new Error(`无效的调用目标: ${invokeTarget}`);
      }

      const { className, methodName, params } = result;
      
      // 检查类名是否匹配
      if (className !== 'ryTask') {
        throw new Error(`不支持的任务类: ${className}`);
      }

      // 检查方法是否存在
      if (typeof this[methodName] !== 'function') {
        throw new Error(`方法不存在: ${methodName}`);
      }

      // 执行任务方法
      const executeResult = await this[methodName](...params);
      
      return executeResult;
    } catch (err) {
      ctx.logger.error('执行任务失败:', err);
      throw err;
    }
  }

  /**
   * 解析调用目标字符串
   * @param {string} invokeTarget - 调用目标字符串
   * @return {object|null} 解析结果 {className, methodName, params}
   */
  parseInvokeTarget(invokeTarget) {
    try {
      // 匹配格式：className.methodName 或 className.methodName(params)
      const match = invokeTarget.match(/^(\w+)\.(\w+)(\((.*)\))?$/);
      
      if (!match) {
        return null;
      }

      const className = match[1];
      const methodName = match[2];
      const paramsStr = match[4];
      
      // 解析参数
      let params = [];
      if (paramsStr) {
        // 简单的参数解析（支持字符串、数字、布尔值）
        params = paramsStr.split(',').map(p => {
          p = p.trim();
          
          // 字符串参数（去除引号）
          if (/^['"].*['"]$/.test(p)) {
            return p.slice(1, -1);
          }
          
          // 布尔值
          if (p === 'true') return true;
          if (p === 'false') return false;
          
          // 数字（包括小数和长整型）
          if (/^-?\d+(\.\d+)?[LD]?$/.test(p)) {
            return parseFloat(p.replace(/[LD]$/, ''));
          }
          
          return p;
        });
      }

      return { className, methodName, params };
    } catch (err) {
      return null;
    }
  }
}

module.exports = RyTask;

