/*
 * @Description: 文件上传服务层
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */
const Service = require("egg").Service;
const streamWormhole = require("stream-wormhole");
const path = require("path");
const fs = require("fs-extra");
const { nanoid } = require("nanoid");

class UploadService extends Service {
  
  /**
   * 文件上传（流式）
   * @return {object} 上传结果
   */
  async stream() {
    const { app, ctx } = this;

    const stream = await ctx.getFileStream();
    try {
      const filename = this.generateFilename(stream.filename);
      const filePath = path.join(app.config.uploadAbsPath, filename);
      
      await this.saveAsFile(stream, filePath);
      
      return {
        filename: stream.filename,
        mimeType: stream.mimeType,
        url: path.join(app.config.uploadRelPath, filename).replace(/\\/g, '/'),
        newFileName: filename
      };
    } catch (error) {
      await streamWormhole(stream);
      throw error;
    }
  }

  /**
   * 生成唯一文件名
   * @param {string} originalFilename - 原始文件名
   * @return {string} 生成的文件名
   */
  generateFilename(originalFilename) {
    // 生成格式：时间戳_唯一标识.扩展名
    const timestamp = Date.now();
    const ext = path.extname(originalFilename);
    const uuid = nanoid();

    return `${timestamp}_${uuid}${ext}`;
  }

  /**
   * 保存文件
   * @param {Stream} stream - 文件流
   * @param {string} filePath - 保存路径
   */
  saveAsFile(stream, filePath) {
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      stream
        .pipe(writer)
        .on("error", (error) => {
          writer.destroy();
          stream.destroy();
          reject(error);
        })
        .on("finish", () => {
          writer.destroy();
          stream.destroy();
          resolve();
        });
    });
  }

  /**
   * 检查文件是否允许下载
   * @param {string} filename - 文件名
   * @return {boolean} 是否允许
   */
  checkAllowDownload(filename) {
    // 检查文件名是否包含非法字符
    const illegalChars = ['..', '\\', '//'];
    
    for (const char of illegalChars) {
      if (filename.includes(char)) {
        return false;
      }
    }
    
    return true;
  }
}

module.exports = UploadService;
