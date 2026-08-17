/*
 * @Description: 操作日志服务层
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Service = require("egg").Service;
const dayjs = require("dayjs");

class OperlogService extends Service {
  async selectOperLogPage(params = {}) {
    const { ctx } = this;
    const mapper = ctx.helper.getDB(ctx).sysOperLogMapper;

    return await ctx.helper.pageQuery(
      mapper.selectOperLogListMapper([], params),
      params,
      mapper.db()
    );
  }

  /**
   * 查询操作日志列表
   * @param {object} operLog - 查询参数
   * @return {array} 操作日志列表
   */
  async selectOperLogList(operLog = {}) {
    const { ctx } = this;

    // 查询条件
    const conditions = {
      operIp: operLog.operIp,
      title: operLog.title,
      businessType: operLog.businessType,
      businessTypes: operLog.businessTypes,
      status: operLog.status,
      operName: operLog.operName,
      params: {
        beginTime: operLog.beginTime,
        endTime: operLog.endTime,
      },
    };

    // 查询列表
    const operLogList = await ctx.helper
      .getDB(ctx)
      .sysOperLogMapper.selectOperLogList([], conditions);

    return operLogList || [];
  }

  /**
   * 根据操作日志ID查询操作日志
   * @param {number} operId - 操作日志ID
   * @return {object} 操作日志信息
   */
  async selectOperLogById(operId) {
    const { ctx } = this;

    const operLogList = await ctx.helper
      .getDB(ctx)
      .sysOperLogMapper.selectOperLogById([], { operId });

    return operLogList && operLogList.length > 0 ? operLogList[0] : null;
  }

  /**
   * 删除操作日志
   * @param {array} operIds - 操作日志ID数组
   * @return {object} 删除结果
   */
  async deleteOperLogByIds(operIds) {
    const { ctx } = this;

    // 删除操作日志
    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysOperLogMapper.deleteOperLogByIds([], { array: operIds });

    return result;
  }

  /**
   * 清空操作日志
   */
  async cleanOperLog() {
    const { ctx } = this;

    // 清空操作日志
    await ctx.helper.getDB(ctx).sysOperLogMapper.cleanOperLog();
  }

  /**
   * 记录操作日志
   * @param {object} operLog - 操作日志对象
   */
  async recordOperLog(operLog) {
    const { ctx } = this;

    try {
      const log = {
        title: operLog.title || "",
        businessType: operLog.businessType || 0,
        method: operLog.method || "",
        requestMethod: operLog.requestMethod || ctx.method,
        operatorType: operLog.operatorType || 0,
        operName:
          operLog.operName || (ctx.state.user ? ctx.state.user.userName : ""),
        deptName: operLog.deptName || "",
        operUrl: operLog.operUrl || ctx.url,
        operIp: operLog.operIp || ctx.helper.getClientIP(ctx),
        operLocation: operLog.operLocation || "",
        operParam: operLog.operParam || JSON.stringify(ctx.request.body),
        jsonResult: operLog.jsonResult || "",
        status: operLog.status || "0",
        errorMsg: operLog.errorMsg || "",
        costTime: operLog.costTime || 0,
        operTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      };

      // 异步写入数据库
      await ctx.helper.getMasterDB(ctx).sysOperLogMapper.insertOperlog([], log);
    } catch (err) {
      ctx.logger.error("记录操作日志失败:", err);
    }
  }
}

module.exports = OperlogService;
