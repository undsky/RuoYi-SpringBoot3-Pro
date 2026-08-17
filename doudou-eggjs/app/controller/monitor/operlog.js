/*
 * @Description: 操作日志监控控制器
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpPost, HttpDelete } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');
const { Log, BusinessType } = require('../../decorator/log');
const ExcelUtil = require('../../extend/excel');

module.exports = app => {

  @Route('/monitor/operlog')
  class OperlogController extends Controller {

    /**
     * 获取操作日志列表（分页）
     * GET /api/monitor/operlog/list
     * 权限：monitor:operlog:list
     */
    @RequiresPermissions('monitor:operlog:list')
    @HttpGet('/list')
    async list() {
      const { ctx, service } = this;

      try {
        const params = ctx.query;

        // 查询列表
        const result = await service.monitor.operlog.selectOperLogPage(params);

        ctx.body = {
          code: 200,
          msg: "查询成功",
          ...result,
        };
      } catch (err) {
        ctx.logger.error('查询操作日志列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询操作日志列表失败'
        };
      }
    }

    /**
     * 删除操作日志
     * DELETE /api/monitor/operlog/:operIds
     * 权限：monitor:operlog:remove
     */
    @Log({ title: '操作日志', businessType: BusinessType.DELETE })
    @RequiresPermissions('monitor:operlog:remove')
    @HttpDelete('/:operIds')
    async remove() {
      const { ctx, service } = this;
      
      try {
        const { operIds } = ctx.params;
        
        // 解析日志ID数组
        const operIdArray = operIds.split(',').map(id => parseInt(id));
        
        // 删除操作日志
        const rows = await service.monitor.operlog.deleteOperLogByIds(operIdArray);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '删除成功' : '删除失败'
        };
      } catch (err) {
        ctx.logger.error('删除操作日志失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '删除操作日志失败'
        };
      }
    }

    /**
     * 清空操作日志
     * DELETE /api/monitor/operlog/clean
     * 权限：monitor:operlog:remove
     */
    @Log({ title: '操作日志', businessType: BusinessType.CLEAN })
    @RequiresPermissions('monitor:operlog:remove')
    @HttpDelete('/clean')
    async clean() {
      const { ctx, service } = this;
      
      try {
        // 清空操作日志
        await service.monitor.operlog.cleanOperLog();
        
        ctx.body = {
          code: 200,
          msg: '清空成功'
        };
      } catch (err) {
        ctx.logger.error('清空操作日志失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '清空操作日志失败'
        };
      }
    }

    /**
     * 导出操作日志
     * POST /api/monitor/operlog/export
     * 权限：monitor:operlog:export
     */
    @Log({ title: '操作日志', businessType: BusinessType.EXPORT })
    @RequiresPermissions('monitor:operlog:export')
    @HttpPost('/export')
    async export() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.request.body;
        
        // 查询操作日志列表
        const list = await service.monitor.operlog.selectOperLogList(params);

        // 定义 Excel 列配置
        const columns = [
          { header: '日志编号', key: 'operId', width: 12 },
          { header: '系统模块', key: 'title', width: 20 },
          { header: '操作类型', key: 'businessTypeText', width: 12 },
          { header: '请求方式', key: 'requestMethod', width: 10 },
          { header: '操作人员', key: 'operName', width: 15 },
          { header: '操作IP', key: 'operIp', width: 15 },
          { header: '操作地点', key: 'operLocation', width: 20 },
          { header: '操作状态', key: 'statusText', width: 10 },
          { header: '执行时间', key: 'costTime', width: 12 },
          { header: '操作时间', key: 'operTime', width: 20 },
        ];

        // 处理导出数据
        const exportData = list.map((log) => ({
          ...log,
          businessTypeText: ExcelUtil.convertDictValue(log.businessType, {
            0: '其它',
            1: '新增',
            2: '修改',
            3: '删除',
            4: '授权',
            5: '导出',
            6: '导入',
            7: '强退',
            8: '生成代码',
            9: '清空数据',
          }),
          statusText: ExcelUtil.convertDictValue(log.status, {
            0: '正常',
            1: '异常',
          }),
        }));

        // 导出 Excel
        ExcelUtil.exportExcel(ctx, exportData, columns, '操作日志数据');
      } catch (err) {
        ctx.logger.error('导出操作日志失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '导出操作日志失败',
        };
      }
    }
  }

  return OperlogController;
};
