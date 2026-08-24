/*
 * @Description: 个人中心控制器
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpPost, HttpPut } = require('egg-decorator-router');
const path = require('path');
const fs = require('fs');

module.exports = app => {

  @Route('/system/user/profile')
  class ProfileController extends Controller {

    /**
     * 获取个人信息
     * GET /api/system/user/profile
     * 说明：个人中心接口，无需特殊权限，仅需登录
     */
    @HttpGet('/')
    async profile() {
      const { ctx, service } = this;
      
      try {
        const userId = ctx.state.user.userId;
        const userName = ctx.state.user.userName;
        
        // 查询用户详细信息
        const user = await service.system.user.selectUserById(userId);
        
        if (!user) {
          ctx.body = {
            code: 500,
            msg: '用户不存在'
          };
          return;
        }
        
        // 查询用户角色组
        const roleGroup = await service.system.user.selectUserRoleGroup(userName);
        
        // 查询用户岗位组
        const postGroup = await service.system.user.selectUserPostGroup(userName);
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: user,
          roleGroup,
          postGroup
        };
      } catch (err) {
        ctx.logger.error('获取个人信息失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '获取个人信息失败'
        };
      }
    }

    /**
     * 修改个人信息
     * PUT /api/system/user/profile
     * 说明：个人中心接口，无需特殊权限，仅需登录
     */
    @HttpPut('/')
    async updateProfile() {
      const { ctx, service } = this;
      
      try {
        const { nickName, email, phonenumber, sex } = ctx.request.body;
        const userId = ctx.state.user.userId;
        
        // 仅允许修改安全的基础个人资料字段
        const user = {
          userId,
          nickName,
          email,
          phonenumber,
          sex,
        };
        
        // 校验手机号是否唯一
        if (user.phonenumber) {
          const checkUser = await service.system.user.checkPhoneUnique(user);
          if (checkUser && checkUser.userId !== user.userId) {
            ctx.body = {
              code: 500,
              msg: `修改用户失败，手机号码已存在`
            };
            return;
          }
        }
        
        // 校验邮箱是否唯一
        if (user.email) {
          const checkUser = await service.system.user.checkEmailUnique(user);
          if (checkUser && checkUser.userId !== user.userId) {
            ctx.body = {
              code: 500,
              msg: `修改用户失败，邮箱账号已存在`
            };
            return;
          }
        }
        
        // 修改个人信息
        const rows = await service.system.user.updateUserProfile(user);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '修改成功' : '修改失败'
        };
      } catch (err) {
        ctx.logger.error('修改个人信息失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '修改个人信息失败'
        };
      }
    }

    /**
     * 修改密码
     * PUT /api/system/user/profile/updatePwd
     * 说明：个人中心接口，无需特殊权限，仅需登录
     */
    @HttpPut('/updatePwd')
    async updatePwd() {
      const { ctx, service } = this;
      
      try {
        const { oldPassword, newPassword } = ctx.request.body;
        const userId = ctx.state.user.userId;
        
        // 查询用户信息
        const user = await service.system.user.selectUserById(userId);
        
        if (!user) {
          ctx.body = {
            code: 500,
            msg: '用户不存在'
          };
          return;
        }
        
        // 校验旧密码是否正确
        const isMatch = await ctx.helper.security.comparePassword(oldPassword, user.password);
        if (!isMatch) {
          ctx.body = {
            code: 500,
            msg: '修改密码失败，旧密码错误'
          };
          return;
        }
        
        // 校验新密码是否与旧密码相同
        const isSame = await ctx.helper.security.comparePassword(newPassword, user.password);
        if (isSame) {
          ctx.body = {
            code: 500,
            msg: '新密码不能与旧密码相同'
          };
          return;
        }
        
        // 加密新密码
        const encryptedPassword = await ctx.helper.security.encryptPassword(newPassword);
        
        // 修改密码
        const rows = await service.system.user.resetUserPwd(userId, encryptedPassword);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '修改成功' : '修改失败'
        };
      } catch (err) {
        ctx.logger.error('修改密码失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '修改密码失败'
        };
      }
    }

    /**
     * 上传头像
     * POST /api/system/user/profile/avatar
     * 说明：个人中心接口，无需特殊权限，仅需登录
     */
    @HttpPost('/avatar')
    async avatar() {
      const { ctx, service } = this;
      
      try {
        const userId = ctx.state.user.userId;
        
        // 获取上传的文件
        const stream = await ctx.getFileStream();
        
        // 文件名
        const ext = path.extname(stream.filename) || '.png';
        const filename = `avatar_${userId}_${Date.now()}${ext}`;
        
        // 上传路径
        const uploadDir = path.join(app.config.uploadAbsPath, 'avatar');
        
        // 确保目录存在
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const targetPath = path.join(uploadDir, filename);
        
        // 保存文件
        const writeStream = fs.createWriteStream(targetPath);
        stream.pipe(writeStream);
        
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
        
        // 生成访问URL
        const avatar = `/public/uploads/avatar/${filename}`;
        
        // 查询旧头像
        const user = await service.system.user.selectUserById(userId);
        const oldAvatar = user.avatar;
        
        // 更新用户头像
        const success = await service.system.user.updateUserAvatar(userId, avatar);
        
        if (success) {
          // 删除旧头像文件
          if (oldAvatar && oldAvatar.startsWith('/public/uploads/')) {
            const oldAvatarPath = path.join(app.config.baseDir, 'app', oldAvatar.replace(/^\/public\//, 'public/'));
            if (fs.existsSync(oldAvatarPath)) {
              fs.unlinkSync(oldAvatarPath);
            }
          }
          
          ctx.body = {
            code: 200,
            msg: '上传成功',
            imgUrl: avatar
          };
        } else {
          ctx.body = {
            code: 500,
            msg: '上传失败'
          };
        }
      } catch (err) {
        ctx.logger.error('上传头像失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '上传头像失败'
        };
      }
    }
  }

  return ProfileController;
};

