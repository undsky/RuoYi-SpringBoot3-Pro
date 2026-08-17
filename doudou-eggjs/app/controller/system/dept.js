/*
 * @Description: 部门管理控制器
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Controller = require('egg').Controller;
const { Route, HttpGet, HttpPost, HttpPut, HttpDelete } = require('egg-decorator-router');
const { RequiresPermissions } = require('../../decorator/permission');
const { Log, BusinessType } = require('../../decorator/log');

module.exports = app => {

  @Route('/system/dept')
  class DeptController extends Controller {

    /**
     * 获取部门列表（树形）
     * GET /api/system/dept/list
     * 权限：system:dept:list
     */
    @RequiresPermissions('system:dept:list')
    @HttpGet('/list')
    async list() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.query;
        
        // 查询部门列表
        const list = await service.system.dept.selectDeptList(params);
        
        ctx.body = {
          code: 200,
          msg: '查询成功',
          data: list
        };
      } catch (err) {
        ctx.logger.error('查询部门列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询部门列表失败'
        };
      }
    }

    /**
     * 查询部门列表（排除节点）
     * GET /api/system/dept/list/exclude/:deptId
     * 权限：system:dept:list
     */
    @RequiresPermissions('system:dept:list')
    @HttpGet('/list/exclude/:deptId')
    async excludeChild() {
      const { ctx, service } = this;
      
      try {
        const { deptId } = ctx.params;
        
        // 查询所有部门
        const depts = await service.system.dept.selectDeptList({});
        
        // 排除指定节点及其子节点
        const excludeDeptId = parseInt(deptId);
        const filteredDepts = depts.filter(d => {
          // 排除自己
          if (d.deptId === excludeDeptId) {
            return false;
          }
          
          // 排除子节点（ancestors 中包含该 deptId）
          if (d.ancestors) {
            const ancestorIds = d.ancestors.split(',').map(id => parseInt(id));
            if (ancestorIds.includes(excludeDeptId)) {
              return false;
            }
          }
          
          return true;
        });
        
        ctx.body = {
          code: 200,
          msg: '查询成功',
          data: filteredDepts
        };
      } catch (err) {
        ctx.logger.error('查询部门列表失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询部门列表失败'
        };
      }
    }

    /**
     * 获取部门详情
     * GET /api/system/dept/:deptId
     * 权限：system:dept:query
     */
    @RequiresPermissions('system:dept:query')
    @HttpGet('/:deptId')
    async getInfo() {
      const { ctx, service } = this;
      
      try {
        const { deptId } = ctx.params;
        
        // 校验数据权限
        await service.system.dept.checkDeptDataScope(parseInt(deptId));
        
        // 查询部门信息
        const dept = await service.system.dept.selectDeptById(parseInt(deptId));
        
        if (!dept) {
          ctx.body = {
            code: 500,
            msg: '部门不存在'
          };
          return;
        }
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: dept
        };
      } catch (err) {
        ctx.logger.error('查询部门详情失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询部门详情失败'
        };
      }
    }

    /**
     * 新增部门
     * POST /api/system/dept
     * 权限：system:dept:add
     */
    @Log({ title: '部门管理', businessType: BusinessType.INSERT })
    @RequiresPermissions('system:dept:add')
    @HttpPost('/')
    async add() {
      const { ctx, service } = this;
      
      try {
        const dept = ctx.request.body;
        
        // 校验部门名称是否唯一
        const isDeptNameUnique = await service.system.dept.checkDeptNameUnique(dept);
        if (!isDeptNameUnique) {
          ctx.body = {
            code: 500,
            msg: `新增部门'${dept.deptName}'失败，部门名称已存在`
          };
          return;
        }
        
        // 新增部门
        const rows = await service.system.dept.insertDept(dept);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '新增成功' : '新增失败'
        };
      } catch (err) {
        ctx.logger.error('新增部门失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '新增部门失败'
        };
      }
    }

    /**
     * 修改部门
     * PUT /api/system/dept
     * 权限：system:dept:edit
     */
    @Log({ title: '部门管理', businessType: BusinessType.UPDATE })
    @RequiresPermissions('system:dept:edit')
    @HttpPut('/')
    async edit() {
      const { ctx, service } = this;
      
      try {
        const dept = ctx.request.body;
        
        // 校验数据权限
        await service.system.dept.checkDeptDataScope(dept.deptId);
        
        // 校验部门名称是否唯一
        const isDeptNameUnique = await service.system.dept.checkDeptNameUnique(dept);
        if (!isDeptNameUnique) {
          ctx.body = {
            code: 500,
            msg: `修改部门'${dept.deptName}'失败，部门名称已存在`
          };
          return;
        }
        
        // 上级部门不能是自己
        if (dept.parentId === dept.deptId) {
          ctx.body = {
            code: 500,
            msg: `修改部门'${dept.deptName}'失败，上级部门不能是自己`
          };
          return;
        }
        
        // 如果停用，检查是否有正常状态的子部门
        if (dept.status === '1') {
          const normalChildCount = await service.system.dept.selectNormalChildrenDeptById(dept.deptId);
          if (normalChildCount > 0) {
            ctx.body = {
              code: 500,
              msg: '该部门包含未停用的子部门！'
            };
            return;
          }
        }
        
        // 修改部门
        const rows = await service.system.dept.updateDept(dept);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '修改成功' : '修改失败'
        };
      } catch (err) {
        ctx.logger.error('修改部门失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '修改部门失败'
        };
      }
    }

    /**
     * 删除部门
     * DELETE /api/system/dept/:deptId
     * 权限：system:dept:remove
     */
    @Log({ title: '部门管理', businessType: BusinessType.DELETE })
    @RequiresPermissions('system:dept:remove')
    @HttpDelete('/:deptId')
    async remove() {
      const { ctx, service } = this;
      
      try {
        const { deptId } = ctx.params;
        const parsedDeptId = parseInt(deptId);
        
        // 检查是否存在子部门
        const hasChild = await service.system.dept.hasChildByDeptId(parsedDeptId);
        if (hasChild) {
          ctx.body = {
            code: 500,
            msg: '存在下级部门,不允许删除'
          };
          return;
        }
        
        // 检查部门是否存在用户
        const existUser = await service.system.dept.checkDeptExistUser(parsedDeptId);
        if (existUser) {
          ctx.body = {
            code: 500,
            msg: '部门存在用户,不允许删除'
          };
          return;
        }
        
        // 校验数据权限
        await service.system.dept.checkDeptDataScope(parsedDeptId);
        
        // 删除部门
        const rows = await service.system.dept.deleteDeptById(parsedDeptId);
        
        ctx.body = {
          code: 200,
          msg: rows > 0 ? '删除成功' : '删除失败'
        };
      } catch (err) {
        ctx.logger.error('删除部门失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '删除部门失败'
        };
      }
    }

    /**
     * 获取部门树选择
     * GET /api/system/dept/treeselect
     * 权限：system:dept:query
     */
    @RequiresPermissions('system:dept:query')
    @HttpGet('/treeselect')
    async treeselect() {
      const { ctx, service } = this;
      
      try {
        const params = ctx.query;
        
        // 查询部门列表
        const depts = await service.system.dept.selectDeptList(params);
        
        // 构建树形选择结构
        const treeSelect = service.system.dept.buildDeptTreeSelect(depts);
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          data: treeSelect
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
     * 获取对应角色部门树列表
     * GET /api/system/dept/roleDeptTreeselect/:roleId
     * 权限：system:dept:query
     */
    @RequiresPermissions('system:dept:query')
    @HttpGet('/roleDeptTreeselect/:roleId')
    async roleDeptTreeselect() {
      const { ctx, service } = this;
      
      try {
        const { roleId } = ctx.params;
        
        // 查询角色已分配的部门ID列表
        const checkedKeys = await service.system.dept.selectDeptListByRoleId(parseInt(roleId));
        
        // 查询所有部门树
        const depts = await service.system.dept.selectDeptList({});
        const treeSelect = service.system.dept.buildDeptTreeSelect(depts);
        
        ctx.body = {
          code: 200,
          msg: '操作成功',
          checkedKeys,
          depts: treeSelect
        };
      } catch (err) {
        ctx.logger.error('查询角色部门树失败:', err);
        ctx.body = {
          code: 500,
          msg: err.message || '查询角色部门树失败'
        };
      }
    }
  }

  return DeptController;
};

