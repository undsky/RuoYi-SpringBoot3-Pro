/*
 * @Description: 用户管理控制器
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpPost, HttpPut, HttpDelete } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');
const { Log, BusinessType } = require('../../decorator/log');
const ExcelUtil = require('../../extend/excel');

module.exports = app => {

  @Route('/system/user')
  class UserController extends Controller {

    /**
     * 获取用户列表（分页）
     * GET /api/system/user/list
     * 权限：system:user:list
     */
    @RequiresPermissions('system:user:list')
    @HttpGet('/list')
    async list() {
      const { ctx, service } = this;

      try {
        const params = ctx.query;

        // 查询列表
        const result = await service.system.user.selectUserPage(params);

        ctx.body = {
          code: 200,
          msg: "查询成功",
          ...result,
        };
      } catch (err) {
        ctx.logger.error('查询用户列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询用户列表失败'
        };
      }
    }

    /**
     * 获取用户详情
     * GET /api/system/user?userId=xxx (userId 非必填)
     * 权限：system:user:query
     */
    @RequiresPermissions('system:user:query')
    @HttpGet('/')
    @HttpGet('/:userId')
    async getInfo() {
      const { ctx, service } = this;
      
      try {
        const userId =ctx.params.userId || ctx.query.userId;
        
        if (!userId) {
          // 获取新增用户时需要的数据
          const roles = await service.system.role.selectRoleAll();
          const posts = await service.system.post.selectPostAll();
          
          ctx.body = {
            code: 200,
            msg: '操作成功',
            data: null,
            roles,
            posts
          };
          return;
        }
        
        // 校验数据权限
        await service.system.user.checkUserDataScope(parseInt(userId));
        
        // 查询用户信息
        const user = await service.system.user.selectUserById(parseInt(userId));
        
        if (!user) {
          ctx.body = {
            code: 500,
            msg: '用户不存在'
          };
          return;
        }
        
        // 查询用户的岗位ID列表
        const postIds = await service.system.post.selectPostListByUserId(parseInt(userId));
        
        // 查询所有角色和岗位
        const roles = await service.system.role.selectRoleAll();
        const posts = await service.system.post.selectPostAll();
        
        // 过滤掉管理员角色（非管理员用户不能分配管理员角色）
        const isAdmin = ctx.helper.isAdmin(parseInt(userId));
        const filteredRoles = isAdmin ? roles : roles.filter(r => !ctx.helper.isAdmin(r.roleId));
        const roleIds = user.roleIds;
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: user,
          postIds,
          roleIds,
          roles: filteredRoles,
          posts
        };
      } catch (err) {
        ctx.logger.error('查询用户详情失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询用户详情失败'
        };
      }
    }

    /**
     * 新增用户
     * POST /api/system/user
     * 权限：system:user:add
     */
    @Log({ title: '用户管理', businessType: BusinessType.INSERT })
    @RequiresPermissions('system:user:add')
    @HttpPost('/')
    async add() {
      const { ctx, service } = this;
      
      try {
        const user = ctx.request.body;
        
        // 校验部门数据权限
        await service.system.dept.checkDeptDataScope(user.deptId);
        
        // 校验角色数据权限
        if (user.roleIds && user.roleIds.length > 0) {
          const roleIds = Array.isArray(user.roleIds) ? user.roleIds : [user.roleIds];
          for (const roleId of roleIds) {
            await service.system.role.checkRoleDataScope(roleId);
          }
        }
        
        // 校验用户名是否唯一
        const isUserNameUnique = await service.system.user.checkUserNameUnique(user);
        if (isUserNameUnique) {
          ctx.body = {
            code: 500,
            msg: `新增用户'${user.userName}'失败，登录账号已存在`
          };
          return;
        }
        
        // 校验手机号是否唯一
        if (user.phonenumber) {
          const isPhoneUnique = await service.system.user.checkPhoneUnique(user);
          if (isPhoneUnique) {
            ctx.body = {
              code: 500,
              msg: `新增用户'${user.userName}'失败，手机号码已存在`
            };
            return;
          }
        }
        
        // 校验邮箱是否唯一
        if (user.email) {
          const isEmailUnique = await service.system.user.checkEmailUnique(user);
          if (isEmailUnique) {
            ctx.body = {
              code: 500,
              msg: `新增用户'${user.userName}'失败，邮箱账号已存在`
            };
            return;
          }
        }
        
        // 设置创建者
        user.createBy = ctx.state.user.userName;
        
        // 加密密码
        user.password = await ctx.helper.security.encryptPassword(user.password);
        
        // 新增用户
        const rows = await service.system.user.insertUser(user);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '新增成功' : '新增失败'
        };
      } catch (err) {
        ctx.logger.error('新增用户失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '新增用户失败'
        };
      }
    }

    /**
     * 修改用户
     * PUT /api/system/user
     * 权限：system:user:edit
     */
    @Log({ title: '用户管理', businessType: BusinessType.UPDATE })
    @RequiresPermissions('system:user:edit')
    @HttpPut('/')
    async edit() {
      const { ctx, service } = this;
      
      try {
        const user = ctx.request.body;
        
        // 校验用户是否允许操作
        service.system.user.checkUserAllowed(user);
        
        // 校验数据权限
        await service.system.user.checkUserDataScope(user.userId);
        
        // 校验部门数据权限
        await service.system.dept.checkDeptDataScope(user.deptId);
        
        // 校验角色数据权限
        if (user.roleIds && user.roleIds.length > 0) {
          const roleIds = Array.isArray(user.roleIds) ? user.roleIds : [user.roleIds];
          for (const roleId of roleIds) {
            await service.system.role.checkRoleDataScope(roleId);
          }
        }
        
        // 校验用户名是否唯一
        const isUserNameUnique = await service.system.user.checkUserNameUnique(user);
        if (!isUserNameUnique) {
          ctx.body = {
            code: 500,
            msg: `修改用户'${user.userName}'失败，登录账号已存在`
          };
          return;
        }
        
        // 校验手机号是否唯一
        if (user.phonenumber) {
          const checkUser = await service.system.user.checkPhoneUnique(user);
          if (checkUser && checkUser.userId !== user.userId) {
            ctx.body = {
              code: 500,
              msg: `修改用户'${user.userName}'失败，手机号码已存在`
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
              msg: `修改用户'${user.userName}'失败，邮箱账号已存在`
            };
            return;
          }
        }
        
        // 设置更新者
        user.updateBy = ctx.state.user.userName;
        
        // 修改用户
        const rows = await service.system.user.updateUser(user);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '修改成功' : '修改失败'
        };
      } catch (err) {
        ctx.logger.error('修改用户失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '修改用户失败'
        };
      }
    }

    /**
     * 删除用户
     * DELETE /api/system/user/:userIds
     * 权限：system:user:remove
     */
    @Log({ title: '用户管理', businessType: BusinessType.DELETE })
    @RequiresPermissions('system:user:remove')
    @HttpDelete('/:userIds')
    async remove() {
      const { ctx, service } = this;
      
      try {
        const { userIds } = ctx.params;
        
        // 解析用户ID数组
        const userIdArray = userIds.split(',').map(id => parseInt(id));
        
        // 检查是否包含当前用户
        if (userIdArray.includes(ctx.state.user.userId)) {
          ctx.body = {
            code: 500,
            msg: '当前用户不能删除'
          };
          return;
        }
        
        // 删除用户
        const rows = await service.system.user.deleteUserByIds(userIdArray);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '删除成功' : '删除失败'
        };
      } catch (err) {
        ctx.logger.error('删除用户失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '删除用户失败'
        };
      }
    }

    /**
     * 重置密码
     * PUT /api/system/user/resetPwd
     * 权限：system:user:resetPwd
     */
    @Log({ title: '用户管理', businessType: BusinessType.UPDATE })
    @RequiresPermissions('system:user:resetPwd')
    @HttpPut('/resetPwd')
    async resetPwd() {
      const { ctx, service } = this;
      
      try {
        const user = ctx.request.body;
        
        // 校验用户是否允许操作
        service.system.user.checkUserAllowed(user);
        
        // 校验数据权限
        await service.system.user.checkUserDataScope(user.userId);
        
        // 设置更新者
        user.updateBy = ctx.state.user.userName;
        
        // 加密密码
        user.password = await ctx.helper.security.encryptPassword(user.password);
        
        // 重置密码
        const rows = await service.system.user.resetPwd(user);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '重置成功' : '重置失败'
        };
      } catch (err) {
        ctx.logger.error('重置密码失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '重置密码失败'
        };
      }
    }

    /**
     * 修改状态
     * PUT /api/system/user/changeStatus
     */
    @HttpPut('/changeStatus')
    async changeStatus() {
      const { ctx, service } = this;
      
      try {
        const user = ctx.request.body;
        
        // 校验用户是否允许操作
        service.system.user.checkUserAllowed(user);
        
        // 校验数据权限
        await service.system.user.checkUserDataScope(user.userId);
        
        // 设置更新者
        user.updateBy = ctx.state.user.userName;
        
        // 修改状态
        const rows = await service.system.user.updateUserStatus(user);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '修改成功' : '修改失败'
        };
      } catch (err) {
        ctx.logger.error('修改用户状态失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '修改用户状态失败'
        };
      }
    }

    /**
     * 查询授权角色
     * GET /api/system/user/authRole/:userId
     */
    @HttpGet('/authRole/:userId')
    async authRole() {
      const { ctx, service } = this;
      
      try {
        const { userId } = ctx.params;
        
        // 查询用户信息
        const user = await service.system.user.selectUserById(parseInt(userId));
        
        if (!user) {
          ctx.body = {
            code: 500,
            msg: '用户不存在'
          };
          return;
        }
        
        // 查询用户角色
        const roles = await service.system.role.selectRolesByUserId(parseInt(userId));
        
        // 过滤掉管理员角色（非管理员用户不能分配管理员角色）
        const isAdmin = ctx.helper.isAdmin(parseInt(userId));
        const filteredRoles = isAdmin ? roles : roles.filter(r => !ctx.helper.isAdmin(r.roleId));
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          user,
          roles: filteredRoles
        };
      } catch (err) {
        ctx.logger.error('查询授权角色失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询授权角色失败'
        };
      }
    }

    /**
     * 用户授权
     * PUT /api/system/user/authRole
     */
    @HttpPut('/authRole')
    async insertAuthRole() {
      const { ctx, service } = this;
      
      try {
        const { userId, roleIds } = ctx.query;
        
        // 校验数据权限
        await service.system.user.checkUserDataScope(userId);
        
        // 解析角色ID数组
        const roleIdArray = typeof roleIds === 'string' 
          ? roleIds.split(',').map(id => parseInt(id))
          : roleIds;
        
        // 用户授权
        await service.system.user.insertUserAuth(userId, roleIdArray);
        
        ctx.body = {
          code: 200,
          msg: '授权成功'
        };
      } catch (err) {
        ctx.logger.error('用户授权失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '用户授权失败'
        };
      }
    }

    /**
     * 获取部门树选择
     * GET /api/system/user/deptTree
     */
    @HttpGet('/deptTree')
    async deptTree() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.query;
        
        // 查询部门树
        const deptTree = await service.system.dept.selectDeptTreeList(params);
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: deptTree
        };
      } catch (err) {
        ctx.logger.error('查询部门树失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询部门树失败'
        };
      }
    }

    /**
     * 导出用户
     * POST /api/system/user/export
     * 权限：system:user:export
     */
    @Log({ title: '用户管理', businessType: BusinessType.EXPORT })
    @RequiresPermissions('system:user:export')
    @HttpPost('/export')
    async export() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.request.body;
        
        // 查询用户列表
        const list = await service.system.user.selectUserList(params);
        
        // 定义 Excel 列配置
        const columns = [
          { header: '用户序号', key: 'userId', width: 12 },
          { header: '登录名称', key: 'userName', width: 15 },
          { header: '用户名称', key: 'nickName', width: 15 },
          { header: '用户邮箱', key: 'email', width: 25 },
          { header: '手机号码', key: 'phonenumber', width: 15 },
          { header: '用户性别', key: 'sexText', width: 10 },
          { header: '账号状态', key: 'statusText', width: 10 },
          { header: '最后登录IP', key: 'loginIp', width: 15 },
          { header: '最后登录时间', key: 'loginDate', width: 20 },
          { header: '部门名称', key: 'deptName', width: 20 },
          { header: '部门负责人', key: 'leader', width: 15 }
        ];
        
        // 处理导出数据
        const exportData = list.map(user => ({
          ...user,
          deptName: user.dept ? user.dept.deptName : '',
          leader: user.dept ? user.dept.leader : '',
          sexText: ExcelUtil.convertDictValue(user.sex, { '0': '男', '1': '女', '2': '未知' }),
          statusText: ExcelUtil.convertDictValue(user.status, { '0': '正常', '1': '停用' })
        }));
        
        // 导出 Excel
        ExcelUtil.exportExcel(ctx, exportData, columns, '用户数据');
      } catch (err) {
        ctx.logger.error('导出用户失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '导出用户失败'
        };
      }
    }

    /**
     * 导入用户
     * POST /api/system/user/importData
     * 权限：system:user:import
     */
    @RequiresPermissions('system:user:import')
    @HttpPost('/importData')
    async importData() {
      const { ctx, service } = this;
      
      try {
        // 获取上传的文件
        const parts = ctx.multipart();
        let fileBuffer = null;
        let updateSupport = 'true' === ctx.query.updateSupport;
        
        let part;
        while ((part = await parts()) != null) {
          
            // 处理文件流
            if (part.fieldname === 'file') {
              const chunks = [];
              part.on('data', chunk => {
                chunks.push(chunk);
              });
              
              await new Promise((resolve, reject) => {
                part.on('end', () => {
                  fileBuffer = Buffer.concat(chunks);
                  resolve();
                });
                part.on('error', reject);
              });
            } else {
              // 清理未使用的流
              await part.resume();
            }
          
        }
        
        if (!fileBuffer || fileBuffer.length === 0) {
          ctx.body = { code: 400, msg: '请选择要导入的文件' };
          return;
        }
        
        // 定义导入列配置
        const columns = [
          { header: '用户名称', key: 'userName', required: true, example: 'zhangsan' },
          { header: '用户昵称', key: 'nickName', required: true, example: '张三' },
          { header: '部门名称', key: 'deptName', required: false, example: '研发部门' },
          { header: '手机号码', key: 'phonenumber', required: false, example: '13888888888' },
          { header: '邮箱', key: 'email', required: false, example: 'zhangsan@example.com' },
          { 
            header: '用户性别', 
            key: 'sex', 
            required: false, 
            example: '男',
            dictMap: { '0': '男', '1': '女', '2': '未知' }
          },
          { 
            header: '帐号状态', 
            key: 'status', 
            required: false, 
            example: '正常',
            dictMap: { '0': '正常', '1': '停用' }
          },
          { header: '备注', key: 'remark', required: false, example: '用户备注信息' }
        ];
        
        // 解析 Excel 文件
        const userList = ExcelUtil.importExcel(fileBuffer, columns);
        
        // 调用用户导入服务
        const operName = ctx.state.user.userName;
        const message = await service.system.user.importUser(userList, updateSupport, operName);
        
        ctx.body = {
          code: 200,
          msg: message
        };
      } catch (err) {
        ctx.logger.error('导入用户失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '导入用户失败'
        };
      }
    }

    /**
     * 下载导入模板
     * POST /api/system/user/importTemplate
     */
    @HttpPost('/importTemplate')
    async importTemplate() {
      const { ctx } = this;
      
      try {
        // 定义模板列配置（与导入配置保持一致）
        const columns = [
          { header: '用户名称', key: 'userName', width: 15, example: 'zhangsan' },
          { header: '用户昵称', key: 'nickName', width: 15, example: '张三' },
          { header: '部门名称', key: 'deptName', width: 20, example: '研发部门' },
          { header: '手机号码', key: 'phonenumber', width: 15, example: '13888888888' },
          { header: '邮箱', key: 'email', width: 25, example: 'zhangsan@example.com' },
          { header: '用户性别', key: 'sex', width: 10, example: '男' },
          { header: '帐号状态', key: 'status', width: 10, example: '正常' },
          { header: '备注', key: 'remark', width: 30, example: '用户备注信息' }
        ];
        
        // 生成并下载模板
        ExcelUtil.exportTemplate(ctx, columns, '用户导入模板');
      } catch (err) {
        ctx.logger.error('下载模板失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '下载模板失败'
        };
      }
    }
  }

  return UserController;
};

