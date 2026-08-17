/*
 * @Description: 字典工具类
 * @Author: 姜彦汐
 * @Date: 2025-11-22
 */

const { CacheConstants } = require('../constant');

/**
 * 字典工具类
 */
class DictUtils {
  /**
   * 获取分隔符
   */
  static get SEPARATOR() {
    return ',';
  }

  /**
   * 设置字典缓存
   * @param {object} app - 应用实例
   * @param {string} key - 字典类型
   * @param {array} dictDatas - 字典数据列表
   */
  static async setDictCache(app, key, dictDatas) {
    const cacheKey = this.getCacheKey(key);
    // 字典数据长期缓存（1小时），不传参数则使用配置的默认 TTL
    await app.cache.default.set(cacheKey, JSON.stringify(dictDatas || []));
  }

  /**
   * 获取字典缓存
   * @param {object} app - 应用实例
   * @param {string} key - 字典类型
   * @return {array} 字典数据列表
   */
  static async getDictCache(app, key) {
    const cacheKey = this.getCacheKey(key);
    const cacheData = await app.cache.default.get(cacheKey);

    if (cacheData) {
      try {
        return JSON.parse(cacheData);
      } catch (err) {
        console.error('解析字典缓存失败:', err);
        return null;
      }
    }

    return null;
  }

  /**
   * 根据字典类型和字典值获取字典标签
   * @param {object} app - 应用实例
   * @param {string} dictType - 字典类型
   * @param {string} dictValue - 字典值
   * @param {string} separator - 分隔符（可选）
   * @return {string} 字典标签
   */
  static async getDictLabel(app, dictType, dictValue, separator = this.SEPARATOR) {
    if (!dictValue) {
      return '';
    }

    const datas = await this.getDictCache(app, dictType);
    if (!datas || datas.length === 0) {
      return '';
    }

    // 如果值中包含分隔符，说明是多个值
    if (dictValue.includes(separator)) {
      const labels = [];
      const values = dictValue.split(separator);

      for (const dict of datas) {
        for (const value of values) {
          if (value === String(dict.dictValue)) {
            labels.push(dict.dictLabel);
            break;
          }
        }
      }

      return labels.join(separator);
    } else {
      // 单个值
      const dict = datas.find(d => String(d.dictValue) === String(dictValue));
      return dict ? dict.dictLabel : '';
    }
  }

  /**
   * 根据字典类型和字典标签获取字典值
   * @param {object} app - 应用实例
   * @param {string} dictType - 字典类型
   * @param {string} dictLabel - 字典标签
   * @param {string} separator - 分隔符（可选）
   * @return {string} 字典值
   */
  static async getDictValue(app, dictType, dictLabel, separator = this.SEPARATOR) {
    if (!dictLabel) {
      return '';
    }

    const datas = await this.getDictCache(app, dictType);
    if (!datas || datas.length === 0) {
      return '';
    }

    // 如果标签中包含分隔符，说明是多个标签
    if (dictLabel.includes(separator)) {
      const values = [];
      const labels = dictLabel.split(separator);

      for (const dict of datas) {
        for (const label of labels) {
          if (label === dict.dictLabel) {
            values.push(dict.dictValue);
            break;
          }
        }
      }

      return values.join(separator);
    } else {
      // 单个标签
      const dict = datas.find(d => d.dictLabel === dictLabel);
      return dict ? String(dict.dictValue) : '';
    }
  }

  /**
   * 根据字典类型获取所有字典值
   * @param {object} app - 应用实例
   * @param {string} dictType - 字典类型
   * @return {string} 字典值（逗号分隔）
   */
  static async getDictValues(app, dictType) {
    const datas = await this.getDictCache(app, dictType);
    if (!datas || datas.length === 0) {
      return '';
    }

    return datas.map(dict => dict.dictValue).join(this.SEPARATOR);
  }

  /**
   * 根据字典类型获取所有字典标签
   * @param {object} app - 应用实例
   * @param {string} dictType - 字典类型
   * @return {string} 字典标签（逗号分隔）
   */
  static async getDictLabels(app, dictType) {
    const datas = await this.getDictCache(app, dictType);
    if (!datas || datas.length === 0) {
      return '';
    }

    return datas.map(dict => dict.dictLabel).join(this.SEPARATOR);
  }

  /**
   * 删除指定字典缓存
   * @param {object} app - 应用实例
   * @param {string} key - 字典类型
   */
  static async removeDictCache(app, key) {
    const cacheKey = this.getCacheKey(key);
    await app.cache.default.del(cacheKey);
  }

  /**
   * 清空所有字典缓存
   * @param {object} app - 应用实例
   */
  static async clearDictCache(app) {
    const keys = await app.cache.default.keys(CacheConstants.SYS_DICT_KEY + '*');

    for (const key of keys) {
      await app.cache.default.del(key);
    }
  }

  /**
   * 设置缓存键
   * @param {string} configKey - 字典类型
   * @return {string} 缓存键
   */
  static getCacheKey(configKey) {
    return CacheConstants.SYS_DICT_KEY + configKey;
  }

  /**
   * 加载所有字典缓存
   * @param {object} app - 应用实例
   * @param {object} ctx - 上下文（用于数据库查询）
   */
  static async loadingDictCache(app, ctx) {
    // 查询所有正常状态的字典数据
    const dictDataList = await ctx.helper
      .getDB(ctx)
      .sysDictDataMapper.selectDictDataList([], { status: '0' });

    // 按字典类型分组
    const dictDataMap = {};
    dictDataList.forEach((data) => {
      if (!dictDataMap[data.dictType]) {
        dictDataMap[data.dictType] = [];
      }
      dictDataMap[data.dictType].push(data);
    });

    // 存入缓存（按 dictSort 排序）
    for (const dictType in dictDataMap) {
      const sortedData = dictDataMap[dictType].sort((a, b) => a.dictSort - b.dictSort);
      await this.setDictCache(app, dictType, sortedData);
    }

    ctx.logger.info('字典缓存加载完成');
  }

  /**
   * 重置字典缓存
   * @param {object} app - 应用实例
   * @param {object} ctx - 上下文
   */
  static async resetDictCache(app, ctx) {
    await this.clearDictCache(app);
    await this.loadingDictCache(app, ctx);
  }
}

module.exports = DictUtils;
