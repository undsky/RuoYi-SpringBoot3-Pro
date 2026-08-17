/*
 * @Description: 缓存监控控制器
 * @Author: 姜彦汐
 * @Date: 2025-11-21
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpDelete } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');

module.exports = app => {

  @Route('/monitor/cache')
  class CacheController extends Controller {

    /**
     * 获取缓存信息
     * GET /api/monitor/cache
     * 权限：monitor:cache:list
     */
    @RequiresPermissions('monitor:cache:list')
    @HttpGet('/')
    async getInfo() {
      const { ctx, service } = this;
      
      try {
        // 获取缓存信息
        const cacheInfo = await service.monitor.cache.getCacheInfo();
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: cacheInfo
        };
      } catch (err) {
        ctx.logger.error('获取缓存信息失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '获取缓存信息失败'
        };
      }
    }

    /**
     * 获取缓存名称列表
     * GET /api/monitor/cache/getNames
     * 权限：monitor:cache:list
     */
    @RequiresPermissions('monitor:cache:list')
    @HttpGet('/getNames')
    async getNames() {
      const { ctx, service } = this;
      
      try {
        // 获取缓存名称列表
        const cacheNames = service.monitor.cache.getCacheNames();
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: cacheNames
        };
      } catch (err) {
        ctx.logger.error('获取缓存名称列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '获取缓存名称列表失败'
        };
      }
    }

    /**
     * 获取缓存键名列表
     * GET /api/monitor/cache/getKeys/:cacheName
     * 权限：monitor:cache:list
     */
    @RequiresPermissions('monitor:cache:list')
    @HttpGet('/getKeys/:cacheName')
    async getCacheKeys() {
      const { ctx, service } = this;
      
      try {
        const { cacheName } = ctx.params;
        
        // 获取缓存键名列表
        const cacheKeys = await service.monitor.cache.getCacheKeys(cacheName);
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: cacheKeys
        };
      } catch (err) {
        ctx.logger.error('获取缓存键名列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '获取缓存键名列表失败'
        };
      }
    }

    /**
     * 获取缓存内容
     * GET /api/monitor/cache/getValue/:cacheName/:cacheKey
     * 权限：monitor:cache:list
     */
    @RequiresPermissions('monitor:cache:list')
    @HttpGet('/getValue/:cacheName/:cacheKey')
    async getCacheValue() {
      const { ctx, service } = this;
      
      try {
        const { cacheName, cacheKey } = ctx.params;
        
        // 获取缓存值
        const cacheData = await service.monitor.cache.getCacheValue(cacheName, cacheKey);
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: cacheData
        };
      } catch (err) {
        ctx.logger.error('获取缓存内容失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '获取缓存内容失败'
        };
      }
    }

    /**
     * 清空缓存名称
     * DELETE /api/monitor/cache/clearCacheName/:cacheName
     * 权限：monitor:cache:remove
     */
    @RequiresPermissions('monitor:cache:remove')
    @HttpDelete('/clearCacheName/:cacheName')
    async clearCacheName() {
      const { ctx, service } = this;
      
      try {
        const { cacheName } = ctx.params;
        
        // 清空缓存名称
        await service.monitor.cache.clearCacheName(cacheName);
        
        ctx.body = {
          code: 200,
          msg: '清空成功'
        };
      } catch (err) {
        ctx.logger.error('清空缓存名称失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '清空缓存名称失败'
        };
      }
    }

    /**
     * 清空缓存键值
     * DELETE /api/monitor/cache/clearCacheKey/:cacheKey
     * 权限：monitor:cache:remove
     */
    @RequiresPermissions('monitor:cache:remove')
    @HttpDelete('/clearCacheKey/:cacheKey')
    async clearCacheKey() {
      const { ctx, service } = this;
      
      try {
        const { cacheKey } = ctx.params;
        
        // 清空缓存键值
        await service.monitor.cache.clearCacheKey(cacheKey);
        
        ctx.body = {
          code: 200,
          msg: '清空成功'
        };
      } catch (err) {
        ctx.logger.error('清空缓存键值失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '清空缓存键值失败'
        };
      }
    }

    /**
     * 清空全部缓存
     * DELETE /api/monitor/cache/clearCacheAll
     * 权限：monitor:cache:remove
     */
    @RequiresPermissions('monitor:cache:remove')
    @HttpDelete('/clearCacheAll')
    async clearCacheAll() {
      const { ctx, service } = this;
      
      try {
        // 清空全部缓存
        await service.monitor.cache.clearCacheAll();
        
        ctx.body = {
          code: 200,
          msg: '清空成功'
        };
      } catch (err) {
        ctx.logger.error('清空全部缓存失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '清空全部缓存失败'
        };
      }
    }
  }

  return CacheController;
};

