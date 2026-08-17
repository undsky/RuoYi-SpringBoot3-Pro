/*
 * @Description: 字典类型服务层
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Service = require('egg').Service;
const DictUtils = require('../../util/dictUtils');

class DictTypeService extends Service {
  async selectDictTypePage(params = {}) {
    const { ctx } = this;
    const mapper = ctx.helper.getDB(ctx).sysDictTypeMapper;

    return await ctx.helper.pageQuery(
      mapper.selectDictTypeListMapper([], params),
      params,
      mapper.db()
    );
  }


  /**
   * 查询字典类型列表
   * @param {object} dictType - 查询参数
   * @return {array} 字典类型列表
   */
  async selectDictTypeList(dictType = {}) {
    const { ctx } = this;
    
    // 查询条件
    const conditions = {
      dictName: dictType.dictName,
      dictType: dictType.dictType,
      status: dictType.status,
      params: {
        beginTime: dictType.beginTime,
        endTime: dictType.endTime
      }
    };

    // 查询列表
    const dictTypes = await ctx.helper.getDB(ctx).sysDictTypeMapper.selectDictTypeList([], conditions);
    
    return dictTypes || [];
  }

  /**
   * 查询所有字典类型
   * @return {array} 字典类型列表
   */
  async selectDictTypeAll() {
    const { ctx } = this;
    
    const dictTypes = await ctx.helper.getDB(ctx).sysDictTypeMapper.selectDictTypeAll();
    
    return dictTypes || [];
  }

  /**
   * 根据字典ID查询字典类型
   * @param {number} dictId - 字典ID
   * @return {object} 字典类型信息
   */
  async selectDictTypeById(dictId) {
    const { ctx } = this;
    
    return await ctx.helper.getDB(ctx).sysDictTypeMapper.selectDictTypeById([], {dictId});
  }

  /**
   * 根据字典类型查询字典类型
   * @param {string} dictType - 字典类型
   * @return {object} 字典类型信息
   */
  async selectDictTypeByType(dictType) {
    const { ctx } = this;
    
    const dictTypes = await ctx.helper.getDB(ctx).sysDictTypeMapper.selectDictTypeByType([], {dictType});
    
    return dictTypes && dictTypes.length > 0 ? dictTypes[0] : null;
  }

  /**
   * 校验字典类型是否唯一
   * @param {object} dictType - 字典类型对象
   * @return {boolean} true-唯一 false-不唯一
   */
  async checkDictTypeUnique(dictType) {
    const { ctx } = this;
    
    const dictId = dictType.dictId || -1;
    const dictTypes = await ctx.helper.getDB(ctx).sysDictTypeMapper.checkDictTypeUnique([], {dictType: dictType.dictType});
    
    if (dictTypes && dictTypes.length > 0 && dictTypes[0].dictId !== dictId) {
      return false;
    }
    
    return true;
  }

  /**
   * 新增字典类型
   * @param {object} dictType - 字典类型对象
   * @return {number} 影响行数
   */
  async insertDictType(dictType) {
    const { ctx, app } = this;
    
    // 设置创建信息
    dictType.createBy = ctx.state.user.userName;
    
    // 插入字典类型
    const result = await ctx.helper.getMasterDB(ctx).sysDictTypeMapper.insertDictType([], dictType);
    
    // 设置空缓存
    if (result > 0) {
      await DictUtils.setDictCache(app, dictType.dictType, []);
      return 1;
    }
    
    return 0;
  }

  /**
   * 修改字典类型
   * @param {object} dictType - 字典类型对象
   * @return {number} 影响行数
   */
  async updateDictType(dictType) {
    const { ctx, app } = this;
    
    // 查询旧的字典类型
    const oldDict = await this.selectDictTypeById(dictType.dictId);
    
    // 设置更新信息
    dictType.updateBy = ctx.state.user.userName;
    
    // 更新字典类型
    const result = await ctx.helper.getMasterDB(ctx).sysDictTypeMapper.updateDictType([], dictType);
    
    // 如果字典类型改变，需要更新字典数据表中的类型
    if (oldDict && oldDict.dictType !== dictType.dictType) {
      await ctx.helper.getMasterDB(ctx).sysDictDataMapper.updateDictDataType([], {oldDictType: oldDict.dictType, newDictType: dictType.dictType});
    }
    
    // 更新缓存
    if (result > 0) {
      const dictDatas = await ctx.helper.getDB(ctx).sysDictDataMapper.selectDictDataByType([], {dictType: dictType.dictType});
      await DictUtils.setDictCache(app, dictType.dictType, dictDatas);
      return 1;
    }
    
    return 0;
  }

  /**
   * 删除字典类型
   * @param {array} dictIds - 字典ID数组
   * @return {number} 影响行数
   */
  async deleteDictTypeByIds(dictIds) {
    const { ctx, app } = this;
    
    let deletedCount = 0;
    
    for (const dictId of dictIds) {
      // 查询字典类型
      const dictType = await this.selectDictTypeById(dictId);
      
      if (!dictType) {
        continue;
      }
      
      // 检查是否有字典数据
      const count = await ctx.helper.getDB(ctx).sysDictDataMapper.countDictDataByType([], {dictType: dictType.dictType});
      const dataCount = count ? (Number(count.count || count['count(1)']) || 0) : 0;
      
      if (dataCount > 0) {
        throw new Error(`${dictType.dictName}已分配,不能删除`);
      }
      
      // 删除字典类型
      await ctx.helper.getMasterDB(ctx).sysDictTypeMapper.deleteDictTypeById([], {dictId});
      
      // 删除对应缓存
      await DictUtils.removeDictCache(app, dictType.dictType);
      deletedCount++;
    }
    
    return deletedCount;
  }

  /**
   * 加载字典缓存
   */
  async loadingDictCache() {
    const { ctx, app } = this;
    await DictUtils.loadingDictCache(app, ctx);
  }

  /**
   * 清空字典缓存
   */
  async clearDictCache() {
    const { app } = this;
    await DictUtils.clearDictCache(app);
  }

  /**
   * 重置字典缓存
   */
  async resetDictCache() {
    const { ctx, app } = this;
    await DictUtils.resetDictCache(app, ctx);
  }
}

module.exports = DictTypeService;


