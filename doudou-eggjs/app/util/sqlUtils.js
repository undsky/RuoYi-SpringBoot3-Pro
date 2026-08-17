/*
 * @Description: SQL 工具类
 * @Author: AI Assistant
 * @Date: 2025-11-24
 */

/**
 * SQL 关键字过滤
 */
class SqlUtils {
  /**
   * 过滤 SQL 关键字，防止 SQL 注入
   * @param {string} sql - SQL 语句
   * @throws {Error} 包含非法字符时抛出异常
   */
  static filterKeyword(sql) {
    if (!sql || typeof sql !== 'string') {
      return;
    }

    // 转换为大写进行检查
    const sqlUpper = sql.toUpperCase();

    // 危险关键字列表（除了 CREATE TABLE 相关的）
    const dangerousKeywords = [
      'DROP',
      'TRUNCATE',
      'DELETE',
      'UPDATE',
      'INSERT',
      'EXEC',
      'EXECUTE',
      'SCRIPT',
      'JAVASCRIPT',
      'ALERT',
      'IFRAME',
      'OBJECT',
      'EMBED',
      'ONLOAD',
      'ONERROR',
    ];

    // 检查是否包含危险关键字
    for (const keyword of dangerousKeywords) {
      // 使用正则表达式匹配完整单词
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(sqlUpper)) {
        throw new Error(`SQL语句中包含非法关键字: ${keyword}`);
      }
    }

    // 检查特殊字符
    const specialChars = ['--', '/*', '*/', ';--', '||', '&&'];
    for (const char of specialChars) {
      if (sql.includes(char) && !char.includes('*')) {
        // 允许注释符在 CREATE TABLE 中使用
        if (char === '/*' || char === '*/') {
          continue;
        }
        throw new Error(`SQL语句中包含非法字符: ${char}`);
      }
    }
  }

  /**
   * 解析 CREATE TABLE 语句，提取表名
   * @param {string} sql - SQL 语句
   * @return {array} 表名数组
   */
  static parseCreateTableNames(sql) {
    if (!sql || typeof sql !== 'string') {
      return [];
    }

    const tableNames = [];
    
    // 匹配 CREATE TABLE 语句
    // 支持格式：CREATE TABLE table_name 或 CREATE TABLE `table_name`
    const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?\s*\(/gi;
    let match;
    
    while ((match = regex.exec(sql)) !== null) {
      const tableName = match[1];
      if (tableName) {
        tableNames.push(tableName);
      }
    }
    
    return tableNames;
  }

  /**
   * 分割多个 SQL 语句
   * @param {string} sql - SQL 语句
   * @return {array} SQL 语句数组
   */
  static splitStatements(sql) {
    if (!sql || typeof sql !== 'string') {
      return [];
    }

    // 简单的分割方式：按分号分割（不考虑字符串内的分号）
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    return statements;
  }

  /**
   * 验证是否为 CREATE TABLE 语句
   * @param {string} sql - SQL 语句
   * @return {boolean} 是否为 CREATE TABLE 语句
   */
  static isCreateTableStatement(sql) {
    if (!sql || typeof sql !== 'string') {
      return false;
    }

    const sqlUpper = sql.trim().toUpperCase();
    return sqlUpper.startsWith('CREATE TABLE') || sqlUpper.startsWith('CREATE TABLE IF NOT EXISTS');
  }
}

module.exports = SqlUtils;
