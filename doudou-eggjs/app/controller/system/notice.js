/*
 * @Description: 通知公告管理控制器
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpPost, HttpPut, HttpDelete } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');
const { Log, BusinessType } = require('../../decorator/log');

module.exports = app => {

  @Route('/system/notice')
  class NoticeController extends Controller {

    /**
     * 获取通知公告列表（分页）
     * GET /api/system/notice/list
     * 权限：system:notice:list
     */
    @RequiresPermissions('system:notice:list')
    @HttpGet('/list')
    async list() {
      const { ctx, service } = this;

      try {
        const params = ctx.query;

        // 查询列表
        const result = await service.system.notice.selectNoticePage(params);

        ctx.body = {
          code: 200,
          msg: "查询成功",
          ...result,
        };
      } catch (err) {
        ctx.logger.error('查询通知公告列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询通知公告列表失败'
        };
      }
    }

    /**
     * 获取通知公告详情
     * GET /api/system/notice/:noticeId
     * 权限：system:notice:query
     */
    @RequiresPermissions('system:notice:query')
    @HttpGet('/:noticeId')
    async getInfo() {
      const { ctx, service } = this;
      
      try {
        const { noticeId } = ctx.params;
        
        // 查询通知公告信息
        const notice = await service.system.notice.selectNoticeById(parseInt(noticeId));
        
        if (!notice) {
          ctx.body = {
            code: 500,
            msg: '通知公告不存在'
          };
          return;
        }
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: notice
        };
      } catch (err) {
        ctx.logger.error('查询通知公告详情失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询通知公告详情失败'
        };
      }
    }

    /**
     * 新增通知公告
     * POST /api/system/notice
     * 权限：system:notice:add
     */
    @Log({ title: '通知公告', businessType: BusinessType.INSERT })
    @RequiresPermissions('system:notice:add')
    @HttpPost('/')
    async add() {
      const { ctx, service } = this;
      
      try {
        const notice = ctx.request.body;
        
        // 新增通知公告
        const rows = await service.system.notice.insertNotice(notice);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '新增成功' : '新增失败'
        };
      } catch (err) {
        ctx.logger.error('新增通知公告失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '新增通知公告失败'
        };
      }
    }

    /**
     * 修改通知公告
     * PUT /api/system/notice
     * 权限：system:notice:edit
     */
    @Log({ title: '通知公告', businessType: BusinessType.UPDATE })
    @RequiresPermissions('system:notice:edit')
    @HttpPut('/')
    async edit() {
      const { ctx, service } = this;
      
      try {
        const notice = ctx.request.body;
        
        // 修改通知公告
        const rows = await service.system.notice.updateNotice(notice);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '修改成功' : '修改失败'
        };
      } catch (err) {
        ctx.logger.error('修改通知公告失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '修改通知公告失败'
        };
      }
    }

    /**
     * 删除通知公告
     * DELETE /api/system/notice/:noticeIds
     * 权限：system:notice:remove
     */
    @Log({ title: '通知公告', businessType: BusinessType.DELETE })
    @RequiresPermissions('system:notice:remove')
    @HttpDelete('/:noticeIds')
    async remove() {
      const { ctx, service } = this;
      
      try {
        const { noticeIds } = ctx.params;
        
        // 解析通知公告ID数组
        const noticeIdArray = noticeIds.split(',').map(id => parseInt(id));
        
        // 删除通知公告
        const rows = await service.system.notice.deleteNoticeByIds(noticeIdArray);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '删除成功' : '删除失败'
        };
      } catch (err) {
        ctx.logger.error('删除通知公告失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '删除通知公告失败'
        };
      }
    }
  }

  return NoticeController;
};

