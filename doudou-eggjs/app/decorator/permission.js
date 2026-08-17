/*
 * @Description: 权限控制装饰器
 * @Author: AI Assistant
 * @Date: 2025-10-27
 */

/**
 * 权限验证装饰器 - 类似 Spring Boot 的 @PreAuthorize
 * 
 * 用法示例：
 * @RequiresPermissions('system:user:list')
 * @RequiresPermissions(['system:user:list', 'system:user:query'], 'OR')
 * @RequiresRoles('admin')
 * @RequiresRoles(['admin', 'editor'], 'AND')
 */

/**
 * 权限验证装饰器
 * @param {string|array} permissions - 权限字符串或数组
 * @param {string} logical - 逻辑类型 'AND' 或 'OR'，默认 'AND'
 */
function RequiresPermissions(permissions, logical = 'AND') {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const ctx = this.ctx;
      
      try {
        // 获取当前用户权限
        const userPermissions = await getUserPermissions(ctx);
        
        // 验证权限
        const hasPermission = checkPermissions(userPermissions, permissions, logical);
        
        if (!hasPermission) {
          ctx.status = 403;
          ctx.body = {
            code: 403,
            msg: '没有权限，请联系管理员授权'
          };
          return;
        }
        
        // 执行原方法
        return await originalMethod.apply(this, args);
      } catch (err) {
        ctx.logger.error('权限验证失败:', err);
        ctx.status = 500;
        ctx.body = {
          code: 500,
          msg: '权限验证失败'
        };
      }
    };
    
    return descriptor;
  };
}

/**
 * 角色验证装饰器
 * @param {string|array} roles - 角色字符串或数组
 * @param {string} logical - 逻辑类型 'AND' 或 'OR'，默认 'AND'
 */
function RequiresRoles(roles, logical = 'AND') {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const ctx = this.ctx;
      
      try {
        // 获取当前用户角色
        const userRoles = await getUserRoles(ctx);
        
        // 验证角色
        const hasRole = checkRoles(userRoles, roles, logical);
        
        if (!hasRole) {
          ctx.status = 403;
          ctx.body = {
            code: 403,
            msg: '没有权限，请联系管理员授权'
          };
          return;
        }
        
        // 执行原方法
        return await originalMethod.apply(this, args);
      } catch (err) {
        ctx.logger.error('角色验证失败:', err);
        ctx.status = 500;
        ctx.body = {
          code: 500,
          msg: '角色验证失败'
        };
      }
    };
    
    return descriptor;
  };
}

/**
 * 组合权限验证装饰器（同时验证角色和权限）
 * @param {object} options - 配置选项
 *   - roles: 角色数组
 *   - permissions: 权限数组
 *   - logical: 逻辑类型
 */
function RequiresAuth(options = {}) {
  const { roles, permissions, logical = 'AND' } = options;
  
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const ctx = this.ctx;
      
      try {
        // 验证角色
        if (roles) {
          const userRoles = await getUserRoles(ctx);
          const hasRole = checkRoles(userRoles, roles, logical);
          
          if (!hasRole) {
            ctx.status = 403;
            ctx.body = {
              code: 403,
              msg: '没有权限，请联系管理员授权'
            };
            return;
          }
        }
        
        // 验证权限
        if (permissions) {
          const userPermissions = await getUserPermissions(ctx);
          const hasPermission = checkPermissions(userPermissions, permissions, logical);
          
          if (!hasPermission) {
            ctx.status = 403;
            ctx.body = {
              code: 403,
              msg: '没有权限，请联系管理员授权'
            };
            return;
          }
        }
        
        // 执行原方法
        return await originalMethod.apply(this, args);
      } catch (err) {
        ctx.logger.error('权限验证失败:', err);
        ctx.status = 500;
        ctx.body = {
          code: 500,
          msg: '权限验证失败'
        };
      }
    };
    
    return descriptor;
  };
}

/**
 * 获取用户权限列表
 * @param {Context} ctx - Egg.js Context
 * @return {array} 权限列表
 */
async function getUserPermissions(ctx) {
  try {
    // 从 token 中获取用户ID
    const user = ctx.state.user || {};
    const userId = user.userId;
    
    if (!userId) {
      return [];
    }
    
    // 从缓存中获取权限
    const cacheKey = `user:permissions:${userId}`;
    let permissions = await ctx.app.cache.default.get(cacheKey);
    
    if (!permissions) {
      // 从数据库查询权限
      permissions = await ctx.service.system.menu.selectPermsByUserId(userId);
      
      // 缓存权限（10分钟）
      await ctx.app.cache.default.set(cacheKey, permissions, { ttl: 600 });
    }
    
    return permissions || [];
  } catch (err) {
    ctx.logger.error('获取用户权限失败:', err);
    return [];
  }
}

/**
 * 获取用户角色列表
 * @param {Context} ctx - Egg.js Context
 * @return {array} 角色列表
 */
async function getUserRoles(ctx) {
  try {
    // 从 token 中获取用户ID
    const user = ctx.state.user || {};
    const userId = user.userId;
    
    if (!userId) {
      return [];
    }
    
    // 从缓存中获取角色
    const cacheKey = `user:roles:${userId}`;
    let roles = await ctx.app.cache.default.get(cacheKey);
    
    if (!roles) {
      // 从数据库查询角色
      const roleList = await ctx.service.system.role.selectRolesByUserId(userId);
      roles = roleList.map(r => r.roleKey);
      
      // 缓存角色（10分钟）
      await ctx.app.cache.default.set(cacheKey, roles, { ttl: 600 });
    }
    
    return roles || [];
  } catch (err) {
    ctx.logger.error('获取用户角色失败:', err);
    return [];
  }
}

/**
 * 检查权限
 * @param {array} userPermissions - 用户权限列表
 * @param {string|array} requiredPermissions - 需要的权限
 * @param {string} logical - 逻辑类型
 * @return {boolean} 是否有权限
 */
function checkPermissions(userPermissions, requiredPermissions, logical) {
  // 超级管理员拥有所有权限
  if (userPermissions.includes('*:*:*')) {
    return true;
  }
  
  // 转换为数组
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  if (logical === 'OR') {
    // OR 逻辑：只要有一个权限匹配即可
    return permissions.some(permission => {
      return userPermissions.includes(permission) || hasWildcardPermission(userPermissions, permission);
    });
  } else {
    // AND 逻辑：所有权限都要匹配
    return permissions.every(permission => {
      return userPermissions.includes(permission) || hasWildcardPermission(userPermissions, permission);
    });
  }
}

/**
 * 检查角色
 * @param {array} userRoles - 用户角色列表
 * @param {string|array} requiredRoles - 需要的角色
 * @param {string} logical - 逻辑类型
 * @return {boolean} 是否有角色
 */
function checkRoles(userRoles, requiredRoles, logical) {
  // 转换为数组
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  if (logical === 'OR') {
    // OR 逻辑：只要有一个角色匹配即可
    return roles.some(role => userRoles.includes(role));
  } else {
    // AND 逻辑：所有角色都要匹配
    return roles.every(role => userRoles.includes(role));
  }
}

/**
 * 检查通配符权限
 * @param {array} userPermissions - 用户权限列表
 * @param {string} permission - 需要验证的权限
 * @return {boolean} 是否匹配
 */
function hasWildcardPermission(userPermissions, permission) {
  const parts = permission.split(':');
  
  // 检查各级通配符
  // 例如: system:user:list
  // 可以匹配: system:*:*, system:user:*, *:*:*
  
  for (const userPerm of userPermissions) {
    if (matchWildcard(userPerm, permission)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 通配符匹配
 * @param {string} pattern - 通配符模式
 * @param {string} permission - 权限字符串
 * @return {boolean} 是否匹配
 */
function matchWildcard(pattern, permission) {
  const patternParts = pattern.split(':');
  const permParts = permission.split(':');
  
  if (patternParts.length !== permParts.length) {
    return false;
  }
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] !== '*' && patternParts[i] !== permParts[i]) {
      return false;
    }
  }
  
  return true;
}

module.exports = {
  RequiresPermissions,
  RequiresRoles,
  RequiresAuth,
  getUserPermissions,
  getUserRoles,
  checkPermissions,
  checkRoles
};

