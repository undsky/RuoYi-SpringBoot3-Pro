/*
 * @Description: 参数配置服务层
 * @Author: AI Assistant
 * @Date: 2025-10-23
 */

const Service = require('egg').Service;
const { CacheConstants } = require('../../constant');

class ConfigService extends Service {
  async selectConfigPage(params = {}) {
    const { ctx } = this;
    const mapper = ctx.helper.getDB(ctx).sysConfigMapper;

    return await ctx.helper.pageQuery(
      mapper.selectConfigListMapper([], params),
      params,
      mapper.db()
    );
  }


  /**
   * 查询参数配置列表
   * @param {object} config - 查询参数
   * @return {array} 参数配置列表
   */
  async selectConfigList(config = {}) {
    const { ctx } = this;
    
    // 查询条件
    const conditions = {
      configName: config.configName,
      configKey: config.configKey,
      configType: config.configType,
      params: {
        beginTime: config.beginTime,
        endTime: config.endTime
      }
    };

    // 查询列表
    const configs = await ctx.helper.getDB(ctx).sysConfigMapper.selectConfigList([], conditions);
    
    return configs || [];
  }

  /**
   * 根据参数ID查询参数配置
   * @param {number} configId - 参数ID
   * @return {object} 参数配置信息
   */
  async selectConfigById(configId) {
    const { ctx } = this;
    
    return await ctx.helper.getDB(ctx).sysConfigMapper.selectConfigById([], {configId});
  }

  /**
   * 根据键名查询参数配置值
   * @param {string} configKey - 参数键名
   * @return {string} 参数键值
   */
  async selectConfigByKey(configKey) {
    const { ctx, app } = this;
    
    // 先从缓存中获取
    const cacheKey = CacheConstants.SYS_CONFIG_KEY + configKey;
    let configValue = await app.cache.default.get(cacheKey);
    
    if (configValue) {
      return configValue;
    }
    
    // 从数据库查询
    const conditions = {
      configKey
    };
    
    const configs = await ctx.helper.getDB(ctx).sysConfigMapper.selectConfig([], conditions);
    
    if (configs) {
      configValue = configs.configValue;
      
      // 存入缓存（不过期）
      await app.cache.default.set(cacheKey, configValue, 0);
      
      return configValue;
    }
    
    return '';
  }

  /**
   * 校验参数键名是否唯一
   * @param {object} config - 参数配置对象
   * @return {boolean} true-唯一 false-不唯一
   */
  async checkConfigKeyUnique(config) {
    const { ctx } = this;
    
    const configId = config.configId || -1;
    const configs = await ctx.helper.getDB(ctx).sysConfigMapper.checkConfigKeyUnique([], {configKey: config.configKey});
    
    if (configs && configs.length > 0 && configs[0].configId !== configId) {
      return false;
    }
    
    return true;
  }

  /**
   * 新增参数配置
   * @param {object} config - 参数配置对象
   * @return {number} 影响行数
   */
  async insertConfig(config) {
    const { ctx, app } = this;
    
    // 设置创建信息
    config.createBy = ctx.state.user.userName;
    
    // 插入参数配置
    const result = await ctx.helper.getMasterDB(ctx).sysConfigMapper.insertConfig([], config);
    
    // 更新缓存
    if (result > 0) {
      const cacheKey = CacheConstants.SYS_CONFIG_KEY + config.configKey;
      await app.cache.default.set(cacheKey, config.configValue, 0);
      return 1;
    }
    
    return 0;
  }

  /**
   * 修改参数配置
   * @param {object} config - 参数配置对象
   * @return {number} 影响行数
   */
  async updateConfig(config) {
    const { ctx, app } = this;
    
    // 查询旧的参数配置
    const oldConfig = await this.selectConfigById(config.configId);
    
    // 设置更新信息
    config.updateBy = ctx.state.user.userName;
    
    // 更新参数配置
    const result = await ctx.helper.getMasterDB(ctx).sysConfigMapper.updateConfig([], config);
    
    // 更新缓存
    if (result > 0) {
      // 如果键名改变，删除旧的缓存
      if (oldConfig && oldConfig.configKey !== config.configKey) {
        const oldCacheKey = CacheConstants.SYS_CONFIG_KEY + oldConfig.configKey;
        await app.cache.default.del(oldCacheKey);
      }
      
      // 更新新的缓存
      const cacheKey = CacheConstants.SYS_CONFIG_KEY + config.configKey;
      await app.cache.default.set(cacheKey, config.configValue, 0);
      
      return 1;
    }
    
    return 0;
  }

  /**
   * 删除参数配置
   * @param {array} configIds - 参数ID数组
   * @return {number} 影响行数
   */
  async deleteConfigByIds(configIds) {
    const { ctx, app } = this;
    
    let deletedCount = 0;
    
    for (const configId of configIds) {
      // 查询参数配置
      const config = await this.selectConfigById(configId);
      
      if (!config) {
        continue;
      }
      
      // 检查是否为内置参数
      if (config.configType === 'Y') {
        throw new Error(`内置参数【${config.configKey}】不能删除`);
      }
      
      // 删除参数配置
      await ctx.helper.getMasterDB(ctx).sysConfigMapper.deleteConfigById([], {configId});
      
      // 删除缓存
      const cacheKey = CacheConstants.SYS_CONFIG_KEY + config.configKey;
      await app.cache.default.del(cacheKey);
      
      deletedCount++;
    }
    
    return deletedCount;
  }

  /**
   * 加载参数缓存
   */
  async loadingConfigCache() {
    const { ctx, app } = this;
    
    // 查询所有参数配置
    const configs = await this.selectConfigList({});
    
    // 存入缓存
    for (const config of configs) {
      const cacheKey = CacheConstants.SYS_CONFIG_KEY + config.configKey;
      await app.cache.default.set(cacheKey, config.configValue, 0);
    }
    
    ctx.logger.info('参数配置缓存加载完成');
  }

  /**
   * 清空参数缓存
   */
  async clearConfigCache() {
    const { app } = this;
    
    // 获取所有缓存键
    const keys = await app.cache.default.keys(CacheConstants.SYS_CONFIG_KEY + '*');
    
    // 删除所有参数缓存
    for (const key of keys) {
      await app.cache.default.del(key);
    }
  }

  /**
   * 重置参数缓存
   */
  async resetConfigCache() {
    // 清空缓存
    await this.clearConfigCache();
    
    // 重新加载缓存
    await this.loadingConfigCache();
  }
}

module.exports = ConfigService;


