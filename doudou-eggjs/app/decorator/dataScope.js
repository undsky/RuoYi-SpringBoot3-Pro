/*
 * @Description: 数据权限过滤装饰器
 * @Author: AI Assistant
 * @Date: 2025-11-23
 */

const { DataScopeType } = require('../constant');

/**
 * 数据权限装饰器
 * @param {object} options - 配置选项
 * @param {string} options.deptAlias - 部门表的别名，默认为 'd'
 * @param {string} options.userAlias - 用户表的别名，默认为 'u'
 * @param {string} options.permission - 权限字符（用于多个角色匹配符合要求的权限）
 * 
 * 使用示例：
 * @DataScope({ deptAlias: 'd', userAlias: 'u' })
 * async selectUserList(params) { ... }
 */
function DataScope(options = {}) {
  const { deptAlias = 'd', userAlias = 'u', permission = '' } = options;
  
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const ctx = this.ctx;
      const params = args[0] || {};
      
      // 清空 dataScope 防止注入
      if (params.params) {
        params.params.dataScope = '';
      } else {
        params.params = { dataScope: '' };
      }
      
      // 获取当前登录用户
      const user = ctx.state.user;
      
      // 如果未登录或是超级管理员，不过滤数据
      if (!user || ctx.helper.isAdmin(user.userId)) {
        return await originalMethod.apply(this, args);
      }
      
      // 生成数据权限 SQL
      const dataScopeSql = await generateDataScopeSql(ctx, user, deptAlias, userAlias, permission);
      
      if (dataScopeSql) {
        params.params.dataScope = dataScopeSql;
      }
      
      return await originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * 生成数据权限 SQL
 * @param {object} ctx - 上下文对象
 * @param {object} user - 当前用户
 * @param {string} deptAlias - 部门表别名
 * @param {string} userAlias - 用户表别名
 * @param {string} permission - 权限字符
 * @return {string} 数据权限 SQL 条件
 */
async function generateDataScopeSql(ctx, user, deptAlias, userAlias, permission) {
  const { service } = ctx.app;
  
  // 查询用户拥有的角色权限（包含数据权限范围）
  const userRoles = await ctx.helper.getDB(ctx).sysRoleMapper.selectRolePermissionByUserId(
    [],
    { userId: user.userId }
  );
  
  if (!userRoles || userRoles.length === 0) {
    // 没有角色，不查询任何数据
    return ` AND (${deptAlias}.dept_id = 0)`;
  }
  
  const sqlConditions = [];
  const conditions = new Set();
  const scopeCustomIds = [];
  
  // 收集自定义数据权限的角色ID
  userRoles.forEach(role => {
    if (role.dataScope === DataScopeType.CUSTOM && role.status === '0') {
      scopeCustomIds.push(role.roleId);
    }
  });
  
  // 遍历角色，生成 SQL 条件
  for (const role of userRoles) {
    const dataScope = role.dataScope;
    
    // 跳过已处理的数据权限类型或停用的角色
    if (conditions.has(dataScope) || role.status === '1') {
      continue;
    }
    
    switch (dataScope) {
      case DataScopeType.ALL:
        // 全部数据权限，清空条件并退出
        return '';
        
      case DataScopeType.CUSTOM:
        // 自定义数据权限
        if (scopeCustomIds.length > 1) {
          // 多个自定义数据权限使用 IN 查询
          sqlConditions.push(`${deptAlias}.dept_id IN (SELECT dept_id FROM sys_role_dept WHERE role_id IN (${scopeCustomIds.join(',')}))`);
        } else if (scopeCustomIds.length === 1) {
          sqlConditions.push(`${deptAlias}.dept_id IN (SELECT dept_id FROM sys_role_dept WHERE role_id = ${role.roleId})`);
        }
        break;
        
      case DataScopeType.DEPT:
        // 部门数据权限
        sqlConditions.push(`${deptAlias}.dept_id = ${user.deptId}`);
        break;
        
      case DataScopeType.DEPT_AND_CHILD:
        // 部门及以下数据权限（标准 SQL，兼容 MySQL / PostgreSQL / SQLite）
        sqlConditions.push(`${deptAlias}.dept_id IN (SELECT dept_id FROM sys_dept WHERE dept_id = ${user.deptId} OR ancestors LIKE '%,${user.deptId},%' OR ancestors LIKE '${user.deptId},%' OR ancestors LIKE '%,${user.deptId}' OR ancestors = '${user.deptId}')`);
        break;
        
      case DataScopeType.SELF:
        // 仅本人数据权限
        if (userAlias) {
          sqlConditions.push(`${userAlias}.user_id = ${user.userId}`);
        } else {
          // 数据权限为仅本人且没有 userAlias 别名，不查询任何数据
          sqlConditions.push(`${deptAlias}.dept_id = 0`);
        }
        break;
    }
    
    conditions.add(dataScope);
  }
  
  // 如果没有任何条件（角色都不包含传递过来的权限字符），不查询任何数据
  if (sqlConditions.length === 0) {
    return ` AND (${deptAlias}.dept_id = 0)`;
  }
  
  // 拼接 SQL 条件
  return ` AND (${sqlConditions.join(' OR ')})`;
}

module.exports = {
  DataScope,
  DataScopeType,
  generateDataScopeSql
};
