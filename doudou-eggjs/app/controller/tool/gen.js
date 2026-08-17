/*
 * @Description: 代码生成控制器
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpPost, HttpPut, HttpDelete } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');

module.exports = app => {

  @Route('/tool/gen')
  class GenController extends Controller {

    /**
     * 获取代码生成表列表（分页）
     * GET /api/tool/gen/list
     * 权限：tool:gen:list
     */
    @RequiresPermissions('tool:gen:list')
    @HttpGet('/list')
    async list() {
      const { ctx, service } = this;

      try {
        const params = ctx.query;

        // 查询列表
        const result = await service.tool.gen.selectGenTablePage(params);

        ctx.body = {
          code: 200,
          msg: "查询成功",
          ...result,
        };
      } catch (err) {
        ctx.logger.error('查询代码生成表列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询代码生成表列表失败'
        };
      }
    }

    /**
     * 查询数据库表列表（分页）
     * GET /api/tool/gen/db/list
     * 权限：tool:gen:list
     */
    @RequiresPermissions('tool:gen:list')
    @HttpGet('/db/list')
    async dbList() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.query;
        
        // 查询数据库表列表（使用 pageQuery 分页）
        const result = await service.tool.gen.selectDbTablePage(params);
        
        ctx.body = {
          code: 200,
          msg: '查询成功',
          ...result
        };
      } catch (err) {
        ctx.logger.error('查询数据库表列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询数据库表列表失败'
        };
      }
    }

    /**
     * 获取代码生成表详情
     * GET /api/tool/gen/:tableId
     * 权限：tool:gen:query
     */
    @RequiresPermissions('tool:gen:query')
    @HttpGet('/:tableId')
    async getInfo() {
      const { ctx, service } = this;
      
      try {
        const { tableId } = ctx.params;
        
        // 查询表信息（已包含列信息）
        const table = await service.tool.gen.selectGenTableById(parseInt(tableId));
        
        // 查询所有表信息（用于主子表选择）
        const tables = await service.tool.gen.selectGenTableAll();
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: {
            info: table,
            rows: table ? table.columns : [],
            tables: tables
          }
        };
      } catch (err) {
        ctx.logger.error('查询代码生成表详情失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询代码生成表详情失败'
        };
      }
    }

    /**
     * 查询表字段列表
     * GET /api/tool/gen/column/:tableId
     * 权限：tool:gen:query
     */
    @RequiresPermissions('tool:gen:query')
    @HttpGet('/column/:tableId')
    async columnList() {
      const { ctx, service } = this;
      
      try {
        const { tableId } = ctx.params;
        
        // 查询表字段
        const columns = await service.tool.gen.selectGenTableColumnListByTableId(parseInt(tableId));
        
        ctx.body = {
          code: 200,
          msg: '查询成功',
          rows: columns,
          total: columns.length
        };
      } catch (err) {
        ctx.logger.error('查询表字段列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询表字段列表失败'
        };
      }
    }

    /**
     * 导入表结构
     * POST /api/tool/gen/importTable
     * 权限：tool:gen:import
     */
    @RequiresPermissions('tool:gen:import')
    @HttpPost('/importTable')
    async importTable() {
      const { ctx, service } = this;
      
      try {
        const { tables } = ctx.query;
        
        // 解析表名数组
        const tableNames = typeof tables === 'string' ? tables.split(',') : tables;
        
        // 导入表结构
        const rows = await service.tool.gen.importGenTable(tableNames);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '导入成功' : '导入失败'
        };
      } catch (err) {
        ctx.logger.error('导入表结构失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '导入表结构失败'
        };
      }
    }

    /**
     * 创建表结构（保存）
     * POST /api/tool/gen/createTable
     * 权限：需要 admin 角色
     * 参照：GenController.createTableSave
     */
    @RequiresPermissions('tool:gen:import')
    @HttpPost('/createTable')
    async createTable() {
      const { ctx, service } = this;
      
      try {
        const { sql } = ctx.query;
        
        if (!sql) {
          ctx.body = {
            code: 500,
            msg: 'SQL 语句不能为空'
          };
          return;
        }
        
        // 创建表结构
        const result = await service.tool.gen.createTable(sql);
        
        ctx.body = {
          code: 200,
          msg: result.message,
          data: {
            tableNames: result.tableNames
          }
        };
      } catch (err) {
        ctx.logger.error('创建表结构失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '创建表结构异常'
        };
      }
    }

    /**
     * 修改代码生成配置
     * PUT /api/tool/gen
     * 权限：tool:gen:edit
     */
    @RequiresPermissions('tool:gen:edit')
    @HttpPut('/')
    async edit() {
      const { ctx, service } = this;
      
      try {
        const genTable = ctx.request.body;
        
        // 修改代码生成配置
        const rows = await service.tool.gen.updateGenTable(genTable);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '修改成功' : '修改失败'
        };
      } catch (err) {
        ctx.logger.error('修改代码生成配置失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '修改代码生成配置失败'
        };
      }
    }

    /**
     * 删除代码生成表配置
     * DELETE /api/tool/gen/:tableIds
     * 权限：tool:gen:remove
     */
    @RequiresPermissions('tool:gen:remove')
    @HttpDelete('/:tableIds')
    async remove() {
      const { ctx, service } = this;
      
      try {
        const { tableIds } = ctx.params;
        
        // 解析表ID数组
        const tableIdArray = tableIds.split(',').map(id => parseInt(id));
        
        // 删除代码生成表配置
        const rows = await service.tool.gen.deleteGenTableByIds(tableIdArray);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '删除成功' : '删除失败'
        };
      } catch (err) {
        ctx.logger.error('删除代码生成表配置失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '删除代码生成表配置失败'
        };
      }
    }

    

    /**
     * 预览代码
     * GET /api/tool/gen/preview/:tableId
     * 权限：tool:gen:preview
     */
    @RequiresPermissions('tool:gen:preview')
    @HttpGet('/preview/:tableId')
    async preview() {
      const { ctx, service } = this;
      
      try {
        const { tableId } = ctx.params;
        
        // 预览代码
        const codePreview = await service.tool.gen.previewCode(parseInt(tableId));
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: codePreview
        };
      } catch (err) {
        ctx.logger.error('预览代码失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '预览代码失败'
        };
      }
    }

    /**
     * 下载代码
     * GET /api/tool/gen/download/:tableName
     * 权限：tool:gen:code
     */
    @RequiresPermissions('tool:gen:code')
    @HttpGet('/download/:tableName')
    async download() {
      const { ctx, service } = this;
      
      try {
        const { tableName } = ctx.params;
        
        // 生成代码
        const codeZip = await service.tool.gen.downloadCode(tableName);
        
        // 设置响应头
        ctx.set('Content-Type', 'application/octet-stream');
        ctx.set('Content-Disposition', `attachment; filename=${tableName}.zip`);
        
        ctx.body = codeZip;
      } catch (err) {
        ctx.logger.error('下载代码失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '下载代码失败'
        };
      }
    }

    /**
     * 生成代码（自定义路径）
     * GET /api/tool/gen/genCode/:tableName
     * 权限：tool:gen:code
     */
    @RequiresPermissions('tool:gen:code')
    @HttpGet('/genCode/:tableName')
    async genCode() {
      const { ctx, service } = this;
      
      try {
        const { tableName } = ctx.params;
        
        // 生成代码到指定路径
        const rows = await service.tool.gen.genCode(tableName);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '生成成功' : '生成失败'
        };
      } catch (err) {
        ctx.logger.error('生成代码失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '生成代码失败'
        };
      }
    }

    /**
     * 同步数据库
     * GET /api/tool/gen/synchDb/:tableName
     * 权限：tool:gen:edit
     */
    @RequiresPermissions('tool:gen:edit')
    @HttpGet('/synchDb/:tableName')
    async synchDb() {
      const { ctx, service } = this;
      
      try {
        const { tableName } = ctx.params;
        
        // 同步数据库
        const rows = await service.tool.gen.synchDb(tableName);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '同步成功' : '同步失败'
        };
      } catch (err) {
        ctx.logger.error('同步数据库失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '同步数据库失败'
        };
      }
    }

    /**
     * 批量生成代码
     * GET /api/tool/gen/batchGenCode
     * 权限：tool:gen:code
     */
    @RequiresPermissions('tool:gen:code')
    @HttpGet('/batchGenCode')
    async batchGenCode() {
      const { ctx, service } = this;
      
      try {
        const { tables } = ctx.query;
        
        // 解析表名数组
        const tableNames = typeof tables === 'string' ? tables.split(',') : [];
        
        // 批量生成代码
        const codeZip = await service.tool.gen.batchGenCode(tableNames);
        
        // 设置响应头
        ctx.set('Content-Type', 'application/octet-stream');
        ctx.set('Content-Disposition', 'attachment; filename=doudou-gen.zip');
        
        ctx.body = codeZip;
      } catch (err) {
        ctx.logger.error('批量生成代码失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '批量生成代码失败'
        };
      }
    }
  }

  return GenController;
};

