/**
 * 定时任务调度工具类
 * @Author: 姜彦汐
 * @Date: 2025-11-08
 */

const schedule = require('node-schedule');
const CronUtils = require('./cronUtils');

class ScheduleUtils {
  constructor() {
    // 存储所有的定时任务
    this.jobs = new Map();
  }

  /**
   * 创建定时任务
   * @param {object} jobConfig - 任务配置
   * @param {number} jobConfig.jobId - 任务 ID
   * @param {string} jobConfig.jobName - 任务名称
   * @param {string} jobConfig.jobGroup - 任务组名
   * @param {string} jobConfig.cronExpression - cron 表达式
   * @param {string} jobConfig.invokeTarget - 调用目标字符串
   * @param {string} jobConfig.concurrent - 是否并发执行 (0允许 1禁止)
   * @param {function} callback - 任务执行回调
   * @return {boolean} 是否创建成功
   */
  createJob(jobConfig, callback) {
    try {
      const { jobId, jobGroup, cronExpression, concurrent } = jobConfig;
      const jobKey = this.getJobKey(jobId, jobGroup);

      // 如果任务已存在，先删除
      if (this.jobs.has(jobKey)) {
        this.deleteJob(jobId, jobGroup);
      }

      // 验证 cron 表达式
      if (!CronUtils.isValid(cronExpression)) {
        throw new Error(`无效的 Cron 表达式: ${cronExpression}`);
      }

      // 创建定时任务
      const job = schedule.scheduleJob(cronExpression, async () => {
        // 如果禁止并发执行，检查是否正在执行
        if (concurrent === '1') {
          const runningKey = `${jobKey}_running`;
          if (this.jobs.get(runningKey)) {
            console.log(`任务 ${jobKey} 正在执行，跳过本次调度`);
            return;
          }
          this.jobs.set(runningKey, true);
        }

        try {
          await callback(jobConfig);
        } finally {
          // 执行完成后清除运行标记
          if (concurrent === '1') {
            const runningKey = `${jobKey}_running`;
            this.jobs.delete(runningKey);
          }
        }
      });

      // 存储任务实例
      this.jobs.set(jobKey, job);
      
      return true;
    } catch (err) {
      console.error('创建定时任务失败:', err);
      return false;
    }
  }

  /**
   * 立即执行任务一次
   * @param {number} jobId - 任务 ID
   * @param {string} jobGroup - 任务组名
   * @param {object} jobConfig - 任务配置
   * @param {function} callback - 任务执行回调
   * @return {boolean} 是否存在并执行
   */
  async runJobNow(jobId, jobGroup, jobConfig, callback) {
    try {
      const jobKey = this.getJobKey(jobId, jobGroup);
      
      // 检查任务是否存在
      if (!this.jobs.has(jobKey)) {
        return false;
      }

      // 立即执行任务
      await callback(jobConfig);
      
      return true;
    } catch (err) {
      console.error('立即执行任务失败:', err);
      return false;
    }
  }

  /**
   * 暂停任务
   * @param {number} jobId - 任务 ID
   * @param {string} jobGroup - 任务组名
   * @return {boolean} 是否成功
   */
  pauseJob(jobId, jobGroup) {
    try {
      const jobKey = this.getJobKey(jobId, jobGroup);
      const job = this.jobs.get(jobKey);
      
      if (!job) {
        return false;
      }

      // node-schedule 的 cancel 方法会停止任务
      job.cancel();
      
      return true;
    } catch (err) {
      console.error('暂停任务失败:', err);
      return false;
    }
  }

  /**
   * 恢复任务
   * @param {object} jobConfig - 任务配置
   * @param {function} callback - 任务执行回调
   * @return {boolean} 是否成功
   */
  resumeJob(jobConfig, callback) {
    try {
      // 恢复任务实际上是重新创建任务
      return this.createJob(jobConfig, callback);
    } catch (err) {
      console.error('恢复任务失败:', err);
      return false;
    }
  }

  /**
   * 删除任务
   * @param {number} jobId - 任务 ID
   * @param {string} jobGroup - 任务组名
   * @return {boolean} 是否成功
   */
  deleteJob(jobId, jobGroup) {
    try {
      const jobKey = this.getJobKey(jobId, jobGroup);
      const job = this.jobs.get(jobKey);
      
      if (!job) {
        return false;
      }

      // 取消任务
      job.cancel();
      
      // 从 Map 中删除
      this.jobs.delete(jobKey);
      
      return true;
    } catch (err) {
      console.error('删除任务失败:', err);
      return false;
    }
  }

  /**
   * 更新任务
   * @param {object} jobConfig - 任务配置
   * @param {function} callback - 任务执行回调
   * @return {boolean} 是否成功
   */
  updateJob(jobConfig, callback) {
    try {
      const { jobId, jobGroup } = jobConfig;
      
      // 删除旧任务
      this.deleteJob(jobId, jobGroup);
      
      // 创建新任务
      return this.createJob(jobConfig, callback);
    } catch (err) {
      console.error('更新任务失败:', err);
      return false;
    }
  }

  /**
   * 检查任务是否存在
   * @param {number} jobId - 任务 ID
   * @param {string} jobGroup - 任务组名
   * @return {boolean} 是否存在
   */
  hasJob(jobId, jobGroup) {
    const jobKey = this.getJobKey(jobId, jobGroup);
    return this.jobs.has(jobKey);
  }

  /**
   * 获取任务键名
   * @param {number} jobId - 任务 ID
   * @param {string} jobGroup - 任务组名
   * @return {string} 任务键名
   */
  getJobKey(jobId, jobGroup) {
    return `${jobGroup}_${jobId}`;
  }

  /**
   * 清空所有任务
   */
  clear() {
    this.jobs.forEach((job, key) => {
      if (!key.endsWith('_running')) {
        job.cancel();
      }
    });
    this.jobs.clear();
  }

  /**
   * 获取所有任务的状态
   * @return {Array} 任务状态列表
   */
  getAllJobsStatus() {
    const status = [];
    
    this.jobs.forEach((job, key) => {
      if (!key.endsWith('_running')) {
        status.push({
          jobKey: key,
          nextInvocation: job.nextInvocation()
        });
      }
    });
    
    return status;
  }

  /**
   * 白名单校验 - 检查调用目标是否在白名单内
   * @param {string} invokeTarget - 调用目标字符串
   * @return {boolean} 是否在白名单内
   */
  static whiteList(invokeTarget) {
    // 定义白名单规则
    // 只允许调用特定的类和方法
    const whiteListPatterns = [
      /^ryTask\./,           // 允许 ryTask 类的方法
      /^systemTask\./,       // 允许 systemTask 类的方法
      // 可以添加更多白名单规则
    ];

    return whiteListPatterns.some(pattern => pattern.test(invokeTarget));
  }
}

// 导出单例
module.exports = new ScheduleUtils();

