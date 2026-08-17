/*
 * @Description: 登录认证控制器
 * @Author: AI Assistant
 * @Date: 2025-10-23
 */

const Controller = require("egg").Controller;
const { Route, HttpPost, HttpGet, HttpAll } = require("egg-decorator-router");

module.exports = (app) => {
  const { secret, expiresIn } = app.config.jwt;

  @Route("")
  class LoginController extends Controller {
    /**
     * 用户登录
     * POST /login
     * 说明：公开接口，无需权限验证
     */
    @HttpPost("/login")
    async login() {
      const { ctx, service } = this;
      const { username, password, code, uuid } = ctx.request.body;

      try {
        // 1. 校验验证码
        if (app.config.captcha.enabled) {
          await service.system.login.validateCaptcha(code, uuid);
        }

        // 2. 用户认证
        const user = await service.system.login.login(username, password);

        // 3. 生成 Token
        const tokenData = {
          userId: user.userId,
          userName: user.userName,
          deptId: user.deptId,
        };

        const token = app.jwt.sign(tokenData, secret, {
          expiresIn,
          jwtid: `${Date.now()}_${user.userId}`,
        });

        // 4. 记录登录日志
        await service.monitor.logininfor.recordLoginInfo(
          user.userName,
          "0",
          "登录成功",
          ctx
        );

        // 5. 存储在线用户信息到 Redis
        await service.system.login.recordOnlineUser(user, token);

        ctx.body = {
          code: 200,
          msg: "登录成功",
          token,
        };
      } catch (err) {
        // 记录登录失败日志
        await service.monitor.logininfor.recordLoginInfo(
          username || "",
          "1",
          err.message,
          ctx
        );

        ctx.body = {
          code: 500,
          msg: err.message || "登录失败",
        };
      }
    }

    /**
     * 用户登出
     * POST /logout
     * 说明：需要登录，无需特殊权限
     */
    @HttpPost("/logout")
    async logout() {
      const { ctx, service } = this;

      try {
        const user = ctx.state.user;

        if (user) {
          // 删除在线用户信息并加入黑名单
          await service.system.login.removeOnlineUser(user.jti, user.userId);

          // 记录登出日志
          await service.monitor.logininfor.recordLoginInfo(
            user.userName,
            "0",
            "退出成功",
            ctx
          );
        }

        ctx.body = {
          code: 200,
          msg: "退出成功",
        };
      } catch (err) {
        ctx.body = {
          code: 500,
          msg: err.message || "退出失败",
        };
      }
    }

    /**
     * 获取用户信息
     * GET /getInfo
     * 说明：需要登录，无需特殊权限
     */
    @HttpGet("/getInfo")
    async getInfo() {
      const { ctx, service } = this;

      try {
        const userId = ctx.state.user.userId;

        // 查询用户详细信息
        const user = await service.system.user.selectUserById(userId);

        if (!user) {
          ctx.body = {
            code: 500,
            msg: "用户不存在",
          };
          return;
        }

        // 查询用户角色
        const roles = await service.system.role.selectRolesByUserId(userId);

        // 查询用户权限
        const permissions = await service.system.menu.selectPermsByUserId(
          userId
        );

        // 检查初始密码是否需要修改
        const isDefaultModifyPwd = await this.initPasswordIsModify(
          user.pwdUpdateDate
        );

        // 检查密码是否过期
        const isPasswordExpired = await this.passwordIsExpiration(
          user.pwdUpdateDate
        );

        ctx.body = {
          code: 200,
          msg: "查询成功",
          user: {
            userId: user.userId,
            deptId: user.deptId,
            userName: user.userName,
            nickName: user.nickName,
            email: user.email,
            phonenumber: user.phonenumber,
            sex: user.sex,
            avatar: user.avatar,
            status: user.status,
            createTime: user.createTime,
          },
          roles: roles.map((r) => r.roleKey),
          permissions,
          isDefaultModifyPwd,
          isPasswordExpired,
        };
      } catch (err) {
        ctx.logger.error("获取用户信息失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "获取用户信息失败",
        };
      }
    }

    /**
     * 检查初始密码是否需要修改
     * @param {Date} pwdUpdateDate - 密码更新日期
     * @return {boolean} 是否需要修改
     */
    async initPasswordIsModify(pwdUpdateDate) {
      const { ctx, service } = this;

      // 获取配置：是否启用初始密码修改提醒
      const initPasswordModify = await service.system.config.selectConfigByKey(
        "sys.account.initPasswordModify"
      );

      // 如果配置启用(1)且密码更新日期为空，则需要提醒修改
      return (
        initPasswordModify === "1" &&
        (pwdUpdateDate === null || pwdUpdateDate === undefined)
      );
    }

    /**
     * 检查密码是否过期
     * @param {Date} pwdUpdateDate - 密码更新日期
     * @return {boolean} 是否过期
     */
    async passwordIsExpiration(pwdUpdateDate) {
      const { ctx, service } = this;

      // 获取配置：密码有效期（天数）
      const passwordValidateDays =
        await service.system.config.selectConfigByKey(
          "sys.account.passwordValidateDays"
        );

      // 如果配置了密码有效期
      if (passwordValidateDays && parseInt(passwordValidateDays) > 0) {
        const days = parseInt(passwordValidateDays);

        // 如果从未修改过初始密码，直接提醒过期
        if (!pwdUpdateDate) {
          return true;
        }

        // 计算密码更新日期与当前日期的天数差
        const nowDate = new Date();
        const updateDate = new Date(pwdUpdateDate);
        const diffTime = nowDate.getTime() - updateDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // 如果超过有效期，则密码过期
        return diffDays > days;
      }

      return false;
    }

    /**
     * 获取路由菜单
     * GET /getRouters
     * 说明：需要登录，无需特殊权限
     */
    @HttpGet("/getRouters")
    async getRouters() {
      const { ctx, service } = this;

      try {
        const userId = ctx.state.user.userId;

        // 查询用户菜单
        let menus = await service.system.menu.selectMenuTreeByUserId(userId);

        ctx.body = {
          code: 200,
          msg: "查询成功",
          data: await service.system.menu.buildMenus(menus),
        };
      } catch (err) {
        ctx.logger.error("获取路由菜单失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "获取路由菜单失败",
        };
      }
    }

    /**
     * 用户注册
     * POST /register
     * 说明：公开接口，无需权限验证
     */
    @HttpPost("/register")
    async register() {
      const { ctx, service, app } = this;
      const { username, password, code, uuid } = ctx.request.body;

      try {
        // 1. 检查是否允许注册（fail-closed：仅在配置显式为 "true" 时放行，
        //    配置缺失或读取异常返回空串时一律视为关闭）
        const registerEnabled = await service.system.config.selectConfigByKey(
          "sys.account.registerUser"
        );
        if (registerEnabled !== "true") {
          ctx.body = {
            code: 500,
            msg: "当前系统没有开启注册功能",
          };
          return;
        }

        // 2. 校验用户名格式（2-20 个字符，非空）
        if (!username || username.length < 2 || username.length > 20) {
          ctx.body = {
            code: 400,
            msg: "用户名长度必须在 2 到 20 个字符之间",
          };
          return;
        }

        // 3. 校验密码格式（与前端一致：至少 6 位，且包含数字/字母/特殊字符中的至少两种）
        const pwdError = this.validatePasswordComplexity(password);
        if (pwdError) {
          ctx.body = {
            code: 400,
            msg: pwdError,
          };
          return;
        }

        // 4. 敏感词检测用户名
        const sensitiveCheck = ctx.checkSensitive(username);
        if (sensitiveCheck.hasSensitiveWord) {
          ctx.body = {
            code: 400,
            msg: `用户名包含敏感词: ${sensitiveCheck.sensitiveWords.join(', ')}`,
            data: {
              sensitiveWords: sensitiveCheck.sensitiveWords
            }
          };
          return;
        }

        // 5. 校验验证码
        if (app.config.captcha.enabled) {
          await service.system.login.validateCaptcha(code, uuid);
        }

        // 6. 校验用户名是否存在（checkUserNameUnique 读取的是 user.userName，
        //    必须传对象，否则查询条件恒为 NULL 导致重名校验失效）
        const exists = await service.system.user.checkUserNameUnique({
          userName: username,
        });
        if (exists) {
          ctx.body = {
            code: 500,
            msg: "用户名已存在",
          };
          return;
        }

        // 7. 注册用户
        await service.system.login.register(username, password);

        ctx.body = {
          code: 200,
          msg: "注册成功",
        };
      } catch (err) {
        ctx.logger.error("用户注册失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "注册失败",
        };
      }
    }

    /**
     * 校验密码复杂度（与前端 AgentStore.vue 注册校验规则保持一致）
     * 规则：非空、至少 6 位，且包含数字、字母、特殊字符中的至少两种
     * @param {string} value - 待校验的密码
     * @return {string} 校验通过返回空串，否则返回错误提示
     */
    validatePasswordComplexity(value) {
      if (!value) {
        return "请输入密码";
      }
      if (value.length < 6) {
        return "密码至少6位";
      }
      // 检查是否包含数字、字母、特殊字符中的至少两种
      const hasNumber = /\d/.test(value);
      const hasLetter = /[a-zA-Z]/.test(value);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
      const complexity = [hasNumber, hasLetter, hasSpecial].filter(Boolean)
        .length;
      if (complexity < 2) {
        return "密码需包含数字、字母、特殊字符中的至少两种";
      }
      return "";
    }

    /**
     * 获取验证码
     * GET /captchaImage
     * 说明：公开接口，无需权限验证
     */
    @HttpGet("/captchaImage")
    async captchaImage() {
      const { ctx, service, app } = this;

      try {
        const captchaEnabled =
          app.config.captcha && app.config.captcha.enabled !== undefined
            ? Boolean(app.config.captcha.enabled)
            : true;
        if (!captchaEnabled) {
          ctx.body = {
            code: 200,
            msg: "操作成功",
            captchaEnabled: false,
          };
          return;
        }

        // 生成验证码
        const captcha = await service.system.login.createCaptcha();

        ctx.body = {
          code: 200,
          msg: "操作成功",
          captchaEnabled: true,
          ...captcha,
        };
      } catch (err) {
        ctx.logger.error("生成验证码失败:", err);
        ctx.body = {
          code: 500,
          msg: err.message || "生成验证码失败",
        };
      }
    }
  }

  return LoginController;
};
