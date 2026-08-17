/*
 * @Description: 用户服务�?
 * @Author: AI Assistant
 * @Date: 2025-10-23
 */

const Service = require("egg").Service;
const { DataScope } = require("../../decorator/dataScope");

class UserService extends Service {
  /**
   * 查询用户列表（分页，带数据权限过滤）
   * @param {object} params - 查询参数
   * @return {object} 分页结果（包含部门信息）
   */
  @DataScope({ deptAlias: "d", userAlias: "u" })
  async selectUserPage(params = {}) {
    const { ctx } = this;
    const mapper = ctx.helper.getDB(ctx).sysUserMapper;

    const result = await ctx.helper.pageQuery(
      mapper.selectUserListMapper([], params),
      params,
      mapper.db()
    );

    // 为每个用户添加部门信息
    if (result.rows && result.rows.length > 0) {
      for (const user of result.rows) {
        if (user.deptId) {
          user.dept = await this.selectDeptByDeptId(user.deptId);
        }
      }
    }

    return result;
  }

  

  /**
   * 查询用户列表（带数据权限过滤）
   * @param {object} params - 查询参数
   * @return {array} 用户列表
   */
  @DataScope({ deptAlias: "d", userAlias: "u" })
  async selectUserList(params = {}) {
    const { ctx } = this;

    // 查询条件
    const conditions = {
      userId: params.userId,
      userName: params.userName,
      phonenumber: params.phonenumber,
      status: params.status,
      deptId: params.deptId,
      params: {
        beginTime: params.beginTime,
        endTime: params.endTime,
        ...(params.params || {}),
      },
    };

    // 查询列表
    const users = await ctx.helper
      .getDB(ctx)
      .sysUserMapper.selectUserList([], conditions);
    
    // 为每个用户添加部门信息
    if (users && users.length > 0) {
      for (const user of users) {
        if (user.deptId) {
          user.dept = await this.selectDeptByDeptId(user.deptId);
        }
      }
    }

    return users || [];
  }

  /**
   * 根据用户ID查询用户（包含部门和角色信息）
   * @param {number} userId - 用户ID
   * @return {object} 用户信息（包含 dept、roles 和 roleIds）
   */
  async selectUserById(userId) {
    const { ctx } = this;

    const users = await ctx.helper.getDB(ctx).sysUserMapper.selectUserById([], {
      userId,
    });

    let user = Array.isArray(users) ? users[0] : users;
    
   user = await this.selectUserWithDeptAndRoles(user);
    
    return user;
  }

  /**
   * 根据用户名查询角色列表
   * @param {string} userName - 用户名
   * @return {object} { roles: 角色列表, roleIds: 角色ID列表 }
   */
  async selectRolesByUserName(userName) {
    const { ctx } = this;
    
    if (!userName) {
      return { roles: [], roleIds: [] };
    }
    
    const roles = await ctx.helper.getDB(ctx).sysRoleMapper.selectRolesByUserName([], {
      userName
    }) || [];
    
    // 提取角色ID列表
    const roleIds = roles.map(role => role.roleId);
    
    return { roles, roleIds };
  }

  /**
   * 根据部门ID查询部门信息
   * @param {number} deptId - 部门ID
   * @return {object} 部门信息
   */
  async selectDeptByDeptId(deptId) {
    const { ctx } = this;
    
    if (!deptId) {
      return null;
    }
    
    return await ctx.helper.getDB(ctx).sysDeptMapper.selectDeptById([], {
      deptId
    });
  }

  /**
   * 根据用户对象查询用户详情（包含部门和角色列表）
   * @param {object} user - 用户对象（必须包含 userName 和 deptId）
   * @return {object} 用户详情（包含 dept、roles 和 roleIds 字段）
   */
  async selectUserWithDeptAndRoles(user) {
    const { ctx } = this;
    
    if (!user || !user.userName) {
      return null;
    }
    
    // 1. 查询角色列表和角色ID
    const { roles, roleIds } = await this.selectRolesByUserName(user.userName);
    
    // 2. 查询部门信息
    const dept = await this.selectDeptByDeptId(user.deptId);
    
    // 3. 组装结果
    return {
      ...user,
      dept,
      roles,
      roleIds
    };
  }

  /**
   * 根据用户名查询用�?
   * @param {string} userName - 用户�?
   * @return {object} 用户信息
   */
  async selectUserByUserName(userName) {
    const { ctx } = this;

    const user = await ctx.helper
      .getDB(ctx)
      .sysUserMapper.selectUserByUserName([], {
        userName,
      });

    return user;
  }

  /**
   * 校验用户名是否已存在
   * 注意：返回的是查询结果本身——命中(用户名已被占用)时为用户记录(truthy)，
   * 未命中(用户名可用)时为 null。调用方据此判断是否重名。
   * @param {object} user - 用户对象，需包含 userName 字段
   * @return {object|null} 已存在则返回匹配的用户记录，否则返回 null
   */
  async checkUserNameUnique(user) {
    const { ctx } = this;

    return await ctx.helper.getDB(ctx).sysUserMapper.checkUserNameUnique([], {
      userName: user.userName,
    });
  }

  /**
   * 校验手机号是否唯一
   * @param {object} user - 用户对象
   * @return {boolean} true-唯一 false-不唯一
   */
  async checkPhoneUnique(user) {
    const { ctx } = this;

    return await ctx.helper.getDB(ctx).sysUserMapper.checkPhoneUnique([], {
      phonenumber: user.phonenumber,
    });
  }

  /**
   * 校验邮箱是否唯一
   * @param {object} user - 用户对象
   * @return {boolean} true-唯一 false-不唯一
   */
  async checkEmailUnique(user) {
    const { ctx } = this;

    return await ctx.helper.getDB(ctx).sysUserMapper.checkEmailUnique([], {
      email: user.email,
    });
  }

  /**
   * 校验用户是否允许操作
   * @param {object} user - 用户对象
   */
  checkUserAllowed(user) {
    const { ctx } = this;

    if (user.userId && ctx.helper.isAdmin(user.userId)) {
      throw new Error("不允许操作超级管理员用户");
    }
  }

  /**
   * 校验用户是否有数据权�?
   * @param {number} userId - 用户ID
   */
  async checkUserDataScope(userId) {
    const { ctx } = this;

    // 管理员拥有所有数据权�?
    if (ctx.helper.isAdmin(ctx.state.user.userId)) {
      return;
    }

    // TODO: 实现数据权限校验
  }

  /**
   * 新增用户
   * @param {object} user - 用户对象
   * @return {number} 影响行数
   */
  async insertUser(user) {
    const { ctx } = this;

    // 设置创建信息
    user.createBy = ctx.state.user.userName;

    // 插入用户
    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysUserMapper.insertUser([], user);

    if (result) {
      const userId = result;

      // 插入用户与岗位关�?
      if (user.postIds && user.postIds.length > 0) {
        await this.insertUserPost(userId, user.postIds);
      }

      // 插入用户与角色关�?
      if (user.roleIds && user.roleIds.length > 0) {
        await this.insertUserRole(userId, user.roleIds);
      }

      return 1;
    }

    return 0;
  }

  /**
   * 修改用户
   * @param {object} user - 用户对象
   * @return {number} 影响行数
   */
  async updateUser(user) {
    const { ctx } = this;

    // 设置更新信息
    user.updateBy = ctx.state.user.userName;

    // 删除用户与角色关�?
    await ctx.helper
      .getMasterDB(ctx)
      .sysUserRoleMapper.deleteUserRoleByUserId([], { userId: user.userId });

    // 插入用户与角色关�?
    if (user.roleIds && user.roleIds.length > 0) {
      await this.insertUserRole(user.userId, user.roleIds);
    }

    // 删除用户与岗位关�?
    await ctx.helper
      .getMasterDB(ctx)
      .sysUserPostMapper.deleteUserPostByUserId([], { userId: user.userId });

    // 插入用户与岗位关�?
    if (user.postIds && user.postIds.length > 0) {
      await this.insertUserPost(user.userId, user.postIds);
    }

    // 更新用户
    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysUserMapper.updateUser([], user);

    return result;
  }

  /**
   * 修改用户状�?
   * @param {object} user - 用户对象
   * @return {number} 影响行数
   */
  async updateUserStatus(user) {
    const { ctx } = this;

    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysUserMapper.updateUserStatus([], user);

    return result;
  }

  /**
   * 重置用户密码
   * @param {object} user - 用户对象
   * @return {number} 影响行数
   */
  async resetPwd(user) {
    const { ctx } = this;

    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysUserMapper.resetUserPwd([], user);

    return result;
  }

  /**
   * 删除用户
   * @param {array} userIds - 用户ID数组
   * @return {number} 影响行数
   */
  async deleteUserByIds(userIds) {
    const { ctx } = this;

    // 删除用户与角色关�?
    await ctx.helper.getMasterDB(ctx).sysUserRoleMapper.deleteUserRole([], {
      array: userIds,
    });

    // 删除用户与岗位关�?
    await ctx.helper.getMasterDB(ctx).sysUserPostMapper.deleteUserPost([], {
      array: userIds,
    });

    // 删除用户
    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysUserMapper.deleteUserByIds([], {
        array: userIds,
      });

    return result;
  }

  /**
   * 用户授权角色
   * @param {number} userId - 用户ID
   * @param {array} roleIds - 角色ID数组
   */
  async insertUserAuth(userId, roleIds) {
    const { ctx } = this;

    // 删除用户与角色关�?
    await ctx.helper
      .getMasterDB(ctx)
      .sysUserRoleMapper.deleteUserRoleByUserId([], { userId });

    // 插入用户与角色关�?
    await this.insertUserRole(userId, roleIds);
  }

  /**
   * 插入用户与角色关�?
   * @param {number} userId - 用户ID
   * @param {array} roleIds - 角色ID数组
   */
  async insertUserRole(userId, roleIds) {
    const { ctx } = this;

    if (!roleIds || roleIds.length === 0) {
      return;
    }

    const userRoles = roleIds.map((roleId) => ({
      userId,
      roleId,
    }));

    await ctx.helper
      .getMasterDB(ctx)
      .sysUserRoleMapper.batchUserRole([], { list: userRoles });
  }

  /**
   * 插入用户与岗位关�?
   * @param {number} userId - 用户ID
   * @param {array} postIds - 岗位ID数组
   */
  async insertUserPost(userId, postIds) {
    const { ctx } = this;

    if (!postIds || postIds.length === 0) {
      return;
    }

    const userPosts = postIds.map((postId) => ({
      userId,
      postId,
    }));

    await ctx.helper
      .getMasterDB(ctx)
      .sysUserPostMapper.batchUserPost([], { list: userPosts });
  }

  /**
   * 导入用户数据
   * @param {array} userList - 用户列表
   * @param {boolean} updateSupport - 是否更新已存在的用户
   * @param {string} operName - 操作�?
   * @return {string} 导入结果信息
   */
  async importUser(userList, updateSupport = false, operName) {
    const { ctx } = this;

    if (!userList || userList.length === 0) {
      throw new Error("导入用户数据不能为空");
    }

    let successNum = 0;
    let failureNum = 0;
    const failureMsg = [];

    for (const user of userList) {
      try {
        
        // 根据部门名称查询部门ID
        if (user.deptName) {
          const dept = await ctx.service.system.dept.selectDeptByName(user.deptName);
          if (dept) {
            user.deptId = dept.deptId;
          }
        }
        
        // 校验用户名是否存�?
        const existUser = await this.selectUserByUserName(user.userName);

        if (!existUser) {
          // 新增用户
          user.password = await ctx.helper.security.encryptPassword(
            user.password || "123456"
          );
          user.createBy = operName;
          await this.insertUser(user);
          successNum++;
        } else if (updateSupport) {
          // 更新用户
          user.userId = existUser.userId;
          user.updateBy = operName;
          await this.updateUser(user);
          successNum++;
        } else {
          failureNum++;
          failureMsg.push(`用户 ${user.userName} 已存在`);
        }
      } catch (err) {
        failureNum++;
        failureMsg.push(`用户 ${user.userName} 导入失败�?{err.message}`);
      }
    }

    if (failureNum > 0) {
      return `导入成功 ${successNum} 条，失败 ${failureNum} 条�?{failureMsg.join(
        "; "
      )}`;
    }

    return `导入成功 ${successNum} 条`;
  }

  /**
   * 修改用户个人信息
   * @param {object} user - 用户对象
   * @return {number} 影响行数
   */
  async updateUserProfile(user) {
    const { ctx } = this;

    // 设置更新信息
    user.updateBy = ctx.state.user.userName;

    // 更新用户
    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysUserMapper.updateUser([], user);

    return result;
  }

  /**
   * 修改用户密码
   * @param {number} userId - 用户ID
   * @param {string} password - 新密码（已加密）
   * @return {number} 影响行数
   */
  async resetUserPwd(userId, password) {
    const { ctx } = this;

    const user = {
      userId,
      password,
    };

    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysUserMapper.resetUserPwd([], user);

    return result;
  }

  /**
   * 修改用户头像
   * @param {number} userId - 用户ID
   * @param {string} avatar - 头像地址
   * @return {boolean} 是否成功
   */
  async updateUserAvatar(userId, avatar) {
    const { ctx } = this;

    const user = {
      userId,
      avatar,
    };

    return await ctx.helper
      .getMasterDB(ctx)
      .sysUserMapper.updateUserAvatar([], user);
  }

  /**
   * 查询用户角色组
   * @param {string} userName - 用户名
   * @return {string} 角色组
   */
  async selectUserRoleGroup(userName) {
    const { ctx } = this;

    const roles = await ctx.helper
      .getMasterDB(ctx)
      .sysRoleMapper.selectRolesByUserName([],{userName});

    if (!roles || roles.length === 0) {
      return '';
    }

    return roles.map((r) => r.roleName).join(',');
  }

  /**
   * 查询用户岗位组
   * @param {string} userName - 用户名
   * @return {string} 岗位组
   */
  async selectUserPostGroup(userName) {
    const { ctx } = this;

    const posts = await ctx.helper
      .getMasterDB(ctx)
      .sysPostMapper.selectPostsByUserName([], { userName });

    if (!posts || posts.length === 0) {
      return '';
    }

    return posts.map((p) => p.postName).join(',');
  }

  /**
   * 查询已分配用户角色列表
   * @param {object} params - 查询参数
   * @return {object} 分页结果
   */
  @DataScope({ deptAlias: "d", userAlias: "u" })
  async selectAllocatedList(params) {
    const { ctx } = this;

    const mapper = ctx.helper.getDB(ctx).sysUserMapper;

    return await ctx.helper.pageQuery(
      mapper.selectAllocatedListMapper([], params),
      params,
      mapper.db()
    );
  }

  /**
   * 查询未分配用户角色列表
   * @param {object} params - 查询参数
   * @return {array} 用户列表
   */
  @DataScope({ deptAlias: "d", userAlias: "u" })
  async selectUnallocatedList(params) {
    const { ctx } = this;

    const mapper = ctx.helper.getDB(ctx).sysUserMapper;

    return await ctx.helper.pageQuery(
      mapper.selectUnallocatedListMapper([], params),
      params,
      mapper.db()
    );
  }
}

module.exports = UserService;
