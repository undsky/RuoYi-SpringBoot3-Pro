const XLSX = require('xlsx');

/**
 * Excel 导出工具类
 */
class ExcelUtil {
  /**
   * 导出 Excel 文件
   * @param {Object} ctx - Egg.js 上下文对象
   * @param {Array} data - 要导出的数据数组
   * @param {Array} columns - 列配置数组，格式：[{header: '列名', key: '字段名', width: 宽度}]
   * @param {String} filename - 文件名（不含扩展名）
   */
  static exportExcel(ctx, data, columns, filename = '导出数据') {
    try {
      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      
      // 准备表头和数据
      const headers = columns.map(col => col.header);
      const keys = columns.map(col => col.key);
      
      // 转换数据格式
      const worksheetData = [
        headers, // 表头
        ...data.map(row => keys.map(key => this.formatCellValue(row[key])))
      ];
      
      // 创建工作表
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // 设置列宽
      const colWidths = columns.map(col => ({ width: col.width || 15 }));
      worksheet['!cols'] = colWidths;
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      
      // 生成 Excel 文件缓冲区
      const buffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'buffer',
        compression: true 
      });
      
      // 设置响应头
      const encodedFilename = encodeURIComponent(`${filename}.xlsx`);
      ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      ctx.set('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
      ctx.set('Content-Length', buffer.length);
      
      // 返回文件内容
      ctx.body = buffer;
      
    } catch (error) {
      ctx.logger.error('Excel 导出失败:', error);
      ctx.body = {
        code: 500,
        msg: 'Excel 导出失败',
        data: null
      };
    }
  }
  
  /**
   * 格式化单元格值
   * @param {*} value - 原始值
   * @returns {String} 格式化后的值
   */
  static formatCellValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }
    
    if (value instanceof Date) {
      return value.toLocaleString('zh-CN');
    }
    
    // 处理状态字典映射
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    
    return String(value);
  }
  
  /**
   * 状态值转换
   * @param {String|Number} value - 状态值
   * @param {Object} dictMap - 字典映射
   * @returns {String} 转换后的值
   */
  static convertDictValue(value, dictMap = {}) {
    return dictMap[value] || value || '';
  }
  
  /**
   * 解析 Excel 文件
   * @param {Buffer} fileBuffer - Excel 文件缓冲区
   * @param {Array} columns - 列配置数组，格式：[{header: '列名', key: '字段名', required: true/false}]
   * @returns {Array} 解析后的数据数组
   */
  static importExcel(fileBuffer, columns) {
    try {
      // 读取 Excel 文件
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      // 获取第一个工作表
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // 将工作表转换为 JSON 数组
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // 使用数组格式，第一行作为表头
        defval: '' // 空单元格的默认值
      });
      
      if (jsonData.length < 2) {
        throw new Error('Excel 文件为空或格式不正确');
      }
      
      // 获取表头和数据行
      const headers = jsonData[0];
      const dataRows = jsonData.slice(1);
      
      // 创建表头映射
      const headerMap = {};
      columns.forEach(col => {
        const headerIndex = headers.findIndex(h => h === col.header);
        if (headerIndex !== -1) {
          headerMap[col.key] = headerIndex;
        } else if (col.required) {
          throw new Error(`必填列 "${col.header}" 未找到`);
        }
      });
      
      // 解析数据行
      const result = [];
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowData = {};
        
        // 跳过空行
        if (!row || row.every(cell => !cell && cell !== 0)) {
          continue;
        }
        
        // 解析每个字段
        for (const col of columns) {
          const cellIndex = headerMap[col.key];
          let cellValue = cellIndex !== undefined ? row[cellIndex] : '';
          
          // 格式化单元格值
          cellValue = this.parseCellValue(cellValue, col);
          
          // 必填字段验证
          if (col.required && (!cellValue && cellValue !== 0)) {
            throw new Error(`第 ${i + 2} 行，列 "${col.header}" 为必填项`);
          }
          
          rowData[col.key] = cellValue;
        }
        
        result.push(rowData);
      }
      
      return result;
      
    } catch (error) {
      throw new Error(`Excel 解析失败: ${error.message}`);
    }
  }
  
  /**
   * 解析单元格值
   * @param {*} value - 原始值
   * @param {Object} column - 列配置
   * @returns {*} 解析后的值
   */
  static parseCellValue(value, column) {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    
    // 处理字典值转换
    if (column.dictMap) {
      for (const [dictValue, dictLabel] of Object.entries(column.dictMap)) {
        if (value === dictLabel) {
          return dictValue;
        }
      }
    }
    
    // 处理数字类型
    if (column.type === 'number') {
      const num = Number(value);
      return isNaN(num) ? '' : num;
    }
    
    // 处理布尔类型
    if (column.type === 'boolean') {
      if (value === '是' || value === 'true' || value === true || value === 1) {
        return true;
      }
      if (value === '否' || value === 'false' || value === false || value === 0) {
        return false;
      }
    }
    
    return String(value).trim();
  }
  
  /**
   * 生成导入模板
   * @param {Object} ctx - Egg.js 上下文对象
   * @param {Array} columns - 列配置数组
   * @param {String} filename - 文件名（不含扩展名）
   */
  static exportTemplate(ctx, columns, filename = '导入模板') {
    try {
      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      
      // 准备表头和示例数据
      const headers = columns.map(col => col.header);
      const exampleRow = columns.map(col => col.example || '');
      
      // 创建工作表数据
      const worksheetData = [headers, exampleRow];
      
      // 创建工作表
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // 设置列宽
      const colWidths = columns.map(col => ({ width: col.width || 15 }));
      worksheet['!cols'] = colWidths;
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      
      // 生成 Excel 文件缓冲区
      const buffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'buffer',
        compression: true 
      });
      
      // 设置响应头
      const encodedFilename = encodeURIComponent(`${filename}.xlsx`);
      ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      ctx.set('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
      ctx.set('Content-Length', buffer.length);
      
      // 返回文件内容
      ctx.body = buffer;
      
    } catch (error) {
      ctx.logger.error('模板生成失败:', error);
      ctx.body = {
        code: 500,
        msg: '模板生成失败',
        data: null
      };
    }
  }
}

module.exports = ExcelUtil;
