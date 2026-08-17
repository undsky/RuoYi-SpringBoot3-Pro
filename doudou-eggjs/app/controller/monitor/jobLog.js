/**
 * 定时任务调度日志控制器
 * @Author: 姜彦汐
 * @Date: 2025-11-08
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpPost, HttpDelete } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');

module.exports = app => {

  @Route('/monitor/jobLog')
  class JobLogController extends Controller {

    /**
     * 查询调度日志列表
     * GET /api/monitor/jobLog/list
     * 权限：monitor:job:list
     */
    @RequiresPermissions('monitor:job:list')
    @HttpGet('/list')
    async list() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.query;
        
        // 查询调度日志列表
        const result = await service.monitor.jobLog.selectJobLogPage(params);
        
        ctx.body = {
          code: 200,
          msg: '查询成功',
          ...result
        };
      } catch (err) {
        ctx.logger.error('查询调度日志列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询失败'
        };
      }
    }

    /**
     * 根据调度编号获取详细信息
     * GET /api/monitor/jobLog/:jobLogId
     * 权限：monitor:job:query
     */
    @RequiresPermissions('monitor:job:query')
    @HttpGet('/:jobLogId')
    async getInfo() {
      const { ctx, service } = this;
      
      try {
        const jobLogId = parseInt(ctx.params.jobLogId);
        
        // 查询调度日志信息
        const jobLog = await service.monitor.jobLog.selectJobLogById(jobLogId);
        
        if (!jobLog) {
          ctx.body = {
            code: 500,
            msg: '调度日志不存在'
          };
          return;
        }
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: jobLog
        };
      } catch (err) {
        ctx.logger.error('查询调度日志详情失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询失败'
        };
      }
    }

    /**
     * 删除调度日志
     * DELETE /api/monitor/jobLog/:jobLogIds
     * 权限：monitor:job:remove
     */
    @RequiresPermissions('monitor:job:remove')
    @HttpDelete('/:jobLogIds')
    async remove() {
      const { ctx, service } = this;
      
      try {
        const jobLogIds = ctx.params.jobLogIds.split(',').map(id => parseInt(id));
        
        // 删除调度日志
        const result = await service.monitor.jobLog.deleteJobLogByIds(jobLogIds);
        
        ctx.body = {
          code: 200,
          msg: result > 0 ? '删除成功' : '删除失败'
        };
      } catch (err) {
        ctx.logger.error('删除调度日志失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '删除失败'
        };
      }
    }

    /**
     * 清空调度日志
     * DELETE /api/monitor/jobLog/clean
     * 权限：monitor:job:remove
     */
    @RequiresPermissions('monitor:job:remove')
    @HttpDelete('/clean')
    async clean() {
      const { ctx, service } = this;
      
      try {
        // 清空调度日志
        await service.monitor.jobLog.cleanJobLog();
        
        ctx.body = {
          code: 200,
          msg: '清空成功'
        };
      } catch (err) {
        ctx.logger.error('清空调度日志失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '清空失败'
        };
      }
    }

    /**
     * 导出调度日志
     * POST /api/monitor/jobLog/export
     * 权限：monitor:job:export
     */
    @RequiresPermissions('monitor:job:export')
    @HttpPost('/export')
    async export() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.request.body;
        
        // 查询所有符合条件的调度日志
        const list = await service.monitor.jobLog.selectJobLogList(
          { pageNum: 1, pageSize: 100000 },
          params
        );
        
        // 导出为 CSV
        const buffer = await service.monitor.jobLog.exportJobLog(list);
        
        // 设置响应头
        ctx.set('Content-Type', 'text/csv');
        ctx.set('Content-Disposition', `attachment; filename=job_log_${Date.now()}.csv`);
        
        ctx.body = buffer;
      } catch (err) {
        ctx.logger.error('导出调度日志失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '导出失败'
        };
      }
    }

    /**
     * 获取任务执行统计信息
     * GET /api/monitor/jobLog/statistics
     * 权限：monitor:job:list
     */
    @RequiresPermissions('monitor:job:list')
    @HttpGet('/statistics')
    async statistics() {
      const { ctx, service } = this;
      
      try {
        const query = ctx.query;
        
        // 查询条件
        const params = {
          jobName: query.jobName,
          jobGroup: query.jobGroup,
          beginTime: query.beginTime,
          endTime: query.endTime
        };
        
        // 获取统计信息
        const statistics = await service.monitor.jobLog.getJobLogStatistics(params);
        
        ctx.body = {
          code: 200,
          msg: '查询成功',
          data: statistics
        };
      } catch (err) {
        ctx.logger.error('获取统计信息失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询失败'
        };
      }
    }
  }

  return JobLogController;
};
