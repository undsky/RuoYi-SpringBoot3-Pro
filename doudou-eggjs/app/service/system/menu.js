/*
 * @Description: 菜单服务层
 * @Author: AI Assistant
 * @Date: 2025-10-23
 */

const Service = require("egg").Service;

// 菜单常量
const TYPE_DIR = "M"; // 目录
const TYPE_MENU = "C"; // 菜单
const TYPE_BUTTON = "F"; // 按钮
const YES_FRAME = 0; // 是外链
const NO_FRAME = 1; // 否外链
const LAYOUT = "Layout";
const PARENT_VIEW = "ParentView";
const INNER_LINK = "InnerLink";

class MenuService extends Service {
  /**
   * 查询菜单列表
   * @param {object} menu - 查询参数
   * @param {number} userId - 用户ID
   * @return {array} 菜单列表
   */
  async selectMenuList(menu = {}, userId) {
    const { ctx } = this;

    let menus;

    // 管理员显示所有菜单信息
    if (ctx.helper.isAdmin(userId)) {
      const conditions = {
        menuName: menu.menuName,
        visible: menu.visible,
        status: menu.status,
      };
      menus = await ctx.helper
        .getDB(ctx)
        .sysMenuMapper.selectMenuList([], conditions);
    } else {
      // 普通用户显示有权限的菜单
      const conditions = {
        menuName: menu.menuName,
        visible: menu.visible,
        status: menu.status,
        params: {
          userId,
        },
      };
      menus = await ctx.helper
        .getDB(ctx)
        .sysMenuMapper.selectMenuListByUserId([], conditions);
    }

    return menus || [];
  }

  /**
   * 根据菜单ID查询菜单
   * @param {number} menuId - 菜单ID
   * @return {object} 菜单信息
   */
  async selectMenuById(menuId) {
    const { ctx } = this;

    return await ctx.helper
      .getDB(ctx)
      .sysMenuMapper.selectMenuById([], { menuId });
  }

  /**
   * 根据用户ID查询权限标识
   * @param {number} userId - 用户ID
   * @return {array} 权限标识列表
   */
  async selectPermsByUserId(userId) {
    const { ctx } = this;

    const perms = [];

    // 管理员拥有所有权限
    if (ctx.helper.isAdmin(userId)) {
      perms.push("*:*:*");
      return perms;
    }

    // 查询用户拥有的角色列表
    const roles = await ctx.helper
      .getDB(ctx)
      .sysRoleMapper.selectRolePermissionByUserId([], { userId });

    if (roles && roles.length > 0) {
      // 多角色设置permissions属性，以便数据权限匹配权限
      for (const role of roles) {
        // 角色状态为正常(0)且不是管理员角色
        if (role.status === "0" && role.roleKey !== "admin") {
          const rolePerms = await this.selectMenuPermsByRoleId(role.roleId);
          perms.push(...rolePerms);
        }
      }
    }

    // 去重并返回
    return [...new Set(perms)];
  }

  /**
   * 根据用户ID查询菜单树
   * @param {number} userId - 用户ID
   * @return {array} 菜单树
   */
  async selectMenuTreeByUserId(userId) {
    const { ctx } = this;

    let menus;

    // 如果是管理员，查询所有菜单
    if (ctx.helper.isAdmin(userId)) {
      menus = await ctx.helper.getDB(ctx).sysMenuMapper.selectMenuTreeAll();
    } else {
      // 查询用户菜单
      menus = await ctx.helper
        .getDB(ctx)
        .sysMenuMapper.selectMenuTreeByUserId([], { userId });
    }

    // 使用 getChildPerms 构建菜单树
    return this.getChildPerms(menus, 0);
  }

  /**
   * 构建前端路由菜单树
   * @param {array} menus - 菜单列表
   * @param {number} parentId - 父菜单ID
   * @return {array} 菜单树
   */
  buildRouterMenuTree(menus, parentId) {
    const tree = [];

    menus.forEach((menu) => {
      if (menu.parentId === parentId) {
        const children = this.buildRouterMenuTree(menus, menu.menuId);

        const menuNode = {
          name: menu.routeName || menu.menuName,
          path: menu.path,
          hidden: menu.visible === "1",
          component: menu.component,
          query: menu.query,
          meta: {
            title: menu.menuName,
            icon: menu.icon,
            noCache: menu.isCache === "1",
            link: menu.path,
          },
        };

        if (children.length > 0) {
          menuNode.children = children;
          menuNode.alwaysShow = true;
          menuNode.redirect = "noRedirect";
        }

        tree.push(menuNode);
      }
    });

    return tree;
  }

  /**
   * 根据父节点ID获取所有子节点（O(N) 哈希表优化算法）
   * @param {array} list - 菜单列表
   * @param {number} parentId - 父节点ID
   * @return {array} 子节点列表
   */
  getChildPerms(list = [], parentId = 0) {
    return this.buildMenuTreeByParentId(list, parentId);
  }

  /**
   * 构建菜单树（用于管理界面，O(N) 哈希表优化算法）
   * @param {array} menus - 菜单列表
   * @return {array} 菜单树
   */
  buildMenuTree(menus = []) {
    return this.buildMenuTreeByParentId(menus, null);
  }

  /**
   * 通用 O(N) 哈希表建树算法
   * @param {array} list - 菜单列表
   * @param {number|null} targetParentId - 目标父节点ID（传入 null 时自动挂载根节点）
   * @return {array} 树形结构
   */
  buildMenuTreeByParentId(list = [], targetParentId = null) {
    if (!list || list.length === 0) return [];

    const map = new Map();
    const tree = [];
    const menuIds = new Set(list.map((m) => m.menuId));

    // 1. 先将所有节点转存至 Map，初始化 children 属性
    list.forEach((menu) => {
      map.set(menu.menuId, { ...menu, children: [] });
    });

    // 2. 一次遍历通过 Map 建立引用关系，复杂度 O(N)
    list.forEach((menu) => {
      const node = map.get(menu.menuId);
      const parentId = menu.parentId;

      if (targetParentId !== null && targetParentId !== undefined) {
        if (parentId === targetParentId) {
          tree.push(node);
        } else if (map.has(parentId)) {
          map.get(parentId).children.push(node);
        }
      } else {
        if (!menuIds.has(parentId) || parentId === 0) {
          tree.push(node);
        } else if (map.has(parentId)) {
          map.get(parentId).children.push(node);
        }
      }
    });

    return tree;
  }

  /**
   * 递归列表（保留方法兼容性）
   * @param {array} list - 菜单列表
   * @param {object} t - 当前菜单节点
   */
  recursionFn(list, t) {
    const childList = this.getChildList(list, t);
    t.children = childList;

    for (const tChild of childList) {
      if (this.hasChild(list, tChild)) {
        this.recursionFn(list, tChild);
      }
    }
  }

  /**
   * 得到子节点列表
   * @param {array} list - 菜单列表
   * @param {object} t - 当前菜单节点
   * @return {array} 子节点列表
   */
  getChildList(list, t) {
    const tlist = [];
    for (const n of list) {
      if (n.parentId === t.menuId) {
        tlist.push(n);
      }
    }
    return tlist;
  }

  /**
   * 判断是否有子节点
   * @param {array} list - 菜单列表
   * @param {object} t - 当前菜单节点
   * @return {boolean} 是否有子节点
   */
  hasChild(list, t) {
    return this.getChildList(list, t).length > 0;
  }

  /**
   * 构建菜单树选择结构
   * @param {array} menus - 菜单列表
   * @return {array} 树选择结构
   */
  buildMenuTreeSelect(menus) {
    const menuTree = this.buildMenuTree(menus);
    return this.convertToTreeSelect(menuTree);
  }

  /**
   * 转换为树选择结构
   * @param {array} menus - 菜单树
   * @return {array} 树选择结构
   */
  convertToTreeSelect(menus) {
    const treeSelect = [];

    menus.forEach((menu) => {
      const node = {
        id: menu.menuId,
        label: menu.menuName,
      };

      if (menu.children && menu.children.length > 0) {
        node.children = this.convertToTreeSelect(menu.children);
      }

      treeSelect.push(node);
    });

    return treeSelect;
  }

  /**
   * 根据角色ID查询菜单ID列表
   * @param {number} roleId - 角色ID
   * @return {array} 菜单ID列表
   */
  async selectMenuListByRoleId(roleId) {
    const { ctx } = this;

    // 查询角色信息
    const role = await ctx.service.system.role.selectRoleById(roleId);
    const menuCheckStrictly = role && role.menuCheckStrictly;

    return await ctx.helper
      .getDB(ctx)
      .sysMenuMapper.selectMenuListByRoleId([], { roleId, menuCheckStrictly });
  }

  /**
   * 校验菜单名称是否唯一
   * @param {object} menu - 菜单对象
   * @return {boolean} true-唯一 false-不唯一
   */
  async checkMenuNameUnique(menu) {
    const { ctx } = this;

    const menuId = menu.menuId || -1;
    const conditions = {
      menuName: menu.menuName,
      parentId: menu.parentId,
    };

    const menus = await ctx.helper
      .getDB(ctx)
      .sysMenuMapper.checkMenuNameUnique([], conditions);

    if (menus && menus.length > 0 && menus[0].menuId !== menuId) {
      return false;
    }

    return true;
  }

  /**
   * 是否存在子菜单
   * @param {number} menuId - 菜单ID
   * @return {boolean} true-存在 false-不存在
   */
  async hasChildByMenuId(menuId) {
    const { ctx } = this;

    const result = await ctx.helper
      .getDB(ctx)
      .sysMenuMapper.hasChildByMenuId([], { menuId });

    const count = result ? (Number(result.count || result["count(1)"]) || 0) : 0;
    return count > 0;
  }

  /**
   * 检查菜单是否已分配给角色
   * @param {number} menuId - 菜单ID
   * @return {boolean} true-已分配 false-未分配
   */
  async checkMenuExistRole(menuId) {
    const { ctx } = this;

    const result = await ctx.helper
      .getDB(ctx)
      .sysRoleMenuMapper.checkMenuExistRole([], { menuId });

    const count = result ? (Number(result.count || result["count(1)"]) || 0) : 0;
    return count > 0;
  }

  /**
   * 新增菜单
   * @param {object} menu - 菜单对象
   * @return {number} 影响行数
   */
  async insertMenu(menu) {
    const { ctx } = this;

    // 设置创建信息
    menu.createBy = ctx.state.user.userName;

    // 插入菜单
    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysMenuMapper.insertMenu([], menu);

    return result;
  }

  /**
   * 修改菜单
   * @param {object} menu - 菜单对象
   * @return {number} 影响行数
   */
  async updateMenu(menu) {
    const { ctx } = this;

    // 设置更新信息
    menu.updateBy = ctx.state.user.userName;

    // 更新菜单
    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysMenuMapper.updateMenu([], menu);

    return result;
  }

  /**
   * 删除菜单
   * @param {number} menuId - 菜单ID
   * @return {number} 影响行数
   */
  async deleteMenuById(menuId) {
    const { ctx } = this;

    // 删除菜单
    const result = await ctx.helper
      .getMasterDB(ctx)
      .sysMenuMapper.deleteMenuById([], { menuId });

    return result;
  }

  /**
   * 根据角色ID查询权限标识
   * @param {number} roleId - 角色ID
   * @return {array} 权限标识列表
   */
  async selectMenuPermsByRoleId(roleId) {
    const { ctx } = this;

    // 调用 Mapper 获取权限字符串列表
    const permsList = await ctx.helper
      .getDB(ctx)
      .sysMenuMapper.selectMenuPermsByRoleId([],{roleId});

    const permsSet = [];

    // 处理每个权限字符串，按逗号分割
    for (const perm of permsList) {
      if (perm && perm.perms && perm.perms.trim()) {
        permsSet.push(...perm.perms.trim().split(","));
      }
    }

    // 去重并返回
    return [...new Set(permsSet)];
  }

  /**
   * 构建前端路由所需要的菜单（完整版）
   * @param {array} menus - 菜单列表
   * @return {array} 路由列表
   */
  buildMenus(menus) {
    const routers = [];

    for (const menu of menus) {
      const router = {
        hidden: menu.visible === "1",
        name: this.getRouteName(menu),
        path: this.getRouterPath(menu),
        component: this.getComponent(menu),
        query: menu.query,
        meta: {
          title: menu.menuName,
          icon: menu.icon,
          noCache: menu.isCache === "1",
          link: null, //menu.path
        },
      };

      const cMenus = menu.children || [];

      // 目录类型并且有子菜单
      if (cMenus.length > 0 && menu.menuType === TYPE_DIR) {
        router.alwaysShow = true;
        router.redirect = "noRedirect";
        router.children = this.buildMenus(cMenus);
      }
      // 菜单内部跳转
      else if (this.isMenuFrame(menu)) {
        router.meta = null;
        const children = {
          path: menu.path,
          component: menu.component,
          name: this.getRouteNameFromPath(menu.routeName, menu.path),
          meta: {
            title: menu.menuName,
            icon: menu.icon,
            noCache: menu.isCache === "1",
            link: null, //menu.path
          },
          query: menu.query,
        };
        router.children = [children];
      }
      // 一级目录内链
      else if (menu.parentId === 0 && this.isInnerLink(menu)) {
        router.meta = {
          title: menu.menuName,
          icon: menu.icon,
        };
        router.path = "/";
        const routerPath = this.innerLinkReplaceEach(menu.path);
        const children = {
          path: routerPath,
          component: INNER_LINK,
          name: this.getRouteNameFromPath(menu.routeName, routerPath),
          meta: {
            title: menu.menuName,
            icon: menu.icon,
            link: menu.path,
          },
        };
        router.children = [children];
      }

      routers.push(router);
    }

    return routers;
  }

  /**
   * 获取路由名称
   * @param {object} menu - 菜单信息
   * @return {string} 路由名称
   */
  getRouteName(menu) {
    // 非外链并且是一级目录（类型为目录）
    if (this.isMenuFrame(menu)) {
      return "";
    }
    return this.getRouteNameFromPath(menu.routeName, menu.path);
  }

  /**
   * 获取路由名称，如没有配置路由名称则取路由地址
   * @param {string} name - 路由名称
   * @param {string} path - 路由地址
   * @return {string} 路由名称（首字母大写）
   */
  getRouteNameFromPath(name, path) {
    const routerName = name || path || "";
    // 首字母大写
    return routerName.charAt(0).toUpperCase() + routerName.slice(1);
  }

  /**
   * 获取路由地址
   * @param {object} menu - 菜单信息
   * @return {string} 路由地址
   */
  getRouterPath(menu) {
    let routerPath = menu.path;

    // 内链打开外网方式
    if (menu.parentId !== 0 && this.isInnerLink(menu)) {
      routerPath = this.innerLinkReplaceEach(routerPath);
    }
    // 非外链并且是一级目录（类型为目录）
    else if (
      menu.parentId === 0 &&
      menu.menuType === TYPE_DIR &&
      menu.isFrame === NO_FRAME
    ) {
      routerPath = "/" + menu.path;
    }
    // 非外链并且是一级目录（类型为菜单）
    else if (this.isMenuFrame(menu)) {
      routerPath = "/";
    }

    return routerPath;
  }

  /**
   * 获取组件信息
   * @param {object} menu - 菜单信息
   * @return {string} 组件信息
   */
  getComponent(menu) {
    let component = LAYOUT;

    if (menu.component && !this.isMenuFrame(menu)) {
      component = menu.component;
    } else if (
      !menu.component &&
      menu.parentId !== 0 &&
      this.isInnerLink(menu)
    ) {
      component = INNER_LINK;
    } else if (!menu.component && this.isParentView(menu)) {
      component = PARENT_VIEW;
    }

    return component;
  }

  /**
   * 是否为菜单内部跳转
   * @param {object} menu - 菜单信息
   * @return {boolean} 结果
   */
  isMenuFrame(menu) {
    return (
      menu.parentId === 0 &&
      menu.menuType === TYPE_MENU &&
      menu.isFrame === NO_FRAME
    );
  }

  /**
   * 是否为内链组件
   * @param {object} menu - 菜单信息
   * @return {boolean} 结果
   */
  isInnerLink(menu) {
    return menu.isFrame === NO_FRAME && this.isHttp(menu.path);
  }

  /**
   * 是否为parent_view组件
   * @param {object} menu - 菜单信息
   * @return {boolean} 结果
   */
  isParentView(menu) {
    return menu.parentId !== 0 && menu.menuType === TYPE_DIR;
  }

  /**
   * 判断是否为http(s)://开头
   * @param {string} link - 链接
   * @return {boolean} 结果
   */
  isHttp(link) {
    if (!link) return false;
    return link.startsWith("http://") || link.startsWith("https://");
  }

  /**
   * 内链域名特殊字符替换
   * @param {string} path - 路径
   * @return {string} 替换后的内链域名
   */
  innerLinkReplaceEach(path) {
    if (!path) return "";

    return path
      .replace(/http:\/\//g, "")
      .replace(/https:\/\//g, "")
      .replace(/www\./g, "")
      .replace(/\./g, "/")
      .replace(/:/g, "/");
  }
}

module.exports = MenuService;
