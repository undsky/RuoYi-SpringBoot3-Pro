/**
 * Cron 表达式工具类
 * @Author: 姜彦汐
 * @Date: 2025-11-08
 */

const parser = require('cron-parser');

class CronUtils {
  /**
   * 验证 cron 表达式是否有效
   * @param {string} cronExpression - cron 表达式
   * @return {boolean} 是否有效
   */
  static isValid(cronExpression) {
    if (!cronExpression || typeof cronExpression !== 'string') {
      return false;
    }

    try {
      // 尝试解析 cron 表达式
      parser.parseExpression(cronExpression);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * 获取 cron 表达式的下次执行时间
   * @param {string} cronExpression - cron 表达式
   * @return {Date|null} 下次执行时间
   */
  static getNextExecution(cronExpression) {
    try {
      const interval = parser.parseExpression(cronExpression);
      return interval.next().toDate();
    } catch (err) {
      return null;
    }
  }

  /**
   * 获取 cron 表达式的未来 N 次执行时间
   * @param {string} cronExpression - cron 表达式
   * @param {number} count - 获取次数，默认 5
   * @return {Array<Date>} 执行时间列表
   */
  static getNextExecutions(cronExpression, count = 5) {
    try {
      const interval = parser.parseExpression(cronExpression);
      const executions = [];
      
      for (let i = 0; i < count; i++) {
        executions.push(interval.next().toDate());
      }
      
      return executions;
    } catch (err) {
      return [];
    }
  }

  /**
   * 格式化 cron 表达式描述
   * @param {string} cronExpression - cron 表达式
   * @return {string} 表达式描述
   */
  static describe(cronExpression) {
    try {
      const interval = parser.parseExpression(cronExpression);
      const next = interval.next().toDate();
      return `下次执行时间: ${next.toLocaleString('zh-CN')}`;
    } catch (err) {
      return '无效的 Cron 表达式';
    }
  }

  /**
   * 常用的 cron 表达式示例
   */
  static get EXAMPLES() {
    return {
      EVERY_SECOND: '* * * * * *',           // 每秒执行
      EVERY_MINUTE: '0 * * * * *',           // 每分钟执行
      EVERY_HOUR: '0 0 * * * *',             // 每小时执行
      EVERY_DAY: '0 0 0 * * *',              // 每天 0 点执行
      EVERY_WEEK: '0 0 0 * * 0',             // 每周日 0 点执行
      EVERY_MONTH: '0 0 0 1 * *',            // 每月 1 号 0 点执行
      WORKDAY_MORNING: '0 0 9 * * 1-5',      // 工作日早上 9 点
      WORKDAY_EVENING: '0 0 18 * * 1-5',     // 工作日晚上 6 点
    };
  }
}

module.exports = CronUtils;

