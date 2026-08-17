/*
 * @Description: 参数配置管理控制器
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpPost, HttpPut, HttpDelete } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');
const { Log, BusinessType } = require('../../decorator/log');
const ExcelUtil = require('../../extend/excel');

module.exports = app => {

  @Route('/system/config')
  class ConfigController extends Controller {

    /**
     * 获取参数配置列表（分页）
     * GET /api/system/config/list
     * 权限：system:config:list
     */
    @RequiresPermissions('system:config:list')
    @HttpGet('/list')
    async list() {
      const { ctx, service } = this;

      try {
        const params = ctx.query;

        // 查询列表
        const result = await service.system.config.selectConfigPage(params);

        ctx.body = {
          code: 200,
          msg: "查询成功",
          ...result,
        };
      } catch (err) {
        ctx.logger.error('查询参数配置列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询参数配置列表失败'
        };
      }
    }

    /**
     * 获取参数配置详情
     * GET /api/system/config/:configId
     * 权限：system:config:query
     */
    @RequiresPermissions('system:config:query')
    @HttpGet('/:configId')
    async getInfo() {
      const { ctx, service } = this;
      
      try {
        const { configId } = ctx.params;
        
        // 查询参数配置信息
        const config = await service.system.config.selectConfigById(parseInt(configId));
        
        if (!config) {
          ctx.body = {
            code: 500,
            msg: '参数配置不存在'
          };
          return;
        }
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: config
        };
      } catch (err) {
        ctx.logger.error('查询参数配置详情失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询参数配置详情失败'
        };
      }
    }

    /**
     * 根据参数键名查询参数值
     * GET /api/system/config/configKey/:configKey
     */
    @HttpGet('/configKey/:configKey')
    async getConfigKey() {
      const { ctx, service } = this;
      
      try {
        const { configKey } = ctx.params;
        
        // 查询参数值
        const configValue = await service.system.config.selectConfigByKey(configKey);
        
        ctx.body = {
          code: 200,
          msg: configValue
        };
      } catch (err) {
        ctx.logger.error('根据键名查询参数失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '根据键名查询参数失败'
        };
      }
    }

    /**
     * 新增参数配置
     * POST /api/system/config
     * 权限：system:config:add
     */
    @Log({ title: '参数管理', businessType: BusinessType.INSERT })
    @RequiresPermissions('system:config:add')
    @HttpPost('/')
    async add() {
      const { ctx, service } = this;
      
      try {
        const config = ctx.request.body;
        
        // 校验参数键名是否唯一
        const isConfigKeyUnique = await service.system.config.checkConfigKeyUnique(config);
        if (!isConfigKeyUnique) {
          ctx.body = {
            code: 500,
            msg: `新增参数'${config.configName}'失败，参数键名已存在`
          };
          return;
        }
        
        // 新增参数配置
        const rows = await service.system.config.insertConfig(config);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '新增成功' : '新增失败'
        };
      } catch (err) {
        ctx.logger.error('新增参数配置失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '新增参数配置失败'
        };
      }
    }

    /**
     * 修改参数配置
     * PUT /api/system/config
     * 权限：system:config:edit
     */
    @Log({ title: '参数管理', businessType: BusinessType.UPDATE })
    @RequiresPermissions('system:config:edit')
    @HttpPut('/')
    async edit() {
      const { ctx, service } = this;
      
      try {
        const config = ctx.request.body;
        
        // 校验参数键名是否唯一
        const isConfigKeyUnique = await service.system.config.checkConfigKeyUnique(config);
        if (!isConfigKeyUnique) {
          ctx.body = {
            code: 500,
            msg: `修改参数'${config.configName}'失败，参数键名已存在`
          };
          return;
        }
        
        // 修改参数配置
        const rows = await service.system.config.updateConfig(config);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '修改成功' : '修改失败'
        };
      } catch (err) {
        ctx.logger.error('修改参数配置失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '修改参数配置失败'
        };
      }
    }

    /**
     * 删除参数配置
     * DELETE /api/system/config/:configIds
     * 权限：system:config:remove
     */
    @Log({ title: '参数管理', businessType: BusinessType.DELETE })
    @RequiresPermissions('system:config:remove')
    @HttpDelete('/:configIds')
    async remove() {
      const { ctx, service } = this;
      
      try {
        const { configIds } = ctx.params;
        
        // 解析参数ID数组
        const configIdArray = configIds.split(',').map(id => parseInt(id));
        
        // 删除参数配置
        const rows = await service.system.config.deleteConfigByIds(configIdArray);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '删除成功' : '删除失败'
        };
      } catch (err) {
        ctx.logger.error('删除参数配置失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '删除参数配置失败'
        };
      }
    }

    /**
     * 刷新参数缓存
     * DELETE /api/system/config/refreshCache
     * 权限：system:config:remove
     */
    @Log({ title: '参数管理', businessType: BusinessType.CLEAN })
    @RequiresPermissions('system:config:remove')
    @HttpDelete('/refreshCache')
    async refreshCache() {
      const { ctx, service } = this;
      
      try {
        // 重置参数缓存
        await service.system.config.resetConfigCache();
        
        ctx.body = {
          code: 200,
          msg: '刷新成功'
        };
      } catch (err) {
        ctx.logger.error('刷新参数缓存失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '刷新参数缓存失败'
        };
      }
    }

    /**
     * 导出参数配置
     * POST /api/system/config/export
     * 权限：system:config:export
     */
    @RequiresPermissions('system:config:export')
    @HttpPost('/export')
    async export() {
      const { ctx, service } = this;

      try {
        const params = ctx.request.body;

        // 查询参数配置列表
        const list = await service.system.config.selectConfigList(params);

        // 定义 Excel 列配置
        const columns = [
          { header: '参数编号', key: 'configId', width: 12 },
          { header: '参数名称', key: 'configName', width: 25 },
          { header: '参数键名', key: 'configKey', width: 30 },
          { header: '参数键值', key: 'configValue', width: 20 },
          { header: '系统内置', key: 'configTypeText', width: 10 },
          { header: '创建时间', key: 'createTime', width: 20 },
          { header: '备注', key: 'remark', width: 30 },
        ];

        // 处理导出数据
        const exportData = list.map((config) => ({
          ...config,
          configTypeText: ExcelUtil.convertDictValue(config.configType, {
            Y: '是',
            N: '否',
          }),
        }));

        // 导出 Excel
        ExcelUtil.exportExcel(ctx, exportData, columns, '参数配置数据');
      } catch (err) {
        ctx.logger.error('导出参数配置失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '导出参数配置失败',
        };
      }
    }
  }

  return ConfigController;
};
