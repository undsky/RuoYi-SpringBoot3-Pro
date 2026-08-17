// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportCommon = require('../../../app/controller/common');
import ExportIndex = require('../../../app/controller/index');
import ExportMonitorCache = require('../../../app/controller/monitor/cache');
import ExportMonitorDruid = require('../../../app/controller/monitor/druid');
import ExportMonitorJob = require('../../../app/controller/monitor/job');
import ExportMonitorJobLog = require('../../../app/controller/monitor/jobLog');
import ExportMonitorLogininfor = require('../../../app/controller/monitor/logininfor');
import ExportMonitorOnline = require('../../../app/controller/monitor/online');
import ExportMonitorOperlog = require('../../../app/controller/monitor/operlog');
import ExportMonitorServer = require('../../../app/controller/monitor/server');
import ExportSystemConfig = require('../../../app/controller/system/config');
import ExportSystemDept = require('../../../app/controller/system/dept');
import ExportSystemDictData = require('../../../app/controller/system/dictData');
import ExportSystemDictType = require('../../../app/controller/system/dictType');
import ExportSystemLogin = require('../../../app/controller/system/login');
import ExportSystemMenu = require('../../../app/controller/system/menu');
import ExportSystemNotice = require('../../../app/controller/system/notice');
import ExportSystemPost = require('../../../app/controller/system/post');
import ExportSystemProfile = require('../../../app/controller/system/profile');
import ExportSystemRole = require('../../../app/controller/system/role');
import ExportSystemUser = require('../../../app/controller/system/user');
import ExportToolGen = require('../../../app/controller/tool/gen');
import ExportToolSwaggerUi = require('../../../app/controller/tool/swagger-ui');
import ExportToolSwagger = require('../../../app/controller/tool/swagger');

declare module 'egg' {
  interface IController {
    common: ExportCommon;
    index: ExportIndex;
    monitor: {
      cache: ExportMonitorCache;
      druid: ExportMonitorDruid;
      job: ExportMonitorJob;
      jobLog: ExportMonitorJobLog;
      logininfor: ExportMonitorLogininfor;
      online: ExportMonitorOnline;
      operlog: ExportMonitorOperlog;
      server: ExportMonitorServer;
    }
    system: {
      config: ExportSystemConfig;
      dept: ExportSystemDept;
      dictData: ExportSystemDictData;
      dictType: ExportSystemDictType;
      login: ExportSystemLogin;
      menu: ExportSystemMenu;
      notice: ExportSystemNotice;
      post: ExportSystemPost;
      profile: ExportSystemProfile;
      role: ExportSystemRole;
      user: ExportSystemUser;
    }
    tool: {
      gen: ExportToolGen;
      swaggerUi: ExportToolSwaggerUi;
      swagger: ExportToolSwagger;
    }
  }
}
