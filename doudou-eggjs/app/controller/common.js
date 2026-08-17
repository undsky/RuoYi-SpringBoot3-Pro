/*
 * @Description: 公共接口控制器
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpPost } = require('egg-decorator-router');
const path = require('path');
const fs = require('fs');

module.exports = app => {

  @Route('/common')
  class CommonController extends Controller {

    /**
     * 文件上传
     * POST /api/common/upload
     */
    @HttpPost('/upload')
    async upload() {
      const { ctx, service } = this;
      
      try {
        // 上传文件
        const result = await service.upload.stream();
        
        ctx.body = {
          code: 200,
          msg: '上传成功',
          url: result.url,
          fileName: result.url,
          newFileName: result.newFileName,
          originalFilename: result.filename
        };
      } catch (err) {
        ctx.logger.error('文件上传失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '文件上传失败'
        };
      }
    }

    /**
     * 文件下载
     * GET /api/common/download
     */
    @HttpGet('/download')
    async download() {
      const { ctx, service, app } = this;
      
      try {
        const { fileName, delete: deleteAfter } = ctx.query;
        
        // 检查文件名是否合法
        if (!service.upload.checkAllowDownload(fileName)) {
          ctx.body = {
            code: 500,
            msg: `文件名称(${fileName})非法，不允许下载`
          };
          return;
        }
        
        // 文件路径（假设在 uploads 目录）
        const filePath = path.join(app.config.uploadAbsPath, fileName);
        
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
          ctx.body = {
            code: 500,
            msg: '文件不存在'
          };
          return;
        }
        
        // 提取真实文件名（去掉时间戳前缀）
        const realFileName = fileName.substring(fileName.indexOf('_') + 1);
        
        // 设置响应头
        ctx.set('Content-Type', 'application/octet-stream');
        ctx.set('Content-Disposition', `attachment; filename=${encodeURIComponent(realFileName)}`);
        
        // 读取文件并返回
        ctx.body = fs.createReadStream(filePath);
      } catch (err) {
        ctx.logger.error('文件下载失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '文件下载失败'
        };
      }
    }

    /**
     * 本地资源下载
     * GET /api/common/download/resource
     */
    @HttpGet('/download/resource')
    async resourceDownload() {
      const { ctx, service, app } = this;
      
      try {
        const { resource } = ctx.query;
        
        // 检查资源路径是否合法
        if (!service.upload.checkAllowDownload(resource)) {
          ctx.body = {
            code: 500,
            msg: `资源文件(${resource})非法，不允许下载`
          };
          return;
        }
        
        // 去掉 URL 前缀（/profile/）
        const resourcePath = resource.replace(/^\/profile\//, '');
        
        // 本地资源路径
        const localPath = path.join(app.config.baseDir, 'app', 'public', resourcePath);
        
        // 检查文件是否存在
        if (!fs.existsSync(localPath)) {
          ctx.body = {
            code: 500,
            msg: '资源文件不存在'
          };
          return;
        }
        
        // 下载名称
        const downloadName = path.basename(localPath);
        
        // 设置响应头
        ctx.set('Content-Type', 'application/octet-stream');
        ctx.set('Content-Disposition', `attachment; filename=${encodeURIComponent(downloadName)}`);
        
        // 读取文件并返回
        ctx.body = fs.createReadStream(localPath);
      } catch (err) {
        ctx.logger.error('本地资源下载失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '本地资源下载失败'
        };
      }
    }
  }

  return CommonController;
};

