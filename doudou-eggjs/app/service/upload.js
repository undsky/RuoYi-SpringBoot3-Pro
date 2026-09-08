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
      const ext = this.assertAllowedExtension(stream.filename, stream.mimeType);
      const filename = this.generateFilename(ext);
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
   * 校验并返回规范化后的扩展名（含点号，小写）
   * 浏览器录音/截图常把文件名设为 "blob"、无扩展名，按 MIME 推断；
   * 推断不出则落成 .bin，避免无扩展名文件被静态目录按 HTML 嗅探。
   * @param {string} originalFilename
   * @param {string} [mimeType]
   * @return {string}
   */
  assertAllowedExtension(originalFilename, mimeType) {
    const { app } = this;
    const allowExtensions = (app.config.upload && app.config.upload.allowExtensions) || [];
    let ext = path.extname(originalFilename || '').toLowerCase();
    if (!ext && String(originalFilename).toLowerCase() === 'blob') {
      ext = this.extFromMime(mimeType);
      if (!ext || !allowExtensions.includes(ext)) {
        return '.bin';
      }
      return ext;
    }
    if (!ext || !allowExtensions.includes(ext)) {
      const err = new Error('不允许的文件类型');
      err.status = 400;
      throw err;
    }
    return ext;
  }

  /**
   * 从 MIME 推断扩展名
   * @param {string} mimeType
   * @return {string}
   */
  extFromMime(mimeType) {
    if (!mimeType || typeof mimeType !== 'string') {
      return '';
    }
    const mime = mimeType.split(';')[0].trim().toLowerCase();
    const map = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/bmp': '.bmp',
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/x-wav': '.wav',
      'audio/webm': '.webm',
      'audio/ogg': '.ogg',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi',
      'application/pdf': '.pdf',
      'application/zip': '.zip',
    };
    return map[mime] || '';
  }

  /**
   * 生成唯一文件名
   * @param {string} ext - 已校验的扩展名（含点号）
   * @return {string} 生成的文件名
   */
  generateFilename(ext) {
    // 生成格式：时间戳_唯一标识.扩展名
    const timestamp = Date.now();
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
