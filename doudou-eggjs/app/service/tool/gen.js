/*
 * @Description: 代码生成服务层
 * @Author: 姜彦汐
 * @Date: 2025-11-08
 */

const Service = require('egg').Service;
const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');
const GenUtils = require('../../util/genUtils');
const VelocityUtils = require('../../util/velocityUtils');
const GenConstants = require('../../constant/genConstants');
const SqlUtils = require('../../util/sqlUtils');

class GenService extends Service {
  async selectGenTablePage(params = {}) {
    const { ctx } = this;
    const mapper = ctx.helper.getDB(ctx).genTableMapper;

    return await ctx.helper.pageQuery(
      mapper.selectGenTableListMapper([], params),
      params,
      mapper.db()
    );
  }


  /**
   * 查询代码生成表列表
   * @param {object} genTable - 查询参数
   * @return {array} 代码生成表列表
   */
  async selectGenTableList(genTable = {}) {
    const { ctx } = this;
    
    try {
      const result = await ctx.helper.getDB(ctx).genTableMapper.selectGenTableList(
        [],
        genTable
      );
      
      return result || [];
    } catch (err) {
      ctx.logger.error('查询代码生成表列表失败:', err);
      return [];
    }
  }

  /**
   * 查询数据库表列表（分页）
   * @param {object} params - 查询参数
   * @return {object} { rows, total }
   */
  async selectDbTablePage(params = {}) {
    const { ctx } = this;
    const mapper = ctx.helper.getDB(ctx).genTableMapper;

    return await ctx.helper.pageQuery(
      mapper.selectDbTableListMapper([], params),
      params,
      mapper.db()
    );
  }

  /**
   * 查询数据库表列表
   * @param {object} genTable - 查询参数
   * @return {array} 数据库表列表
   */
  async selectDbTableList(genTable = {}) {
    const { ctx } = this;
    
    try {
      const result = await ctx.helper.getDB(ctx).genTableMapper.selectDbTableList(
        [],
        genTable
      );
      
      return result || [];
    } catch (err) {
      ctx.logger.error('查询数据库表列表失败:', err);
      return [];
    }
  }

  /**
   * 根据表名查询数据库表列表
   * @param {array} tableNames - 表名数组
   * @return {array} 数据库表列表
   */
  async selectDbTableListByNames(tableNames) {
    const { ctx } = this;
    
    try {
      const result = await ctx.helper.getDB(ctx).genTableMapper.selectDbTableListByNames(
        [],
        { array: tableNames }
      );
      
      return result || [];
    } catch (err) {
      ctx.logger.error('查询数据库表列表失败:', err);
      return [];
    }
  }

  /**
   * 查询所有表信息
   * @return {array} 表信息集合
   */
  async selectGenTableAll() {
    const { ctx } = this;
    
    try {
      const result = await ctx.helper.getDB(ctx).genTableMapper.selectGenTableAll([]);
      
      return result || [];
    } catch (err) {
      ctx.logger.error('查询所有表信息失败:', err);
      return [];
    }
  }

  /**
   * 根据表ID查询代码生成表信息
   * @param {number} tableId - 表ID
   * @return {object} 表信息
   */
  async selectGenTableById(tableId) {
    const { ctx } = this;
    
    try {
      const result = await ctx.helper.getDB(ctx).genTableMapper.selectGenTableById([],{tableId});
      
      if (result != null && result.length > 0) {
        const genTable = result[0];
        await this.setTableFromOptions(genTable);
        // 查询列信息
        genTable.columns = await this.selectGenTableColumnListByTableId(tableId);
        
        // 调试日志
        ctx.logger.info(`查询表 ${tableId} 的列信息:`, {
          columnsType: typeof genTable.columns,
          isArray: Array.isArray(genTable.columns),
          columnsLength: Array.isArray(genTable.columns) ? genTable.columns.length : 'N/A',
          columns: genTable.columns
        });
        
        return genTable;
      }
      
      return null;
    } catch (err) {
      ctx.logger.error('查询代码生成表信息失败:', err);
      return null;
    }
  }

  /**
   * 根据表名查询代码生成表信息
   * @param {string} tableName - 表名
   * @return {object} 表信息
   */
  async selectGenTableByName(tableName) {
    const { ctx } = this;
    
    try {
      const result = await ctx.helper.getDB(ctx).genTableMapper.selectGenTableByName([],{tableName});
      
      if (result != null && result.length > 0) {
        const genTable = result[0];
        await this.setTableFromOptions(genTable);
        // 查询列信息
        genTable.columns = await this.selectGenTableColumnListByTableId(genTable.tableId);
        return genTable;
      }
      
      return null;
    } catch (err) {
      ctx.logger.error('查询代码生成表信息失败:', err);
      return null;
    }
  }

  /**
   * 查询表字段列表
   * @param {number} tableId - 表ID
   * @return {array} 字段列表
   */
  async selectGenTableColumnListByTableId(tableId) {
    const { ctx } = this;
    
    try {
      const result = await ctx.helper.getDB(ctx).genTableColumnMapper.selectGenTableColumnListByTableId([], { tableId });
      
      // 确保返回数组
      if (!result) {
        ctx.logger.warn(`查询表 ${tableId} 的字段列表为空`);
        return [];
      }
      
      if (!Array.isArray(result)) {
        ctx.logger.error(`查询表 ${tableId} 的字段列表不是数组:`, typeof result, result);
        return [];
      }
      
      // 处理以 is 开头的属性，生成不带 is 的对应属性
      result.forEach(column => {
        Object.keys(column).forEach(key => {
          // 如果属性名以 is 开头且长度大于 2
          if (key.startsWith('is') && key.length > 2) {
            // 生成不带 is 的属性名（首字母小写）
            const newKey = key.charAt(2).toLowerCase() + key.slice(3);
            // 兼容多种真值格式：'1', 1, 'true', true
            const value = column[key];
            column[newKey] = value === '1' || value === 1 || value === 'true' || value === true;
          }
        });

        // 补充缺失的 htmlType 默认值
        if (!column.htmlType || column.htmlType === null || column.htmlType === '') {
          column.htmlType = 'input';
        }
      });
      
      ctx.logger.info(`查询表 ${tableId} 的字段列表成功，共 ${result.length} 个字段`);
      return result;
    } catch (err) {
      ctx.logger.error('查询表字段列表失败:', err);
      return [];
    }
  }

  /**
   * 根据表名查询数据库表字段
   * @param {string} tableName - 表名
   * @return {array} 字段列表
   */
  async selectDbTableColumnsByName(tableName) {
    const { ctx } = this;
    
    try {
      const result = await ctx.helper.getDB(ctx).genTableColumnMapper.selectDbTableColumnsByName([], { tableName });
      
      // 确保返回数组
      if (!result) {
        ctx.logger.warn(`查询表 ${tableName} 的字段为空`);
        return [];
      }
      
      if (!Array.isArray(result)) {
        ctx.logger.warn(`查询表 ${tableName} 的字段结果不是数组:`, typeof result, result);
        return [];
      }
      
      return result;
    } catch (err) {
      ctx.logger.error('查询表字段失败:', err);
      return [];
    }
  }

  /**
   * 导入表结构
   * @param {array} tableNames - 表名数组
   * @return {number} 影响行数
   */
  async importGenTable(tableNames) {
    const { ctx } = this;
    
    try {
      const operName = ctx.state.user.userName || 'admin';
      
      // 查询表信息
      const tableList = await this.selectDbTableListByNames(tableNames);
      
      let count = 0;
      for (const table of tableList) {
        const tableName = table.tableName;
        
        // 初始化表信息
        GenUtils.initTable(table, operName);
        
        // 保存表信息
        const result = await ctx.helper.getMasterDB(ctx).genTableMapper.insertGenTable([],table);
        
        if (result > 0) {
          // 获取插入的表ID
          const tableId = result;
          
          // 保存列信息
          const genTableColumns = await this.selectDbTableColumnsByName(tableName);
          
          // 确保 genTableColumns 是数组
          if (!Array.isArray(genTableColumns)) {
            ctx.logger.error(`表 ${tableName} 的字段信息不是数组类型:`, typeof genTableColumns);
            throw new Error(`获取表 ${tableName} 的字段信息失败`);
          }
          
          if (genTableColumns.length === 0) {
            ctx.logger.warn(`表 ${tableName} 没有字段信息`);
          }
          
          for (const column of genTableColumns) {
            GenUtils.initColumnField(column, table);
            column.tableId = tableId;
            await ctx.helper.getMasterDB(ctx).genTableColumnMapper.insertGenTableColumn([],column);
          }
          
          count++;
        }
      }
      
      return count;
    } catch (err) {
      ctx.logger.error('导入表结构失败:', err);
      throw new Error('导入失败：' + err.message);
    }
  }

  /**
   * 修改代码生成配置
   * @param {object} genTable - 表配置
   * @return {number} 影响行数
   */
  async updateGenTable(genTable) {
    const { ctx } = this;
    
    try {
      // 序列化 options
      const options = JSON.stringify(genTable.params || {});
      genTable.options = options;
      
      // 更新表信息
      const result = await ctx.helper.getMasterDB(ctx).genTableMapper.updateGenTable([],genTable);
      
      if (result > 0) {
        // 更新列信息
        if (genTable.columns && genTable.columns.length > 0) {
          for (const column of genTable.columns) {
            await ctx.helper.getMasterDB(ctx).genTableColumnMapper.updateGenTableColumn([],column);
          }
        }
      }
      
      return result;
    } catch (err) {
      ctx.logger.error('修改代码生成配置失败:', err);
      throw new Error('修改失败：' + err.message);
    }
  }

  /**
   * 删除代码生成表配置
   * @param {array} tableIds - 表ID数组
   * @return {number} 影响行数
   */
  async deleteGenTableByIds(tableIds) {
    const { ctx } = this;
    
    try {
      // 删除列信息
      await ctx.helper.getMasterDB(ctx).genTableColumnMapper.deleteGenTableColumnByIds([],{array:tableIds});
      
      // 删除表信息
      const result = await ctx.helper.getMasterDB(ctx).genTableMapper.deleteGenTableByIds([],{array:tableIds});
      
      return result ? result.affectedRows : 0;
    } catch (err) {
      ctx.logger.error('删除代码生成表配置失败:', err);
      throw new Error('删除失败：' + err.message);
    }
  }

  /**
   * 预览代码
   * @param {number} tableId - 表ID
   * @return {object} 代码预览
   */
  async previewCode(tableId) {
    const { ctx, app } = this;
    
    try {
      // 查询表信息
      const table = await this.selectGenTableById(tableId);
      if (!table) {
        throw new Error('表信息不存在');
      }
      
      // 设置主子表信息
      await this.setSubTable(table);
      
      // 设置主键列信息
      this.setPkColumn(table);
      
      // 准备模板上下文
      const context = VelocityUtils.prepareContext(table);

      // 获取数据库驱动配置
      const dbDriver = (this.config.database && this.config.database.master && this.config.database.master.driver) || 'mysql';

      // 获取模板列表
      const templates = VelocityUtils.getTemplateList(table.tplCategory, table.tplWebType, dbDriver);

      console.log(`[预览代码] 数据库驱动: ${dbDriver}, 模板列表:`, templates);

      const dataMap = {};

      // 渲染每个模板
      for (const template of templates) {
        const templatePath = path.join(app.baseDir, 'app/templates', template);

        const exists = await fs.pathExists(templatePath);
        console.log(`[预览代码] 模板: ${template}, 路径: ${templatePath}, 存在: ${exists}`);

        if (exists) {
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          let code = VelocityUtils.render(templateContent, context);
          // 移除多余的空行
          code = VelocityUtils.removeExtraBlankLines(code);
          dataMap[template] = code;
        } else {
          ctx.logger.warn(`模板文件不存在: ${templatePath}`);
        }
      }
      
      return dataMap;
    } catch (err) {
      ctx.logger.error('预览代码失败:', err);
      throw new Error('预览失败：' + err.message);
    }
  }

  /**
   * 生成代码（下载）
   * @param {string} tableName - 表名
   * @return {Buffer} 代码压缩包
   */
  async downloadCode(tableName) {
    const { ctx } = this;
    
    try {
      // 查询表信息
      const table = await this.selectGenTableByName(tableName);
      if (!table) {
        throw new Error('表信息不存在');
      }

      // 清理 functionName 中的占位符
      if (table.functionName) {
        table.functionName = GenUtils.replaceText(table.functionName);
      }

      // 设置主子表信息
      await this.setSubTable(table);
      
      // 设置主键列信息
      this.setPkColumn(table);
      
      // 生成代码
      const codeMap = await this.generatorCode(table);
      
      // 创建 zip 压缩包
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });
      
      // 添加文件到压缩包
      for (const [fileName, content] of Object.entries(codeMap)) {
        archive.append(content, { name: fileName });
      }
      
      // 完成压缩
      archive.finalize();
      
      // 转换为 Buffer
      const chunks = [];
      archive.on('data', chunk => chunks.push(chunk));
      
      return new Promise((resolve, reject) => {
        archive.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        archive.on('error', reject);
      });
    } catch (err) {
      ctx.logger.error('生成代码失败:', err);
      throw new Error('生成失败：' + err.message);
    }
  }

  /**
   * 生成代码（自定义路径）
   * @param {string} tableName - 表名
   * @return {number} 影响行数
   */
  async genCode(tableName) {
    const { ctx, app } = this;
    
    try {
      // 查询表信息
      const table = await this.selectGenTableByName(tableName);
      if (!table) {
        throw new Error('表信息不存在');
      }

      // 清理 functionName 中的占位符
      if (table.functionName) {
        table.functionName = GenUtils.replaceText(table.functionName);
      }

      // 设置主子表信息
      await this.setSubTable(table);
      
      // 设置主键列信息
      this.setPkColumn(table);
      
      // 生成代码
      const codeMap = await this.generatorCode(table);
      
      // 写入文件
      let count = 0;
      for (const [fileName, content] of Object.entries(codeMap)) {
        // 排除 sql、api.js、vue 文件（这些通常不直接写入后端项目）
        if (!fileName.includes('.sql') && 
            !fileName.includes('api.js') && 
            !fileName.includes('.vue')) {
          const filePath = this.getGenPath(table, fileName);
          await fs.ensureDir(path.dirname(filePath));
          await fs.writeFile(filePath, content, 'utf-8');
          count++;
        }
      }
      
      return count;
    } catch (err) {
      ctx.logger.error('生成代码失败:', err);
      throw new Error('生成失败：' + err.message);
    }
  }

  /**
   * 同步数据库
   * @param {string} tableName - 表名
   * @return {number} 影响行数
   */
  async synchDb(tableName) {
    const { ctx } = this;
    
    try {
      // 查询表信息
      const table = await this.selectGenTableByName(tableName);
      if (!table) {
        throw new Error('表信息不存在');
      }
      
      const tableColumns = table.columns || [];
      const tableColumnMap = {};
      for (const column of tableColumns) {
        tableColumnMap[column.columnName] = column;
      }
      
      // 查询数据库表列
      const dbTableColumns = await this.selectDbTableColumnsByName(tableName);
      if (!dbTableColumns || dbTableColumns.length === 0) {
        throw new Error('同步数据失败，原表结构不存在');
      }
      
      const dbTableColumnNames = dbTableColumns.map(col => col.columnName);
      
      // 同步列信息
      for (const column of dbTableColumns) {
        GenUtils.initColumnField(column, table);
        
        if (tableColumnMap[column.columnName]) {
          // 更新已有列
          const prevColumn = tableColumnMap[column.columnName];
          column.columnId = prevColumn.columnId;
          
          if (column.isList === '1') {
            // 如果是列表，继续保留查询方式/字典类型选项
            column.dictType = prevColumn.dictType;
            column.queryType = prevColumn.queryType;
          }
          
          if (prevColumn.isRequired && !column.isPk &&
              (column.isInsert === '1' || column.isEdit === '1')) {
            // 继续保留必填/显示类型选项
            column.isRequired = prevColumn.isRequired;
            column.htmlType = prevColumn.htmlType;
          }
          
          await ctx.helper.getMasterDB(ctx).genTableColumnMapper.updateGenTableColumn([], column);
        } else {
          // 新增列
          column.tableId = table.tableId;
          await ctx.helper.getMasterDB(ctx).genTableColumnMapper.insertGenTableColumn([], column);
        }
      }
      
      // 删除不存在的列
      const delColumns = tableColumns.filter(col => !dbTableColumnNames.includes(col.columnName));
      if (delColumns.length > 0) {
        await ctx.helper.getMasterDB(ctx).genTableColumnMapper.deleteGenTableColumns([], {list:delColumns});
      }
      
      return 1;
    } catch (err) {
      ctx.logger.error('同步数据库失败:', err);
      throw new Error('同步失败：' + err.message);
    }
  }

  /**
   * 批量生成代码
   * @param {array} tableNames - 表名数组
   * @return {Buffer} 代码压缩包
   */
  async batchGenCode(tableNames) {
    const { ctx } = this;
    
    try {
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });
      
      for (const tableName of tableNames) {
        // 查询表信息
        const table = await this.selectGenTableByName(tableName);
        if (!table) {
          continue;
        }

        // 清理 functionName 中的占位符
        if (table.functionName) {
          table.functionName = GenUtils.replaceText(table.functionName);
        }

        // 设置主子表信息
        await this.setSubTable(table);

        // 设置主键列信息
        this.setPkColumn(table);

        // 生成代码
        const codeMap = await this.generatorCode(table);

        // 添加文件到压缩包
        for (const [fileName, content] of Object.entries(codeMap)) {
          archive.append(content, { name: fileName });
        }
      }
      
      // 完成压缩
      archive.finalize();
      
      // 转换为 Buffer
      const chunks = [];
      archive.on('data', chunk => chunks.push(chunk));
      
      return new Promise((resolve, reject) => {
        archive.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        archive.on('error', reject);
      });
    } catch (err) {
      ctx.logger.error('批量生成代码失败:', err);
      throw new Error('生成失败：' + err.message);
    }
  }

  /**
   * 生成代码
   * @param {object} table - 表信息
   * @return {object} 代码映射
   */
  async generatorCode(table) {
    const { app } = this;

    // 准备模板上下文
    const context = VelocityUtils.prepareContext(table);

    // 获取数据库驱动配置
    const dbDriver = (this.config.database && this.config.database.master && this.config.database.master.driver) || 'mysql';

    // 获取模板列表
    const templates = VelocityUtils.getTemplateList(table.tplCategory, table.tplWebType, dbDriver);

    const codeMap = {};

    // 渲染每个模板
    for (const template of templates) {
      const templatePath = path.join(app.baseDir, 'app/templates', template);

      const exists = await fs.pathExists(templatePath);
      console.log(`[代码生成] 模板: ${template}, 路径: ${templatePath}, 存在: ${exists}`);

      if (exists) {
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        let code = VelocityUtils.render(templateContent, context);
        // 移除多余的空行
        code = VelocityUtils.removeExtraBlankLines(code);
        const fileName = VelocityUtils.getFileName(template, table);
        console.log(`[代码生成] 生成文件: ${fileName}`);
        codeMap[fileName] = code;
      } else {
        console.warn(`[代码生成] 模板文件不存在: ${templatePath}`);
      }
    }
    
    return codeMap;
  }

  /**
   * 设置主键列信息
   * @param {object} table - 表信息
   */
  setPkColumn(table) {
    const { ctx } = this;
    
    // 确保 columns 是数组
    if (!table.columns) {
      ctx.logger.warn('表信息中缺少 columns 字段');
      table.columns = [];
    }
    
    if (!Array.isArray(table.columns)) {
      ctx.logger.error('表的 columns 不是数组类型:', typeof table.columns, table.columns);
      table.columns = [];
    }
    
    const columns = table.columns;
    
    for (const column of columns) {
      if (column.isPk === '1') {
        table.pkColumn = column;
        // 设置大写字段名
        column.capJavaField = GenUtils.capitalize(column.javaField);
        break;
      }
    }
    
    if (!table.pkColumn && columns.length > 0) {
      table.pkColumn = columns[0];
      table.pkColumn.capJavaField = GenUtils.capitalize(table.pkColumn.javaField);
    }
    
    // 处理子表
    if (table.tplCategory === GenConstants.TPL_SUB && table.subTable) {
      const subColumns = table.subTable.columns || [];
      for (const column of subColumns) {
        if (column.isPk === '1') {
          table.subTable.pkColumn = column;
          column.capJavaField = GenUtils.capitalize(column.javaField);
          break;
        }
      }
      
      if (!table.subTable.pkColumn && subColumns.length > 0) {
        table.subTable.pkColumn = subColumns[0];
        table.subTable.pkColumn.capJavaField = GenUtils.capitalize(table.subTable.pkColumn.javaField);
      }
    }
  }

  /**
   * 设置主子表信息
   * @param {object} table - 表信息
   */
  async setSubTable(table) {
    const subTableName = table.subTableName;
    if (subTableName) {
      table.subTable = await this.selectGenTableByName(subTableName);
    }
  }

  /**
   * 设置代码生成其他选项值
   * @param {object} genTable - 表信息
   */
  async setTableFromOptions(genTable) {
    const options = genTable.options;
    if (options) {
      try {
        const paramsObj = typeof options === 'string' ? JSON.parse(options) : options;
        
        genTable.treeCode = paramsObj[GenConstants.TREE_CODE];
        genTable.treeParentCode = paramsObj[GenConstants.TREE_PARENT_CODE];
        genTable.treeName = paramsObj[GenConstants.TREE_NAME];
        genTable.parentMenuId = paramsObj[GenConstants.PARENT_MENU_ID];
        genTable.parentMenuName = paramsObj[GenConstants.PARENT_MENU_NAME];
      } catch (e) {
        // 解析失败，忽略
      }
    }
  }

  /**
   * 获取代码生成地址
   * @param {object} table - 表信息
   * @param {string} fileName - 文件名
   * @return {string} 生成地址
   */
  getGenPath(table, fileName) {
    const { app } = this;
    const genPath = table.genPath || '/';
    
    if (genPath === '/') {
      return path.join(app.baseDir, fileName);
    }
    
    return path.join(genPath, fileName);
  }

  /**
   * 创建表结构
   * @param {string} sql - SQL 语句
   * @return {object} { success: boolean, tableNames: array, message: string }
   */
  async createTable(sql) {
    const { ctx } = this;
    
    try {
      // 1. 过滤 SQL 关键字
      SqlUtils.filterKeyword(sql);
      
      // 2. 分割 SQL 语句
      const statements = SqlUtils.splitStatements(sql);
      const tableNames = [];
      
      // 3. 执行每个 CREATE TABLE 语句
      for (const statement of statements) {
        if (SqlUtils.isCreateTableStatement(statement)) {
          // 执行 SQL
          await ctx.helper.getMasterDB(ctx).genTableMapper.db().run(statement);
          
          // 提取表名
          const names = SqlUtils.parseCreateTableNames(statement);
          tableNames.push(...names);
        }
      }
      
      if (tableNames.length === 0) {
        throw new Error('未找到有效的 CREATE TABLE 语句');
      }
      
      // 4. 查询新创建的表信息
      const tableList = await this.selectDbTableListByNames(tableNames);
      
      // 5. 导入表结构
      const operName = ctx.state.user.userName || 'admin';
      await this.importGenTable(tableNames);
      
      return {
        success: true,
        tableNames,
        message: `成功创建 ${tableNames.length} 个表`
      };
    } catch (err) {
      ctx.logger.error('创建表结构失败:', err);
      throw new Error('创建表结构异常：' + err.message);
    }
  }
}

module.exports = GenService;

