/*
 * @Description: 登录认证服务层
 * @Author: AI Assistant
 * @Date: 2025-10-23
 */

const Service = require("egg").Service;
const captcha = require("trek-captcha");
const { nanoid } = require("nanoid");
const dayjs = require("dayjs");
const { CacheConstants } = require("../../constant");

class LoginService extends Service {
  /**
   * 用户登录
   * @param {string} userName - 用户名
   * @param {string} password - 密码
   * @return {object} 用户信息
   */
  async login(userName, password) {
    const { ctx, service } = this;

    // 1. 查询用户
    const users =
      await ctx.helper.getDB(ctx).sysUserMapper.selectUserByUserName(
        null,
        { userName }
      );

    if (!users || users.length === 0) {
      throw new Error("用户不存在或密码错误");
    }

    const user = Array.isArray(users) ? users[0] : users;

    // 2. 检查用户状态
    if (user.delFlag === "2") {
      throw new Error("用户已被删除");
    }

    if (user.status === "1") {
      throw new Error("用户已被停用，请联系管理员");
    }

    // 3. 验证密码（包含错误次数限制）
    await service.system.password.validate(user, password);

    // 4. 更新登录信息
    await ctx.helper.getMasterDB(ctx).sysUserMapper.updateLoginInfo([], {
      userId: user.userId,
      loginIp: ctx.request.ip,
      loginDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    });

    return user;
  }

  /**
   * 用户注册
   * @param {string} userName - 用户名
   * @param {string} password - 密码
   */
  async register(userName, password) {
    const { ctx } = this;

    // 密码由控制器负责校验非空及复杂度，此处不再兜底默认密码，
    // 避免用空密码静默降级为弱口令(如 123456)
    if (!password) {
      throw new Error("密码不能为空");
    }

    // 加密密码
    const security = ctx.helper.security;
    const hashedPassword = await security.encryptPassword(password);

    // 插入用户
    const result = await ctx.helper.getMasterDB(ctx).sysUserMapper.insertUser([], {
      userName,
      nickName: userName,
      password: hashedPassword,
      status: "0",
      delFlag: "0",
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    });

    // 获取新插入的用户ID
    const userId = result.insertId || result.lastID;

    // 分配 common 角色 (role_id = 2)
    // 注意：batchUserRole 的 XML 用 collection="list"，必须以 { list: [...] } 形式传参，
    // 与本项目 user.js/role.js 中的调用约定保持一致
    if (userId) {
      await ctx.helper.getMasterDB(ctx).sysUserRoleMapper.batchUserRole([], {
        list: [{ userId, roleId: 2 }], // common 角色
      });
    }
  }

  /**
   * 验证验证码
   * @param {string} code - 验证码
   * @param {string} uuid - 唯一标识
   */
  async validateCaptcha(code, uuid) {
    const { app } = this;

    if (!code || !uuid) {
      throw new Error("验证码不能为空");
    }

    // 从缓存中获取验证码
    const cacheKey = CacheConstants.CAPTCHA_CODE_KEY + uuid;
    const cachedCode = await app.cache.default.get(cacheKey);

    if (!cachedCode) {
      throw new Error("验证码已过期，请重新获取");
    }

    // 验证码不区分大小写
    if (code.toLowerCase() !== cachedCode.toLowerCase()) {
      throw new Error("验证码错误");
    }

    // 验证通过后删除缓存
    await app.cache.default.del(cacheKey);
  }

  /**
   * 生成验证码
   * @return {object} 验证码信息
   */
  async createCaptcha() {
    const { app } = this;

    // 生成验证码 (PNG 图片)
    const { token, buffer } = await captcha({
      size: 4, // 验证码长度
      width: 120, // 图片宽度
      height: 40, // 图片高度
    });

    // 生成唯一标识
    const uuid = nanoid();

    // 存储到缓存（5分钟过期）
    const cacheKey = CacheConstants.CAPTCHA_CODE_KEY + uuid;
    await app.cache.default.set(cacheKey, token, { ttl: 300 });

    // 将 Buffer 转换为 Base64
    const base64Img = buffer.toString("base64");

    return {
      uuid,
      img: base64Img, // PNG 图片 (Base64)
    };
  }

  /**
   * 记录在线用户信息
   * @param {object} user - 用户信息
   * @param {string} token - Token
   */
  async recordOnlineUser(user, token) {
    const { app, ctx } = this;

    const onlineUser = {
      tokenId: token,
      userId: user.userId,
      userName: user.userName,
      deptName: user.deptName || "",
      ipaddr: ctx.request.ip,
      loginTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      expireTime: dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss'), // 7天后过期
    };

    // 存储到 Redis（与 Token 过期时间一致）
    const cacheKey = CacheConstants.LOGIN_TOKEN_KEY + user.userId;
    await app.cache.default.set(cacheKey, onlineUser, {
      ttl: 7 * 24 * 60 * 60,
    });
  }

  /**
   * 删除在线用户信息
   * @param {string} jti - Token ID
   * @param {number|string} [userId] - 用户ID
   */
  async removeOnlineUser(jti, userId) {
    const { app } = this;

    // 将 Token 加入黑名单
    if (jti) {
      await app.cache.default.set(jti, "revoked", { ttl: 7 * 24 * 60 * 60 });
    }

    // 删除在线用户缓存
    if (userId) {
      await app.cache.default.del(CacheConstants.LOGIN_TOKEN_KEY + userId);
    }
  }
}

module.exports = LoginService;

