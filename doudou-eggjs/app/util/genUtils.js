/*
 * @Description: 代码生成工具类
 * @Author: 姜彦汐
 * @Date: 2025-11-08
 */

const GenConstants = require('../constant/genConstants');

class GenUtils {
  /**
   * 初始化表信息
   * @param {object} genTable - 表信息
   * @param {string} operName - 操作者
   */
  static initTable(genTable, operName) {
    // 如果表描述不存在，默认为表名
    if (!genTable.tableComment || genTable.tableComment.trim() === '') {
      genTable.tableComment = genTable.tableName;
    }

    genTable.className = GenUtils.convertClassName(genTable.tableName);
    genTable.packageName = 'app.service';
    genTable.moduleName = GenUtils.getModuleName(genTable.tableName);
    genTable.businessName = GenUtils.getBusinessName(genTable.tableName);
    genTable.functionName = GenUtils.replaceText(genTable.tableComment || genTable.tableName);
    genTable.functionAuthor = '姜彦汐';
    genTable.createBy = operName;
    genTable.tplCategory = GenConstants.TPL_CRUD;
    genTable.tplWebType = 'element-plus';
  }

  /**
   * 初始化列属性字段
   * @param {object} column - 列信息
   * @param {object} table - 表信息
   */
  static initColumnField(column, table) {
    const dataType = GenUtils.getDbType(column.columnType);
    const columnName = column.columnName;

    column.tableId = table.tableId;
    column.createBy = table.createBy;

    // 如果列注释为空，使用列名
    if (!column.columnComment || column.columnComment.trim() === '') {
      column.columnComment = columnName;
    }

    // 设置js字段名（驼峰）
    column.javaField = GenUtils.toCamelCase(columnName);
    
    // 设置默认类型
    column.javaType = GenConstants.TYPE_STRING;
    column.queryType = GenConstants.QUERY_EQ;
    column.htmlType = GenConstants.HTML_INPUT; // 默认为 input，兼容所有数据库

    if (GenUtils.arraysContains(GenConstants.COLUMNTYPE_STR, dataType) ||
        GenUtils.arraysContains(GenConstants.COLUMNTYPE_TEXT, dataType)) {
      // 字符串长度超过500设置为文本域
      const columnLength = GenUtils.getColumnLength(column.columnType);
      const htmlType = columnLength >= 500 || GenUtils.arraysContains(GenConstants.COLUMNTYPE_TEXT, dataType)
        ? GenConstants.HTML_TEXTAREA
        : GenConstants.HTML_INPUT;
      column.htmlType = htmlType;
    } else if (GenUtils.arraysContains(GenConstants.COLUMNTYPE_TIME, dataType)) {
      column.javaType = GenConstants.TYPE_DATE;
      column.htmlType = GenConstants.HTML_DATETIME;
    } else if (GenUtils.arraysContains(GenConstants.COLUMNTYPE_NUMBER, dataType)) {
      // htmlType 保持默认的 input

      // 如果是浮点型 统一用BigDecimal
      const typeInfo = GenUtils.getColumnTypeInfo(column.columnType);
      if (typeInfo && typeInfo.length === 2 && parseInt(typeInfo[1]) > 0) {
        column.javaType = GenConstants.TYPE_BIGDECIMAL;
      }
      // 如果是整形
      else if (typeInfo && typeInfo.length === 1 && parseInt(typeInfo[0]) <= 10) {
        column.javaType = GenConstants.TYPE_INTEGER;
      }
      // 长整形
      else {
        column.javaType = GenConstants.TYPE_LONG;
      }
    }

    // 插入字段（默认所有字段都需要插入，不需要插入的字段和主键除外）
    column.isInsert = GenUtils.arraysContains(GenConstants.COLUMNNAME_NOT_INSERT, columnName) || column.isPk !== '0'
      ? GenConstants.NOT_REQUIRE
      : GenConstants.REQUIRE;

    // 编辑字段
    if (!GenUtils.arraysContains(GenConstants.COLUMNNAME_NOT_EDIT, columnName) && column.isPk === '0') {
      column.isEdit = GenConstants.REQUIRE;
    }
    
    // 列表字段
    if (!GenUtils.arraysContains(GenConstants.COLUMNNAME_NOT_LIST, columnName) && column.isPk === '0') {
      column.isList = GenConstants.REQUIRE;
    }
    
    // 查询字段
    if (!GenUtils.arraysContains(GenConstants.COLUMNNAME_NOT_QUERY, columnName) && column.isPk === '0') {
      column.isQuery = GenConstants.REQUIRE;
    }

    // 查询字段类型
    if (columnName.toLowerCase().endsWith('name')) {
      column.queryType = GenConstants.QUERY_LIKE;
    }
    
    // 状态字段设置单选框
    if (columnName.toLowerCase().endsWith('status')) {
      column.htmlType = GenConstants.HTML_RADIO;
    } else if (columnName.toLowerCase().endsWith('type') || 
               columnName.toLowerCase().endsWith('sex')) {
      // 类型&性别字段设置下拉框
      column.htmlType = GenConstants.HTML_SELECT;
    } else if (columnName.toLowerCase().endsWith('image')) {
      // 图片字段设置图片上传控件
      column.htmlType = GenConstants.HTML_IMAGE_UPLOAD;
    } else if (columnName.toLowerCase().endsWith('file')) {
      // 文件字段设置文件上传控件
      column.htmlType = GenConstants.HTML_FILE_UPLOAD;
    } else if (columnName.toLowerCase().endsWith('content')) {
      // 内容字段设置富文本控件
      column.htmlType = GenConstants.HTML_EDITOR;
    }
  }

  /**
   * 校验数组是否包含指定值
   * @param {array} arr - 数组
   * @param {string} targetValue - 值
   * @return {boolean} 是否包含
   */
  static arraysContains(arr, targetValue) {
    return arr.includes(targetValue);
  }

  /**
   * 获取模块名
   * @param {string} tableName - 表名
   * @return {string} 模块名
   */
  static getModuleName(tableName) {
    // 取第一个下划线之前的部分作为模块名
    const parts = tableName.split('_');
    return parts.length > 1 ? parts[0] : 'system';
  }

  /**
   * 获取业务名
   * @param {string} tableName - 表名
   * @return {string} 业务名
   */
  static getBusinessName(tableName) {
    // 取最后一个下划线之后的部分作为业务名
    const lastIndex = tableName.lastIndexOf('_');
    if (lastIndex !== -1) {
      return tableName.substring(lastIndex + 1);
    }
    return tableName;
  }

  /**
   * 表名转换成类名
   * @param {string} tableName - 表名称
   * @return {string} 类名
   */
  static convertClassName(tableName) {
    // 移除表前缀
    const tablePrefix = 'sys_';
    if (tableName.startsWith(tablePrefix)) {
      tableName = tableName.substring(tablePrefix.length);
    }
    return GenUtils.convertToCamelCase(tableName);
  }

  /**
   * 下划线转驼峰命名（首字母大写）
   * @param {string} str - 字符串
   * @return {string} 驼峰字符串
   */
  static convertToCamelCase(str) {
    if (!str) return '';
    return str.split('_')
      .map((word, index) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * 下划线转驼峰命名（首字母小写）
   * @param {string} str - 字符串
   * @return {string} 驼峰字符串
   */
  static toCamelCase(str) {
    if (!str) return '';
    const camel = GenUtils.convertToCamelCase(str);
    return camel.charAt(0).toLowerCase() + camel.slice(1);
  }

  /**
   * 首字母大写
   * @param {string} str - 字符串
   * @return {string} 首字母大写的字符串
   */
  static capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 首字母小写
   * @param {string} str - 字符串
   * @return {string} 首字母小写的字符串
   */
  static uncapitalize(str) {
    if (!str) return '';
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * 关键字替换
   * @param {string} text - 需要被替换的名字
   * @return {string} 替换后的名字
   */
  static replaceText(text) {
    if (!text) return '';
    return text.replace(/(?:表|豆豆|【请填写功能名称】)/g, '');
  }

  /**
   * 获取数据库类型字段
   * @param {string} columnType - 列类型
   * @return {string} 截取后的列类型
   */
  static getDbType(columnType) {
    if (!columnType) return '';
    const index = columnType.indexOf('(');
    return index > 0 ? columnType.substring(0, index) : columnType;
  }

  /**
   * 获取字段长度
   * @param {string} columnType - 列类型
   * @return {number} 字段长度
   */
  static getColumnLength(columnType) {
    if (!columnType) return 0;
    const index = columnType.indexOf('(');
    if (index > 0) {
      const length = columnType.substring(index + 1, columnType.indexOf(')'));
      return parseInt(length) || 0;
    }
    return 0;
  }

  /**
   * 获取字段类型信息（长度和精度）
   * @param {string} columnType - 列类型，如 int(11)、decimal(10,2)
   * @return {array} 类型信息数组，如 ['11'] 或 ['10', '2']
   */
  static getColumnTypeInfo(columnType) {
    if (!columnType) return [];
    const startIndex = columnType.indexOf('(');
    const endIndex = columnType.indexOf(')');
    if (startIndex > 0 && endIndex > startIndex) {
      const typeInfo = columnType.substring(startIndex + 1, endIndex);
      return typeInfo.split(',').map(s => s.trim()).filter(s => s);
    }
    return [];
  }

  /**
   * 获取权限前缀
   * @param {string} moduleName - 模块名
   * @param {string} businessName - 业务名
   * @return {string} 权限前缀
   */
  static getPermissionPrefix(moduleName, businessName) {
    return `${moduleName}:${businessName}`;
  }
}

module.exports = GenUtils;

