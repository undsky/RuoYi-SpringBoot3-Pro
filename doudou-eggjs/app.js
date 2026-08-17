/*
 * @Description: 应用启动文件
 * @Author: 姜彦汐
 * @Date: 2025-11-22
 */

const DictUtils = require('./app/util/dictUtils');

class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  /**
   * 应用启动完成后执行
   */
  async didReady() {
    const { app } = this;
    
    // 创建一个临时上下文用于数据库查询
    const ctx = app.createAnonymousContext();
    
    try {
      // 加载字典缓存
      await DictUtils.loadingDictCache(app, ctx);
      app.logger.info('✅ 字典缓存初始化完成');
    } catch (error) {
      app.logger.error('❌ 字典缓存初始化失败:', error);
    }

    try {
      // 加载参数配置缓存
      await ctx.service.system.config.loadingConfigCache();
      app.logger.info('✅ 参数配置缓存初始化完成');
    } catch (error) {
      app.logger.error('❌ 参数配置缓存初始化失败:', error);
    }
  }

  /**
   * 应用启动前执行
   */
  async willReady() {
    // 可以在这里执行一些启动前的准备工作
  }

  /**
   * 服务器关闭前执行
   */
  async beforeClose() {
    // 可以在这里执行一些清理工作
  }
}

module.exports = AppBootHook;
