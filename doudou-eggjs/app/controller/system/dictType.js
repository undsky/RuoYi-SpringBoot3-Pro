/*
 * @Description: 字典类型管理控制器
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpPost, HttpPut, HttpDelete } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');
const { Log, BusinessType } = require('../../decorator/log');
const ExcelUtil = require('../../extend/excel');

module.exports = app => {

  @Route('/system/dict/type')
  class DictTypeController extends Controller {

    /**
     * 获取字典类型列表（分页）
     * GET /api/system/dict/type/list
     * 权限：system:dict:list
     */
    @RequiresPermissions('system:dict:list')
    @HttpGet('/list')
    async list() {
      const { ctx, service } = this;

      try {
        const params = ctx.query;

        // 查询列表
        const result = await service.system.dictType.selectDictTypePage(params);

        ctx.body = {
          code: 200,
          msg: "查询成功",
          ...result,
        };
      } catch (err) {
        ctx.logger.error('查询字典类型列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询字典类型列表失败'
        };
      }
    }

    /**
     * 获取字典类型详情
     * GET /api/system/dict/type/:dictId
     * 权限：system:dict:query
     */
    @RequiresPermissions('system:dict:query')
    @HttpGet('/:dictId')
    async getInfo() {
      const { ctx, service } = this;
      
      try {
        const { dictId } = ctx.params;
        
        // 查询字典类型信息
        const dictType = await service.system.dictType.selectDictTypeById(parseInt(dictId));
        
        if (!dictType) {
          ctx.body = {
            code: 500,
            msg: '字典类型不存在'
          };
          return;
        }
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: dictType
        };
      } catch (err) {
        ctx.logger.error('查询字典类型详情失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询字典类型详情失败'
        };
      }
    }

    /**
     * 新增字典类型
     * POST /api/system/dict/type
     * 权限：system:dict:add
     */
    @Log({ title: '字典类型', businessType: BusinessType.INSERT })
    @RequiresPermissions('system:dict:add')
    @HttpPost('/')
    async add() {
      const { ctx, service } = this;
      
      try {
        const dictType = ctx.request.body;
        
        // 校验字典类型是否唯一
        const isDictTypeUnique = await service.system.dictType.checkDictTypeUnique(dictType);
        if (!isDictTypeUnique) {
          ctx.body = {
            code: 500,
            msg: `新增字典'${dictType.dictName}'失败，字典类型已存在`
          };
          return;
        }
        
        // 新增字典类型
        const rows = await service.system.dictType.insertDictType(dictType);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '新增成功' : '新增失败'
        };
      } catch (err) {
        ctx.logger.error('新增字典类型失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '新增字典类型失败'
        };
      }
    }

    /**
     * 修改字典类型
     * PUT /api/system/dict/type
     * 权限：system:dict:edit
     */
    @Log({ title: '字典类型', businessType: BusinessType.UPDATE })
    @RequiresPermissions('system:dict:edit')
    @HttpPut('/')
    async edit() {
      const { ctx, service } = this;
      
      try {
        const dictType = ctx.request.body;
        
        // 校验字典类型是否唯一
        const isDictTypeUnique = await service.system.dictType.checkDictTypeUnique(dictType);
        if (!isDictTypeUnique) {
          ctx.body = {
            code: 500,
            msg: `修改字典'${dictType.dictName}'失败，字典类型已存在`
          };
          return;
        }
        
        // 修改字典类型
        const rows = await service.system.dictType.updateDictType(dictType);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '修改成功' : '修改失败'
        };
      } catch (err) {
        ctx.logger.error('修改字典类型失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '修改字典类型失败'
        };
      }
    }

    /**
     * 删除字典类型
     * DELETE /api/system/dict/type/:dictIds
     * 权限：system:dict:remove
     */
    @Log({ title: '字典类型', businessType: BusinessType.DELETE })
    @RequiresPermissions('system:dict:remove')
    @HttpDelete('/:dictIds')
    async remove() {
      const { ctx, service } = this;
      
      try {
        const { dictIds } = ctx.params;
        
        // 解析字典ID数组
        const dictIdArray = dictIds.split(',').map(id => parseInt(id));
        
        // 删除字典类型
        const rows = await service.system.dictType.deleteDictTypeByIds(dictIdArray);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '删除成功' : '删除失败'
        };
      } catch (err) {
        ctx.logger.error('删除字典类型失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '删除字典类型失败'
        };
      }
    }

    /**
     * 刷新字典缓存
     * DELETE /api/system/dict/type/refreshCache
     * 权限：system:dict:remove
     */
    @Log({ title: '字典类型', businessType: BusinessType.CLEAN })
    @RequiresPermissions('system:dict:remove')
    @HttpDelete('/refreshCache')
    async refreshCache() {
      const { ctx, service } = this;
      
      try {
        // 重置字典缓存
        await service.system.dictType.resetDictCache();
        
        ctx.body = {
          code: 200,
          msg: '刷新成功'
        };
      } catch (err) {
        ctx.logger.error('刷新字典缓存失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '刷新字典缓存失败'
        };
      }
    }

    /**
     * 获取字典选择框列表
     * GET /api/system/dict/type/optionselect
     * 权限：system:dict:query
     */
    @RequiresPermissions('system:dict:query')
    @HttpGet('/optionselect')
    async optionselect() {
      const { ctx, service } = this;
      
      try {
        // 查询所有字典类型
        const dictTypes = await service.system.dictType.selectDictTypeAll();
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: dictTypes
        };
      } catch (err) {
        ctx.logger.error('查询字典选择框列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询字典选择框列表失败'
        };
      }
    }

    /**
     * 导出字典类型
     * POST /api/system/dict/type/export
     * 权限：system:dict:export
     */
    @RequiresPermissions('system:dict:export')
    @HttpPost('/export')
    async export() {
      const { ctx, service } = this;

      try {
        const params = ctx.request.body;

        // 查询字典类型列表
        const list = await service.system.dictType.selectDictTypeList(params);

        // 定义 Excel 列配置
        const columns = [
          { header: '字典编号', key: 'dictId', width: 12 },
          { header: '字典名称', key: 'dictName', width: 20 },
          { header: '字典类型', key: 'dictType', width: 20 },
          { header: '字典状态', key: 'statusText', width: 10 },
          { header: '创建时间', key: 'createTime', width: 20 },
          { header: '备注', key: 'remark', width: 30 },
        ];

        // 处理导出数据
        const exportData = list.map((dict) => ({
          ...dict,
          statusText: ExcelUtil.convertDictValue(dict.status, {
            0: '正常',
            1: '停用',
          }),
        }));

        // 导出 Excel
        ExcelUtil.exportExcel(ctx, exportData, columns, '字典类型数据');
      } catch (err) {
        ctx.logger.error('导出字典类型失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '导出字典类型失败',
        };
      }
    }
  }

  return DictTypeController;
};

