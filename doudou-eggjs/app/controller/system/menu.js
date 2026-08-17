/*
 * @Description: 菜单管理控制器
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpPost, HttpPut, HttpDelete } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');
const { Log, BusinessType } = require('../../decorator/log');

module.exports = app => {

  @Route('/system/menu')
  class MenuController extends Controller {

    /**
     * 获取菜单列表（树形）
     * GET /api/system/menu/list
     * 权限：system:menu:list
     */
    @RequiresPermissions('system:menu:list')
    @HttpGet('/list')
    async list() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.query;
        const userId = ctx.state.user.userId;
        
        // 查询菜单列表
        const list = await service.system.menu.selectMenuList(params, userId);
        
        ctx.body = {
          code: 200,
          msg: '查询成功',
          data: list
        };
      } catch (err) {
        ctx.logger.error('查询菜单列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询菜单列表失败'
        };
      }
    }

    /**
     * 获取菜单详情
     * GET /api/system/menu/:menuId
     * 权限：system:menu:query
     */
    @RequiresPermissions('system:menu:query')
    @HttpGet('/:menuId')
    async getInfo() {
      const { ctx, service } = this;
      
      try {
        const { menuId } = ctx.params;
        
        // 查询菜单信息
        const menu = await service.system.menu.selectMenuById(parseInt(menuId));
        
        if (!menu) {
          ctx.body = {
            code: 500,
            msg: '菜单不存在'
          };
          return;
        }
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: menu
        };
      } catch (err) {
        ctx.logger.error('查询菜单详情失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询菜单详情失败'
        };
      }
    }

    /**
     * 新增菜单
     * POST /api/system/menu
     * 权限：system:menu:add
     */
    @Log({ title: '菜单管理', businessType: BusinessType.INSERT })
    @RequiresPermissions('system:menu:add')
    @HttpPost('/')
    async add() {
      const { ctx, service } = this;
      
      try {
        const menu = ctx.request.body;
        
        // 校验菜单名称是否唯一
        const isMenuNameUnique = await service.system.menu.checkMenuNameUnique(menu);
        if (!isMenuNameUnique) {
          ctx.body = {
            code: 500,
            msg: `新增菜单'${menu.menuName}'失败，菜单名称已存在`
          };
          return;
        }
        
        // 校验外链地址
        if (menu.isFrame === '0' && menu.path && !this.isHttp(menu.path)) {
          ctx.body = {
            code: 500,
            msg: `新增菜单'${menu.menuName}'失败，地址必须以http(s)://开头`
          };
          return;
        }
        
        // 新增菜单
        const rows = await service.system.menu.insertMenu(menu);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '新增成功' : '新增失败'
        };
      } catch (err) {
        ctx.logger.error('新增菜单失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '新增菜单失败'
        };
      }
    }

    /**
     * 修改菜单
     * PUT /api/system/menu
     * 权限：system:menu:edit
     */
    @Log({ title: '菜单管理', businessType: BusinessType.UPDATE })
    @RequiresPermissions('system:menu:edit')
    @HttpPut('/')
    async edit() {
      const { ctx, service } = this;
      
      try {
        const menu = ctx.request.body;
        
        // 校验菜单名称是否唯一
        const isMenuNameUnique = await service.system.menu.checkMenuNameUnique(menu);
        if (!isMenuNameUnique) {
          ctx.body = {
            code: 500,
            msg: `修改菜单'${menu.menuName}'失败，菜单名称已存在`
          };
          return;
        }
        
        // 校验外链地址
        if (menu.isFrame === '0' && menu.path && !this.isHttp(menu.path)) {
          ctx.body = {
            code: 500,
            msg: `修改菜单'${menu.menuName}'失败，地址必须以http(s)://开头`
          };
          return;
        }
        
        // 上级菜单不能选择自己
        if (menu.menuId === menu.parentId) {
          ctx.body = {
            code: 500,
            msg: `修改菜单'${menu.menuName}'失败，上级菜单不能选择自己`
          };
          return;
        }
        
        // 修改菜单
        const rows = await service.system.menu.updateMenu(menu);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '修改成功' : '修改失败'
        };
      } catch (err) {
        ctx.logger.error('修改菜单失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '修改菜单失败'
        };
      }
    }

    /**
     * 删除菜单
     * DELETE /api/system/menu/:menuId
     * 权限：system:menu:remove
     */
    @Log({ title: '菜单管理', businessType: BusinessType.DELETE })
    @RequiresPermissions('system:menu:remove')
    @HttpDelete('/:menuId')
    async remove() {
      const { ctx, service } = this;
      
      try {
        const { menuId } = ctx.params;
        
        // 检查是否存在子菜单
        const hasChild = await service.system.menu.hasChildByMenuId(parseInt(menuId));
        if (hasChild) {
          ctx.body = {
            code: 500,
            msg: '存在子菜单,不允许删除'
          };
          return;
        }
        
        // 检查菜单是否已分配给角色
        const existRole = await service.system.menu.checkMenuExistRole(parseInt(menuId));
        if (existRole) {
          ctx.body = {
            code: 500,
            msg: '菜单已分配,不允许删除'
          };
          return;
        }
        
        // 删除菜单
        const rows = await service.system.menu.deleteMenuById(parseInt(menuId));
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '删除成功' : '删除失败'
        };
      } catch (err) {
        ctx.logger.error('删除菜单失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '删除菜单失败'
        };
      }
    }

    /**
     * 获取菜单下拉树列表
     * GET /api/system/menu/treeselect
     * 权限：system:menu:query
     */
    @RequiresPermissions('system:menu:query')
    @HttpGet('/treeselect')
    async treeselect() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.query;
        const userId = ctx.state.user.userId;
        
        // 查询菜单列表
        const menus = await service.system.menu.selectMenuList(params, userId);
        
        // 构建树形结构
        const treeSelect = service.system.menu.buildMenuTreeSelect(menus);
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: treeSelect
        };
      } catch (err) {
        ctx.logger.error('查询菜单树失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询菜单树失败'
        };
      }
    }

    /**
     * 加载对应角色菜单列表树
     * GET /api/system/menu/roleMenuTreeselect/:roleId
     * 权限：system:menu:query
     */
    @RequiresPermissions('system:menu:query')
    @HttpGet('/roleMenuTreeselect/:roleId')
    async roleMenuTreeselect() {
      const { ctx, service } = this;
      
      try {
        const { roleId } = ctx.params;
        const userId = ctx.state.user.userId;
        
        // 查询菜单列表
        const menus = await service.system.menu.selectMenuList({}, userId);
        
        // 查询角色已分配的菜单ID列表
        const checkedKeys = await service.system.menu.selectMenuListByRoleId(parseInt(roleId));
        
        // 构建树形结构
        const menuTree = service.system.menu.buildMenuTreeSelect(menus);
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          checkedKeys: checkedKeys.map(item => item.menuId),
          menus: menuTree
        };
      } catch (err) {
        ctx.logger.error('查询角色菜单树失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询角色菜单树失败'
        };
      }
    }

    /**
     * 判断是否为 http(s):// 开头
     * @param {string} link - 链接地址
     * @return {boolean}
     */
    isHttp(link) {
      return link && (link.startsWith('http://') || link.startsWith('https://'));
    }
  }

  return MenuController;
};

