/*
 * @Description: 通知公告服务层
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Service = require("egg").Service;

class NoticeService extends Service {
  async selectNoticePage(params = {}) {
    const { ctx } = this;
    const mapper = ctx.helper.getDB(ctx).sysNoticeMapper;

    return await ctx.helper.pageQuery(
      mapper.selectNoticeListMapper([], params),
      params,
      mapper.db()
    );
  }

  /**
   * 查询通知公告列表
   * @param {object} notice - 查询参数
   * @return {array} 通知公告列表
   */
  async selectNoticeList(notice = {}) {
    const { ctx } = this;

    // 查询条件
    const conditions = {
      noticeTitle: notice.noticeTitle,
      noticeType: notice.noticeType,
      createBy: notice.createBy,
    };

    // 查询列表
    const notices = await ctx.helper
      .getDB(ctx)
      .sysNoticeMapper.selectNoticeList([], conditions);

    return notices || [];
  }

  /**
   * 根据通知公告ID查询通知公告
   * @param {number} noticeId - 通知公告ID
   * @return {object} 通知公告信息
   */
  async selectNoticeById(noticeId) {
    const { ctx } = this;

    return await ctx.helper
      .getDB(ctx)
      .sysNoticeMapper.selectNoticeById([], { noticeId });
  }

  /**
   * 新增通知公告
   * @param {object} notice - 通知公告对象
   * @return {number} 影响行数
   */
  async insertNotice(notice) {
    const { ctx } = this;

    // 设置创建信息
    notice.createBy = ctx.state.user.userName;

    // 插入通知公告
    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysNoticeMapper.insertNotice([], notice);

    return result;
  }

  /**
   * 修改通知公告
   * @param {object} notice - 通知公告对象
   * @return {number} 影响行数
   */
  async updateNotice(notice) {
    const { ctx } = this;

    // 设置更新信息
    notice.updateBy = ctx.state.user.userName;

    // 更新通知公告
    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysNoticeMapper.updateNotice([], notice);

    return result;
  }

  /**
   * 删除通知公告
   * @param {array} noticeIds - 通知公告ID数组
   * @return {number} 影响行数
   */
  async deleteNoticeByIds(noticeIds) {
    const { ctx } = this;

    // 删除通知公告
    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysNoticeMapper.deleteNoticeByIds([], { array: noticeIds });

    return result;
  }
}

module.exports = NoticeService;
