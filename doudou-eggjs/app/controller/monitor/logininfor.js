/*
 * @Description: 登录日志监控控制器
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpPost, HttpDelete } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');
const { Log, BusinessType } = require('../../decorator/log');
const ExcelUtil = require('../../extend/excel');

module.exports = app => {

  @Route('/monitor/logininfor')
  class LogininforController extends Controller {

    /**
     * 获取登录日志列表（分页）
     * GET /api/monitor/logininfor/list
     * 权限：monitor:logininfor:list
     */
    @RequiresPermissions('monitor:logininfor:list')
    @HttpGet('/list')
    async list() {
      const { ctx, service } = this;

      try {
        const params = ctx.query;

        // 查询列表
        const result = await service.monitor.logininfor.selectLogininforPage(params);

        ctx.body = {
          code: 200,
          msg: "查询成功",
          ...result,
        };
      } catch (err) {
        ctx.logger.error('查询登录日志列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询登录日志列表失败'
        };
      }
    }

    /**
     * 删除登录日志
     * DELETE /api/monitor/logininfor/:infoIds
     * 权限：monitor:logininfor:remove
     */
    @RequiresPermissions('monitor:logininfor:remove')
    @HttpDelete('/:infoIds')
    async remove() {
      const { ctx, service } = this;
      
      try {
        const { infoIds } = ctx.params;
        
        // 解析日志ID数组
        const infoIdArray = infoIds.split(',').map(id => parseInt(id));
        
        // 删除登录日志
        const rows = await service.monitor.logininfor.deleteLogininforByIds(infoIdArray);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '删除成功' : '删除失败'
        };
      } catch (err) {
        ctx.logger.error('删除登录日志失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '删除登录日志失败'
        };
      }
    }

    /**
     * 清空登录日志
     * DELETE /api/monitor/logininfor/clean
     * 权限：monitor:logininfor:remove
     */
    @RequiresPermissions('monitor:logininfor:remove')
    @HttpDelete('/clean')
    async clean() {
      const { ctx, service } = this;
      
      try {
        // 清空登录日志
        await service.monitor.logininfor.cleanLogininfor();
        
        ctx.body = {
          code: 200,
          msg: '清空成功'
        };
      } catch (err) {
        ctx.logger.error('清空登录日志失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '清空登录日志失败'
        };
      }
    }

    /**
     * 解锁用户（清除密码错误次数缓存）
     * GET /api/monitor/logininfor/unlock/:userName
     * 权限：monitor:logininfor:unlock
     * 参照：SysLogininforController.unlock
     */
    @Log({ title: '账户解锁', businessType: BusinessType.OTHER })
    @RequiresPermissions('monitor:logininfor:unlock')
    @HttpGet('/unlock/:userName')
    async unlock() {
      const { ctx, service } = this;
      
      try {
        const { userName } = ctx.params;
        
        // 解锁用户（调用密码服务清除登录记录缓存）
        await service.system.password.clearLoginRecordCache(userName);
        
        ctx.body = {
          code: 200,
          msg: '解锁成功'
        };
      } catch (err) {
        ctx.logger.error('解锁用户失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '解锁用户失败'
        };
      }
    }

    /**
     * 导出登录日志
     * POST /api/monitor/logininfor/export
     * 权限：monitor:logininfor:export
     */
    @Log({ title: '登录日志', businessType: BusinessType.EXPORT })
    @RequiresPermissions('monitor:logininfor:export')
    @HttpPost('/export')
    async export() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.request.body;
        
        // 查询登录日志列表
        const list = await service.monitor.logininfor.selectLogininforList(params);
        
        // 定义 Excel 列配置
        const columns = [
          { header: '访问编号', key: 'infoId', width: 12 },
          { header: '用户名称', key: 'userName', width: 15 },
          { header: '登录地址', key: 'ipaddr', width: 15 },
          { header: '登录地点', key: 'loginLocation', width: 20 },
          { header: '浏览器', key: 'browser', width: 20 },
          { header: '操作系统', key: 'os', width: 15 },
          { header: '登录状态', key: 'statusText', width: 12 },
          { header: '操作信息', key: 'msg', width: 30 },
          { header: '登录时间', key: 'loginTime', width: 20 },
        ];
        
        // 处理导出数据
        const exportData = list.map(log => ({
          ...log,
          statusText: ExcelUtil.convertDictValue(log.status, {
            '0': '成功',
            '1': '失败',
          }),
        }));
        
        // 导出 Excel
        ExcelUtil.exportExcel(ctx, exportData, columns, '登录日志');
      } catch (err) {
        ctx.logger.error('导出登录日志失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '导出登录日志失败'
        };
      }
    }
  }

  return LogininforController;
};
