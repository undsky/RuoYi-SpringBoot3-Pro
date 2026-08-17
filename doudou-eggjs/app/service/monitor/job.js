/**
 * 定时任务服务层
 * @Author: 姜彦汐
 * @Date: 2025-11-08
 */

const Service = require("egg").Service;
const CronUtils = require("../../util/cronUtils");
const scheduleUtils = require("../../util/scheduleUtils");

class JobService extends Service {
  async selectJobPage(params = {}) {
    const { ctx } = this;
    const mapper = ctx.helper.getDB(ctx).sysJobMapper;

    return await ctx.helper.pageQuery(
      mapper.selectJobListMapper([], params),
      params,
      mapper.db()
    );
  }

  /**
   * 查询定时任务列表（不分页，用于导出）
   * @param {object} params - 查询参数
   * @return {array} 定时任务列表
   */
  async selectJobList(params = {}) {
    const { ctx } = this;

    try {
      const mapper = ctx.helper.getDB(ctx).sysJobMapper;

      // 查询任务列表（不分页）
      const list = await mapper.selectJobList([], params);

      // 为每个任务添加下次执行时间
      if (list && list.length > 0) {
        list.forEach((item) => {
          if (item.cronExpression) {
            item.nextValidTime = CronUtils.getNextExecution(
              item.cronExpression
            );
          }
        });
      }

      return list || [];
    } catch (err) {
      ctx.logger.error("查询定时任务列表失败:", err);
      throw err;
    }
  }


  /**
   * 根据任务ID查询定时任务
   * @param {number} jobId - 任务ID
   * @return {object} 定时任务信息
   */
  async selectJobById(jobId) {
    const { ctx } = this;

    try {
      const mapper = ctx.helper.getDB(ctx).sysJobMapper;
      const result = await mapper.selectJobById([], { jobId });

      if (result) {
        const job = result;

        // 添加下次执行时间
        if (job.cronExpression) {
          job.nextValidTime = CronUtils.getNextExecution(job.cronExpression);
        }

        return job;
      }

      return null;
    } catch (err) {
      ctx.logger.error("查询定时任务详情失败:", err);
      throw err;
    }
  }

  /**
   * 查询所有定时任务
   * @return {array} 定时任务列表
   */
  async selectJobAll() {
    const { ctx } = this;

    try {
      const mapper = ctx.helper.getDB(ctx).sysJobMapper;
      const result = await mapper.selectJobAll([]);

      return result || [];
    } catch (err) {
      ctx.logger.error("查询所有定时任务失败:", err);
      throw err;
    }
  }

  /**
   * 新增定时任务
   * @param {object} job - 定时任务对象
   * @return {number} 影响行数
   */
  async insertJob(job) {
    const { ctx } = this;

    try {
      const mapper = ctx.helper.getDB(ctx).sysJobMapper;

      // 校验必填字段
      if (!job.jobName || job.jobName.trim() === "") {
        throw new Error("任务名称不能为空");
      }
      if (!job.invokeTarget || job.invokeTarget.trim() === "") {
        throw new Error("调用目标字符串不能为空");
      }
      if (!job.cronExpression || job.cronExpression.trim() === "") {
        throw new Error("cron执行表达式不能为空");
      }

      // 设置默认值
      job.jobGroup = job.jobGroup || "DEFAULT";
      job.misfirePolicy = job.misfirePolicy || "3";
      job.concurrent = job.concurrent || "1";
      job.status = job.status || "1"; // 新任务默认暂停状态

      // 设置创建信息
      job.createBy = ctx.state.user ? ctx.state.user.userName : "system";
      job.createTime = ctx.helper.formatDate(new Date());

      // 插入数据库
      const result = await mapper.insertJob([], job);

      if (result > 0) {
        job.jobId = result;

        // 使用 Bull 创建定时任务调度（如果状态为正常）
        if (job.status === "0") {
          await this.createBullJob(job);
        }
      }

      return result;
    } catch (err) {
      ctx.logger.error("新增定时任务失败:", err);
      throw err;
    }
  }

  /**
   * 修改定时任务
   * @param {object} job - 定时任务对象
   * @return {number} 影响行数
   */
  async updateJob(job) {
    const { ctx } = this;

    try {
      const mapper = ctx.helper.getDB(ctx).sysJobMapper;

      // 获取原任务信息
      const oldJob = await this.selectJobById(job.jobId);

      if (!oldJob) {
        throw new Error("任务不存在");
      }

      // 设置更新信息
      job.updateBy = ctx.state.user ? ctx.state.user.userName : "system";
      job.updateTime = ctx.helper.formatDate(new Date());

      // 更新数据库
      const result = await mapper.updateJob([], job);

      if (result.affectedRows > 0) {
        // 使用 Bull 更新任务调度
        await this.updateBullJob(job, oldJob);
      }

      return result.affectedRows;
    } catch (err) {
      ctx.logger.error("修改定时任务失败:", err);
      throw err;
    }
  }

  /**
   * 删除定时任务
   * @param {array} jobIds - 任务ID数组
   * @return {number} 影响行数
   */
  async deleteJobByIds(jobIds) {
    const { ctx } = this;

    try {
      const mapper = ctx.helper.getDB(ctx).sysJobMapper;

      // 先获取所有任务信息，用于删除调度
      const jobs = [];
      for (const jobId of jobIds) {
        const job = await this.selectJobById(jobId);
        if (job) {
          jobs.push(job);
        }
      }

      // 删除数据库记录
      const result = await mapper.deleteJobByIds([], { array: jobIds });

      // 使用 Bull 删除任务调度
      for (const job of jobs) {
        await this.deleteBullJob(job);
      }

      return result.affectedRows;
    } catch (err) {
      ctx.logger.error("删除定时任务失败:", err);
      throw err;
    }
  }

  /**
   * 修改任务状态
   * @param {object} job - 定时任务对象
   * @return {number} 影响行数
   */
  async changeStatus(job) {
    const { ctx } = this;

    try {
      const mapper = ctx.helper.getDB(ctx).sysJobMapper;

      // 获取完整的任务信息
      const fullJob = await this.selectJobById(job.jobId);

      if (!fullJob) {
        throw new Error("任务不存在");
      }

      // 更新状态
      fullJob.status = job.status;
      fullJob.updateBy = ctx.state.user ? ctx.state.user.userName : "system";
      fullJob.updateTime = ctx.helper.formatDate(new Date());

      // 更新数据库
      const result = await mapper.updateJob([], fullJob);

      if (result > 0) {
        // 使用 Bull 根据状态启动或暂停任务
        if (job.status === "0") {
          // 恢复任务
          await this.resumeBullJob(fullJob);
        } else {
          // 暂停任务
          await this.pauseBullJob(fullJob);
        }
      }

      return result;
    } catch (err) {
      ctx.logger.error("修改任务状态失败:", err);
      throw err;
    }
  }

  /**
   * 立即执行任务
   * @param {object} job - 定时任务对象
   * @return {boolean} 是否成功
   */
  async run(job) {
    const { ctx } = this;

    try {
      // 获取完整的任务信息
      const fullJob = await this.selectJobById(job.jobId);

      if (!fullJob) {
        return false;
      }

      // 使用 Bull 立即执行任务
      return await this.runBullJob(fullJob);
    } catch (err) {
      ctx.logger.error("立即执行任务失败:", err);
      return false;
    }
  }

  /**
   * 暂停任务
   * @param {object} job - 定时任务对象
   * @return {boolean} 是否成功
   */
  async pauseJob(job) {
    const result = scheduleUtils.pauseJob(job.jobId, job.jobGroup);
    return result;
  }

  /**
   * 恢复任务
   * @param {object} job - 定时任务对象
   * @return {boolean} 是否成功
   */
  async resumeJob(job) {
    const result = scheduleUtils.resumeJob(job, this.executeJob.bind(this));
    return result;
  }

  /**
   * 创建定时任务调度
   * @param {object} job - 定时任务对象
   * @return {boolean} 是否成功
   */
  async createScheduleJob(job) {
    const result = scheduleUtils.createJob(job, this.executeJob.bind(this));
    return result;
  }

  /**
   * 更新定时任务调度
   * @param {object} newJob - 新的任务对象
   * @param {object} oldJob - 旧的任务对象
   * @return {boolean} 是否成功
   */
  async updateScheduleJob(newJob, oldJob) {
    // 删除旧任务
    scheduleUtils.deleteJob(oldJob.jobId, oldJob.jobGroup);

    // 创建新任务（如果状态为正常）
    if (newJob.status === "0") {
      const result = scheduleUtils.createJob(
        newJob,
        this.executeJob.bind(this)
      );
      return result;
    }

    return true;
  }

  /**
   * 执行任务
   * @param {object} job - 任务配置
   */
  async executeJob(job) {
    const { ctx } = this;
    const startTime = new Date();

    let status = "0"; // 0-成功 1-失败
    let jobMessage = "";
    let exceptionInfo = "";

    try {
      ctx.logger.info(`开始执行任务: ${job.jobName} (${job.invokeTarget})`);

      // 解析并执行任务
      const result = await this.invokeMethod(job.invokeTarget);

      jobMessage = result.message || "任务执行成功";
      ctx.logger.info(`任务执行成功: ${job.jobName}`);
    } catch (err) {
      status = "1";
      jobMessage = "任务执行失败";
      exceptionInfo = err.message || err.toString();

      ctx.logger.error(`任务执行失败: ${job.jobName}`, err);
    } finally {
      const stopTime = new Date();
      const duration = stopTime - startTime;

      // 记录任务执行日志
      await ctx.service.monitor.jobLog.insertJobLog({
        jobName: job.jobName,
        jobGroup: job.jobGroup,
        invokeTarget: job.invokeTarget,
        jobMessage: `${jobMessage} (耗时: ${duration}ms)`,
        status,
        exceptionInfo: exceptionInfo.substring(0, 2000),
        createTime: ctx.helper.formatDate(startTime),
      });
    }
  }

  /**
   * 调用任务方法
   * @param {string} invokeTarget - 调用目标字符串
   * @return {object} 执行结果
   */
  async invokeMethod(invokeTarget) {
    const { ctx } = this;

    // 解析调用目标
    // 格式：className.methodName 或 className.methodName(params)
    const match = invokeTarget.match(/^(\w+)\.(\w+)(\((.*)\))?$/);

    if (!match) {
      throw new Error(`无效的调用目标格式: ${invokeTarget}`);
    }

    const className = match[1];
    const methodName = match[2];

    // 根据类名创建实例
    let taskInstance;
    if (className === "ryTask") {
      const RyTask = require("../ryTask");
      taskInstance = new RyTask(ctx);
    } else {
      throw new Error(`不支持的任务类: ${className}`);
    }

    // 执行任务
    const result = await taskInstance.execute(invokeTarget);

    return result;
  }

  /**
   * 校验 cron 表达式是否有效
   * @param {string} cronExpression - cron 表达式
   * @return {boolean} 是否有效
   */
  isValidCron(cronExpression) {
    return CronUtils.isValid(cronExpression);
  }

  /**
   * 初始化所有任务（使用 Bull 队列）
   */
  async initJobs() {
    const { ctx, app } = this;

    try {
      ctx.logger.info("开始初始化定时任务（使用 Bull 队列）...");

      // 查询所有正常状态的任务
      const jobs = await this.selectJobAll();

      // 启动任务
      let successCount = 0;
      for (const job of jobs) {
        if (job.status === "0") {
          const result = await this.createBullJob(job);
          if (result) {
            successCount++;
          }
        }
      }

      ctx.logger.info(`定时任务初始化完成，共启动 ${successCount} 个任务`);

      return successCount;
    } catch (err) {
      ctx.logger.error("初始化定时任务失败:", err);
      throw err;
    }
  }

  /**
   * 使用 Bull 创建定时任务
   * @param {Object} job - 任务配置
   */
  async createBullJob(job) {
    const { app, ctx } = this;

    try {
      // 使用 jobId + invokeTarget 作为唯一标识
      const uniqueId = `${job.jobId}:${job.invokeTarget}`;

      ctx.logger.info(
        `[Bull] 准备创建任务 ${job.jobName}, uniqueId: ${uniqueId}, cron: ${job.cronExpression}`
      );

      // 先尝试删除旧的重复任务（避免重复）
      // 使用 removeRepeatable 方法，通过 cron + key 精确匹配
      try {
        // 尝试删除可能存在的旧任务（使用新格式的 key）
        await app.queue.ryTask.removeRepeatable({
          cron: job.cronExpression,
          key: uniqueId,
        });
        ctx.logger.info(`[Bull] 删除旧任务成功（新格式）`);
      } catch (err) {
        // 任务不存在时会抛出错误，忽略即可
        ctx.logger.debug(`[Bull] 未找到旧任务（新格式）: ${err.message}`);
      }

      // 还需要尝试删除旧格式的任务（cron 可能变了）
      // 获取所有 repeat jobs，找到相同 jobId 的任务
      const repeatableJobs = await app.queue.ryTask.getRepeatableJobs();
      for (const repeatJob of repeatableJobs) {
        // 检查是否是同一个 job（通过 id 或 key 中包含的信息）
        if (repeatJob.id && repeatJob.id.includes(`${job.jobId}:`)) {
          ctx.logger.info(`[Bull] 发现旧任务，准备删除: ${repeatJob.key}`);
          try {
            await app.queue.ryTask.removeRepeatable({
              cron: repeatJob.cron,
              key: repeatJob.id || undefined,
            });
            ctx.logger.info(`[Bull] 删除旧任务成功`);
          } catch (err) {
            ctx.logger.warn(`[Bull] 删除旧任务失败: ${err.message}`);
          }
          break;
        }
      }

      // 添加新的重复任务
      await app.queue.ryTask.add(
        {
          invokeTarget: job.invokeTarget,
          jobInfo: {
            jobId: job.jobId,
            jobName: job.jobName,
            jobGroup: job.jobGroup,
            uniqueId, // 保存唯一标识：jobId:invokeTarget
          },
        },
        {
          jobId: uniqueId, // 使用 uniqueId 作为 jobId
          repeat: {
            cron: job.cronExpression,
            key: uniqueId, // 使用 uniqueId 作为 repeat key
          },
          removeOnComplete: true,
          removeOnFail: 100,
        }
      );

      ctx.logger.info(
        `[Bull] 创建定时任务成功: ${job.jobName} (${job.cronExpression})`
      );
      return true;
    } catch (err) {
      ctx.logger.error(`[Bull] 创建定时任务失败: ${job.jobName}`, err);
      return false;
    }
  }

  /**
   * 使用 Bull 更新定时任务
   * @param {Object} newJob - 新任务配置
   * @param {Object} oldJob - 旧任务配置
   */
  async updateBullJob(newJob, oldJob) {
    const { ctx } = this;

    try {
      // 删除旧任务
      if (oldJob) {
        await this.deleteBullJob(oldJob);
      }

      // 如果新任务状态为正常，创建新任务
      if (newJob.status === "0") {
        return await this.createBullJob(newJob);
      }

      return true;
    } catch (err) {
      ctx.logger.error(`[Bull] 更新定时任务失败: ${newJob.jobName}`, err);
      return false;
    }
  }

  /**
   * 使用 Bull 删除定时任务
   * @param {Object} job - 任务配置
   */
  async deleteBullJob(job) {
    const { app, ctx } = this;

    try {
      // 使用 jobId + invokeTarget 作为唯一标识
      const uniqueId = `${job.jobId}:${job.invokeTarget}`;

      // 获取所有重复任务
      const repeatableJobs = await app.queue.ryTask.getRepeatableJobs();

      ctx.logger.info(
        `[Bull] 查找要删除的任务: ${job.jobName}, uniqueId: ${uniqueId}`
      );
      ctx.logger.info(`[Bull] 当前重复任务数量: ${repeatableJobs.length}`);

      let deleted = false;
      // 通过 uniqueId 匹配删除（新格式）
      for (const repeatJob of repeatableJobs) {
        if (repeatJob.key && repeatJob.key.includes(uniqueId)) {
          ctx.logger.info(
            `[Bull] 找到匹配任务（新格式），准备删除: ${repeatJob.key}`
          );
          await app.queue.ryTask.removeRepeatableByKey(repeatJob.key);
          ctx.logger.info(`[Bull] 删除定时任务成功: ${job.jobName}`);
          deleted = true;
          break;
        }
      }

      // 如果没找到，尝试用 cron 表达式匹配（兼容旧格式）
      if (!deleted) {
        ctx.logger.info(
          `[Bull] 未找到新格式任务，尝试匹配旧格式 (cron: ${job.cronExpression})`
        );
        for (const repeatJob of repeatableJobs) {
          if (repeatJob.cron === job.cronExpression) {
            ctx.logger.info(
              `[Bull] 找到匹配任务（旧格式），准备删除: ${repeatJob.key}`
            );
            await app.queue.ryTask.removeRepeatableByKey(repeatJob.key);
            ctx.logger.info(`[Bull] 删除定时任务成功: ${job.jobName}`);
            deleted = true;
            break;
          }
        }
      }

      if (!deleted) {
        ctx.logger.warn(
          `[Bull] 未找到要删除的任务: ${job.jobName}, uniqueId: ${uniqueId}, cron: ${job.cronExpression}`
        );
        // 输出所有 repeat job keys 用于调试
        if (repeatableJobs.length > 0) {
          ctx.logger.info(`[Bull] 现有任务列表 (${repeatableJobs.length}):`);
          repeatableJobs.forEach((rj) => {
            ctx.logger.info(`  - key: ${rj.key}, cron: ${rj.cron}`);
          });
        } else {
          ctx.logger.info(`[Bull] 当前没有任何 repeat 任务`);
        }
      }

      return true;
    } catch (err) {
      ctx.logger.error(`[Bull] 删除定时任务失败: ${job.jobName}`, err);
      return false;
    }
  }

  /**
   * 使用 Bull 立即执行任务
   * @param {Object} job - 任务配置
   */
  async runBullJob(job) {
    const { app, ctx } = this;

    try {
      // 立即添加任务到队列（不使用命名任务，使用默认处理器）
      await app.queue.ryTask.add(
        {
          invokeTarget: job.invokeTarget,
          jobInfo: {
            jobId: job.jobId,
            jobName: job.jobName,
            jobGroup: job.jobGroup,
          },
        },
        {
          removeOnComplete: true,
          // 设置高优先级，确保立即执行
          priority: 1,
        }
      );

      ctx.logger.info(`[Bull] 手动执行任务: ${job.jobName}`);
      return true;
    } catch (err) {
      ctx.logger.error(`[Bull] 手动执行任务失败: ${job.jobName}`, err);
      return false;
    }
  }

  /**
   * 使用 Bull 暂停任务
   * @param {Object} job - 任务配置
   */
  async pauseBullJob(job) {
    // Bull 的暂停通过删除重复任务实现
    return await this.deleteBullJob(job);
  }

  /**
   * 使用 Bull 恢复任务
   * @param {Object} job - 任务配置
   */
  async resumeBullJob(job) {
    // Bull 的恢复通过重新创建任务实现
    return await this.createBullJob(job);
  }
}

module.exports = JobService;
