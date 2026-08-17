/**
 * 定时任务监控控制器
 * @Author: 姜彦汐
 * @Date: 2025-11-08
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpPost, HttpPut, HttpDelete } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');
const { Log, BusinessType } = require('../../decorator/log');
const ExcelUtil = require('../../extend/excel');

// 常量定义
const Constants = {
  LOOKUP_RMI: 'rmi://',
  LOOKUP_LDAP: 'ldap://',
  LOOKUP_LDAPS: 'ldaps://',
  HTTP: 'http://',
  HTTPS: 'https://',
  JOB_ERROR_STR: [
    'java.net.URL',
    'javax.naming.InitialContext',
    'org.yaml.snakeyaml',
    'org.springframework',
    'org.apache',
    'eval',
    'exec',
    'require',
    'import'
  ]
};

module.exports = app => {

  @Route('/monitor/job')
  class JobController extends Controller {

    /**
     * 获取定时任务列表（分页）
     * GET /api/monitor/job/list
     * 权限：monitor:job:list
     */
    @RequiresPermissions('monitor:job:list')
    @HttpGet('/list')
    async list() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.query;
        
        // 查询定时任务列表
        const result = await service.monitor.job.selectJobPage(params);
        
        ctx.body = {
          code: 200,
          msg: '查询成功',
          ...result
        };
      } catch (err) {
        ctx.logger.error('查询定时任务列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询定时任务列表失败'
        };
      }
    }

    /**
     * 获取定时任务详情
     * GET /api/monitor/job/:jobId
     * 权限：monitor:job:query
     */
    @RequiresPermissions('monitor:job:query')
    @HttpGet('/:jobId')
    async getInfo() {
      const { ctx, service } = this;
      
      try {
        const { jobId } = ctx.params;
        
        // 查询定时任务信息
        const job = await service.monitor.job.selectJobById(parseInt(jobId));
        
        if (!job) {
          ctx.body = {
            code: 500,
            msg: '定时任务不存在'
          };
          return;
        }
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: job
        };
      } catch (err) {
        ctx.logger.error('查询定时任务详情失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询定时任务详情失败'
        };
      }
    }

    /**
     * 新增定时任务
     * POST /api/monitor/job
     * 权限：monitor:job:add
     */
    @RequiresPermissions('monitor:job:add')
    @HttpPost('/')
    async add() {
      const { ctx, service } = this;
      
      try {
        const job = ctx.request.body;
        
        // 校验 cron 表达式
        if (!service.monitor.job.isValidCron(job.cronExpression)) {
          ctx.body = {
            code: 500,
            msg: `新增任务'${job.jobName}'失败，Cron表达式不正确`
          };
          return;
        }
        
        // 安全校验
        const securityCheck = this.checkJobSecurity(job);
        if (!securityCheck.pass) {
          ctx.body = {
            code: 500,
            msg: `新增任务'${job.jobName}'失败，${securityCheck.message}`
          };
          return;
        }
        
        // 新增定时任务
        const rows = await service.monitor.job.insertJob(job);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '新增成功' : '新增失败'
        };
      } catch (err) {
        ctx.logger.error('新增定时任务失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '新增定时任务失败'
        };
      }
    }

    /**
     * 修改定时任务
     * PUT /api/monitor/job
     * 权限：monitor:job:edit
     */
    @RequiresPermissions('monitor:job:edit')
    @HttpPut('/')
    async edit() {
      const { ctx, service } = this;
      
      try {
        const job = ctx.request.body;
        
        // 校验 cron 表达式
        if (!service.monitor.job.isValidCron(job.cronExpression)) {
          ctx.body = {
            code: 500,
            msg: `修改任务'${job.jobName}'失败，Cron表达式不正确`
          };
          return;
        }
        
        // 安全校验
        const securityCheck = this.checkJobSecurity(job);
        if (!securityCheck.pass) {
          ctx.body = {
            code: 500,
            msg: `修改任务'${job.jobName}'失败，${securityCheck.message}`
          };
          return;
        }
        
        // 修改定时任务
        const rows = await service.monitor.job.updateJob(job);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '修改成功' : '修改失败'
        };
      } catch (err) {
        ctx.logger.error('修改定时任务失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '修改定时任务失败'
        };
      }
    }

    /**
     * 删除定时任务
     * DELETE /api/monitor/job/:jobIds
     * 权限：monitor:job:remove
     */
    @RequiresPermissions('monitor:job:remove')
    @HttpDelete('/:jobIds')
    async remove() {
      const { ctx, service } = this;
      
      try {
        const { jobIds } = ctx.params;
        
        // 解析任务ID数组
        const jobIdArray = jobIds.split(',').map(id => parseInt(id));
        
        // 删除定时任务
        const rows = await service.monitor.job.deleteJobByIds(jobIdArray);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '删除成功' : '删除失败'
        };
      } catch (err) {
        ctx.logger.error('删除定时任务失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '删除定时任务失败'
        };
      }
    }

    /**
     * 修改任务状态
     * PUT /api/monitor/job/changeStatus
     * 权限：monitor:job:changeStatus
     */
    @RequiresPermissions('monitor:job:changeStatus')
    @HttpPut('/changeStatus')
    async changeStatus() {
      const { ctx, service } = this;
      
      try {
        const job = ctx.request.body;
        
        // 修改任务状态
        const rows = await service.monitor.job.changeStatus(job);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '修改成功' : '修改失败'
        };
      } catch (err) {
        ctx.logger.error('修改任务状态失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '修改任务状态失败'
        };
      }
    }

    /**
     * 立即执行任务
     * PUT /api/monitor/job/run
     * 权限：monitor:job:changeStatus
     */
    @RequiresPermissions('monitor:job:changeStatus')
    @HttpPut('/run')
    async run() {
      const { ctx, service } = this;
      
      try {
        const job = ctx.request.body;
        
        // 立即执行任务
        const result = await service.monitor.job.run(job);
        
        ctx.body = {
          code: 200,
          msg: result ? '执行成功' : '任务不存在或已过期！'
        };
      } catch (err) {
        ctx.logger.error('执行任务失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '执行任务失败'
        };
      }
    }

    /**
     * 导出定时任务
     * POST /api/monitor/job/export
     * 权限：monitor:job:export
     */
    @Log({ title: '定时任务', businessType: BusinessType.EXPORT })
    @RequiresPermissions('monitor:job:export')
    @HttpPost('/export')
    async export() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.request.body;
        
        // 查询定时任务列表
        const list = await service.monitor.job.selectJobList(params);
        
        // 定义 Excel 列配置
        const columns = [
          { header: '任务编号', key: 'jobId', width: 12 },
          { header: '任务名称', key: 'jobName', width: 20 },
          { header: '任务组名', key: 'jobGroup', width: 15 },
          { header: '调用目标字符串', key: 'invokeTarget', width: 30 },
          { header: 'cron执行表达式', key: 'cronExpression', width: 20 },
          { header: '计划执行错误策略', key: 'misfirePolicyText', width: 20 },
          { header: '是否并发执行', key: 'concurrentText', width: 15 },
          { header: '状态', key: 'statusText', width: 10 },
          { header: '创建时间', key: 'createTime', width: 20 }
        ];
        
        // 处理导出数据
        const exportData = list.map(job => ({
          ...job,
          misfirePolicyText: ExcelUtil.convertDictValue(job.misfirePolicy, { 
            '1': '立即执行', 
            '2': '执行一次', 
            '3': '放弃执行' 
          }),
          concurrentText: ExcelUtil.convertDictValue(job.concurrent, { 
            '0': '允许', 
            '1': '禁止' 
          }),
          statusText: ExcelUtil.convertDictValue(job.status, { 
            '0': '正常', 
            '1': '暂停' 
          })
        }));
        
        // 导出 Excel
        ExcelUtil.exportExcel(ctx, exportData, columns, '定时任务数据');
      } catch (err) {
        ctx.logger.error('导出定时任务失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '导出定时任务失败'
        };
      }
    }

    /**
     * 安全校验
     * @param {object} job - 任务对象
     * @return {object} 校验结果 {pass: boolean, message: string}
     */
    checkJobSecurity(job) {
      const { invokeTarget } = job;
      
      // 检查是否包含 rmi 调用
      if (this.containsIgnoreCase(invokeTarget, Constants.LOOKUP_RMI)) {
        return {
          pass: false,
          message: "目标字符串不允许'rmi'调用"
        };
      }
      
      // 检查是否包含 ldap(s) 调用
      if (this.containsAnyIgnoreCase(invokeTarget, [Constants.LOOKUP_LDAP, Constants.LOOKUP_LDAPS])) {
        return {
          pass: false,
          message: "目标字符串不允许'ldap(s)'调用"
        };
      }
      
      // 检查是否包含 http(s) 调用
      if (this.containsAnyIgnoreCase(invokeTarget, [Constants.HTTP, Constants.HTTPS])) {
        return {
          pass: false,
          message: "目标字符串不允许'http(s)'调用"
        };
      }
      
      // 检查是否包含违规字符串
      if (this.containsAnyIgnoreCase(invokeTarget, Constants.JOB_ERROR_STR)) {
        return {
          pass: false,
          message: '目标字符串存在违规'
        };
      }
      
      // 白名单校验
      const scheduleUtils = require('../../util/scheduleUtils');
      if (!scheduleUtils.constructor.whiteList(invokeTarget)) {
        return {
          pass: false,
          message: '目标字符串不在白名单内'
        };
      }
      
      return {
        pass: true,
        message: ''
      };
    }

    /**
     * 检查字符串是否包含（忽略大小写）
     * @param {string} str - 字符串
     * @param {string} searchStr - 搜索字符串
     * @return {boolean} 是否包含
     */
    containsIgnoreCase(str, searchStr) {
      if (!str || !searchStr) {
        return false;
      }
      return str.toLowerCase().includes(searchStr.toLowerCase());
    }

    /**
     * 检查字符串是否包含任意一个（忽略大小写）
     * @param {string} str - 字符串
     * @param {array} searchStrs - 搜索字符串数组
     * @return {boolean} 是否包含
     */
    containsAnyIgnoreCase(str, searchStrs) {
      if (!str || !searchStrs || searchStrs.length === 0) {
        return false;
      }
      return searchStrs.some(searchStr => this.containsIgnoreCase(str, searchStr));
    }
  }

  return JobController;
};
