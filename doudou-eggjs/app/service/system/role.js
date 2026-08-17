/*
 * @Description: 角色服务层
 * @Author: AI Assistant
 * @Date: 2025-10-23
 */

const Service = require("egg").Service;
const { DataScope } = require("../../decorator/dataScope");

class RoleService extends Service {
  /**
   * 查询所有角色
   * @return {array} 角色列表
   */
  async selectRoleAll() {
    const { ctx } = this;

    return await ctx.helper.getDB(ctx).sysRoleMapper.selectRoleAll();
  }

  /**
   * 根据用户ID查询角色列表
   * @param {number} userId - 用户ID
   * @return {array} 角色列表
   */
  async selectRolesByUserId(userId) {
    const { ctx } = this;

    // 查询用户拥有的角色权限
    const userRoles =
      await ctx.helper.getDB(ctx).sysRoleMapper.selectRolePermissionByUserId(
        [],
        { userId }
      );

    // 查询所有角色
    const roles = await this.selectRoleAll();

    // 遍历所有角色，标记用户拥有的角色
    for (const role of roles) {
      for (const userRole of userRoles) {
        if (role.roleId === userRole.roleId) {
          role.flag = true;
          break;
        }
      }
    }

    return roles;
  }

  /**
   * 分页查询角色列表（带数据权限过滤）
   * @param {object} role - 查询参数
   * @return {object} 分页结果
   */
  @DataScope({ deptAlias: "d" })
  async selectRolePage(role = {}) {
    const { ctx } = this;
    const mapper = ctx.helper.getDB(ctx).sysRoleMapper;

    // 确保包含 params 参数
    const conditions = {
      ...role,
      params: role.params || {}
    };

    return await ctx.helper.pageQuery(
      mapper.selectRoleListMapper([], conditions),
      conditions,
      mapper.db()
    );
  }

  /**
   * 查询角色列表（带数据权限过滤）
   * @param {object} role - 查询参数
   * @return {array} 角色列表
   */
  @DataScope({ deptAlias: "d" })
  async selectRoleList(role = {}) {
    const { ctx } = this;

    // 查询条件
    const conditions = {
      roleId: role.roleId,
      roleName: role.roleName,
      roleKey: role.roleKey,
      status: role.status,
      params: role.params || {
        beginTime: role.beginTime,
        endTime: role.endTime,
      },
    };

    // 查询列表
    const roles = await ctx.helper.getDB(ctx).sysRoleMapper.selectRoleList(
      [],
      conditions
    );

    return roles || [];
  }

  /**
   * 根据角色ID查询角色
   * @param {number} roleId - 角色ID
   * @return {object} 角色信息
   */
  async selectRoleById(roleId) {
    const { ctx } = this;

    return await ctx.helper.getDB(ctx).sysRoleMapper.selectRoleById([], {
      roleId,
    });
  }

  /**
   * 校验角色名称是否唯一
   * @param {object} role - 角色对象
   * @return {boolean} true-唯一 false-不唯一
   */
  async checkRoleNameUnique(role) {
    const { ctx } = this;

    const roleId = role.roleId || -1;
    const roles =
      await ctx.helper.getDB(ctx).sysRoleMapper.checkRoleNameUnique([], {
        roleName: role.roleName,
        roleId,
      });

    if (roles && roles.length > 0 && roles[0].roleId !== roleId) {
      return false;
    }

    return true;
  }

  /**
   * 校验角色权限字符是否唯一
   * @param {object} role - 角色对象
   * @return {boolean} true-唯一 false-不唯一
   */
  async checkRoleKeyUnique(role) {
    const { ctx } = this;

    const roleId = role.roleId || -1;
    const roles =
      await ctx.helper.getDB(ctx).sysRoleMapper.checkRoleKeyUnique([], {
        roleKey: role.roleKey,
        roleId,
      });

    if (roles && roles.length > 0 && roles[0].roleId !== roleId) {
      return false;
    }

    return true;
  }

  /**
   * 校验角色是否允许操作
   * @param {object} role - 角色对象
   */
  checkRoleAllowed(role) {
    const { ctx } = this;

    if (role.roleId && ctx.helper.isAdmin(role.roleId)) {
      throw new Error("不允许操作超级管理员角色");
    }
  }

  /**
   * 校验角色是否有数据权限
   * @param {number} roleId - 角色ID
   */
  async checkRoleDataScope(roleId) {
    const { ctx } = this;

    // 管理员拥有所有数据权限
    if (ctx.helper.isAdmin(ctx.state.user.userId)) {
      return;
    }

    // 查询角色是否在当前用户的数据权限范围内
    const role = await this.selectRoleById(roleId);
    if (!role) {
      throw new Error("没有权限访问角色数据！");
    }
  }

  /**
   * 新增角色
   * @param {object} role - 角色对象
   * @return {number} 影响行数
   */
  async insertRole(role) {
    const { ctx } = this;

    // 设置创建信息
    role.createBy = ctx.state.user.userName;
    role.menuCheckStrictly = role.menuCheckStrictly === true ? 1 : 0;
    role.deptCheckStrictly = role.deptCheckStrictly === true ? 1 : 0;

    // 插入角色
    const result = await ctx.helper.getMasterDB(ctx).sysRoleMapper.insertRole(
      [],
      role
    );

    if (result > 0) {
      // 插入角色与菜单关联
      if (role.menuIds && role.menuIds.length > 0) {
        await this.insertRoleMenu(result, role.menuIds);
      }

      return 1;
    }

    return 0;
  }

  /**
   * 修改角色
   * @param {object} role - 角色对象
   * @return {number} 影响行数
   */
  async updateRole(role) {
    const { ctx } = this;

    // 设置更新信息
    role.updateBy = ctx.state.user.userName;

    // 更新角色
    const result = await ctx.helper.getMasterDB(ctx).sysRoleMapper.updateRole(
      [],
      role
    );

    // 删除角色与菜单关联
    await ctx.helper.getMasterDB(ctx).sysRoleMenuMapper.deleteRoleMenuByRoleId(
      [],
      { roleId: role.roleId }
    );

    // 插入角色与菜单关联
    if (role.menuIds && role.menuIds.length > 0) {
      await this.insertRoleMenu(role.roleId, role.menuIds);
    }

    return result;
  }

  /**
   * 修改角色状态
   * @param {object} role - 角色对象
   * @return {number} 影响行数
   */
  async updateRoleStatus(role) {
    const { ctx } = this;

    const result = await ctx.helper.getMasterDB(ctx).sysRoleMapper.updateRole(
      [],
      role
    );

    return result;
  }

  /**
   * 修改数据权限
   * @param {object} role - 角色对象
   * @return {number} 影响行数
   */
  async authDataScope(role) {
    const { ctx } = this;

    // 更新角色
    const result = await ctx.helper.getMasterDB(ctx).sysRoleMapper.updateRole(
      [],
      role
    );

    // 删除角色与部门关联
    await ctx.helper.getMasterDB(ctx).sysRoleDeptMapper.deleteRoleDeptByRoleId(
      [],
      { roleId: role.roleId }
    );

    // 插入角色与部门关联
    if (role.deptIds && role.deptIds.length > 0) {
      await this.insertRoleDept(role.roleId, role.deptIds);
    }

    return result;
  }

  /**
   * 删除角色
   * @param {array} roleIds - 角色ID数组
   * @return {number} 影响行数
   */
  async deleteRoleByIds(roleIds) {
    const { ctx } = this;

    // 删除角色与菜单关联
    await ctx.helper.getMasterDB(ctx).sysRoleMenuMapper.deleteRoleMenu([], {
      array: roleIds,
    });

    // 删除角色与部门关联
    await ctx.helper.getMasterDB(ctx).sysRoleDeptMapper.deleteRoleDept([], {
      array: roleIds,
    });

    // 删除角色（软删除）
    const result =
      await ctx.helper.getMasterDB(ctx).sysRoleMapper.deleteRoleByIds([], {
        array: roleIds,
      });

    return result;
  }

  /**
   * 取消授权用户
   * @param {object} userRole - 用户角色对象
   * @return {number} 影响行数
   */
  async deleteAuthUser(userRole) {
    const { ctx } = this;

    return ctx.helper.getMasterDB(ctx).sysUserRoleMapper.deleteUserRoleInfo(
      [],
      userRole
    );
  }

  /**
   * 批量取消授权用户
   * @param {number} roleId - 角色ID
   * @param {array} userIds - 用户ID数组
   * @return {number} 影响行数
   */
  async deleteAuthUsers(roleId, userIds) {
    const { ctx } = this;

    return ctx.helper.getMasterDB(ctx).sysUserRoleMapper.deleteUserRoleInfos(
      [],
      {
        roleId,
        userIds,
      }
    );
  }

  /**
   * 批量授权用户
   * @param {number} roleId - 角色ID
   * @param {array} userIds - 用户ID数组
   * @return {number} 影响行数
   */
  async insertAuthUsers(roleId, userIds) {
    const { ctx } = this;

    if (!userIds || userIds.length === 0) {
      return 0;
    }

    const userRoles = userIds.map((userId) => ({
      userId,
      roleId,
    }));

    await ctx.helper.getMasterDB(ctx).sysUserRoleMapper.batchUserRole(
      [],
    {list: userRoles}
    );

    return userIds.length;
  }

  /**
   * 插入角色与菜单关联
   * @param {number} roleId - 角色ID
   * @param {array} menuIds - 菜单ID数组
   */
  async insertRoleMenu(roleId, menuIds) {
    const { ctx } = this;

    if (!menuIds || menuIds.length === 0) {
      return;
    }

    const roleMenus = menuIds.map((menuId) => ({
      roleId,
      menuId,
    }));

    await ctx.helper.getMasterDB(ctx).sysRoleMenuMapper.batchRoleMenu([], {
      list: roleMenus,
    });
  }

  /**
   * 插入角色与部门关联
   * @param {number} roleId - 角色ID
   * @param {array} deptIds - 部门ID数组
   */
  async insertRoleDept(roleId, deptIds) {
    const { ctx } = this;

    if (!deptIds || deptIds.length === 0) {
      return;
    }

    const roleDepts = deptIds.map((deptId) => ({
      roleId,
      deptId,
    }));

    await ctx.helper.getMasterDB(ctx).sysRoleDeptMapper.batchRoleDept([], {
      list: roleDepts,
    });
  }
}

module.exports = RoleService;
