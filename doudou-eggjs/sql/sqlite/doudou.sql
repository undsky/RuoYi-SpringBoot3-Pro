-- ----------------------------
-- 1、部门表
-- ----------------------------
DROP TABLE IF EXISTS sys_dept;
CREATE TABLE sys_dept (
  dept_id           INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id         INTEGER     DEFAULT 0,
  ancestors         TEXT        DEFAULT '',
  dept_name         TEXT        DEFAULT '',
  order_num         INTEGER     DEFAULT 0,
  leader            TEXT        DEFAULT NULL,
  phone             TEXT        DEFAULT NULL,
  email             TEXT        DEFAULT NULL,
  status            TEXT        DEFAULT '0',
  del_flag          TEXT        DEFAULT '0',
  create_by         TEXT        DEFAULT '',
  create_time       TEXT,
  update_by         TEXT        DEFAULT '',
  update_time       TEXT
);

INSERT INTO sys_dept VALUES(100,  0,   '0',          '总公司',   0, '豆豆', '15888888888', 'doudou@qq.com', '0', '0', 'admin', datetime('now','localtime'), '', NULL);
INSERT INTO sys_dept VALUES(101,  100, '0,100',      '下属部门', 1, '豆豆', '15888888888', 'doudou@qq.com', '0', '0', 'admin', datetime('now','localtime'), '', NULL);

-- ----------------------------
-- 2、用户信息表
-- ----------------------------
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
  user_id           INTEGER PRIMARY KEY AUTOINCREMENT,
  dept_id           INTEGER     DEFAULT NULL,
  user_name         TEXT        NOT NULL,
  nick_name         TEXT        NOT NULL,
  user_type         TEXT        DEFAULT '00',
  email             TEXT        DEFAULT '',
  phonenumber       TEXT        DEFAULT '',
  sex               TEXT        DEFAULT '0',
  avatar            TEXT        DEFAULT '',
  password          TEXT        DEFAULT '',
  status            TEXT        DEFAULT '0',
  del_flag          TEXT        DEFAULT '0',
  login_ip          TEXT        DEFAULT '',
  login_date        TEXT,
  pwd_update_date   TEXT,
  create_by         TEXT        DEFAULT '',
  create_time       TEXT,
  update_by         TEXT        DEFAULT '',
  update_time       TEXT,
  remark            TEXT        DEFAULT NULL
);

INSERT INTO sys_user VALUES(1,  103, 'admin', '豆豆', '00', 'undsky@163.com', '15888888888', '1', '', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '0', '0', '127.0.0.1', datetime('now','localtime'), datetime('now','localtime'), 'admin', datetime('now','localtime'), '', NULL, '管理员');

-- ----------------------------
-- 3、岗位信息表
-- ----------------------------
DROP TABLE IF EXISTS sys_post;
CREATE TABLE sys_post (
  post_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  post_code     TEXT        NOT NULL,
  post_name     TEXT        NOT NULL,
  post_sort     INTEGER     NOT NULL,
  status        TEXT        NOT NULL,
  create_by     TEXT        DEFAULT '',
  create_time   TEXT,
  update_by     TEXT        DEFAULT '',
  update_time   TEXT,
  remark        TEXT        DEFAULT NULL
);

INSERT INTO sys_post VALUES(1, 'ceo',  '董事长',    1, '0', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_post VALUES(2, 'se',   '项目经理',  2, '0', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_post VALUES(3, 'hr',   '人力资源',  3, '0', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_post VALUES(4, 'user', '普通员工',  4, '0', 'admin', datetime('now','localtime'), '', NULL, '');

-- ----------------------------
-- 4、角色信息表
-- ----------------------------
DROP TABLE IF EXISTS sys_role;
CREATE TABLE sys_role (
  role_id              INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name            TEXT        NOT NULL,
  role_key             TEXT        NOT NULL,
  role_sort            INTEGER     NOT NULL,
  data_scope           TEXT        DEFAULT '1',
  menu_check_strictly  INTEGER     DEFAULT 1,
  dept_check_strictly  INTEGER     DEFAULT 1,
  status               TEXT        NOT NULL,
  del_flag             TEXT        DEFAULT '0',
  create_by            TEXT        DEFAULT '',
  create_time          TEXT,
  update_by            TEXT        DEFAULT '',
  update_time          TEXT,
  remark               TEXT        DEFAULT NULL
);

INSERT INTO sys_role VALUES(1, '超级管理员',  'admin',  1, 1, 1, 1, '0', '0', 'admin', datetime('now','localtime'), '', NULL, '超级管理员');
INSERT INTO sys_role VALUES(2, '普通角色',    'common', 2, 2, 1, 1, '0', '0', 'admin', datetime('now','localtime'), '', NULL, '普通角色');

-- ----------------------------
-- 5、菜单权限表
-- ----------------------------
DROP TABLE IF EXISTS sys_menu;
CREATE TABLE sys_menu (
  menu_id           INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_name         TEXT        NOT NULL,
  parent_id         INTEGER     DEFAULT 0,
  order_num         INTEGER     DEFAULT 0,
  path              TEXT        DEFAULT '',
  component         TEXT        DEFAULT NULL,
  query             TEXT        DEFAULT NULL,
  route_name        TEXT        DEFAULT '',
  is_frame          INTEGER     DEFAULT 1,
  is_cache          INTEGER     DEFAULT 0,
  menu_type         TEXT        DEFAULT '',
  visible           TEXT        DEFAULT '0',
  status            TEXT        DEFAULT '0',
  perms             TEXT        DEFAULT NULL,
  icon              TEXT        DEFAULT '#',
  create_by         TEXT        DEFAULT '',
  create_time       TEXT,
  update_by         TEXT        DEFAULT '',
  update_time       TEXT,
  remark            TEXT        DEFAULT ''
);

-- 一级菜单
INSERT INTO sys_menu VALUES(1, '系统管理', 0, 1, 'system',           NULL, '', '', 1, 0, 'M', '0', '0', '', 'system',   'admin', datetime('now','localtime'), '', NULL, '系统管理目录');
INSERT INTO sys_menu VALUES(2, '系统监控', 0, 2, 'monitor',          NULL, '', '', 1, 0, 'M', '0', '0', '', 'monitor',  'admin', datetime('now','localtime'), '', NULL, '系统监控目录');
INSERT INTO sys_menu VALUES(3, '系统工具', 0, 3, 'tool',             NULL, '', '', 1, 0, 'M', '0', '0', '', 'tool',     'admin', datetime('now','localtime'), '', NULL, '系统工具目录');
-- 二级菜单
INSERT INTO sys_menu VALUES(100,  '用户管理', 1,   1, 'user',       'system/user/index',        '', '', 1, 0, 'C', '0', '0', 'system:user:list',        'user',          'admin', datetime('now','localtime'), '', NULL, '用户管理菜单');
INSERT INTO sys_menu VALUES(101,  '角色管理', 1,   2, 'role',       'system/role/index',        '', '', 1, 0, 'C', '0', '0', 'system:role:list',        'peoples',       'admin', datetime('now','localtime'), '', NULL, '角色管理菜单');
INSERT INTO sys_menu VALUES(102,  '菜单管理', 1,   3, 'menu',       'system/menu/index',        '', '', 1, 0, 'C', '0', '0', 'system:menu:list',        'tree-table',    'admin', datetime('now','localtime'), '', NULL, '菜单管理菜单');
INSERT INTO sys_menu VALUES(103,  '部门管理', 1,   4, 'dept',       'system/dept/index',        '', '', 1, 0, 'C', '0', '0', 'system:dept:list',        'tree',          'admin', datetime('now','localtime'), '', NULL, '部门管理菜单');
INSERT INTO sys_menu VALUES(104,  '岗位管理', 1,   5, 'post',       'system/post/index',        '', '', 1, 0, 'C', '0', '0', 'system:post:list',        'post',          'admin', datetime('now','localtime'), '', NULL, '岗位管理菜单');
INSERT INTO sys_menu VALUES(105,  '字典管理', 1,   6, 'dict',       'system/dict/index',        '', '', 1, 0, 'C', '0', '0', 'system:dict:list',        'dict',          'admin', datetime('now','localtime'), '', NULL, '字典管理菜单');
INSERT INTO sys_menu VALUES(106,  '参数设置', 1,   7, 'config',     'system/config/index',      '', '', 1, 0, 'C', '0', '0', 'system:config:list',      'edit',          'admin', datetime('now','localtime'), '', NULL, '参数设置菜单');
INSERT INTO sys_menu VALUES(107,  '通知公告', 1,   8, 'notice',     'system/notice/index',      '', '', 1, 0, 'C', '0', '0', 'system:notice:list',      'message',       'admin', datetime('now','localtime'), '', NULL, '通知公告菜单');
INSERT INTO sys_menu VALUES(108,  '日志管理', 1,   9, 'log',        '',                         '', '', 1, 0, 'M', '0', '0', '',                        'log',           'admin', datetime('now','localtime'), '', NULL, '日志管理菜单');
INSERT INTO sys_menu VALUES(109,  '在线用户', 2,   1, 'online',     'monitor/online/index',     '', '', 1, 0, 'C', '0', '0', 'monitor:online:list',     'online',        'admin', datetime('now','localtime'), '', NULL, '在线用户菜单');
INSERT INTO sys_menu VALUES(110,  '定时任务', 2,   2, 'job',        'monitor/job/index',        '', '', 1, 0, 'C', '0', '0', 'monitor:job:list',        'job',           'admin', datetime('now','localtime'), '', NULL, '定时任务菜单');
INSERT INTO sys_menu VALUES(111,  '数据监控', 2,   3, 'druid',      'monitor/druid/index',      '', '', 1, 0, 'C', '0', '0', 'monitor:druid:list',      'druid',         'admin', datetime('now','localtime'), '', NULL, '数据监控菜单');
INSERT INTO sys_menu VALUES(112,  '服务监控', 2,   4, 'server',     'monitor/server/index',     '', '', 1, 0, 'C', '0', '0', 'monitor:server:list',     'server',        'admin', datetime('now','localtime'), '', NULL, '服务监控菜单');
INSERT INTO sys_menu VALUES(113,  '缓存监控', 2,   5, 'cache',      'monitor/cache/index',      '', '', 1, 0, 'C', '0', '0', 'monitor:cache:list',      'redis',         'admin', datetime('now','localtime'), '', NULL, '缓存监控菜单');
INSERT INTO sys_menu VALUES(114,  '缓存列表', 2,   6, 'cacheList',  'monitor/cache/list',       '', '', 1, 0, 'C', '0', '0', 'monitor:cache:list',      'redis-list',    'admin', datetime('now','localtime'), '', NULL, '缓存列表菜单');
INSERT INTO sys_menu VALUES(115,  '表单构建', 3,   1, 'build',      'tool/build/index',         '', '', 1, 0, 'C', '0', '0', 'tool:build:list',         'build',         'admin', datetime('now','localtime'), '', NULL, '表单构建菜单');
INSERT INTO sys_menu VALUES(116,  '代码生成', 3,   2, 'gen',        'tool/gen/index',           '', '', 1, 0, 'C', '0', '0', 'tool:gen:list',           'code',          'admin', datetime('now','localtime'), '', NULL, '代码生成菜单');
INSERT INTO sys_menu VALUES(117,  '系统接口', 3,   3, 'swagger',    'tool/swagger/index',       '', '', 1, 0, 'C', '0', '0', 'tool:swagger:list',       'swagger',       'admin', datetime('now','localtime'), '', NULL, '系统接口菜单');
-- 三级菜单
INSERT INTO sys_menu VALUES(500,  '操作日志', 108, 1, 'operlog',    'monitor/operlog/index',    '', '', 1, 0, 'C', '0', '0', 'monitor:operlog:list',    'form',          'admin', datetime('now','localtime'), '', NULL, '操作日志菜单');
INSERT INTO sys_menu VALUES(501,  '登录日志', 108, 2, 'logininfor', 'monitor/logininfor/index', '', '', 1, 0, 'C', '0', '0', 'monitor:logininfor:list', 'logininfor',    'admin', datetime('now','localtime'), '', NULL, '登录日志菜单');
-- 用户管理按钮
INSERT INTO sys_menu VALUES(1000, '用户查询', 100, 1,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:query',          '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1001, '用户新增', 100, 2,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:add',            '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1002, '用户修改', 100, 3,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:edit',           '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1003, '用户删除', 100, 4,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:remove',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1004, '用户导出', 100, 5,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:export',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1005, '用户导入', 100, 6,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:import',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1006, '重置密码', 100, 7,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:resetPwd',       '#', 'admin', datetime('now','localtime'), '', NULL, '');
-- 角色管理按钮
INSERT INTO sys_menu VALUES(1007, '角色查询', 101, 1,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:query',          '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1008, '角色新增', 101, 2,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:add',            '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1009, '角色修改', 101, 3,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:edit',           '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1010, '角色删除', 101, 4,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:remove',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1011, '角色导出', 101, 5,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:export',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
-- 菜单管理按钮
INSERT INTO sys_menu VALUES(1012, '菜单查询', 102, 1,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:query',          '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1013, '菜单新增', 102, 2,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:add',            '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1014, '菜单修改', 102, 3,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:edit',           '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1015, '菜单删除', 102, 4,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:remove',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
-- 部门管理按钮
INSERT INTO sys_menu VALUES(1016, '部门查询', 103, 1,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:query',          '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1017, '部门新增', 103, 2,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:add',            '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1018, '部门修改', 103, 3,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:edit',           '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1019, '部门删除', 103, 4,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:remove',         '#', 'admin', datetime('now','localtime'), '', NULL, '');

-- 岗位管理按钮
INSERT INTO sys_menu VALUES(1020, '岗位查询', 104, 1,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:query',          '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1021, '岗位新增', 104, 2,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:add',            '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1022, '岗位修改', 104, 3,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:edit',           '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1023, '岗位删除', 104, 4,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:remove',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1024, '岗位导出', 104, 5,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:export',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
-- 字典管理按钮
INSERT INTO sys_menu VALUES(1025, '字典查询', 105, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:query',          '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1026, '字典新增', 105, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:add',            '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1027, '字典修改', 105, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:edit',           '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1028, '字典删除', 105, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:remove',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1029, '字典导出', 105, 5, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:export',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
-- 参数设置按钮
INSERT INTO sys_menu VALUES(1030, '参数查询', 106, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:query',        '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1031, '参数新增', 106, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:add',          '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1032, '参数修改', 106, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:edit',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1033, '参数删除', 106, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:remove',       '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1034, '参数导出', 106, 5, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:export',       '#', 'admin', datetime('now','localtime'), '', NULL, '');
-- 通知公告按钮
INSERT INTO sys_menu VALUES(1035, '公告查询', 107, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:query',        '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1036, '公告新增', 107, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:add',          '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1037, '公告修改', 107, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:edit',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1038, '公告删除', 107, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:remove',       '#', 'admin', datetime('now','localtime'), '', NULL, '');
-- 操作日志按钮
INSERT INTO sys_menu VALUES(1039, '操作查询', 500, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:operlog:query',      '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1040, '操作删除', 500, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:operlog:remove',     '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1041, '日志导出', 500, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:operlog:export',     '#', 'admin', datetime('now','localtime'), '', NULL, '');
-- 登录日志按钮
INSERT INTO sys_menu VALUES(1042, '登录查询', 501, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:query',   '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1043, '登录删除', 501, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:remove',  '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1044, '日志导出', 501, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:export',  '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1045, '账户解锁', 501, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:unlock',  '#', 'admin', datetime('now','localtime'), '', NULL, '');
-- 在线用户按钮
INSERT INTO sys_menu VALUES(1046, '在线查询', 109, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:online:query',       '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1047, '批量强退', 109, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:online:batchLogout', '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1048, '单条强退', 109, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:online:forceLogout', '#', 'admin', datetime('now','localtime'), '', NULL, '');
-- 定时任务按钮
INSERT INTO sys_menu VALUES(1049, '任务查询', 110, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:query',          '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1050, '任务新增', 110, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:add',            '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1051, '任务修改', 110, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:edit',           '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1052, '任务删除', 110, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:remove',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1053, '状态修改', 110, 5, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:changeStatus',   '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1054, '任务导出', 110, 6, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:export',         '#', 'admin', datetime('now','localtime'), '', NULL, '');
-- 代码生成按钮
INSERT INTO sys_menu VALUES(1055, '生成查询', 116, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:query',             '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1056, '生成修改', 116, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:edit',              '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1057, '生成删除', 116, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:remove',            '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1058, '导入代码', 116, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:import',            '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1059, '预览代码', 116, 5, '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:preview',           '#', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_menu VALUES(1060, '生成代码', 116, 6, '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:code',              '#', 'admin', datetime('now','localtime'), '', NULL, '');

-- ----------------------------
-- 6、用户和角色关联表  用户N-1角色
-- ----------------------------
DROP TABLE IF EXISTS sys_user_role;
CREATE TABLE sys_user_role (
  user_id   INTEGER NOT NULL,
  role_id   INTEGER NOT NULL,
  PRIMARY KEY(user_id, role_id)
);

INSERT INTO sys_user_role VALUES (1, 1);

-- ----------------------------
-- 7、角色和菜单关联表  角色1-N菜单
-- ----------------------------
DROP TABLE IF EXISTS sys_role_menu;
CREATE TABLE sys_role_menu (
  role_id   INTEGER NOT NULL,
  menu_id   INTEGER NOT NULL,
  PRIMARY KEY(role_id, menu_id)
);

INSERT INTO sys_role_menu VALUES (2, 1);
INSERT INTO sys_role_menu VALUES (2, 2);
INSERT INTO sys_role_menu VALUES (2, 3);
INSERT INTO sys_role_menu VALUES (2, 100);
INSERT INTO sys_role_menu VALUES (2, 101);
INSERT INTO sys_role_menu VALUES (2, 102);
INSERT INTO sys_role_menu VALUES (2, 103);
INSERT INTO sys_role_menu VALUES (2, 104);
INSERT INTO sys_role_menu VALUES (2, 105);
INSERT INTO sys_role_menu VALUES (2, 106);
INSERT INTO sys_role_menu VALUES (2, 107);
INSERT INTO sys_role_menu VALUES (2, 108);
INSERT INTO sys_role_menu VALUES (2, 109);
INSERT INTO sys_role_menu VALUES (2, 110);
INSERT INTO sys_role_menu VALUES (2, 111);
INSERT INTO sys_role_menu VALUES (2, 112);
INSERT INTO sys_role_menu VALUES (2, 113);
INSERT INTO sys_role_menu VALUES (2, 114);
INSERT INTO sys_role_menu VALUES (2, 115);
INSERT INTO sys_role_menu VALUES (2, 116);
INSERT INTO sys_role_menu VALUES (2, 117);
INSERT INTO sys_role_menu VALUES (2, 500);
INSERT INTO sys_role_menu VALUES (2, 501);
INSERT INTO sys_role_menu VALUES (2, 1000);
INSERT INTO sys_role_menu VALUES (2, 1001);
INSERT INTO sys_role_menu VALUES (2, 1002);
INSERT INTO sys_role_menu VALUES (2, 1003);
INSERT INTO sys_role_menu VALUES (2, 1004);
INSERT INTO sys_role_menu VALUES (2, 1005);
INSERT INTO sys_role_menu VALUES (2, 1006);
INSERT INTO sys_role_menu VALUES (2, 1007);
INSERT INTO sys_role_menu VALUES (2, 1008);
INSERT INTO sys_role_menu VALUES (2, 1009);
INSERT INTO sys_role_menu VALUES (2, 1010);
INSERT INTO sys_role_menu VALUES (2, 1011);
INSERT INTO sys_role_menu VALUES (2, 1012);
INSERT INTO sys_role_menu VALUES (2, 1013);
INSERT INTO sys_role_menu VALUES (2, 1014);
INSERT INTO sys_role_menu VALUES (2, 1015);
INSERT INTO sys_role_menu VALUES (2, 1016);
INSERT INTO sys_role_menu VALUES (2, 1017);
INSERT INTO sys_role_menu VALUES (2, 1018);
INSERT INTO sys_role_menu VALUES (2, 1019);
INSERT INTO sys_role_menu VALUES (2, 1020);
INSERT INTO sys_role_menu VALUES (2, 1021);
INSERT INTO sys_role_menu VALUES (2, 1022);
INSERT INTO sys_role_menu VALUES (2, 1023);
INSERT INTO sys_role_menu VALUES (2, 1024);
INSERT INTO sys_role_menu VALUES (2, 1025);
INSERT INTO sys_role_menu VALUES (2, 1026);
INSERT INTO sys_role_menu VALUES (2, 1027);
INSERT INTO sys_role_menu VALUES (2, 1028);
INSERT INTO sys_role_menu VALUES (2, 1029);
INSERT INTO sys_role_menu VALUES (2, 1030);
INSERT INTO sys_role_menu VALUES (2, 1031);
INSERT INTO sys_role_menu VALUES (2, 1032);
INSERT INTO sys_role_menu VALUES (2, 1033);
INSERT INTO sys_role_menu VALUES (2, 1034);
INSERT INTO sys_role_menu VALUES (2, 1035);
INSERT INTO sys_role_menu VALUES (2, 1036);
INSERT INTO sys_role_menu VALUES (2, 1037);
INSERT INTO sys_role_menu VALUES (2, 1038);
INSERT INTO sys_role_menu VALUES (2, 1039);
INSERT INTO sys_role_menu VALUES (2, 1040);
INSERT INTO sys_role_menu VALUES (2, 1041);
INSERT INTO sys_role_menu VALUES (2, 1042);
INSERT INTO sys_role_menu VALUES (2, 1043);
INSERT INTO sys_role_menu VALUES (2, 1044);
INSERT INTO sys_role_menu VALUES (2, 1045);
INSERT INTO sys_role_menu VALUES (2, 1046);
INSERT INTO sys_role_menu VALUES (2, 1047);
INSERT INTO sys_role_menu VALUES (2, 1048);
INSERT INTO sys_role_menu VALUES (2, 1049);
INSERT INTO sys_role_menu VALUES (2, 1050);
INSERT INTO sys_role_menu VALUES (2, 1051);
INSERT INTO sys_role_menu VALUES (2, 1052);
INSERT INTO sys_role_menu VALUES (2, 1053);
INSERT INTO sys_role_menu VALUES (2, 1054);
INSERT INTO sys_role_menu VALUES (2, 1055);
INSERT INTO sys_role_menu VALUES (2, 1056);
INSERT INTO sys_role_menu VALUES (2, 1057);
INSERT INTO sys_role_menu VALUES (2, 1058);
INSERT INTO sys_role_menu VALUES (2, 1059);
INSERT INTO sys_role_menu VALUES (2, 1060);

-- ----------------------------
-- 8、角色和部门关联表  角色1-N部门
-- ----------------------------
DROP TABLE IF EXISTS sys_role_dept;
CREATE TABLE sys_role_dept (
  role_id   INTEGER NOT NULL,
  dept_id   INTEGER NOT NULL,
  PRIMARY KEY(role_id, dept_id)
);

INSERT INTO sys_role_dept VALUES (2, 100);
INSERT INTO sys_role_dept VALUES (2, 101);
INSERT INTO sys_role_dept VALUES (2, 105);

-- ----------------------------
-- 9、用户与岗位关联表  用户1-N岗位
-- ----------------------------
DROP TABLE IF EXISTS sys_user_post;
CREATE TABLE sys_user_post (
  user_id   INTEGER NOT NULL,
  post_id   INTEGER NOT NULL,
  PRIMARY KEY (user_id, post_id)
);

INSERT INTO sys_user_post VALUES (1, 1);

-- ----------------------------
-- 10、操作日志记录
-- ----------------------------
DROP TABLE IF EXISTS sys_oper_log;
CREATE TABLE sys_oper_log (
  oper_id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title             TEXT        DEFAULT '',
  business_type     INTEGER     DEFAULT 0,
  method            TEXT        DEFAULT '',
  request_method    TEXT        DEFAULT '',
  operator_type     INTEGER     DEFAULT 0,
  oper_name         TEXT        DEFAULT '',
  dept_name         TEXT        DEFAULT '',
  oper_url          TEXT        DEFAULT '',
  oper_ip           TEXT        DEFAULT '',
  oper_location     TEXT        DEFAULT '',
  oper_param        TEXT        DEFAULT '',
  json_result       TEXT        DEFAULT '',
  status            INTEGER     DEFAULT 0,
  error_msg         TEXT        DEFAULT '',
  oper_time         TEXT,
  cost_time         INTEGER     DEFAULT 0
);

CREATE INDEX idx_sys_oper_log_bt ON sys_oper_log (business_type);
CREATE INDEX idx_sys_oper_log_s ON sys_oper_log (status);
CREATE INDEX idx_sys_oper_log_ot ON sys_oper_log (oper_time);

-- ----------------------------
-- 11、字典类型表
-- ----------------------------
DROP TABLE IF EXISTS sys_dict_type;
CREATE TABLE sys_dict_type (
  dict_id          INTEGER PRIMARY KEY AUTOINCREMENT,
  dict_name        TEXT        DEFAULT '',
  dict_type        TEXT        DEFAULT '' UNIQUE,
  status           TEXT        DEFAULT '0',
  create_by        TEXT        DEFAULT '',
  create_time      TEXT,
  update_by        TEXT        DEFAULT '',
  update_time      TEXT,
  remark           TEXT        DEFAULT NULL
);

INSERT INTO sys_dict_type VALUES(1,  '用户性别', 'sys_user_sex',        '0', 'admin', datetime('now','localtime'), '', NULL, '用户性别列表');
INSERT INTO sys_dict_type VALUES(2,  '菜单状态', 'sys_show_hide',       '0', 'admin', datetime('now','localtime'), '', NULL, '菜单状态列表');
INSERT INTO sys_dict_type VALUES(3,  '系统开关', 'sys_normal_disable',  '0', 'admin', datetime('now','localtime'), '', NULL, '系统开关列表');
INSERT INTO sys_dict_type VALUES(4,  '任务状态', 'sys_job_status',      '0', 'admin', datetime('now','localtime'), '', NULL, '任务状态列表');
INSERT INTO sys_dict_type VALUES(5,  '任务分组', 'sys_job_group',       '0', 'admin', datetime('now','localtime'), '', NULL, '任务分组列表');
INSERT INTO sys_dict_type VALUES(6,  '系统是否', 'sys_yes_no',          '0', 'admin', datetime('now','localtime'), '', NULL, '系统是否列表');
INSERT INTO sys_dict_type VALUES(7,  '通知类型', 'sys_notice_type',     '0', 'admin', datetime('now','localtime'), '', NULL, '通知类型列表');
INSERT INTO sys_dict_type VALUES(8,  '通知状态', 'sys_notice_status',   '0', 'admin', datetime('now','localtime'), '', NULL, '通知状态列表');
INSERT INTO sys_dict_type VALUES(9,  '操作类型', 'sys_oper_type',       '0', 'admin', datetime('now','localtime'), '', NULL, '操作类型列表');
INSERT INTO sys_dict_type VALUES(10, '系统状态', 'sys_common_status',   '0', 'admin', datetime('now','localtime'), '', NULL, '登录状态列表');


-- ----------------------------
-- 12、字典数据表
-- ----------------------------
DROP TABLE IF EXISTS sys_dict_data;
CREATE TABLE sys_dict_data (
  dict_code        INTEGER PRIMARY KEY AUTOINCREMENT,
  dict_sort        INTEGER     DEFAULT 0,
  dict_label       TEXT        DEFAULT '',
  dict_value       TEXT        DEFAULT '',
  dict_type        TEXT        DEFAULT '',
  css_class        TEXT        DEFAULT NULL,
  list_class       TEXT        DEFAULT NULL,
  is_default       TEXT        DEFAULT 'N',
  status           TEXT        DEFAULT '0',
  create_by        TEXT        DEFAULT '',
  create_time      TEXT,
  update_by        TEXT        DEFAULT '',
  update_time      TEXT,
  remark           TEXT        DEFAULT NULL
);

INSERT INTO sys_dict_data VALUES(1,  1,  '男',       '0',       'sys_user_sex',        '',   '',        'Y', '0', 'admin', datetime('now','localtime'), '', NULL, '性别男');
INSERT INTO sys_dict_data VALUES(2,  2,  '女',       '1',       'sys_user_sex',        '',   '',        'N', '0', 'admin', datetime('now','localtime'), '', NULL, '性别女');
INSERT INTO sys_dict_data VALUES(3,  3,  '未知',     '2',       'sys_user_sex',        '',   '',        'N', '0', 'admin', datetime('now','localtime'), '', NULL, '性别未知');
INSERT INTO sys_dict_data VALUES(4,  1,  '显示',     '0',       'sys_show_hide',       '',   'primary', 'Y', '0', 'admin', datetime('now','localtime'), '', NULL, '显示菜单');
INSERT INTO sys_dict_data VALUES(5,  2,  '隐藏',     '1',       'sys_show_hide',       '',   'danger',  'N', '0', 'admin', datetime('now','localtime'), '', NULL, '隐藏菜单');
INSERT INTO sys_dict_data VALUES(6,  1,  '正常',     '0',       'sys_normal_disable',  '',   'primary', 'Y', '0', 'admin', datetime('now','localtime'), '', NULL, '正常状态');
INSERT INTO sys_dict_data VALUES(7,  2,  '停用',     '1',       'sys_normal_disable',  '',   'danger',  'N', '0', 'admin', datetime('now','localtime'), '', NULL, '停用状态');
INSERT INTO sys_dict_data VALUES(8,  1,  '正常',     '0',       'sys_job_status',      '',   'primary', 'Y', '0', 'admin', datetime('now','localtime'), '', NULL, '正常状态');
INSERT INTO sys_dict_data VALUES(9,  2,  '暂停',     '1',       'sys_job_status',      '',   'danger',  'N', '0', 'admin', datetime('now','localtime'), '', NULL, '停用状态');
INSERT INTO sys_dict_data VALUES(10, 1,  '默认',     'DEFAULT', 'sys_job_group',       '',   '',        'Y', '0', 'admin', datetime('now','localtime'), '', NULL, '默认分组');
INSERT INTO sys_dict_data VALUES(11, 2,  '系统',     'SYSTEM',  'sys_job_group',       '',   '',        'N', '0', 'admin', datetime('now','localtime'), '', NULL, '系统分组');
INSERT INTO sys_dict_data VALUES(12, 1,  '是',       'Y',       'sys_yes_no',          '',   'primary', 'Y', '0', 'admin', datetime('now','localtime'), '', NULL, '系统默认是');
INSERT INTO sys_dict_data VALUES(13, 2,  '否',       'N',       'sys_yes_no',          '',   'danger',  'N', '0', 'admin', datetime('now','localtime'), '', NULL, '系统默认否');
INSERT INTO sys_dict_data VALUES(14, 1,  '通知',     '1',       'sys_notice_type',     '',   'warning', 'Y', '0', 'admin', datetime('now','localtime'), '', NULL, '通知');
INSERT INTO sys_dict_data VALUES(15, 2,  '公告',     '2',       'sys_notice_type',     '',   'success', 'N', '0', 'admin', datetime('now','localtime'), '', NULL, '公告');
INSERT INTO sys_dict_data VALUES(16, 1,  '正常',     '0',       'sys_notice_status',   '',   'primary', 'Y', '0', 'admin', datetime('now','localtime'), '', NULL, '正常状态');
INSERT INTO sys_dict_data VALUES(17, 2,  '关闭',     '1',       'sys_notice_status',   '',   'danger',  'N', '0', 'admin', datetime('now','localtime'), '', NULL, '关闭状态');
INSERT INTO sys_dict_data VALUES(18, 99, '其他',     '0',       'sys_oper_type',       '',   'info',    'N', '0', 'admin', datetime('now','localtime'), '', NULL, '其他操作');
INSERT INTO sys_dict_data VALUES(19, 1,  '新增',     '1',       'sys_oper_type',       '',   'info',    'N', '0', 'admin', datetime('now','localtime'), '', NULL, '新增操作');
INSERT INTO sys_dict_data VALUES(20, 2,  '修改',     '2',       'sys_oper_type',       '',   'info',    'N', '0', 'admin', datetime('now','localtime'), '', NULL, '修改操作');
INSERT INTO sys_dict_data VALUES(21, 3,  '删除',     '3',       'sys_oper_type',       '',   'danger',  'N', '0', 'admin', datetime('now','localtime'), '', NULL, '删除操作');
INSERT INTO sys_dict_data VALUES(22, 4,  '授权',     '4',       'sys_oper_type',       '',   'primary', 'N', '0', 'admin', datetime('now','localtime'), '', NULL, '授权操作');
INSERT INTO sys_dict_data VALUES(23, 5,  '导出',     '5',       'sys_oper_type',       '',   'warning', 'N', '0', 'admin', datetime('now','localtime'), '', NULL, '导出操作');
INSERT INTO sys_dict_data VALUES(24, 6,  '导入',     '6',       'sys_oper_type',       '',   'warning', 'N', '0', 'admin', datetime('now','localtime'), '', NULL, '导入操作');
INSERT INTO sys_dict_data VALUES(25, 7,  '强退',     '7',       'sys_oper_type',       '',   'danger',  'N', '0', 'admin', datetime('now','localtime'), '', NULL, '强退操作');
INSERT INTO sys_dict_data VALUES(26, 8,  '生成代码', '8',       'sys_oper_type',       '',   'warning', 'N', '0', 'admin', datetime('now','localtime'), '', NULL, '生成操作');
INSERT INTO sys_dict_data VALUES(27, 9,  '清空数据', '9',       'sys_oper_type',       '',   'danger',  'N', '0', 'admin', datetime('now','localtime'), '', NULL, '清空操作');
INSERT INTO sys_dict_data VALUES(28, 1,  '成功',     '0',       'sys_common_status',   '',   'primary', 'N', '0', 'admin', datetime('now','localtime'), '', NULL, '正常状态');
INSERT INTO sys_dict_data VALUES(29, 2,  '失败',     '1',       'sys_common_status',   '',   'danger',  'N', '0', 'admin', datetime('now','localtime'), '', NULL, '停用状态');

-- ----------------------------
-- 13、参数配置表
-- ----------------------------
DROP TABLE IF EXISTS sys_config;
CREATE TABLE sys_config (
  config_id         INTEGER PRIMARY KEY AUTOINCREMENT,
  config_name       TEXT        DEFAULT '',
  config_key        TEXT        DEFAULT '',
  config_value      TEXT        DEFAULT '',
  config_type       TEXT        DEFAULT 'N',
  create_by         TEXT        DEFAULT '',
  create_time       TEXT,
  update_by         TEXT        DEFAULT '',
  update_time       TEXT,
  remark            TEXT        DEFAULT NULL
);

INSERT INTO sys_config VALUES(1, '主框架页-默认皮肤样式名称',     'sys.index.skinName',               'skin-blue',     'Y', 'admin', datetime('now','localtime'), '', NULL, '蓝色 skin-blue、绿色 skin-green、紫色 skin-purple、红色 skin-red、黄色 skin-yellow');
INSERT INTO sys_config VALUES(2, '用户管理-账号初始密码',         'sys.user.initPassword',            '123456',        'Y', 'admin', datetime('now','localtime'), '', NULL, '初始化密码 123456');
INSERT INTO sys_config VALUES(3, '主框架页-侧边栏主题',           'sys.index.sideTheme',              'theme-dark',    'Y', 'admin', datetime('now','localtime'), '', NULL, '深色主题theme-dark，浅色主题theme-light');
INSERT INTO sys_config VALUES(4, '账号自助-验证码开关',           'sys.account.captchaEnabled',       'true',          'Y', 'admin', datetime('now','localtime'), '', NULL, '是否开启验证码功能（true开启，false关闭）');
INSERT INTO sys_config VALUES(5, '账号自助-是否开启用户注册功能', 'sys.account.registerUser',         'false',         'Y', 'admin', datetime('now','localtime'), '', NULL, '是否开启注册用户功能（true开启，false关闭）');
INSERT INTO sys_config VALUES(6, '用户登录-黑名单列表',           'sys.login.blackIPList',            '',              'Y', 'admin', datetime('now','localtime'), '', NULL, '设置登录IP黑名单限制，多个匹配项以;分隔，支持匹配（*通配、网段）');
INSERT INTO sys_config VALUES(7, '用户管理-初始密码修改策略',     'sys.account.initPasswordModify',   '1',             'Y', 'admin', datetime('now','localtime'), '', NULL, '0：初始密码修改策略关闭，没有任何提示，1：提醒用户，如果未修改初始密码，则在登录时就会提醒修改密码对话框');
INSERT INTO sys_config VALUES(8, '用户管理-账号密码更新周期',     'sys.account.passwordValidateDays', '0',             'Y', 'admin', datetime('now','localtime'), '', NULL, '密码更新周期（填写数字，数据初始化值为0不限制，若修改必须为大于0小于365的正整数），如果超过这个周期登录系统时，则在登录时就会提醒修改密码对话框');

-- ----------------------------
-- 14、系统访问记录
-- ----------------------------
DROP TABLE IF EXISTS sys_logininfor;
CREATE TABLE sys_logininfor (
  info_id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name      TEXT        DEFAULT '',
  ipaddr         TEXT        DEFAULT '',
  login_location TEXT        DEFAULT '',
  browser        TEXT        DEFAULT '',
  os             TEXT        DEFAULT '',
  status         TEXT        DEFAULT '0',
  msg            TEXT        DEFAULT '',
  login_time     TEXT
);

CREATE INDEX idx_sys_logininfor_s ON sys_logininfor (status);
CREATE INDEX idx_sys_logininfor_lt ON sys_logininfor (login_time);


-- ----------------------------
-- 15、定时任务调度表
-- ----------------------------
DROP TABLE IF EXISTS sys_job;
CREATE TABLE sys_job (
  job_id              INTEGER     NOT NULL,
  job_name            TEXT        DEFAULT '',
  job_group           TEXT        DEFAULT 'DEFAULT',
  invoke_target       TEXT        NOT NULL,
  cron_expression     TEXT        DEFAULT '',
  misfire_policy      TEXT        DEFAULT '3',
  concurrent          TEXT        DEFAULT '1',
  status              TEXT        DEFAULT '0',
  create_by           TEXT        DEFAULT '',
  create_time         TEXT,
  update_by           TEXT        DEFAULT '',
  update_time         TEXT,
  remark              TEXT        DEFAULT '',
  PRIMARY KEY (job_id, job_name, job_group)
);

INSERT INTO sys_job VALUES(1, '系统默认（无参）', 'DEFAULT', 'doudouTask.doudouNoParams',        '0/10 * * * * ?', '3', '1', '1', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_job VALUES(2, '系统默认（有参）', 'DEFAULT', 'doudouTask.doudouParams(''doudou'')',  '0/15 * * * * ?', '3', '1', '1', 'admin', datetime('now','localtime'), '', NULL, '');
INSERT INTO sys_job VALUES(3, '系统默认（多参）', 'DEFAULT', 'doudouTask.doudouMultipleParams(''doudou'', true, 2000L, 316.50D, 100)',  '0/20 * * * * ?', '3', '1', '1', 'admin', datetime('now','localtime'), '', NULL, '');

-- ----------------------------
-- 16、定时任务调度日志表
-- ----------------------------
DROP TABLE IF EXISTS sys_job_log;
CREATE TABLE sys_job_log (
  job_log_id          INTEGER PRIMARY KEY AUTOINCREMENT,
  job_name            TEXT        NOT NULL,
  job_group           TEXT        NOT NULL,
  invoke_target       TEXT        NOT NULL,
  job_message         TEXT,
  status              TEXT        DEFAULT '0',
  exception_info      TEXT        DEFAULT '',
  create_time         TEXT
);

-- ----------------------------
-- 17、通知公告表
-- ----------------------------
DROP TABLE IF EXISTS sys_notice;
CREATE TABLE sys_notice (
  notice_id         INTEGER PRIMARY KEY AUTOINCREMENT,
  notice_title      TEXT        NOT NULL,
  notice_type       TEXT        NOT NULL,
  notice_content    BLOB        DEFAULT NULL,
  status            TEXT        DEFAULT '0',
  create_by         TEXT        DEFAULT '',
  create_time       TEXT,
  update_by         TEXT        DEFAULT '',
  update_time       TEXT,
  remark            TEXT        DEFAULT NULL
);


-- ----------------------------
-- 18、代码生成业务表
-- ----------------------------
DROP TABLE IF EXISTS gen_table;
CREATE TABLE gen_table (
  table_id          INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name        TEXT        DEFAULT '',
  table_comment     TEXT        DEFAULT '',
  sub_table_name    TEXT        DEFAULT NULL,
  sub_table_fk_name TEXT        DEFAULT NULL,
  class_name        TEXT        DEFAULT '',
  tpl_category      TEXT        DEFAULT 'crud',
  tpl_web_type      TEXT        DEFAULT '',
  package_name      TEXT,
  module_name       TEXT,
  business_name     TEXT,
  function_name     TEXT,
  function_author   TEXT,
  gen_type          TEXT        DEFAULT '0',
  gen_path          TEXT        DEFAULT '/',
  options           TEXT,
  create_by         TEXT        DEFAULT '',
  create_time       TEXT,
  update_by         TEXT        DEFAULT '',
  update_time       TEXT,
  remark            TEXT        DEFAULT NULL
);

-- ----------------------------
-- 19、代码生成业务表字段
-- ----------------------------
DROP TABLE IF EXISTS gen_table_column;
CREATE TABLE gen_table_column (
  column_id         INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id          INTEGER,
  column_name       TEXT,
  column_comment    TEXT,
  column_type       TEXT,
  java_type         TEXT,
  java_field        TEXT,
  is_pk             TEXT,
  is_increment      TEXT,
  is_required       TEXT,
  is_insert         TEXT,
  is_edit           TEXT,
  is_list           TEXT,
  is_query          TEXT,
  query_type        TEXT        DEFAULT 'EQ',
  html_type         TEXT,
  dict_type         TEXT        DEFAULT '',
  sort              INTEGER,
  create_by         TEXT        DEFAULT '',
  create_time       TEXT,
  update_by         TEXT        DEFAULT '',
  update_time       TEXT
);


-- ----------------------------
-- 20、定时任务调度表（Quartz）
-- ----------------------------
DROP TABLE IF EXISTS QRTZ_FIRED_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_PAUSED_TRIGGER_GRPS;
DROP TABLE IF EXISTS QRTZ_SCHEDULER_STATE;
DROP TABLE IF EXISTS QRTZ_LOCKS;
DROP TABLE IF EXISTS QRTZ_SIMPLE_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_SIMPROP_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_CRON_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_BLOB_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_JOB_DETAILS;
DROP TABLE IF EXISTS QRTZ_CALENDARS;

-- ----------------------------
-- 1、存储每一个已配置的 jobDetail 的详细信息
-- ----------------------------
CREATE TABLE QRTZ_JOB_DETAILS (
    sched_name           TEXT    NOT NULL,  -- 调度名称
    job_name             TEXT    NOT NULL,  -- 任务名称
    job_group            TEXT    NOT NULL,  -- 任务组名
    description          TEXT    NULL,      -- 相关介绍
    job_class_name       TEXT    NOT NULL,  -- 执行任务类名称
    is_durable           TEXT    NOT NULL,  -- 是否持久化
    is_nonconcurrent     TEXT    NOT NULL,  -- 是否并发
    is_update_data       TEXT    NOT NULL,  -- 是否更新数据
    requests_recovery    TEXT    NOT NULL,  -- 是否接受恢复执行
    job_data             BLOB    NULL,      -- 存放持久化job对象
    PRIMARY KEY (sched_name, job_name, job_group)
);

-- ----------------------------
-- 2、 存储已配置的 Trigger 的信息
-- ----------------------------
CREATE TABLE QRTZ_TRIGGERS (
    sched_name           TEXT        NOT NULL,  -- 调度名称
    trigger_name         TEXT        NOT NULL,  -- 触发器的名字
    trigger_group        TEXT        NOT NULL,  -- 触发器所属组的名字
    job_name             TEXT        NOT NULL,  -- qrtz_job_details表job_name的外键
    job_group            TEXT        NOT NULL,  -- qrtz_job_details表job_group的外键
    description          TEXT        NULL,      -- 相关介绍
    next_fire_time       INTEGER     NULL,      -- 上一次触发时间（毫秒）
    prev_fire_time       INTEGER     NULL,      -- 下一次触发时间（默认为-1表示不触发）
    priority             INTEGER     NULL,      -- 优先级
    trigger_state        TEXT        NOT NULL,  -- 触发器状态
    trigger_type         TEXT        NOT NULL,  -- 触发器的类型
    start_time           INTEGER     NOT NULL,  -- 开始时间
    end_time             INTEGER     NULL,      -- 结束时间
    calendar_name        TEXT        NULL,      -- 日程表名称
    misfire_instr        INTEGER     NULL,      -- 补偿执行的策略
    job_data             BLOB        NULL,      -- 存放持久化job对象
    PRIMARY KEY (sched_name, trigger_name, trigger_group),
    FOREIGN KEY (sched_name, job_name, job_group) REFERENCES QRTZ_JOB_DETAILS(sched_name, job_name, job_group)
);

-- ----------------------------
-- 3、 存储简单的 Trigger，包括重复次数，间隔，以及已触发的次数
-- ----------------------------
CREATE TABLE QRTZ_SIMPLE_TRIGGERS (
    sched_name           TEXT        NOT NULL,  -- 调度名称
    trigger_name         TEXT        NOT NULL,  -- qrtz_triggers表trigger_name的外键
    trigger_group        TEXT        NOT NULL,  -- qrtz_triggers表trigger_group的外键
    repeat_count         INTEGER     NOT NULL,  -- 重复的次数统计
    repeat_interval      INTEGER     NOT NULL,  -- 重复的间隔时间
    times_triggered      INTEGER     NOT NULL,  -- 已经触发的次数
    PRIMARY KEY (sched_name, trigger_name, trigger_group),
    FOREIGN KEY (sched_name, trigger_name, trigger_group) REFERENCES QRTZ_TRIGGERS(sched_name, trigger_name, trigger_group)
);

-- ----------------------------
-- 4、 存储 Cron Trigger，包括 Cron 表达式和时区信息
-- ---------------------------- 
CREATE TABLE QRTZ_CRON_TRIGGERS (
    sched_name           TEXT    NOT NULL,  -- 调度名称
    trigger_name         TEXT    NOT NULL,  -- qrtz_triggers表trigger_name的外键
    trigger_group        TEXT    NOT NULL,  -- qrtz_triggers表trigger_group的外键
    cron_expression      TEXT    NOT NULL,  -- cron表达式
    time_zone_id         TEXT,              -- 时区
    PRIMARY KEY (sched_name, trigger_name, trigger_group),
    FOREIGN KEY (sched_name, trigger_name, trigger_group) REFERENCES QRTZ_TRIGGERS(sched_name, trigger_name, trigger_group)
);

-- ----------------------------
-- 5、 Trigger 作为 Blob 类型存储(用于 Quartz 用户用 JDBC 创建他们自己定制的 Trigger 类型，JobStore 并不知道如何存储实例的时候)
-- ---------------------------- 
CREATE TABLE QRTZ_BLOB_TRIGGERS (
    sched_name           TEXT    NOT NULL,  -- 调度名称
    trigger_name         TEXT    NOT NULL,  -- qrtz_triggers表trigger_name的外键
    trigger_group        TEXT    NOT NULL,  -- qrtz_triggers表trigger_group的外键
    blob_data            BLOB    NULL,      -- 存放持久化Trigger对象
    PRIMARY KEY (sched_name, trigger_name, trigger_group),
    FOREIGN KEY (sched_name, trigger_name, trigger_group) REFERENCES QRTZ_TRIGGERS(sched_name, trigger_name, trigger_group)
);

-- ----------------------------
-- 6、 以 Blob 类型存储存放日历信息， quartz可配置一个日历来指定一个时间范围
-- ---------------------------- 
CREATE TABLE QRTZ_CALENDARS (
    sched_name           TEXT    NOT NULL,  -- 调度名称
    calendar_name        TEXT    NOT NULL,  -- 日历名称
    calendar             BLOB    NOT NULL,  -- 存放持久化calendar对象
    PRIMARY KEY (sched_name, calendar_name)
);

-- ----------------------------
-- 7、 存储已暂停的 Trigger 组的信息
-- ---------------------------- 
CREATE TABLE QRTZ_PAUSED_TRIGGER_GRPS (
    sched_name           TEXT    NOT NULL,  -- 调度名称
    trigger_group        TEXT    NOT NULL,  -- qrtz_triggers表trigger_group的外键
    PRIMARY KEY (sched_name, trigger_group)
);

-- ----------------------------
-- 8、 存储与已触发的 Trigger 相关的状态信息，以及相联 Job 的执行信息
-- ---------------------------- 
CREATE TABLE QRTZ_FIRED_TRIGGERS (
    sched_name           TEXT        NOT NULL,  -- 调度名称
    entry_id             TEXT        NOT NULL,  -- 调度器实例id
    trigger_name         TEXT        NOT NULL,  -- qrtz_triggers表trigger_name的外键
    trigger_group        TEXT        NOT NULL,  -- qrtz_triggers表trigger_group的外键
    instance_name        TEXT        NOT NULL,  -- 调度器实例名
    fired_time           INTEGER     NOT NULL,  -- 触发的时间
    sched_time           INTEGER     NOT NULL,  -- 定时器制定的时间
    priority             INTEGER     NOT NULL,  -- 优先级
    state                TEXT        NOT NULL,  -- 状态
    job_name             TEXT        NULL,      -- 任务名称
    job_group            TEXT        NULL,      -- 任务组名
    is_nonconcurrent     TEXT        NULL,      -- 是否并发
    requests_recovery    TEXT        NULL,      -- 是否接受恢复执行
    PRIMARY KEY (sched_name, entry_id)
);

-- ----------------------------
-- 9、 存储少量的有关 Scheduler 的状态信息，假如是用于集群中，可以看到其他的 Scheduler 实例
-- ---------------------------- 
CREATE TABLE QRTZ_SCHEDULER_STATE (
    sched_name           TEXT        NOT NULL,  -- 调度名称
    instance_name        TEXT        NOT NULL,  -- 实例名称
    last_checkin_time    INTEGER     NOT NULL,  -- 上次检查时间
    checkin_interval     INTEGER     NOT NULL,  -- 检查间隔时间
    PRIMARY KEY (sched_name, instance_name)
);

-- ----------------------------
-- 10、 存储程序的悲观锁的信息(假如使用了悲观锁)
-- ---------------------------- 
CREATE TABLE QRTZ_LOCKS (
    sched_name           TEXT    NOT NULL,  -- 调度名称
    lock_name            TEXT    NOT NULL,  -- 悲观锁名称
    PRIMARY KEY (sched_name, lock_name)
);

-- ----------------------------
-- 11、 Quartz集群实现同步机制的行锁表
-- ---------------------------- 
CREATE TABLE QRTZ_SIMPROP_TRIGGERS (
    sched_name           TEXT    NOT NULL,  -- 调度名称
    trigger_name         TEXT    NOT NULL,  -- qrtz_triggers表trigger_name的外键
    trigger_group        TEXT    NOT NULL,  -- qrtz_triggers表trigger_group的外键
    str_prop_1           TEXT    NULL,      -- String类型的trigger的第一个参数
    str_prop_2           TEXT    NULL,      -- String类型的trigger的第二个参数
    str_prop_3           TEXT    NULL,      -- String类型的trigger的第三个参数
    int_prop_1           INTEGER NULL,      -- int类型的trigger的第一个参数
    int_prop_2           INTEGER NULL,      -- int类型的trigger的第二个参数
    long_prop_1          INTEGER NULL,      -- long类型的trigger的第一个参数
    long_prop_2          INTEGER NULL,      -- long类型的trigger的第二个参数
    dec_prop_1           REAL    NULL,      -- decimal类型的trigger的第一个参数
    dec_prop_2           REAL    NULL,      -- decimal类型的trigger的第二个参数
    bool_prop_1          TEXT    NULL,      -- Boolean类型的trigger的第一个参数
    bool_prop_2          TEXT    NULL,      -- Boolean类型的trigger的第二个参数
    PRIMARY KEY (sched_name, trigger_name, trigger_group),
    FOREIGN KEY (sched_name, trigger_name, trigger_group) REFERENCES QRTZ_TRIGGERS(sched_name, trigger_name, trigger_group)
);