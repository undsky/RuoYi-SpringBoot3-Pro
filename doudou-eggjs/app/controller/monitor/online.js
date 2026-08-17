/*
 * @Description: 在线用户监控控制器
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpDelete } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');
const { Log, BusinessType } = require('../../decorator/log');

module.exports = app => {

  @Route('/monitor/online')
  class OnlineController extends Controller {

    /**
     * 获取在线用户列表
     * GET /api/monitor/online/list
     * 权限：monitor:online:list
     */
    @RequiresPermissions('monitor:online:list')
    @HttpGet('/list')
    async list() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.query;
        
        // 分页参数
        const pageNum = parseInt(params.pageNum) || 1;
        const pageSize = parseInt(params.pageSize) || 10;
        
        // 查询在线用户列表
        const list = await service.monitor.online.selectOnlineList(params);
        
        // 手动分页
        const total = list.length;
        const start = (pageNum - 1) * pageSize;
        const rows = list.slice(start, start + pageSize);
        
        ctx.body = {
          code: 200,
          msg: '查询成功',
          rows,
          total
        };
      } catch (err) {
        ctx.logger.error('查询在线用户列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询在线用户列表失败'
        };
      }
    }

    /**
     * 强退用户
     * DELETE /api/monitor/online/:tokenId
     * 权限：monitor:online:forceLogout
     */
    @Log({ title: '在线用户', businessType: BusinessType.FORCE })
    @RequiresPermissions('monitor:online:forceLogout')
    @HttpDelete('/:tokenId')
    async forceLogout() {
      const { ctx, service } = this;
      
      try {
        const { tokenId } = ctx.params;
        
        // 强退用户
        await service.monitor.online.forceLogout(tokenId);
        
        ctx.body = {
          code: 200,
          msg: '强退成功'
        };
      } catch (err) {
        ctx.logger.error('强退用户失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '强退用户失败'
        };
      }
    }
  }

  return OnlineController;
};

