/*
 * @Description: 代码生成常量
 * @Author: 姜彦汐
 * @Date: 2025-11-08
 */

module.exports = {
  // 单表（增删改查）
  TPL_CRUD: 'crud',
  // 树表（增删改查）
  TPL_TREE: 'tree',
  // 主子表（增删改查）
  TPL_SUB: 'sub',

  // 树编码字段
  TREE_CODE: 'treeCode',
  // 树父编码字段
  TREE_PARENT_CODE: 'treeParentCode',
  // 树名称字段
  TREE_NAME: 'treeName',

  // 上级菜单ID字段
  PARENT_MENU_ID: 'parentMenuId',
  // 上级菜单名称字段
  PARENT_MENU_NAME: 'parentMenuName',

  // 数据库字符串类型
  COLUMNTYPE_STR: ['char', 'varchar', 'nvarchar', 'varchar2'],
  // 数据库文本类型
  COLUMNTYPE_TEXT: ['tinytext', 'text', 'mediumtext', 'longtext'],
  // 数据库时间类型
  COLUMNTYPE_TIME: ['datetime', 'time', 'date', 'timestamp'],
  // 数据库数字类型
  COLUMNTYPE_NUMBER: ['tinyint', 'smallint', 'mediumint', 'int', 'number', 'integer', 'bigint', 'float', 'double', 'decimal'],

  // 页面不需要插入字段
  COLUMNNAME_NOT_INSERT: ['id', 'create_by', 'create_time', 'del_flag', 'update_by', 'update_time', 'remark', 'status'],
  // 页面不需要编辑字段
  COLUMNNAME_NOT_EDIT: ['id', 'create_by', 'create_time', 'del_flag', 'update_by', 'update_time', 'remark', 'status'],
  // 页面不需要显示的列表字段
  COLUMNNAME_NOT_LIST: ['id', 'create_by', 'create_time', 'del_flag', 'update_by', 'update_time', 'remark', 'status'],
  // 页面不需要查询字段
  COLUMNNAME_NOT_QUERY: ['id', 'create_by', 'create_time', 'del_flag', 'update_by', 'update_time', 'remark', 'status'],

  // Entity基类字段
  BASE_ENTITY: ['createBy', 'createTime', 'updateBy', 'updateTime', 'remark'],
  // Tree基类字段
  TREE_ENTITY: ['parentName', 'parentId', 'orderNum', 'ancestors', 'children'],

  // 文本框
  HTML_INPUT: 'input',
  // 文本域
  HTML_TEXTAREA: 'textarea',
  // 下拉框
  HTML_SELECT: 'select',
  // 单选框
  HTML_RADIO: 'radio',
  // 复选框
  HTML_CHECKBOX: 'checkbox',
  // 日期控件
  HTML_DATETIME: 'datetime',
  // 图片上传控件
  HTML_IMAGE_UPLOAD: 'imageUpload',
  // 文件上传控件
  HTML_FILE_UPLOAD: 'fileUpload',
  // 富文本控件
  HTML_EDITOR: 'editor',

  // 字符串类型
  TYPE_STRING: 'String',
  // 整型
  TYPE_INTEGER: 'Number',
  // 长整型
  TYPE_LONG: 'Number',
  // 浮点型
  TYPE_DOUBLE: 'Number',
  // 高精度计算类型
  TYPE_BIGDECIMAL: 'Number',
  // 时间类型
  TYPE_DATE: 'Date',

  // 模糊查询
  QUERY_LIKE: 'LIKE',
  // 相等查询
  QUERY_EQ: 'EQ',
  // 不等查询
  QUERY_NE: 'NE',
  // 大于查询
  QUERY_GT: 'GT',
  // 大于等于查询
  QUERY_GTE: 'GTE',
  // 小于查询
  QUERY_LT: 'LT',
  // 小于等于查询
  QUERY_LTE: 'LTE',
  // 范围查询
  QUERY_BETWEEN: 'BETWEEN',

  // 需要
  REQUIRE: '1',
  // 不需要
  NOT_REQUIRE: '0'
};

