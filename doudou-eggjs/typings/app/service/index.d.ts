// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
type AnyClass = new (...args: any[]) => any;
type AnyFunc<T = any> = (...args: any[]) => T;
type CanExportFunc = AnyFunc<Promise<any>> | AnyFunc<IterableIterator<any>>;
type AutoInstanceType<T, U = T extends CanExportFunc ? T : T extends AnyFunc ? ReturnType<T> : T> = U extends AnyClass ? InstanceType<U> : U;
import ExportDoudouTask = require('../../../app/service/doudouTask');
import ExportUpload = require('../../../app/service/upload');
import ExportMonitorCache = require('../../../app/service/monitor/cache');
import ExportMonitorJob = require('../../../app/service/monitor/job');
import ExportMonitorJobLog = require('../../../app/service/monitor/jobLog');
import ExportMonitorLogininfor = require('../../../app/service/monitor/logininfor');
import ExportMonitorOnline = require('../../../app/service/monitor/online');
import ExportMonitorOperlog = require('../../../app/service/monitor/operlog');
import ExportMonitorServer = require('../../../app/service/monitor/server');
import ExportSystemConfig = require('../../../app/service/system/config');
import ExportSystemDept = require('../../../app/service/system/dept');
import ExportSystemDictData = require('../../../app/service/system/dictData');
import ExportSystemDictType = require('../../../app/service/system/dictType');
import ExportSystemLogin = require('../../../app/service/system/login');
import ExportSystemMenu = require('../../../app/service/system/menu');
import ExportSystemNotice = require('../../../app/service/system/notice');
import ExportSystemPassword = require('../../../app/service/system/password');
import ExportSystemPost = require('../../../app/service/system/post');
import ExportSystemRole = require('../../../app/service/system/role');
import ExportSystemUser = require('../../../app/service/system/user');
import ExportToolGen = require('../../../app/service/tool/gen');
import ExportToolSwagger = require('../../../app/service/tool/swagger');
import ExportDbMysqlDoudouGenTableColumnMapper = require('../../../app/service/db/mysql/doudou/GenTableColumnMapper');
import ExportDbMysqlDoudouGenTableMapper = require('../../../app/service/db/mysql/doudou/GenTableMapper');
import ExportDbMysqlDoudouSysConfigMapper = require('../../../app/service/db/mysql/doudou/SysConfigMapper');
import ExportDbMysqlDoudouSysDeptMapper = require('../../../app/service/db/mysql/doudou/SysDeptMapper');
import ExportDbMysqlDoudouSysDictDataMapper = require('../../../app/service/db/mysql/doudou/SysDictDataMapper');
import ExportDbMysqlDoudouSysDictTypeMapper = require('../../../app/service/db/mysql/doudou/SysDictTypeMapper');
import ExportDbMysqlDoudouSysJobLogMapper = require('../../../app/service/db/mysql/doudou/SysJobLogMapper');
import ExportDbMysqlDoudouSysJobMapper = require('../../../app/service/db/mysql/doudou/SysJobMapper');
import ExportDbMysqlDoudouSysLogininforMapper = require('../../../app/service/db/mysql/doudou/SysLogininforMapper');
import ExportDbMysqlDoudouSysMenuMapper = require('../../../app/service/db/mysql/doudou/SysMenuMapper');
import ExportDbMysqlDoudouSysNoticeMapper = require('../../../app/service/db/mysql/doudou/SysNoticeMapper');
import ExportDbMysqlDoudouSysOperLogMapper = require('../../../app/service/db/mysql/doudou/SysOperLogMapper');
import ExportDbMysqlDoudouSysPostMapper = require('../../../app/service/db/mysql/doudou/SysPostMapper');
import ExportDbMysqlDoudouSysRoleDeptMapper = require('../../../app/service/db/mysql/doudou/SysRoleDeptMapper');
import ExportDbMysqlDoudouSysRoleMapper = require('../../../app/service/db/mysql/doudou/SysRoleMapper');
import ExportDbMysqlDoudouSysRoleMenuMapper = require('../../../app/service/db/mysql/doudou/SysRoleMenuMapper');
import ExportDbMysqlDoudouSysUserMapper = require('../../../app/service/db/mysql/doudou/SysUserMapper');
import ExportDbMysqlDoudouSysUserPostMapper = require('../../../app/service/db/mysql/doudou/SysUserPostMapper');
import ExportDbMysqlDoudouSysUserRoleMapper = require('../../../app/service/db/mysql/doudou/SysUserRoleMapper');
import ExportDbPgsqlDoudouGenTableColumnMapper = require('../../../app/service/db/pgsql/doudou/GenTableColumnMapper');
import ExportDbPgsqlDoudouGenTableMapper = require('../../../app/service/db/pgsql/doudou/GenTableMapper');
import ExportDbPgsqlDoudouSysConfigMapper = require('../../../app/service/db/pgsql/doudou/SysConfigMapper');
import ExportDbPgsqlDoudouSysDeptMapper = require('../../../app/service/db/pgsql/doudou/SysDeptMapper');
import ExportDbPgsqlDoudouSysDictDataMapper = require('../../../app/service/db/pgsql/doudou/SysDictDataMapper');
import ExportDbPgsqlDoudouSysDictTypeMapper = require('../../../app/service/db/pgsql/doudou/SysDictTypeMapper');
import ExportDbPgsqlDoudouSysJobLogMapper = require('../../../app/service/db/pgsql/doudou/SysJobLogMapper');
import ExportDbPgsqlDoudouSysJobMapper = require('../../../app/service/db/pgsql/doudou/SysJobMapper');
import ExportDbPgsqlDoudouSysLogininforMapper = require('../../../app/service/db/pgsql/doudou/SysLogininforMapper');
import ExportDbPgsqlDoudouSysMenuMapper = require('../../../app/service/db/pgsql/doudou/SysMenuMapper');
import ExportDbPgsqlDoudouSysNoticeMapper = require('../../../app/service/db/pgsql/doudou/SysNoticeMapper');
import ExportDbPgsqlDoudouSysOperLogMapper = require('../../../app/service/db/pgsql/doudou/SysOperLogMapper');
import ExportDbPgsqlDoudouSysPostMapper = require('../../../app/service/db/pgsql/doudou/SysPostMapper');
import ExportDbPgsqlDoudouSysRoleDeptMapper = require('../../../app/service/db/pgsql/doudou/SysRoleDeptMapper');
import ExportDbPgsqlDoudouSysRoleMapper = require('../../../app/service/db/pgsql/doudou/SysRoleMapper');
import ExportDbPgsqlDoudouSysRoleMenuMapper = require('../../../app/service/db/pgsql/doudou/SysRoleMenuMapper');
import ExportDbPgsqlDoudouSysUserMapper = require('../../../app/service/db/pgsql/doudou/SysUserMapper');
import ExportDbPgsqlDoudouSysUserPostMapper = require('../../../app/service/db/pgsql/doudou/SysUserPostMapper');
import ExportDbPgsqlDoudouSysUserRoleMapper = require('../../../app/service/db/pgsql/doudou/SysUserRoleMapper');
import ExportDbSqliteDoudouGenTableColumnMapper = require('../../../app/service/db/sqlite/doudou/GenTableColumnMapper');
import ExportDbSqliteDoudouGenTableMapper = require('../../../app/service/db/sqlite/doudou/GenTableMapper');
import ExportDbSqliteDoudouSysConfigMapper = require('../../../app/service/db/sqlite/doudou/SysConfigMapper');
import ExportDbSqliteDoudouSysDeptMapper = require('../../../app/service/db/sqlite/doudou/SysDeptMapper');
import ExportDbSqliteDoudouSysDictDataMapper = require('../../../app/service/db/sqlite/doudou/SysDictDataMapper');
import ExportDbSqliteDoudouSysDictTypeMapper = require('../../../app/service/db/sqlite/doudou/SysDictTypeMapper');
import ExportDbSqliteDoudouSysJobLogMapper = require('../../../app/service/db/sqlite/doudou/SysJobLogMapper');
import ExportDbSqliteDoudouSysJobMapper = require('../../../app/service/db/sqlite/doudou/SysJobMapper');
import ExportDbSqliteDoudouSysLogininforMapper = require('../../../app/service/db/sqlite/doudou/SysLogininforMapper');
import ExportDbSqliteDoudouSysMenuMapper = require('../../../app/service/db/sqlite/doudou/SysMenuMapper');
import ExportDbSqliteDoudouSysNoticeMapper = require('../../../app/service/db/sqlite/doudou/SysNoticeMapper');
import ExportDbSqliteDoudouSysOperLogMapper = require('../../../app/service/db/sqlite/doudou/SysOperLogMapper');
import ExportDbSqliteDoudouSysPostMapper = require('../../../app/service/db/sqlite/doudou/SysPostMapper');
import ExportDbSqliteDoudouSysRoleDeptMapper = require('../../../app/service/db/sqlite/doudou/SysRoleDeptMapper');
import ExportDbSqliteDoudouSysRoleMapper = require('../../../app/service/db/sqlite/doudou/SysRoleMapper');
import ExportDbSqliteDoudouSysRoleMenuMapper = require('../../../app/service/db/sqlite/doudou/SysRoleMenuMapper');
import ExportDbSqliteDoudouSysUserMapper = require('../../../app/service/db/sqlite/doudou/SysUserMapper');
import ExportDbSqliteDoudouSysUserPostMapper = require('../../../app/service/db/sqlite/doudou/SysUserPostMapper');
import ExportDbSqliteDoudouSysUserRoleMapper = require('../../../app/service/db/sqlite/doudou/SysUserRoleMapper');

declare module 'egg' {
  interface IService {
    doudouTask: AutoInstanceType<typeof ExportDoudouTask>;
    upload: AutoInstanceType<typeof ExportUpload>;
    monitor: {
      cache: AutoInstanceType<typeof ExportMonitorCache>;
      job: AutoInstanceType<typeof ExportMonitorJob>;
      jobLog: AutoInstanceType<typeof ExportMonitorJobLog>;
      logininfor: AutoInstanceType<typeof ExportMonitorLogininfor>;
      online: AutoInstanceType<typeof ExportMonitorOnline>;
      operlog: AutoInstanceType<typeof ExportMonitorOperlog>;
      server: AutoInstanceType<typeof ExportMonitorServer>;
    }
    system: {
      config: AutoInstanceType<typeof ExportSystemConfig>;
      dept: AutoInstanceType<typeof ExportSystemDept>;
      dictData: AutoInstanceType<typeof ExportSystemDictData>;
      dictType: AutoInstanceType<typeof ExportSystemDictType>;
      login: AutoInstanceType<typeof ExportSystemLogin>;
      menu: AutoInstanceType<typeof ExportSystemMenu>;
      notice: AutoInstanceType<typeof ExportSystemNotice>;
      password: AutoInstanceType<typeof ExportSystemPassword>;
      post: AutoInstanceType<typeof ExportSystemPost>;
      role: AutoInstanceType<typeof ExportSystemRole>;
      user: AutoInstanceType<typeof ExportSystemUser>;
    }
    tool: {
      gen: AutoInstanceType<typeof ExportToolGen>;
      swagger: AutoInstanceType<typeof ExportToolSwagger>;
    }
    db: {
      mysql: {
        doudou: {
          genTableColumnMapper: AutoInstanceType<typeof ExportDbMysqlDoudouGenTableColumnMapper>;
          genTableMapper: AutoInstanceType<typeof ExportDbMysqlDoudouGenTableMapper>;
          sysConfigMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysConfigMapper>;
          sysDeptMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysDeptMapper>;
          sysDictDataMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysDictDataMapper>;
          sysDictTypeMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysDictTypeMapper>;
          sysJobLogMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysJobLogMapper>;
          sysJobMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysJobMapper>;
          sysLogininforMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysLogininforMapper>;
          sysMenuMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysMenuMapper>;
          sysNoticeMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysNoticeMapper>;
          sysOperLogMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysOperLogMapper>;
          sysPostMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysPostMapper>;
          sysRoleDeptMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysRoleDeptMapper>;
          sysRoleMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysRoleMapper>;
          sysRoleMenuMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysRoleMenuMapper>;
          sysUserMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysUserMapper>;
          sysUserPostMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysUserPostMapper>;
          sysUserRoleMapper: AutoInstanceType<typeof ExportDbMysqlDoudouSysUserRoleMapper>;
        }
      }
      pgsql: {
        doudou: {
          genTableColumnMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouGenTableColumnMapper>;
          genTableMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouGenTableMapper>;
          sysConfigMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysConfigMapper>;
          sysDeptMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysDeptMapper>;
          sysDictDataMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysDictDataMapper>;
          sysDictTypeMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysDictTypeMapper>;
          sysJobLogMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysJobLogMapper>;
          sysJobMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysJobMapper>;
          sysLogininforMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysLogininforMapper>;
          sysMenuMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysMenuMapper>;
          sysNoticeMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysNoticeMapper>;
          sysOperLogMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysOperLogMapper>;
          sysPostMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysPostMapper>;
          sysRoleDeptMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysRoleDeptMapper>;
          sysRoleMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysRoleMapper>;
          sysRoleMenuMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysRoleMenuMapper>;
          sysUserMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysUserMapper>;
          sysUserPostMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysUserPostMapper>;
          sysUserRoleMapper: AutoInstanceType<typeof ExportDbPgsqlDoudouSysUserRoleMapper>;
        }
      }
      sqlite: {
        doudou: {
          genTableColumnMapper: AutoInstanceType<typeof ExportDbSqliteDoudouGenTableColumnMapper>;
          genTableMapper: AutoInstanceType<typeof ExportDbSqliteDoudouGenTableMapper>;
          sysConfigMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysConfigMapper>;
          sysDeptMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysDeptMapper>;
          sysDictDataMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysDictDataMapper>;
          sysDictTypeMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysDictTypeMapper>;
          sysJobLogMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysJobLogMapper>;
          sysJobMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysJobMapper>;
          sysLogininforMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysLogininforMapper>;
          sysMenuMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysMenuMapper>;
          sysNoticeMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysNoticeMapper>;
          sysOperLogMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysOperLogMapper>;
          sysPostMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysPostMapper>;
          sysRoleDeptMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysRoleDeptMapper>;
          sysRoleMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysRoleMapper>;
          sysRoleMenuMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysRoleMenuMapper>;
          sysUserMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysUserMapper>;
          sysUserPostMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysUserPostMapper>;
          sysUserRoleMapper: AutoInstanceType<typeof ExportDbSqliteDoudouSysUserRoleMapper>;
        }
      }
    }
  }
}
