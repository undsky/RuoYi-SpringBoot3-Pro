/*
 * @Description: 角色管理控制器
 * @Author: AI Assistant
 * @Date: 2025-10-24
 */

const Controller = require("egg").Controller;
const {
  Route,
  HttpGet,
  HttpPost,
  HttpPut,
  HttpDelete,
} = require("egg-decorator-router");
const { RequiresPermissions } = require("../../decorator/permission");
const { Log, BusinessType } = require("../../decorator/log");
const ExcelUtil = require("../../extend/excel");

module.exports = (app) => {
  @Route("/system/role")
  class RoleController extends Controller {
    /**
     * 获取角色列表（分页）
     * GET /api/system/role/list
     * 权限：system:role:list
     */
    @RequiresPermissions("system:role:list")
    @HttpGet("/list")
    async list() {
      const { ctx, service } = this;

      try {
        const params = ctx.query;

        // 查询角色列表
        const result = await service.system.role.selectRolePage(params);

        ctx.body = {
          code: 200,
          msg: "查询成功",
          ...result,
        };
      } catch (err) {
        ctx.logger.error("查询角色列表失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "查询角色列表失败",
        };
      }
    }

    /**
     * 获取角色详情
     * GET /api/system/role/:roleId
     * 权限：system:role:query
     */
    @RequiresPermissions("system:role:query")
    @HttpGet("/:roleId")
    async getInfo() {
      const { ctx, service } = this;

      try {
        const { roleId } = ctx.params;

        // 校验数据权限
        await service.system.role.checkRoleDataScope(parseInt(roleId));

        // 查询角色信息
        const role = await service.system.role.selectRoleById(parseInt(roleId));

        if (!role) {
          ctx.body = {
            code: 500,
            msg: "角色不存在",
          };
          return;
        }

        ctx.body = {
          code: 200,
          msg: "操作成功",
          data: role,
        };
      } catch (err) {
        ctx.logger.error("查询角色详情失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "查询角色详情失败",
        };
      }
    }

    /**
     * 新增角色
     * POST /api/system/role
     * 权限：system:role:add
     */
    @Log({ title: "角色管理", businessType: BusinessType.INSERT })
    @RequiresPermissions("system:role:add")
    @HttpPost("/")
    async add() {
      const { ctx, service } = this;

      try {
        const role = ctx.request.body;

        // 校验角色名称是否唯一
        const isRoleNameUnique = await service.system.role.checkRoleNameUnique(
          role
        );
        if (!isRoleNameUnique) {
          ctx.body = {
            code: 500,
            msg: `新增角色'${role.roleName}'失败，角色名称已存在`,
          };
          return;
        }

        // 校验角色权限字符是否唯一
        const isRoleKeyUnique = await service.system.role.checkRoleKeyUnique(
          role
        );
        if (!isRoleKeyUnique) {
          ctx.body = {
            code: 500,
            msg: `新增角色'${role.roleName}'失败，角色权限已存在`,
          };
          return;
        }

        // 新增角色
        const rows = await service.system.role.insertRole(role);

        ctx.body = {
          code: 200,
          msg: rows > 0 ? "新增成功" : "新增失败",
        };
      } catch (err) {
        ctx.logger.error("新增角色失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "新增角色失败",
        };
      }
    }

    /**
     * 修改角色
     * PUT /api/system/role
     * 权限：system:role:edit
     */
    @Log({ title: "角色管理", businessType: BusinessType.UPDATE })
    @RequiresPermissions("system:role:edit")
    @HttpPut("/")
    async edit() {
      const { ctx, service } = this;

      try {
        const role = ctx.request.body;

        // 校验角色是否允许操作
        service.system.role.checkRoleAllowed(role);

        // 校验数据权限
        await service.system.role.checkRoleDataScope(role.roleId);

        // 校验角色名称是否唯一
        const isRoleNameUnique = await service.system.role.checkRoleNameUnique(
          role
        );
        if (!isRoleNameUnique) {
          ctx.body = {
            code: 500,
            msg: `修改角色'${role.roleName}'失败，角色名称已存在`,
          };
          return;
        }

        // 校验角色权限字符是否唯一
        const isRoleKeyUnique = await service.system.role.checkRoleKeyUnique(
          role
        );
        if (!isRoleKeyUnique) {
          ctx.body = {
            code: 500,
            msg: `修改角色'${role.roleName}'失败，角色权限已存在`,
          };
          return;
        }

        // 修改角色
        const rows = await service.system.role.updateRole(role);

        ctx.body = {
          code: 200,
          msg: rows > 0 ? "修改成功" : "修改失败",
        };
      } catch (err) {
        ctx.logger.error("修改角色失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "修改角色失败",
        };
      }
    }

    /**
     * 删除角色
     * DELETE /api/system/role/:roleIds
     * 权限：system:role:remove
     */
    @Log({ title: "角色管理", businessType: BusinessType.DELETE })
    @RequiresPermissions("system:role:remove")
    @HttpDelete("/:roleIds")
    async remove() {
      const { ctx, service } = this;

      try {
        const { roleIds } = ctx.params;

        // 解析角色ID数组
        const roleIdArray = roleIds.split(",").map((id) => parseInt(id));

        // 校验是否允许操作
        for (const roleId of roleIdArray) {
          service.system.role.checkRoleAllowed({ roleId });
        }

        // 删除角色
        const rows = await service.system.role.deleteRoleByIds(roleIdArray);

        ctx.body = {
          code: 200,
          msg: rows > 0 ? "删除成功" : "删除失败",
        };
      } catch (err) {
        ctx.logger.error("删除角色失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "删除角色失败",
        };
      }
    }

    /**
     * 修改状态
     * PUT /api/system/role/changeStatus
     */
    @Log({ title: "角色管理", businessType: BusinessType.UPDATE })
    @HttpPut("/changeStatus")
    async changeStatus() {
      const { ctx, service } = this;

      try {
        const role = ctx.request.body;

        // 校验角色是否允许操作
        service.system.role.checkRoleAllowed(role);

        // 校验数据权限
        await service.system.role.checkRoleDataScope(role.roleId);

        // 修改状态
        const rows = await service.system.role.updateRoleStatus(role);

        ctx.body = {
          code: 200,
          msg: rows > 0 ? "修改成功" : "修改失败",
        };
      } catch (err) {
        ctx.logger.error("修改角色状态失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "修改角色状态失败",
        };
      }
    }

    /**
     * 修改数据权限
     * PUT /api/system/role/dataScope
     */
    @Log({ title: "角色管理", businessType: BusinessType.GRANT })
    @HttpPut("/dataScope")
    async dataScope() {
      const { ctx, service } = this;

      try {
        const role = ctx.request.body;

        // 校验角色是否允许操作
        service.system.role.checkRoleAllowed(role);

        // 校验数据权限
        await service.system.role.checkRoleDataScope(role.roleId);

        // 修改数据权限
        const rows = await service.system.role.authDataScope(role);

        ctx.body = {
          code: 200,
          msg: rows > 0 ? "修改成功" : "修改失败",
        };
      } catch (err) {
        ctx.logger.error("修改数据权限失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "修改数据权限失败",
        };
      }
    }

    /**
     * 查询已分配用户角色列表
     * GET /api/system/role/authUser/allocatedList
     * 权限：system:role:list
     */
    @RequiresPermissions("system:role:list")
    @HttpGet("/authUser/allocatedList")
    async allocatedList() {
      const { ctx, service } = this;

      try {
        const params = ctx.query;

        // 查询已分配用户角色列表
        const result = await service.system.user.selectAllocatedList(params);

        ctx.body = {
          code: 200,
          msg: "查询成功",
          ...result,
        };
      } catch (err) {
        ctx.logger.error("查询已分配用户列表失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "查询已分配用户列表失败",
        };
      }
    }

    /**
     * 查询未分配用户角色列表
     * GET /api/system/role/authUser/unallocatedList
     * 权限：system:role:list
     */
    @RequiresPermissions("system:role:list")
    @HttpGet("/authUser/unallocatedList")
    async unallocatedList() {
      const { ctx, service } = this;

      try {
        const params = ctx.query;

        // 查询未分配用户角色列表
        const result = await service.system.user.selectUnallocatedList(params);

        ctx.body = {
          code: 200,
          msg: "查询成功",
          ...result,
        };
      } catch (err) {
        ctx.logger.error("查询未分配用户列表失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "查询未分配用户列表失败",
        };
      }
    }

    /**
     * 取消授权用户
     * PUT /api/system/role/authUser/cancel
     * 权限：system:role:edit
     */
    @Log({ title: "角色管理", businessType: BusinessType.GRANT })
    @RequiresPermissions("system:role:edit")
    @HttpPut("/authUser/cancel")
    async cancelAuthUser() {
      const { ctx, service } = this;

      try {
        const userRole = ctx.request.body;

        // 取消授权
        const rows = await service.system.role.deleteAuthUser(userRole);

        ctx.body = {
          code: 200,
          msg: rows > 0 ? "取消授权成功" : "取消授权失败",
        };
      } catch (err) {
        ctx.logger.error("取消授权失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "取消授权失败",
        };
      }
    }

    /**
     * 批量取消授权用户
     * PUT /api/system/role/authUser/cancelAll
     * 权限：system:role:edit
     */
    @Log({ title: "角色管理", businessType: BusinessType.GRANT })
    @RequiresPermissions("system:role:edit")
    @HttpPut("/authUser/cancelAll")
    async cancelAuthUserAll() {
      const { ctx, service } = this;

      try {
        const { roleId, userIds } = ctx.query;

        // 解析用户ID数组
        const userIdArray =
          typeof userIds === "string"
            ? userIds.split(",").map((id) => parseInt(id))
            : userIds;

        // 批量取消授权
        const rows = await service.system.role.deleteAuthUsers(
          roleId,
          userIdArray
        );

        ctx.body = {
          code: 200,
          msg: rows > 0 ? "取消授权成功" : "取消授权失败",
        };
      } catch (err) {
        ctx.logger.error("批量取消授权失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "批量取消授权失败",
        };
      }
    }

    /**
     * 批量选择用户授权
     * PUT /api/system/role/authUser/selectAll
     * 权限：system:role:edit
     */
    @Log({ title: "角色管理", businessType: BusinessType.GRANT })
    @RequiresPermissions("system:role:edit")
    @HttpPut("/authUser/selectAll")
    async selectAuthUserAll() {
      const { ctx, service } = this;

      try {
        const { roleId, userIds } = ctx.query;

        // 校验数据权限
        await service.system.role.checkRoleDataScope(roleId);

        // 解析用户ID数组
        const userIdArray =
          typeof userIds === "string"
            ? userIds.split(",").map((id) => parseInt(id))
            : userIds;

        // 批量授权
        const rows = await service.system.role.insertAuthUsers(
          roleId,
          userIdArray
        );

        ctx.body = {
          code: 200,
          msg: rows > 0 ? "授权成功" : "授权失败",
        };
      } catch (err) {
        ctx.logger.error("批量授权失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "批量授权失败",
        };
      }
    }

    /**
     * 获取对应角色部门树列表
     * GET /api/system/role/deptTree/:roleId
     */
    @HttpGet("/deptTree/:roleId")
    async deptTree() {
      const { ctx, service } = this;

      try {
        const { roleId } = ctx.params;

        // 构建成功响应
        const result = { code: 200, msg: "操作成功" };

        // 查询角色已分配的部门ID列表
        const checkedKeys =
          (await service.system.dept.selectDeptListByRoleId(
            parseInt(roleId)
          )) || [];
        result.checkedKeys = checkedKeys.map((item) => item.deptId);

        // 查询所有部门树
        result.depts = await service.system.dept.selectDeptTreeList({});

        ctx.body = result;
      } catch (err) {
        ctx.logger.error("查询角色部门树失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "查询角色部门树失败",
        };
      }
    }

    /**
     * 导出角色
     * POST /api/system/role/export
     * 权限：system:role:export
     */
    @Log({ title: "角色管理", businessType: BusinessType.EXPORT })
    @RequiresPermissions("system:role:export")
    @HttpPost("/export")
    async export() {
      const { ctx, service } = this;

      try {
        const params = ctx.request.body;

        // 查询角色列表
        const list = await service.system.role.selectRoleList(params);

        // 定义 Excel 列配置
        const columns = [
          { header: "角色编号", key: "roleId", width: 12 },
          { header: "角色名称", key: "roleName", width: 20 },
          { header: "权限字符", key: "roleKey", width: 20 },
          { header: "显示顺序", key: "roleSort", width: 12 },
          { header: "数据范围", key: "dataScopeText", width: 15 },
          { header: "角色状态", key: "statusText", width: 10 },
          { header: "创建时间", key: "createTime", width: 20 },
          { header: "备注", key: "remark", width: 30 },
        ];

        // 处理导出数据
        const exportData = list.map((role) => ({
          ...role,
          dataScopeText: ExcelUtil.convertDictValue(role.dataScope, {
            1: "全部数据权限",
            2: "自定数据权限",
            3: "本部门数据权限",
            4: "本部门及以下数据权限",
            5: "仅本人数据权限",
          }),
          statusText: ExcelUtil.convertDictValue(role.status, {
            0: "正常",
            1: "停用",
          }),
        }));

        // 导出 Excel
        ExcelUtil.exportExcel(ctx, exportData, columns, "角色数据");
      } catch (err) {
        ctx.logger.error("导出角色失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "导出角色失败",
        };
      }
    }
  }

  return RoleController;
};
