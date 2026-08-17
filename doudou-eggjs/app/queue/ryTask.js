/**
 * 豆豆定时任务队列处理器
 * @Author: 姜彦汐
 * @Date: 2025-11-21
 * 
 * 使用 egg-bull 实现动态定时任务
 * 文档: https://github.com/hackycy/egg-bull
 */

const Queue = require('bull');

module.exports = app => {
  // 从配置中获取 Redis 连接信息
  const { client } = app.config.bull;
  
  // 创建 Bull Queue 实例
  const queue = new Queue('ryTask', {
    redis: {
      port: client.port,
      host: client.host,
      password: client.password,
      db: client.db,
    },
  });

  // 配置任务处理器
  queue.process(async (job) => {
    const ctx = app.createAnonymousContext();
    const { invokeTarget, jobInfo } = job.data;
    
    const startTime = Date.now();
    let status = '0'; // 0-成功 1-失败
    let jobMessage = '';
    let exceptionInfo = '';

    try {
      ctx.logger.info(`[Bull] 开始执行任务: ${jobInfo.jobName} (${invokeTarget})`);
      
      // 调用 ryTask 服务执行任务
      const result = await ctx.service.ryTask.execute(invokeTarget);
      
      jobMessage = result.message || '任务执行成功';
      ctx.logger.info(`[Bull] 任务执行成功: ${jobInfo.jobName}`);
    } catch (err) {
      status = '1';
      jobMessage = '任务执行失败';
      exceptionInfo = err.message || err.toString();
      
      ctx.logger.error(`[Bull] 任务执行失败: ${jobInfo.jobName}`, err);
      throw err; // 抛出错误，让 Bull 记录失败
    } finally {
      const stopTime = Date.now();
      const duration = stopTime - startTime;
      
      // 记录任务执行日志
      try {
        await ctx.service.monitor.jobLog.insertJobLog({
          jobName: jobInfo.jobName,
          jobGroup: jobInfo.jobGroup,
          invokeTarget: invokeTarget,
          jobMessage: `${jobMessage} (耗时: ${duration}ms)`,
          status,
          exceptionInfo: exceptionInfo.substring(0, 2000),
          createTime: ctx.helper.formatDate(new Date(startTime)),
        });
      } catch (logErr) {
        ctx.logger.error('[Bull] 记录任务日志失败:', logErr);
      }
    }
  });

  // 监听任务完成事件
  queue.on('completed', (job, result) => {
    const ctx = app.createAnonymousContext();
    ctx.logger.info(`[Bull] 任务完成: ${job.data.jobInfo.jobName}`);
  });

  // 监听任务失败事件
  queue.on('failed', (job, err) => {
    const ctx = app.createAnonymousContext();
    ctx.logger.error(`[Bull] 任务失败: ${job.data.jobInfo.jobName}`, err);
  });

  // 监听任务进度事件
  queue.on('progress', (job, progress) => {
    const ctx = app.createAnonymousContext();
    ctx.logger.info(`[Bull] 任务进度: ${job.data.jobInfo.jobName} - ${progress}%`);
  });

  // 返回 Bull Queue 实例
  return queue;
};
