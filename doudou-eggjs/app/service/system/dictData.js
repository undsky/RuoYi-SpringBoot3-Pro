/*
 * @Description: 字典数据服务层
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Service = require('egg').Service;
const DictUtils = require('../../util/dictUtils');

class DictDataService extends Service {
  async selectDictDataPage(params = {}) {
    const { ctx } = this;
    const mapper = ctx.helper.getDB(ctx).sysDictDataMapper;

    return await ctx.helper.pageQuery(
      mapper.selectDictDataListMapper([], params),
      params,
      mapper.db()
    );
  }


  /**
   * 查询字典数据列表
   * @param {object} dictData - 查询参数
   * @return {array} 字典数据列表
   */
  async selectDictDataList(dictData = {}) {
    const { ctx } = this;
    
    // 查询条件
    const conditions = {
      dictType: dictData.dictType,
      dictLabel: dictData.dictLabel,
      status: dictData.status
    };

    // 查询列表
    const dictDataList = await ctx.helper.getDB(ctx).sysDictDataMapper.selectDictDataList([], conditions);
    
    return dictDataList || [];
  }

  /**
   * 根据字典数据ID查询字典数据
   * @param {number} dictCode - 字典数据ID
   * @return {object} 字典数据信息
   */
  async selectDictDataById(dictCode) {
    const { ctx } = this;
    
    return await ctx.helper.getDB(ctx).sysDictDataMapper.selectDictDataById([], {dictCode});
  }

  /**
   * 根据字典类型查询字典数据
   * @param {string} dictType - 字典类型
   * @return {array} 字典数据列表
   */
  async selectDictDataByType(dictType) {
    const { ctx, app } = this;
    
    // 先从缓存获取
    let dictDatas = await DictUtils.getDictCache(app, dictType);
    
    if (dictDatas && dictDatas.length > 0) {
      return dictDatas;
    }
    
    // 从数据库查询
    dictDatas = await ctx.helper.getDB(ctx).sysDictDataMapper.selectDictDataByType([], {dictType});
    
    // 存入缓存
    if (dictDatas && dictDatas.length > 0) {
      await DictUtils.setDictCache(app, dictType, dictDatas);
      return dictDatas;
    }
    
    return [];
  }

  /**
   * 新增字典数据
   * @param {object} dictData - 字典数据对象
   * @return {number} 影响行数
   */
  async insertDictData(dictData) {
    const { ctx, app } = this;
    
    // 设置创建信息
    dictData.createBy = ctx.state.user.userName;
    
    // 插入字典数据
    const result = await ctx.helper.getMasterDB(ctx).sysDictDataMapper.insertDictData([], dictData);
    
    // 更新缓存
    if (result > 0) {
      const dictDatas = await ctx.helper.getDB(ctx).sysDictDataMapper.selectDictDataByType([], {dictType: dictData.dictType});
      await DictUtils.setDictCache(app, dictData.dictType, dictDatas);
      return 1;
    }
    
    return 0;
  }

  /**
   * 修改字典数据
   * @param {object} dictData - 字典数据对象
   * @return {number} 影响行数
   */
  async updateDictData(dictData) {
    const { ctx, app } = this;
    
    // 设置更新信息
    dictData.updateBy = ctx.state.user.userName;
    
    // 更新字典数据
    const result = await ctx.helper.getMasterDB(ctx).sysDictDataMapper.updateDictData([], dictData);
    
    // 更新缓存
    if (result > 0) {
      const dictDatas = await ctx.helper.getDB(ctx).sysDictDataMapper.selectDictDataByType([], {dictType: dictData.dictType});
      await DictUtils.setDictCache(app, dictData.dictType, dictDatas);
      return 1;
    }
    
    return 0;
  }

  /**
   * 删除字典数据
   * @param {array} dictCodes - 字典数据 ID数组
   * @return {number} 影响行数
   */
  async deleteDictDataByIds(dictCodes) {
    const { ctx, app } = this;
    
    let deletedCount = 0;
    const dictTypes = new Set();
    
    for (const dictCode of dictCodes) {
      // 查询字典数据
      const dictData = await this.selectDictDataById(dictCode);
      
      if (!dictData) {
        continue;
      }
      
      // 删除字典数据
      await ctx.helper.getMasterDB(ctx).sysDictDataMapper.deleteDictDataById([], {dictCode});
      
      // 记录需要更新缓存的字典类型
      dictTypes.add(dictData.dictType);
      deletedCount++;
    }
    
    // 更新缓存
    for (const dictType of dictTypes) {
      const dictDatas = await ctx.helper.getDB(ctx).sysDictDataMapper.selectDictDataByType([], {dictType});
      await DictUtils.setDictCache(app, dictType, dictDatas);
    }
    
    return deletedCount;
  }

}

module.exports = DictDataService;


