/*
 * @Description: 服务监控控制器
 * @Author: 姜彦汐
 * @Date: 2025-11-21
 */

const Controller = require('egg').Controller;
const { Route, HttpGet } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');

module.exports = app => {

  @Route('/monitor/server')
  class ServerController extends Controller {

    /**
     * 获取服务器信息
     * GET /api/monitor/server
     * 权限：monitor:server:list
     */
    @RequiresPermissions('monitor:server:list')
    @HttpGet('/')
    async getInfo() {
      const { ctx, service } = this;
      
      try {
        // 获取服务器信息
        const serverInfo = await service.monitor.server.getServerInfo();
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: serverInfo
        };
      } catch (err) {
        ctx.logger.error('获取服务器信息失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '获取服务器信息失败'
        };
      }
    }
  }

  return ServerController;
};

