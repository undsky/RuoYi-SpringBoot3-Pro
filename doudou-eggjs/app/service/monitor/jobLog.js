/**
 * 定时任务调度日志服务层
 * @Author: 姜彦汐
 * @Date: 2025-11-08
 */

const Service = require('egg').Service;

class JobLogService extends Service {
  async selectJobLogPage(params = {}) {
    const { ctx } = this;
    const mapper = ctx.helper.getDB(ctx).sysJobLogMapper;

    return await ctx.helper.pageQuery(
      mapper.selectJobLogListMapper([], params),
      params,
      mapper.db()
    );
  }


  /**
   * 查询调度日志列表
   * @param {object} page - 分页参数 {pageNum, pageSize}
   * @param {object} jobLog - 查询条件
   * @return {array} 调度日志列表
   */
  async selectJobLogList(page, jobLog = {}) {
    const { ctx } = this;
    
    try {
      const mapper = ctx.helper.getDB(ctx).sysJobLogMapper;
      
      // 构造分页参数
      const values = ctx.helper.page({ pageNum: page.pageNum, pageSize: page.pageSize });
      
      // 构造查询参数，支持时间范围查询
      const params = {
        ...jobLog,
        params: {
          beginTime: jobLog.beginTime,
          endTime: jobLog.endTime
        }
      };
      
      // 查询日志列表
      const list = await mapper.selectJobLogList(
        [values.offset, values.pageSize],
        params
      );
      
      return list || [];
    } catch (err) {
      ctx.logger.error('查询调度日志列表失败:', err);
      throw err;
    }
  }


  /**
   * 根据日志ID查询调度日志
   * @param {number} jobLogId - 日志ID
   * @return {object} 调度日志信息
   */
  async selectJobLogById(jobLogId) {
    const { ctx } = this;
    
    try {
      const mapper = ctx.helper.getDB(ctx).sysJobLogMapper;
      const result = await mapper.selectJobLogById([jobLogId]);
      
      return result && result[0] ? result[0] : null;
    } catch (err) {
      ctx.logger.error('查询调度日志详情失败:', err);
      throw err;
    }
  }

  /**
   * 新增调度日志
   * @param {object} jobLog - 调度日志信息
   * @return {number} 影响行数
   */
  async insertJobLog(jobLog) {
    const { ctx } = this;
    
    try {
      const mapper = ctx.helper.getDB(ctx).sysJobLogMapper;
      
      // 设置创建时间
      if (!jobLog.createTime) {
        jobLog.createTime = ctx.helper.formatDate(new Date());
      }
      
      // 插入日志
      const result = await mapper.insertJobLog([],jobLog);
      
      return result.affectedRows;
    } catch (err) {
      ctx.logger.error('新增调度日志失败:', err);
      throw err;
    }
  }

  /**
   * 批量删除调度日志
   * @param {array} jobLogIds - 调度日志ID数组
   * @return {number} 影响行数
   */
  async deleteJobLogByIds(jobLogIds) {
    const { ctx } = this;
    
    try {
      const mapper = ctx.helper.getDB(ctx).sysJobLogMapper;
      const result = await mapper.deleteJobLogByIds([jobLogIds]);
      
      return result.affectedRows;
    } catch (err) {
      ctx.logger.error('删除调度日志失败:', err);
      throw err;
    }
  }

  /**
   * 删除单条调度日志
   * @param {number} jobLogId - 调度日志ID
   * @return {number} 影响行数
   */
  async deleteJobLogById(jobLogId) {
    const { ctx } = this;
    
    try {
      const mapper = ctx.helper.getDB(ctx).sysJobLogMapper;
      const result = await mapper.deleteJobLogById([jobLogId]);
      
      return result.affectedRows;
    } catch (err) {
      ctx.logger.error('删除调度日志失败:', err);
      throw err;
    }
  }

  /**
   * 清空调度日志
   * @return {number} 影响行数
   */
  async cleanJobLog() {
    const { ctx } = this;
    
    try {
      const mapper = ctx.helper.getDB(ctx).sysJobLogMapper;
      const result = await mapper.cleanJobLog([]);
      
      return result.affectedRows || 0;
    } catch (err) {
      ctx.logger.error('清空调度日志失败:', err);
      throw err;
    }
  }

  /**
   * 根据日期删除调度日志
   * @param {string} beforeDate - 删除此日期之前的日志
   * @return {number} 影响行数
   */
  async deleteJobLogByDate(beforeDate) {
    const { ctx } = this;
    
    try {
      // 查询要删除的日志ID列表
      const params = {
        params: {
          endTime: beforeDate
        }
      };
      
      const mapper = ctx.helper.getDB(ctx).sysJobLogMapper;
      const list = await mapper.selectJobLogList([], params);
      
      if (!list || list.length === 0) {
        return 0;
      }

      // 批量删除
      const jobLogIds = list.map(log => log.jobLogId);
      const result = await mapper.deleteJobLogByIds([jobLogIds]);
      
      return result.affectedRows;
    } catch (err) {
      ctx.logger.error('根据日期删除调度日志失败:', err);
      throw err;
    }
  }

  /**
   * 记录任务执行日志
   * @param {string} jobName - 任务名称
   * @param {string} jobGroup - 任务组名
   * @param {string} invokeTarget - 调用目标
   * @param {string} status - 执行状态 (0成功 1失败)
   * @param {string} jobMessage - 日志信息
   * @param {string} exceptionInfo - 异常信息
   */
  async recordJobLog(jobName, jobGroup, invokeTarget, status, jobMessage, exceptionInfo = '') {
    const { ctx } = this;
    
    try {
      const jobLog = {
        jobName,
        jobGroup,
        invokeTarget,
        status,
        jobMessage,
        exceptionInfo: exceptionInfo.substring(0, 2000), // 限制长度
        createTime: ctx.helper.formatDate(new Date())
      };
      
      await this.insertJobLog(jobLog);
    } catch (err) {
      ctx.logger.error('记录任务执行日志失败:', err);
      // 不抛出异常，避免影响主流程
    }
  }

  /**
   * 导出调度日志
   * @param {array} list - 调度日志列表
   * @return {buffer} Excel 文件 Buffer
   */
  async exportJobLog(list) {
    const { ctx } = this;
    
    try {
      // 简化实现：返回 CSV 格式
      // 实际项目中建议使用 exceljs 或 xlsx 库生成真正的 Excel 文件
      const headers = [
        '日志编号',
        '任务名称',
        '任务组名',
        '调用目标',
        '日志信息',
        '执行状态',
        '异常信息',
        '执行时间'
      ];
      
      // 构造 CSV 数据
      let csv = headers.join(',') + '\n';
      
      list.forEach(item => {
        const row = [
          item.jobLogId,
          item.jobName,
          item.jobGroup,
          item.invokeTarget,
          item.jobMessage,
          item.status === '0' ? '成功' : '失败',
          item.exceptionInfo || '',
          item.createTime
        ];
        
        // 对包含逗号或引号的字段进行转义
        const escapedRow = row.map(cell => {
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        });
        
        csv += escapedRow.join(',') + '\n';
      });
      
      // 添加 BOM 以支持 Excel 正确识别 UTF-8 编码的中文
      return Buffer.from('\ufeff' + csv, 'utf8');
    } catch (err) {
      ctx.logger.error('导出调度日志失败:', err);
      throw err;
    }
  }

  /**
   * 获取任务执行统计信息
   * @param {object} params - 查询参数
   * @return {object} 统计信息
   */
  async getJobLogStatistics(params = {}) {
    const { ctx } = this;
    
    try {
      const mapper = ctx.helper.getDB(ctx).sysJobLogMapper;
      
      // 查询所有日志
      const queryParams = {
        ...params,
        params: {
          beginTime: params.beginTime,
          endTime: params.endTime
        }
      };
      
      const list = await mapper.selectJobLogList([], queryParams);
      
      // 统计成功和失败次数
      const statistics = {
        total: list.length,
        successCount: 0,
        failureCount: 0,
        successRate: 0
      };
      
      list.forEach(log => {
        if (log.status === '0') {
          statistics.successCount++;
        } else {
          statistics.failureCount++;
        }
      });
      
      // 计算成功率
      if (statistics.total > 0) {
        statistics.successRate = (statistics.successCount / statistics.total * 100).toFixed(2) + '%';
      }
      
      return statistics;
    } catch (err) {
      ctx.logger.error('获取任务执行统计信息失败:', err);
      throw err;
    }
  }
}

module.exports = JobLogService;

