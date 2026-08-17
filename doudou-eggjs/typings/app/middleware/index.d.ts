// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportFormatBody = require('../../../app/middleware/formatBody');
import ExportPermission = require('../../../app/middleware/permission');

declare module 'egg' {
  interface IMiddleware {
    formatBody: typeof ExportFormatBody;
    permission: typeof ExportPermission;
  }
}
