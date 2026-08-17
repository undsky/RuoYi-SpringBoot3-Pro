/**
 * 自定义类型定义
 * 用于增强 IDE 智能提示和代码跳转能力
 */

import 'egg';

declare module 'egg' {
  interface IHelper {
    /**
     * 获取数据库访问对象（基于配置，自动读写分离）
     * @param ctx - 上下文对象
     * @param forWrite - 是否用于写操作，默认 false（读操作）
     * @returns 数据库访问对象（包含所有 Mapper）
     * @example
     * // 读操作（从库）
     * const mapper = ctx.helper.getDB(ctx);
     * const users = await mapper.sysUserMapper.selectUserList([0, 10], {});
     * 
     * // 写操作（主库）
     * const mapper = ctx.helper.getDB(ctx, true);
     * await mapper.sysUserMapper.insertUser([userData]);
     */
    getDB(ctx: Context, forWrite?: false): IService['db']['mysql']['doudou'];
    getDB(ctx: Context, forWrite: true): IService['db']['mysql']['doudou'];

    /**
     * 获取主库数据库访问对象（写操作）
     * @param ctx - 上下文对象
     * @returns 主库数据库访问对象
     * @example
     * const mapper = ctx.helper.getMasterDB(ctx);
     * await mapper.sysUserMapper.insertUser([userData]);
     */
    getMasterDB(ctx: Context): IService['db']['mysql']['doudou'];

    /**
     * 获取从库数据库访问对象（读操作）
     * @param ctx - 上下文对象
     * @returns 从库数据库访问对象
     * @example
     * const mapper = ctx.helper.getSlaveDB(ctx);
     * const users = await mapper.sysUserMapper.selectUserList([0, 10], {});
     */
    getSlaveDB(ctx: Context): IService['db']['mysql']['doudou'];
  }
}
