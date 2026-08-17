-- ----------------------------
-- 1、部门表
-- ----------------------------
DROP TABLE IF EXISTS sys_dept;
CREATE TABLE sys_dept (
  dept_id           BIGSERIAL       NOT NULL,
  parent_id         bigint          DEFAULT 0,
  ancestors         varchar(50)     DEFAULT '',
  dept_name         varchar(30)     DEFAULT '',
  order_num         integer         DEFAULT 0,
  leader            varchar(20)     DEFAULT NULL,
  phone             varchar(11)     DEFAULT NULL,
  email             varchar(50)     DEFAULT NULL,
  status            char(1)         DEFAULT '0',
  del_flag          char(1)         DEFAULT '0',
  create_by         varchar(64)     DEFAULT '',
  create_time       timestamp,
  update_by         varchar(64)     DEFAULT '',
  update_time       timestamp,
  PRIMARY KEY (dept_id)
);

COMMENT ON TABLE sys_dept IS '部门表';
COMMENT ON COLUMN sys_dept.dept_id IS '部门id';
COMMENT ON COLUMN sys_dept.parent_id IS '父部门id';
COMMENT ON COLUMN sys_dept.ancestors IS '祖级列表';
COMMENT ON COLUMN sys_dept.dept_name IS '部门名称';
COMMENT ON COLUMN sys_dept.order_num IS '显示顺序';
COMMENT ON COLUMN sys_dept.leader IS '负责人';
COMMENT ON COLUMN sys_dept.phone IS '联系电话';
COMMENT ON COLUMN sys_dept.email IS '邮箱';
COMMENT ON COLUMN sys_dept.status IS '部门状态（0正常 1停用）';
COMMENT ON COLUMN sys_dept.del_flag IS '删除标志（0代表存在 2代表删除）';
COMMENT ON COLUMN sys_dept.create_by IS '创建者';
COMMENT ON COLUMN sys_dept.create_time IS '创建时间';
COMMENT ON COLUMN sys_dept.update_by IS '更新者';
COMMENT ON COLUMN sys_dept.update_time IS '更新时间';

-- ----------------------------
-- 初始化-部门表数据
-- ----------------------------
INSERT INTO sys_dept VALUES(100,  0,   '0',          '总公司',   0, '豆豆', '15888888888', 'ry@qq.com', '0', '0', 'admin', CURRENT_TIMESTAMP, '', NULL);
INSERT INTO sys_dept VALUES(101,  100, '0,100',      '下属部门', 1, '豆豆', '15888888888', 'ry@qq.com', '0', '0', 'admin', CURRENT_TIMESTAMP, '', NULL);
SELECT setval('sys_dept_dept_id_seq', 200);


-- ----------------------------
-- 2、用户信息表
-- ----------------------------
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
  user_id           BIGSERIAL       NOT NULL,
  dept_id           bigint          DEFAULT NULL,
  user_name         varchar(30)     NOT NULL,
  nick_name         varchar(30)     NOT NULL,
  user_type         varchar(2)      DEFAULT '00',
  email             varchar(50)     DEFAULT '',
  phonenumber       varchar(11)     DEFAULT '',
  sex               char(1)         DEFAULT '0',
  avatar            varchar(100)    DEFAULT '',
  password          varchar(100)    DEFAULT '',
  status            char(1)         DEFAULT '0',
  del_flag          char(1)         DEFAULT '0',
  login_ip          varchar(128)    DEFAULT '',
  login_date        timestamp,
  pwd_update_date   timestamp,
  create_by         varchar(64)     DEFAULT '',
  create_time       timestamp,
  update_by         varchar(64)     DEFAULT '',
  update_time       timestamp,
  remark            varchar(500)    DEFAULT NULL,
  PRIMARY KEY (user_id)
);

COMMENT ON TABLE sys_user IS '用户信息表';
COMMENT ON COLUMN sys_user.user_id IS '用户ID';
COMMENT ON COLUMN sys_user.dept_id IS '部门ID';
COMMENT ON COLUMN sys_user.user_name IS '用户账号';
COMMENT ON COLUMN sys_user.nick_name IS '用户昵称';
COMMENT ON COLUMN sys_user.user_type IS '用户类型（00系统用户）';
COMMENT ON COLUMN sys_user.email IS '用户邮箱';
COMMENT ON COLUMN sys_user.phonenumber IS '手机号码';
COMMENT ON COLUMN sys_user.sex IS '用户性别（0男 1女 2未知）';
COMMENT ON COLUMN sys_user.avatar IS '头像地址';
COMMENT ON COLUMN sys_user.password IS '密码';
COMMENT ON COLUMN sys_user.status IS '账号状态（0正常 1停用）';
COMMENT ON COLUMN sys_user.del_flag IS '删除标志（0代表存在 2代表删除）';
COMMENT ON COLUMN sys_user.login_ip IS '最后登录IP';
COMMENT ON COLUMN sys_user.login_date IS '最后登录时间';
COMMENT ON COLUMN sys_user.pwd_update_date IS '密码最后更新时间';
COMMENT ON COLUMN sys_user.create_by IS '创建者';
COMMENT ON COLUMN sys_user.create_time IS '创建时间';
COMMENT ON COLUMN sys_user.update_by IS '更新者';
COMMENT ON COLUMN sys_user.update_time IS '更新时间';
COMMENT ON COLUMN sys_user.remark IS '备注';

-- ----------------------------
-- 初始化-用户信息表数据
-- ----------------------------
INSERT INTO sys_user VALUES(1,  103, 'admin', '豆豆', '00', 'undsky@163.com', '15888888888', '1', '', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '0', '0', '127.0.0.1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', CURRENT_TIMESTAMP, '', NULL, '管理员');
SELECT setval('sys_user_user_id_seq', 100);


-- ----------------------------
-- 3、岗位信息表
-- ----------------------------
DROP TABLE IF EXISTS sys_post;
CREATE TABLE sys_post (
  post_id       BIGSERIAL       NOT NULL,
  post_code     varchar(64)     NOT NULL,
  post_name     varchar(50)     NOT NULL,
  post_sort     integer         NOT NULL,
  status        char(1)         NOT NULL,
  create_by     varchar(64)     DEFAULT '',
  create_time   timestamp,
  update_by     varchar(64)     DEFAULT '',
  update_time   timestamp,
  remark        varchar(500)    DEFAULT NULL,
  PRIMARY KEY (post_id)
);

COMMENT ON TABLE sys_post IS '岗位信息表';
COMMENT ON COLUMN sys_post.post_id IS '岗位ID';
COMMENT ON COLUMN sys_post.post_code IS '岗位编码';
COMMENT ON COLUMN sys_post.post_name IS '岗位名称';
COMMENT ON COLUMN sys_post.post_sort IS '显示顺序';
COMMENT ON COLUMN sys_post.status IS '状态（0正常 1停用）';
COMMENT ON COLUMN sys_post.create_by IS '创建者';
COMMENT ON COLUMN sys_post.create_time IS '创建时间';
COMMENT ON COLUMN sys_post.update_by IS '更新者';
COMMENT ON COLUMN sys_post.update_time IS '更新时间';
COMMENT ON COLUMN sys_post.remark IS '备注';

-- ----------------------------
-- 初始化-岗位信息表数据
-- ----------------------------
INSERT INTO sys_post VALUES(1, 'ceo',  '董事长',    1, '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_post VALUES(2, 'se',   '项目经理',  2, '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_post VALUES(3, 'hr',   '人力资源',  3, '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_post VALUES(4, 'user', '普通员工',  4, '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '');


-- ----------------------------
-- 4、角色信息表
-- ----------------------------
DROP TABLE IF EXISTS sys_role;
CREATE TABLE sys_role (
  role_id              BIGSERIAL       NOT NULL,
  role_name            varchar(30)     NOT NULL,
  role_key             varchar(100)    NOT NULL,
  role_sort            integer         NOT NULL,
  data_scope           char(1)         DEFAULT '1',
  menu_check_strictly  smallint        DEFAULT 1,
  dept_check_strictly  smallint        DEFAULT 1,
  status               char(1)         NOT NULL,
  del_flag             char(1)         DEFAULT '0',
  create_by            varchar(64)     DEFAULT '',
  create_time          timestamp,
  update_by            varchar(64)     DEFAULT '',
  update_time          timestamp,
  remark               varchar(500)    DEFAULT NULL,
  PRIMARY KEY (role_id)
);

COMMENT ON TABLE sys_role IS '角色信息表';
COMMENT ON COLUMN sys_role.role_id IS '角色ID';
COMMENT ON COLUMN sys_role.role_name IS '角色名称';
COMMENT ON COLUMN sys_role.role_key IS '角色权限字符串';
COMMENT ON COLUMN sys_role.role_sort IS '显示顺序';
COMMENT ON COLUMN sys_role.data_scope IS '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限）';
COMMENT ON COLUMN sys_role.menu_check_strictly IS '菜单树选择项是否关联显示';
COMMENT ON COLUMN sys_role.dept_check_strictly IS '部门树选择项是否关联显示';
COMMENT ON COLUMN sys_role.status IS '角色状态（0正常 1停用）';
COMMENT ON COLUMN sys_role.del_flag IS '删除标志（0代表存在 2代表删除）';
COMMENT ON COLUMN sys_role.create_by IS '创建者';
COMMENT ON COLUMN sys_role.create_time IS '创建时间';
COMMENT ON COLUMN sys_role.update_by IS '更新者';
COMMENT ON COLUMN sys_role.update_time IS '更新时间';
COMMENT ON COLUMN sys_role.remark IS '备注';

-- ----------------------------
-- 初始化-角色信息表数据
-- ----------------------------
INSERT INTO sys_role VALUES(1, '超级管理员',  'admin',  1, 1, 1, 1, '0', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '超级管理员');
INSERT INTO sys_role VALUES(2, '普通角色',    'common', 2, 2, 1, 1, '0', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '普通角色');
SELECT setval('sys_role_role_id_seq', 100);


-- ----------------------------
-- 5、菜单权限表
-- ----------------------------
DROP TABLE IF EXISTS sys_menu;
CREATE TABLE sys_menu (
  menu_id           BIGSERIAL       NOT NULL,
  menu_name         varchar(50)     NOT NULL,
  parent_id         bigint          DEFAULT 0,
  order_num         integer         DEFAULT 0,
  path              varchar(200)    DEFAULT '',
  component         varchar(255)    DEFAULT NULL,
  query             varchar(255)    DEFAULT NULL,
  route_name        varchar(50)     DEFAULT '',
  is_frame          integer         DEFAULT 1,
  is_cache          integer         DEFAULT 0,
  menu_type         char(1)         DEFAULT '',
  visible           char(1)         DEFAULT '0',
  status            char(1)         DEFAULT '0',
  perms             varchar(100)    DEFAULT NULL,
  icon              varchar(100)    DEFAULT '#',
  create_by         varchar(64)     DEFAULT '',
  create_time       timestamp,
  update_by         varchar(64)     DEFAULT '',
  update_time       timestamp,
  remark            varchar(500)    DEFAULT '',
  PRIMARY KEY (menu_id)
);

COMMENT ON TABLE sys_menu IS '菜单权限表';
COMMENT ON COLUMN sys_menu.menu_id IS '菜单ID';
COMMENT ON COLUMN sys_menu.menu_name IS '菜单名称';
COMMENT ON COLUMN sys_menu.parent_id IS '父菜单ID';
COMMENT ON COLUMN sys_menu.order_num IS '显示顺序';
COMMENT ON COLUMN sys_menu.path IS '路由地址';
COMMENT ON COLUMN sys_menu.component IS '组件路径';
COMMENT ON COLUMN sys_menu.query IS '路由参数';
COMMENT ON COLUMN sys_menu.route_name IS '路由名称';
COMMENT ON COLUMN sys_menu.is_frame IS '是否为外链（0是 1否）';
COMMENT ON COLUMN sys_menu.is_cache IS '是否缓存（0缓存 1不缓存）';
COMMENT ON COLUMN sys_menu.menu_type IS '菜单类型（M目录 C菜单 F按钮）';
COMMENT ON COLUMN sys_menu.visible IS '菜单状态（0显示 1隐藏）';
COMMENT ON COLUMN sys_menu.status IS '菜单状态（0正常 1停用）';
COMMENT ON COLUMN sys_menu.perms IS '权限标识';
COMMENT ON COLUMN sys_menu.icon IS '菜单图标';
COMMENT ON COLUMN sys_menu.create_by IS '创建者';
COMMENT ON COLUMN sys_menu.create_time IS '创建时间';
COMMENT ON COLUMN sys_menu.update_by IS '更新者';
COMMENT ON COLUMN sys_menu.update_time IS '更新时间';
COMMENT ON COLUMN sys_menu.remark IS '备注';

-- ----------------------------
-- 初始化-菜单信息表数据
-- ----------------------------
-- 一级菜单
INSERT INTO sys_menu VALUES(1, '系统管理', 0, 1, 'system',           NULL, '', '', 1, 0, 'M', '0', '0', '', 'system',   'admin', CURRENT_TIMESTAMP, '', NULL, '系统管理目录');
INSERT INTO sys_menu VALUES(2, '系统监控', 0, 2, 'monitor',          NULL, '', '', 1, 0, 'M', '0', '0', '', 'monitor',  'admin', CURRENT_TIMESTAMP, '', NULL, '系统监控目录');
INSERT INTO sys_menu VALUES(3, '系统工具', 0, 3, 'tool',             NULL, '', '', 1, 0, 'M', '0', '0', '', 'tool',     'admin', CURRENT_TIMESTAMP, '', NULL, '系统工具目录');
-- 二级菜单
INSERT INTO sys_menu VALUES(100,  '用户管理', 1,   1, 'user',       'system/user/index',        '', '', 1, 0, 'C', '0', '0', 'system:user:list',        'user',          'admin', CURRENT_TIMESTAMP, '', NULL, '用户管理菜单');
INSERT INTO sys_menu VALUES(101,  '角色管理', 1,   2, 'role',       'system/role/index',        '', '', 1, 0, 'C', '0', '0', 'system:role:list',        'peoples',       'admin', CURRENT_TIMESTAMP, '', NULL, '角色管理菜单');
INSERT INTO sys_menu VALUES(102,  '菜单管理', 1,   3, 'menu',       'system/menu/index',        '', '', 1, 0, 'C', '0', '0', 'system:menu:list',        'tree-table',    'admin', CURRENT_TIMESTAMP, '', NULL, '菜单管理菜单');
INSERT INTO sys_menu VALUES(103,  '部门管理', 1,   4, 'dept',       'system/dept/index',        '', '', 1, 0, 'C', '0', '0', 'system:dept:list',        'tree',          'admin', CURRENT_TIMESTAMP, '', NULL, '部门管理菜单');
INSERT INTO sys_menu VALUES(104,  '岗位管理', 1,   5, 'post',       'system/post/index',        '', '', 1, 0, 'C', '0', '0', 'system:post:list',        'post',          'admin', CURRENT_TIMESTAMP, '', NULL, '岗位管理菜单');
INSERT INTO sys_menu VALUES(105,  '字典管理', 1,   6, 'dict',       'system/dict/index',        '', '', 1, 0, 'C', '0', '0', 'system:dict:list',        'dict',          'admin', CURRENT_TIMESTAMP, '', NULL, '字典管理菜单');
INSERT INTO sys_menu VALUES(106,  '参数设置', 1,   7, 'config',     'system/config/index',      '', '', 1, 0, 'C', '0', '0', 'system:config:list',      'edit',          'admin', CURRENT_TIMESTAMP, '', NULL, '参数设置菜单');
INSERT INTO sys_menu VALUES(107,  '通知公告', 1,   8, 'notice',     'system/notice/index',      '', '', 1, 0, 'C', '0', '0', 'system:notice:list',      'message',       'admin', CURRENT_TIMESTAMP, '', NULL, '通知公告菜单');
INSERT INTO sys_menu VALUES(108,  '日志管理', 1,   9, 'log',        '',                         '', '', 1, 0, 'M', '0', '0', '',                        'log',           'admin', CURRENT_TIMESTAMP, '', NULL, '日志管理菜单');
INSERT INTO sys_menu VALUES(109,  '在线用户', 2,   1, 'online',     'monitor/online/index',     '', '', 1, 0, 'C', '0', '0', 'monitor:online:list',     'online',        'admin', CURRENT_TIMESTAMP, '', NULL, '在线用户菜单');
INSERT INTO sys_menu VALUES(110,  '定时任务', 2,   2, 'job',        'monitor/job/index',        '', '', 1, 0, 'C', '0', '0', 'monitor:job:list',        'job',           'admin', CURRENT_TIMESTAMP, '', NULL, '定时任务菜单');
INSERT INTO sys_menu VALUES(111,  '数据监控', 2,   3, 'druid',      'monitor/druid/index',      '', '', 1, 0, 'C', '0', '0', 'monitor:druid:list',      'druid',         'admin', CURRENT_TIMESTAMP, '', NULL, '数据监控菜单');
INSERT INTO sys_menu VALUES(112,  '服务监控', 2,   4, 'server',     'monitor/server/index',     '', '', 1, 0, 'C', '0', '0', 'monitor:server:list',     'server',        'admin', CURRENT_TIMESTAMP, '', NULL, '服务监控菜单');
INSERT INTO sys_menu VALUES(113,  '缓存监控', 2,   5, 'cache',      'monitor/cache/index',      '', '', 1, 0, 'C', '0', '0', 'monitor:cache:list',      'redis',         'admin', CURRENT_TIMESTAMP, '', NULL, '缓存监控菜单');
INSERT INTO sys_menu VALUES(114,  '缓存列表', 2,   6, 'cacheList',  'monitor/cache/list',       '', '', 1, 0, 'C', '0', '0', 'monitor:cache:list',      'redis-list',    'admin', CURRENT_TIMESTAMP, '', NULL, '缓存列表菜单');
INSERT INTO sys_menu VALUES(115,  '表单构建', 3,   1, 'build',      'tool/build/index',         '', '', 1, 0, 'C', '0', '0', 'tool:build:list',         'build',         'admin', CURRENT_TIMESTAMP, '', NULL, '表单构建菜单');
INSERT INTO sys_menu VALUES(116,  '代码生成', 3,   2, 'gen',        'tool/gen/index',           '', '', 1, 0, 'C', '0', '0', 'tool:gen:list',           'code',          'admin', CURRENT_TIMESTAMP, '', NULL, '代码生成菜单');
INSERT INTO sys_menu VALUES(117,  '系统接口', 3,   3, 'swagger',    'tool/swagger/index',       '', '', 1, 0, 'C', '0', '0', 'tool:swagger:list',       'swagger',       'admin', CURRENT_TIMESTAMP, '', NULL, '系统接口菜单');
-- 三级菜单
INSERT INTO sys_menu VALUES(500,  '操作日志', 108, 1, 'operlog',    'monitor/operlog/index',    '', '', 1, 0, 'C', '0', '0', 'monitor:operlog:list',    'form',          'admin', CURRENT_TIMESTAMP, '', NULL, '操作日志菜单');
INSERT INTO sys_menu VALUES(501,  '登录日志', 108, 2, 'logininfor', 'monitor/logininfor/index', '', '', 1, 0, 'C', '0', '0', 'monitor:logininfor:list', 'logininfor',    'admin', CURRENT_TIMESTAMP, '', NULL, '登录日志菜单');
-- 用户管理按钮
INSERT INTO sys_menu VALUES(1000, '用户查询', 100, 1,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:query',          '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1001, '用户新增', 100, 2,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:add',            '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1002, '用户修改', 100, 3,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:edit',           '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1003, '用户删除', 100, 4,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:remove',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1004, '用户导出', 100, 5,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:export',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1005, '用户导入', 100, 6,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:import',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1006, '重置密码', 100, 7,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:resetPwd',       '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
-- 角色管理按钮
INSERT INTO sys_menu VALUES(1007, '角色查询', 101, 1,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:query',          '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1008, '角色新增', 101, 2,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:add',            '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1009, '角色修改', 101, 3,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:edit',           '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1010, '角色删除', 101, 4,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:remove',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1011, '角色导出', 101, 5,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:export',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
-- 菜单管理按钮
INSERT INTO sys_menu VALUES(1012, '菜单查询', 102, 1,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:query',          '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1013, '菜单新增', 102, 2,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:add',            '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1014, '菜单修改', 102, 3,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:edit',           '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1015, '菜单删除', 102, 4,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:remove',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
-- 部门管理按钮
INSERT INTO sys_menu VALUES(1016, '部门查询', 103, 1,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:query',          '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1017, '部门新增', 103, 2,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:add',            '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1018, '部门修改', 103, 3,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:edit',           '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1019, '部门删除', 103, 4,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:remove',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
-- 岗位管理按钮
INSERT INTO sys_menu VALUES(1020, '岗位查询', 104, 1,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:query',          '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1021, '岗位新增', 104, 2,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:add',            '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1022, '岗位修改', 104, 3,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:edit',           '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1023, '岗位删除', 104, 4,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:remove',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1024, '岗位导出', 104, 5,  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:export',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
-- 字典管理按钮
INSERT INTO sys_menu VALUES(1025, '字典查询', 105, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:query',          '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1026, '字典新增', 105, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:add',            '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1027, '字典修改', 105, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:edit',           '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1028, '字典删除', 105, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:remove',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1029, '字典导出', 105, 5, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:export',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
-- 参数设置按钮
INSERT INTO sys_menu VALUES(1030, '参数查询', 106, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:query',        '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1031, '参数新增', 106, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:add',          '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1032, '参数修改', 106, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:edit',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1033, '参数删除', 106, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:remove',       '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1034, '参数导出', 106, 5, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:export',       '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
-- 通知公告按钮
INSERT INTO sys_menu VALUES(1035, '公告查询', 107, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:query',        '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1036, '公告新增', 107, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:add',          '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1037, '公告修改', 107, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:edit',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1038, '公告删除', 107, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:remove',       '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
-- 操作日志按钮
INSERT INTO sys_menu VALUES(1039, '操作查询', 500, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:operlog:query',      '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1040, '操作删除', 500, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:operlog:remove',     '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1041, '日志导出', 500, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:operlog:export',     '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
-- 登录日志按钮
INSERT INTO sys_menu VALUES(1042, '登录查询', 501, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:query',   '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1043, '登录删除', 501, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:remove',  '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1044, '日志导出', 501, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:export',  '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1045, '账户解锁', 501, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:unlock',  '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
-- 在线用户按钮
INSERT INTO sys_menu VALUES(1046, '在线查询', 109, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:online:query',       '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1047, '批量强退', 109, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:online:batchLogout', '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1048, '单条强退', 109, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:online:forceLogout', '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
-- 定时任务按钮
INSERT INTO sys_menu VALUES(1049, '任务查询', 110, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:query',          '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1050, '任务新增', 110, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:add',            '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1051, '任务修改', 110, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:edit',           '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1052, '任务删除', 110, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:remove',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1053, '状态修改', 110, 5, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:changeStatus',   '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1054, '任务导出', 110, 6, '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:export',         '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
-- 代码生成按钮
INSERT INTO sys_menu VALUES(1055, '生成查询', 116, 1, '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:query',             '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1056, '生成修改', 116, 2, '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:edit',              '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1057, '生成删除', 116, 3, '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:remove',            '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1058, '导入代码', 116, 4, '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:import',            '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1059, '预览代码', 116, 5, '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:preview',           '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_menu VALUES(1060, '生成代码', 116, 6, '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:code',              '#', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
SELECT setval('sys_menu_menu_id_seq', 2000);


-- ----------------------------
-- 6、用户和角色关联表  用户N-1角色
-- ----------------------------
DROP TABLE IF EXISTS sys_user_role;
CREATE TABLE sys_user_role (
  user_id   bigint NOT NULL,
  role_id   bigint NOT NULL,
  PRIMARY KEY(user_id, role_id)
);

COMMENT ON TABLE sys_user_role IS '用户和角色关联表';
COMMENT ON COLUMN sys_user_role.user_id IS '用户ID';
COMMENT ON COLUMN sys_user_role.role_id IS '角色ID';

-- ----------------------------
-- 初始化-用户和角色关联表数据
-- ----------------------------
INSERT INTO sys_user_role VALUES (1, 1);


-- ----------------------------
-- 7、角色和菜单关联表  角色1-N菜单
-- ----------------------------
DROP TABLE IF EXISTS sys_role_menu;
CREATE TABLE sys_role_menu (
  role_id   bigint NOT NULL,
  menu_id   bigint NOT NULL,
  PRIMARY KEY(role_id, menu_id)
);

COMMENT ON TABLE sys_role_menu IS '角色和菜单关联表';
COMMENT ON COLUMN sys_role_menu.role_id IS '角色ID';
COMMENT ON COLUMN sys_role_menu.menu_id IS '菜单ID';

-- ----------------------------
-- 初始化-角色和菜单关联表数据
-- ----------------------------
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
  role_id   bigint NOT NULL,
  dept_id   bigint NOT NULL,
  PRIMARY KEY(role_id, dept_id)
);

COMMENT ON TABLE sys_role_dept IS '角色和部门关联表';
COMMENT ON COLUMN sys_role_dept.role_id IS '角色ID';
COMMENT ON COLUMN sys_role_dept.dept_id IS '部门ID';

-- ----------------------------
-- 初始化-角色和部门关联表数据
-- ----------------------------
INSERT INTO sys_role_dept VALUES (2, 100);
INSERT INTO sys_role_dept VALUES (2, 101);
INSERT INTO sys_role_dept VALUES (2, 105);


-- ----------------------------
-- 9、用户与岗位关联表  用户1-N岗位
-- ----------------------------
DROP TABLE IF EXISTS sys_user_post;
CREATE TABLE sys_user_post (
  user_id   bigint NOT NULL,
  post_id   bigint NOT NULL,
  PRIMARY KEY (user_id, post_id)
);

COMMENT ON TABLE sys_user_post IS '用户与岗位关联表';
COMMENT ON COLUMN sys_user_post.user_id IS '用户ID';
COMMENT ON COLUMN sys_user_post.post_id IS '岗位ID';

-- ----------------------------
-- 初始化-用户与岗位关联表数据
-- ----------------------------
INSERT INTO sys_user_post VALUES (1, 1);


-- ----------------------------
-- 10、操作日志记录
-- ----------------------------
DROP TABLE IF EXISTS sys_oper_log;
CREATE TABLE sys_oper_log (
  oper_id           BIGSERIAL       NOT NULL,
  title             varchar(50)     DEFAULT '',
  business_type     integer         DEFAULT 0,
  method            varchar(200)    DEFAULT '',
  request_method    varchar(10)     DEFAULT '',
  operator_type     integer         DEFAULT 0,
  oper_name         varchar(50)     DEFAULT '',
  dept_name         varchar(50)     DEFAULT '',
  oper_url          varchar(255)    DEFAULT '',
  oper_ip           varchar(128)    DEFAULT '',
  oper_location     varchar(255)    DEFAULT '',
  oper_param        varchar(2000)   DEFAULT '',
  json_result       varchar(2000)   DEFAULT '',
  status            integer         DEFAULT 0,
  error_msg         varchar(2000)   DEFAULT '',
  oper_time         timestamp,
  cost_time         bigint          DEFAULT 0,
  PRIMARY KEY (oper_id)
);

CREATE INDEX idx_sys_oper_log_bt ON sys_oper_log (business_type);
CREATE INDEX idx_sys_oper_log_s ON sys_oper_log (status);
CREATE INDEX idx_sys_oper_log_ot ON sys_oper_log (oper_time);

COMMENT ON TABLE sys_oper_log IS '操作日志记录';
COMMENT ON COLUMN sys_oper_log.oper_id IS '日志主键';
COMMENT ON COLUMN sys_oper_log.title IS '模块标题';
COMMENT ON COLUMN sys_oper_log.business_type IS '业务类型（0其它 1新增 2修改 3删除）';
COMMENT ON COLUMN sys_oper_log.method IS '方法名称';
COMMENT ON COLUMN sys_oper_log.request_method IS '请求方式';
COMMENT ON COLUMN sys_oper_log.operator_type IS '操作类别（0其它 1后台用户 2手机端用户）';
COMMENT ON COLUMN sys_oper_log.oper_name IS '操作人员';
COMMENT ON COLUMN sys_oper_log.dept_name IS '部门名称';
COMMENT ON COLUMN sys_oper_log.oper_url IS '请求URL';
COMMENT ON COLUMN sys_oper_log.oper_ip IS '主机地址';
COMMENT ON COLUMN sys_oper_log.oper_location IS '操作地点';
COMMENT ON COLUMN sys_oper_log.oper_param IS '请求参数';
COMMENT ON COLUMN sys_oper_log.json_result IS '返回参数';
COMMENT ON COLUMN sys_oper_log.status IS '操作状态（0正常 1异常）';
COMMENT ON COLUMN sys_oper_log.error_msg IS '错误消息';
COMMENT ON COLUMN sys_oper_log.oper_time IS '操作时间';
COMMENT ON COLUMN sys_oper_log.cost_time IS '消耗时间';

SELECT setval('sys_oper_log_oper_id_seq', 100);


-- ----------------------------
-- 11、字典类型表
-- ----------------------------
DROP TABLE IF EXISTS sys_dict_type;
CREATE TABLE sys_dict_type (
  dict_id          BIGSERIAL       NOT NULL,
  dict_name        varchar(100)    DEFAULT '',
  dict_type        varchar(100)    DEFAULT '',
  status           char(1)         DEFAULT '0',
  create_by        varchar(64)     DEFAULT '',
  create_time      timestamp,
  update_by        varchar(64)     DEFAULT '',
  update_time      timestamp,
  remark           varchar(500)    DEFAULT NULL,
  PRIMARY KEY (dict_id),
  UNIQUE (dict_type)
);

COMMENT ON TABLE sys_dict_type IS '字典类型表';
COMMENT ON COLUMN sys_dict_type.dict_id IS '字典主键';
COMMENT ON COLUMN sys_dict_type.dict_name IS '字典名称';
COMMENT ON COLUMN sys_dict_type.dict_type IS '字典类型';
COMMENT ON COLUMN sys_dict_type.status IS '状态（0正常 1停用）';
COMMENT ON COLUMN sys_dict_type.create_by IS '创建者';
COMMENT ON COLUMN sys_dict_type.create_time IS '创建时间';
COMMENT ON COLUMN sys_dict_type.update_by IS '更新者';
COMMENT ON COLUMN sys_dict_type.update_time IS '更新时间';
COMMENT ON COLUMN sys_dict_type.remark IS '备注';

INSERT INTO sys_dict_type VALUES(1,  '用户性别', 'sys_user_sex',        '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '用户性别列表');
INSERT INTO sys_dict_type VALUES(2,  '菜单状态', 'sys_show_hide',       '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '菜单状态列表');
INSERT INTO sys_dict_type VALUES(3,  '系统开关', 'sys_normal_disable',  '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '系统开关列表');
INSERT INTO sys_dict_type VALUES(4,  '任务状态', 'sys_job_status',      '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '任务状态列表');
INSERT INTO sys_dict_type VALUES(5,  '任务分组', 'sys_job_group',       '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '任务分组列表');
INSERT INTO sys_dict_type VALUES(6,  '系统是否', 'sys_yes_no',          '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '系统是否列表');
INSERT INTO sys_dict_type VALUES(7,  '通知类型', 'sys_notice_type',     '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '通知类型列表');
INSERT INTO sys_dict_type VALUES(8,  '通知状态', 'sys_notice_status',   '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '通知状态列表');
INSERT INTO sys_dict_type VALUES(9,  '操作类型', 'sys_oper_type',       '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '操作类型列表');
INSERT INTO sys_dict_type VALUES(10, '系统状态', 'sys_common_status',   '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '登录状态列表');
SELECT setval('sys_dict_type_dict_id_seq', 100);


-- ----------------------------
-- 12、字典数据表
-- ----------------------------
DROP TABLE IF EXISTS sys_dict_data;
CREATE TABLE sys_dict_data (
  dict_code        BIGSERIAL       NOT NULL,
  dict_sort        integer         DEFAULT 0,
  dict_label       varchar(100)    DEFAULT '',
  dict_value       varchar(100)    DEFAULT '',
  dict_type        varchar(100)    DEFAULT '',
  css_class        varchar(100)    DEFAULT NULL,
  list_class       varchar(100)    DEFAULT NULL,
  is_default       char(1)         DEFAULT 'N',
  status           char(1)         DEFAULT '0',
  create_by        varchar(64)     DEFAULT '',
  create_time      timestamp,
  update_by        varchar(64)     DEFAULT '',
  update_time      timestamp,
  remark           varchar(500)    DEFAULT NULL,
  PRIMARY KEY (dict_code)
);

COMMENT ON TABLE sys_dict_data IS '字典数据表';
COMMENT ON COLUMN sys_dict_data.dict_code IS '字典编码';
COMMENT ON COLUMN sys_dict_data.dict_sort IS '字典排序';
COMMENT ON COLUMN sys_dict_data.dict_label IS '字典标签';
COMMENT ON COLUMN sys_dict_data.dict_value IS '字典键值';
COMMENT ON COLUMN sys_dict_data.dict_type IS '字典类型';
COMMENT ON COLUMN sys_dict_data.css_class IS '样式属性（其他样式扩展）';
COMMENT ON COLUMN sys_dict_data.list_class IS '表格回显样式';
COMMENT ON COLUMN sys_dict_data.is_default IS '是否默认（Y是 N否）';
COMMENT ON COLUMN sys_dict_data.status IS '状态（0正常 1停用）';
COMMENT ON COLUMN sys_dict_data.create_by IS '创建者';
COMMENT ON COLUMN sys_dict_data.create_time IS '创建时间';
COMMENT ON COLUMN sys_dict_data.update_by IS '更新者';
COMMENT ON COLUMN sys_dict_data.update_time IS '更新时间';
COMMENT ON COLUMN sys_dict_data.remark IS '备注';

INSERT INTO sys_dict_data VALUES(1,  1,  '男',       '0',       'sys_user_sex',        '',   '',        'Y', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '性别男');
INSERT INTO sys_dict_data VALUES(2,  2,  '女',       '1',       'sys_user_sex',        '',   '',        'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '性别女');
INSERT INTO sys_dict_data VALUES(3,  3,  '未知',     '2',       'sys_user_sex',        '',   '',        'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '性别未知');
INSERT INTO sys_dict_data VALUES(4,  1,  '显示',     '0',       'sys_show_hide',       '',   'primary', 'Y', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '显示菜单');
INSERT INTO sys_dict_data VALUES(5,  2,  '隐藏',     '1',       'sys_show_hide',       '',   'danger',  'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '隐藏菜单');
INSERT INTO sys_dict_data VALUES(6,  1,  '正常',     '0',       'sys_normal_disable',  '',   'primary', 'Y', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '正常状态');
INSERT INTO sys_dict_data VALUES(7,  2,  '停用',     '1',       'sys_normal_disable',  '',   'danger',  'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '停用状态');
INSERT INTO sys_dict_data VALUES(8,  1,  '正常',     '0',       'sys_job_status',      '',   'primary', 'Y', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '正常状态');
INSERT INTO sys_dict_data VALUES(9,  2,  '暂停',     '1',       'sys_job_status',      '',   'danger',  'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '停用状态');
INSERT INTO sys_dict_data VALUES(10, 1,  '默认',     'DEFAULT', 'sys_job_group',       '',   '',        'Y', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '默认分组');
INSERT INTO sys_dict_data VALUES(11, 2,  '系统',     'SYSTEM',  'sys_job_group',       '',   '',        'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '系统分组');
INSERT INTO sys_dict_data VALUES(12, 1,  '是',       'Y',       'sys_yes_no',          '',   'primary', 'Y', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '系统默认是');
INSERT INTO sys_dict_data VALUES(13, 2,  '否',       'N',       'sys_yes_no',          '',   'danger',  'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '系统默认否');
INSERT INTO sys_dict_data VALUES(14, 1,  '通知',     '1',       'sys_notice_type',     '',   'warning', 'Y', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '通知');
INSERT INTO sys_dict_data VALUES(15, 2,  '公告',     '2',       'sys_notice_type',     '',   'success', 'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '公告');
INSERT INTO sys_dict_data VALUES(16, 1,  '正常',     '0',       'sys_notice_status',   '',   'primary', 'Y', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '正常状态');
INSERT INTO sys_dict_data VALUES(17, 2,  '关闭',     '1',       'sys_notice_status',   '',   'danger',  'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '关闭状态');
INSERT INTO sys_dict_data VALUES(18, 99, '其他',     '0',       'sys_oper_type',       '',   'info',    'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '其他操作');
INSERT INTO sys_dict_data VALUES(19, 1,  '新增',     '1',       'sys_oper_type',       '',   'info',    'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '新增操作');
INSERT INTO sys_dict_data VALUES(20, 2,  '修改',     '2',       'sys_oper_type',       '',   'info',    'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '修改操作');
INSERT INTO sys_dict_data VALUES(21, 3,  '删除',     '3',       'sys_oper_type',       '',   'danger',  'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '删除操作');
INSERT INTO sys_dict_data VALUES(22, 4,  '授权',     '4',       'sys_oper_type',       '',   'primary', 'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '授权操作');
INSERT INTO sys_dict_data VALUES(23, 5,  '导出',     '5',       'sys_oper_type',       '',   'warning', 'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '导出操作');
INSERT INTO sys_dict_data VALUES(24, 6,  '导入',     '6',       'sys_oper_type',       '',   'warning', 'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '导入操作');
INSERT INTO sys_dict_data VALUES(25, 7,  '强退',     '7',       'sys_oper_type',       '',   'danger',  'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '强退操作');
INSERT INTO sys_dict_data VALUES(26, 8,  '生成代码', '8',       'sys_oper_type',       '',   'warning', 'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '生成操作');
INSERT INTO sys_dict_data VALUES(27, 9,  '清空数据', '9',       'sys_oper_type',       '',   'danger',  'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '清空操作');
INSERT INTO sys_dict_data VALUES(28, 1,  '成功',     '0',       'sys_common_status',   '',   'primary', 'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '正常状态');
INSERT INTO sys_dict_data VALUES(29, 2,  '失败',     '1',       'sys_common_status',   '',   'danger',  'N', '0', 'admin', CURRENT_TIMESTAMP, '', NULL, '停用状态');
SELECT setval('sys_dict_data_dict_code_seq', 100);


-- ----------------------------
-- 13、参数配置表
-- ----------------------------
DROP TABLE IF EXISTS sys_config;
CREATE TABLE sys_config (
  config_id         SERIAL          NOT NULL,
  config_name       varchar(100)    DEFAULT '',
  config_key        varchar(100)    DEFAULT '',
  config_value      varchar(500)    DEFAULT '',
  config_type       char(1)         DEFAULT 'N',
  create_by         varchar(64)     DEFAULT '',
  create_time       timestamp,
  update_by         varchar(64)     DEFAULT '',
  update_time       timestamp,
  remark            varchar(500)    DEFAULT NULL,
  PRIMARY KEY (config_id)
);

COMMENT ON TABLE sys_config IS '参数配置表';
COMMENT ON COLUMN sys_config.config_id IS '参数主键';
COMMENT ON COLUMN sys_config.config_name IS '参数名称';
COMMENT ON COLUMN sys_config.config_key IS '参数键名';
COMMENT ON COLUMN sys_config.config_value IS '参数键值';
COMMENT ON COLUMN sys_config.config_type IS '系统内置（Y是 N否）';
COMMENT ON COLUMN sys_config.create_by IS '创建者';
COMMENT ON COLUMN sys_config.create_time IS '创建时间';
COMMENT ON COLUMN sys_config.update_by IS '更新者';
COMMENT ON COLUMN sys_config.update_time IS '更新时间';
COMMENT ON COLUMN sys_config.remark IS '备注';

INSERT INTO sys_config VALUES(1, '主框架页-默认皮肤样式名称',     'sys.index.skinName',               'skin-blue',     'Y', 'admin', CURRENT_TIMESTAMP, '', NULL, '蓝色 skin-blue、绿色 skin-green、紫色 skin-purple、红色 skin-red、黄色 skin-yellow' );
INSERT INTO sys_config VALUES(2, '用户管理-账号初始密码',         'sys.user.initPassword',            '123456',        'Y', 'admin', CURRENT_TIMESTAMP, '', NULL, '初始化密码 123456' );
INSERT INTO sys_config VALUES(3, '主框架页-侧边栏主题',           'sys.index.sideTheme',              'theme-dark',    'Y', 'admin', CURRENT_TIMESTAMP, '', NULL, '深色主题theme-dark，浅色主题theme-light' );
INSERT INTO sys_config VALUES(4, '账号自助-验证码开关',           'sys.account.captchaEnabled',       'true',          'Y', 'admin', CURRENT_TIMESTAMP, '', NULL, '是否开启验证码功能（true开启，false关闭）');
INSERT INTO sys_config VALUES(5, '账号自助-是否开启用户注册功能', 'sys.account.registerUser',         'false',         'Y', 'admin', CURRENT_TIMESTAMP, '', NULL, '是否开启注册用户功能（true开启，false关闭）');
INSERT INTO sys_config VALUES(6, '用户登录-黑名单列表',           'sys.login.blackIPList',            '',              'Y', 'admin', CURRENT_TIMESTAMP, '', NULL, '设置登录IP黑名单限制，多个匹配项以;分隔，支持匹配（*通配、网段）');
INSERT INTO sys_config VALUES(7, '用户管理-初始密码修改策略',     'sys.account.initPasswordModify',   '1',             'Y', 'admin', CURRENT_TIMESTAMP, '', NULL, '0：初始密码修改策略关闭，没有任何提示，1：提醒用户，如果未修改初始密码，则在登录时就会提醒修改密码对话框');
INSERT INTO sys_config VALUES(8, '用户管理-账号密码更新周期',     'sys.account.passwordValidateDays', '0',             'Y', 'admin', CURRENT_TIMESTAMP, '', NULL, '密码更新周期（填写数字，数据初始化值为0不限制，若修改必须为大于0小于365的正整数），如果超过这个周期登录系统时，则在登录时就会提醒修改密码对话框');
SELECT setval('sys_config_config_id_seq', 100);


-- ----------------------------
-- 14、系统访问记录
-- ----------------------------
DROP TABLE IF EXISTS sys_logininfor;
CREATE TABLE sys_logininfor (
  info_id        BIGSERIAL      NOT NULL,
  user_name      varchar(50)    DEFAULT '',
  ipaddr         varchar(128)   DEFAULT '',
  login_location varchar(255)   DEFAULT '',
  browser        varchar(50)    DEFAULT '',
  os             varchar(50)    DEFAULT '',
  status         char(1)        DEFAULT '0',
  msg            varchar(255)   DEFAULT '',
  login_time     timestamp,
  PRIMARY KEY (info_id)
);

CREATE INDEX idx_sys_logininfor_s ON sys_logininfor (status);
CREATE INDEX idx_sys_logininfor_lt ON sys_logininfor (login_time);

COMMENT ON TABLE sys_logininfor IS '系统访问记录';
COMMENT ON COLUMN sys_logininfor.info_id IS '访问ID';
COMMENT ON COLUMN sys_logininfor.user_name IS '用户账号';
COMMENT ON COLUMN sys_logininfor.ipaddr IS '登录IP地址';
COMMENT ON COLUMN sys_logininfor.login_location IS '登录地点';
COMMENT ON COLUMN sys_logininfor.browser IS '浏览器类型';
COMMENT ON COLUMN sys_logininfor.os IS '操作系统';
COMMENT ON COLUMN sys_logininfor.status IS '登录状态（0成功 1失败）';
COMMENT ON COLUMN sys_logininfor.msg IS '提示消息';
COMMENT ON COLUMN sys_logininfor.login_time IS '访问时间';

SELECT setval('sys_logininfor_info_id_seq', 100);


-- ----------------------------
-- 15、定时任务调度表
-- ----------------------------
DROP TABLE IF EXISTS sys_job;
CREATE TABLE sys_job (
  job_id              BIGSERIAL     NOT NULL,
  job_name            varchar(64)   DEFAULT '',
  job_group           varchar(64)   DEFAULT 'DEFAULT',
  invoke_target       varchar(500)  NOT NULL,
  cron_expression     varchar(255)  DEFAULT '',
  misfire_policy      varchar(20)   DEFAULT '3',
  concurrent          char(1)       DEFAULT '1',
  status              char(1)       DEFAULT '0',
  create_by           varchar(64)   DEFAULT '',
  create_time         timestamp,
  update_by           varchar(64)   DEFAULT '',
  update_time         timestamp,
  remark              varchar(500)  DEFAULT '',
  PRIMARY KEY (job_id, job_name, job_group)
);

COMMENT ON TABLE sys_job IS '定时任务调度表';
COMMENT ON COLUMN sys_job.job_id IS '任务ID';
COMMENT ON COLUMN sys_job.job_name IS '任务名称';
COMMENT ON COLUMN sys_job.job_group IS '任务组名';
COMMENT ON COLUMN sys_job.invoke_target IS '调用目标字符串';
COMMENT ON COLUMN sys_job.cron_expression IS 'cron执行表达式';
COMMENT ON COLUMN sys_job.misfire_policy IS '计划执行错误策略（1立即执行 2执行一次 3放弃执行）';
COMMENT ON COLUMN sys_job.concurrent IS '是否并发执行（0允许 1禁止）';
COMMENT ON COLUMN sys_job.status IS '状态（0正常 1暂停）';
COMMENT ON COLUMN sys_job.create_by IS '创建者';
COMMENT ON COLUMN sys_job.create_time IS '创建时间';
COMMENT ON COLUMN sys_job.update_by IS '更新者';
COMMENT ON COLUMN sys_job.update_time IS '更新时间';
COMMENT ON COLUMN sys_job.remark IS '备注信息';

INSERT INTO sys_job VALUES(1, '系统默认（无参）', 'DEFAULT', 'ryTask.ryNoParams',        '0/10 * * * * ?', '3', '1', '1', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_job VALUES(2, '系统默认（有参）', 'DEFAULT', 'ryTask.ryParams(''ry'')',  '0/15 * * * * ?', '3', '1', '1', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
INSERT INTO sys_job VALUES(3, '系统默认（多参）', 'DEFAULT', 'ryTask.ryMultipleParams(''ry'', true, 2000L, 316.50D, 100)',  '0/20 * * * * ?', '3', '1', '1', 'admin', CURRENT_TIMESTAMP, '', NULL, '');
SELECT setval('sys_job_job_id_seq', 100);


-- ----------------------------
-- 16、定时任务调度日志表
-- ----------------------------
DROP TABLE IF EXISTS sys_job_log;
CREATE TABLE sys_job_log (
  job_log_id          BIGSERIAL      NOT NULL,
  job_name            varchar(64)    NOT NULL,
  job_group           varchar(64)    NOT NULL,
  invoke_target       varchar(500)   NOT NULL,
  job_message         varchar(500),
  status              char(1)        DEFAULT '0',
  exception_info      varchar(2000)  DEFAULT '',
  create_time         timestamp,
  PRIMARY KEY (job_log_id)
);

COMMENT ON TABLE sys_job_log IS '定时任务调度日志表';
COMMENT ON COLUMN sys_job_log.job_log_id IS '任务日志ID';
COMMENT ON COLUMN sys_job_log.job_name IS '任务名称';
COMMENT ON COLUMN sys_job_log.job_group IS '任务组名';
COMMENT ON COLUMN sys_job_log.invoke_target IS '调用目标字符串';
COMMENT ON COLUMN sys_job_log.job_message IS '日志信息';
COMMENT ON COLUMN sys_job_log.status IS '执行状态（0正常 1失败）';
COMMENT ON COLUMN sys_job_log.exception_info IS '异常信息';
COMMENT ON COLUMN sys_job_log.create_time IS '创建时间';


-- ----------------------------
-- 17、通知公告表
-- ----------------------------
DROP TABLE IF EXISTS sys_notice;
CREATE TABLE sys_notice (
  notice_id         SERIAL          NOT NULL,
  notice_title      varchar(50)     NOT NULL,
  notice_type       char(1)         NOT NULL,
  notice_content    bytea           DEFAULT NULL,
  status            char(1)         DEFAULT '0',
  create_by         varchar(64)     DEFAULT '',
  create_time       timestamp,
  update_by         varchar(64)     DEFAULT '',
  update_time       timestamp,
  remark            varchar(255)    DEFAULT NULL,
  PRIMARY KEY (notice_id)
);

COMMENT ON TABLE sys_notice IS '通知公告表';
COMMENT ON COLUMN sys_notice.notice_id IS '公告ID';
COMMENT ON COLUMN sys_notice.notice_title IS '公告标题';
COMMENT ON COLUMN sys_notice.notice_type IS '公告类型（1通知 2公告）';
COMMENT ON COLUMN sys_notice.notice_content IS '公告内容';
COMMENT ON COLUMN sys_notice.status IS '公告状态（0正常 1关闭）';
COMMENT ON COLUMN sys_notice.create_by IS '创建者';
COMMENT ON COLUMN sys_notice.create_time IS '创建时间';
COMMENT ON COLUMN sys_notice.update_by IS '更新者';
COMMENT ON COLUMN sys_notice.update_time IS '更新时间';
COMMENT ON COLUMN sys_notice.remark IS '备注';




-- ----------------------------
-- 18、代码生成业务表
-- ----------------------------
DROP TABLE IF EXISTS gen_table;
CREATE TABLE gen_table (
  table_id          BIGSERIAL       NOT NULL,
  table_name        varchar(200)    DEFAULT '',
  table_comment     varchar(500)    DEFAULT '',
  sub_table_name    varchar(64)     DEFAULT NULL,
  sub_table_fk_name varchar(64)     DEFAULT NULL,
  class_name        varchar(100)    DEFAULT '',
  tpl_category      varchar(200)    DEFAULT 'crud',
  tpl_web_type      varchar(30)     DEFAULT '',
  package_name      varchar(100),
  module_name       varchar(30),
  business_name     varchar(30),
  function_name     varchar(50),
  function_author   varchar(50),
  gen_type          char(1)         DEFAULT '0',
  gen_path          varchar(200)    DEFAULT '/',
  options           varchar(1000),
  create_by         varchar(64)     DEFAULT '',
  create_time       timestamp,
  update_by         varchar(64)     DEFAULT '',
  update_time       timestamp,
  remark            varchar(500)    DEFAULT NULL,
  PRIMARY KEY (table_id)
);

COMMENT ON TABLE gen_table IS '代码生成业务表';
COMMENT ON COLUMN gen_table.table_id IS '编号';
COMMENT ON COLUMN gen_table.table_name IS '表名称';
COMMENT ON COLUMN gen_table.table_comment IS '表描述';
COMMENT ON COLUMN gen_table.sub_table_name IS '关联子表的表名';
COMMENT ON COLUMN gen_table.sub_table_fk_name IS '子表关联的外键名';
COMMENT ON COLUMN gen_table.class_name IS '实体类名称';
COMMENT ON COLUMN gen_table.tpl_category IS '使用的模板（crud单表操作 tree树表操作）';
COMMENT ON COLUMN gen_table.tpl_web_type IS '前端模板类型（element-ui模版 element-plus模版）';
COMMENT ON COLUMN gen_table.package_name IS '生成包路径';
COMMENT ON COLUMN gen_table.module_name IS '生成模块名';
COMMENT ON COLUMN gen_table.business_name IS '生成业务名';
COMMENT ON COLUMN gen_table.function_name IS '生成功能名';
COMMENT ON COLUMN gen_table.function_author IS '生成功能作者';
COMMENT ON COLUMN gen_table.gen_type IS '生成代码方式（0zip压缩包 1自定义路径）';
COMMENT ON COLUMN gen_table.gen_path IS '生成路径（不填默认项目路径）';
COMMENT ON COLUMN gen_table.options IS '其它生成选项';
COMMENT ON COLUMN gen_table.create_by IS '创建者';
COMMENT ON COLUMN gen_table.create_time IS '创建时间';
COMMENT ON COLUMN gen_table.update_by IS '更新者';
COMMENT ON COLUMN gen_table.update_time IS '更新时间';
COMMENT ON COLUMN gen_table.remark IS '备注';


-- ----------------------------
-- 19、代码生成业务表字段
-- ----------------------------
DROP TABLE IF EXISTS gen_table_column;
CREATE TABLE gen_table_column (
  column_id         BIGSERIAL       NOT NULL,
  table_id          bigint,
  column_name       varchar(200),
  column_comment    varchar(500),
  column_type       varchar(100),
  java_type         varchar(500),
  java_field        varchar(200),
  is_pk             char(1),
  is_increment      char(1),
  is_required       char(1),
  is_insert         char(1),
  is_edit           char(1),
  is_list           char(1),
  is_query          char(1),
  query_type        varchar(200)    DEFAULT 'EQ',
  html_type         varchar(200),
  dict_type         varchar(200)    DEFAULT '',
  sort              integer,
  create_by         varchar(64)     DEFAULT '',
  create_time       timestamp,
  update_by         varchar(64)     DEFAULT '',
  update_time       timestamp,
  PRIMARY KEY (column_id)
);

COMMENT ON TABLE gen_table_column IS '代码生成业务表字段';
COMMENT ON COLUMN gen_table_column.column_id IS '编号';
COMMENT ON COLUMN gen_table_column.table_id IS '归属表编号';
COMMENT ON COLUMN gen_table_column.column_name IS '列名称';
COMMENT ON COLUMN gen_table_column.column_comment IS '列描述';
COMMENT ON COLUMN gen_table_column.column_type IS '列类型';
COMMENT ON COLUMN gen_table_column.java_type IS 'JAVA类型';
COMMENT ON COLUMN gen_table_column.java_field IS 'JAVA字段名';
COMMENT ON COLUMN gen_table_column.is_pk IS '是否主键（1是）';
COMMENT ON COLUMN gen_table_column.is_increment IS '是否自增（1是）';
COMMENT ON COLUMN gen_table_column.is_required IS '是否必填（1是）';
COMMENT ON COLUMN gen_table_column.is_insert IS '是否为插入字段（1是）';
COMMENT ON COLUMN gen_table_column.is_edit IS '是否编辑字段（1是）';
COMMENT ON COLUMN gen_table_column.is_list IS '是否列表字段（1是）';
COMMENT ON COLUMN gen_table_column.is_query IS '是否查询字段（1是）';
COMMENT ON COLUMN gen_table_column.query_type IS '查询方式（等于、不等于、大于、小于、范围）';
COMMENT ON COLUMN gen_table_column.html_type IS '显示类型（文本框、文本域、下拉框、复选框、单选框、日期控件）';
COMMENT ON COLUMN gen_table_column.dict_type IS '字典类型';
COMMENT ON COLUMN gen_table_column.sort IS '排序';
COMMENT ON COLUMN gen_table_column.create_by IS '创建者';
COMMENT ON COLUMN gen_table_column.create_time IS '创建时间';
COMMENT ON COLUMN gen_table_column.update_by IS '更新者';
COMMENT ON COLUMN gen_table_column.update_time IS '更新时间';


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
    sched_name           varchar(120)    NOT NULL,
    job_name             varchar(200)    NOT NULL,
    job_group            varchar(200)    NOT NULL,
    description          varchar(250)    NULL,
    job_class_name       varchar(250)    NOT NULL,
    is_durable           varchar(1)      NOT NULL,
    is_nonconcurrent     varchar(1)      NOT NULL,
    is_update_data       varchar(1)      NOT NULL,
    requests_recovery    varchar(1)      NOT NULL,
    job_data             bytea           NULL,
    PRIMARY KEY (sched_name, job_name, job_group)
);

COMMENT ON TABLE QRTZ_JOB_DETAILS IS '任务详细信息表';
COMMENT ON COLUMN QRTZ_JOB_DETAILS.sched_name IS '调度名称';
COMMENT ON COLUMN QRTZ_JOB_DETAILS.job_name IS '任务名称';
COMMENT ON COLUMN QRTZ_JOB_DETAILS.job_group IS '任务组名';
COMMENT ON COLUMN QRTZ_JOB_DETAILS.description IS '相关介绍';
COMMENT ON COLUMN QRTZ_JOB_DETAILS.job_class_name IS '执行任务类名称';
COMMENT ON COLUMN QRTZ_JOB_DETAILS.is_durable IS '是否持久化';
COMMENT ON COLUMN QRTZ_JOB_DETAILS.is_nonconcurrent IS '是否并发';
COMMENT ON COLUMN QRTZ_JOB_DETAILS.is_update_data IS '是否更新数据';
COMMENT ON COLUMN QRTZ_JOB_DETAILS.requests_recovery IS '是否接受恢复执行';
COMMENT ON COLUMN QRTZ_JOB_DETAILS.job_data IS '存放持久化job对象';

-- ----------------------------
-- 2、 存储已配置的 Trigger 的信息
-- ----------------------------
CREATE TABLE QRTZ_TRIGGERS (
    sched_name           varchar(120)    NOT NULL,
    trigger_name         varchar(200)    NOT NULL,
    trigger_group        varchar(200)    NOT NULL,
    job_name             varchar(200)    NOT NULL,
    job_group            varchar(200)    NOT NULL,
    description          varchar(250)    NULL,
    next_fire_time       bigint          NULL,
    prev_fire_time       bigint          NULL,
    priority             integer         NULL,
    trigger_state        varchar(16)     NOT NULL,
    trigger_type         varchar(8)      NOT NULL,
    start_time           bigint          NOT NULL,
    end_time             bigint          NULL,
    calendar_name        varchar(200)    NULL,
    misfire_instr        smallint        NULL,
    job_data             bytea           NULL,
    PRIMARY KEY (sched_name, trigger_name, trigger_group),
    FOREIGN KEY (sched_name, job_name, job_group) REFERENCES QRTZ_JOB_DETAILS(sched_name, job_name, job_group)
);

COMMENT ON TABLE QRTZ_TRIGGERS IS '触发器详细信息表';
COMMENT ON COLUMN QRTZ_TRIGGERS.sched_name IS '调度名称';
COMMENT ON COLUMN QRTZ_TRIGGERS.trigger_name IS '触发器的名字';
COMMENT ON COLUMN QRTZ_TRIGGERS.trigger_group IS '触发器所属组的名字';
COMMENT ON COLUMN QRTZ_TRIGGERS.job_name IS 'qrtz_job_details表job_name的外键';
COMMENT ON COLUMN QRTZ_TRIGGERS.job_group IS 'qrtz_job_details表job_group的外键';
COMMENT ON COLUMN QRTZ_TRIGGERS.description IS '相关介绍';
COMMENT ON COLUMN QRTZ_TRIGGERS.next_fire_time IS '上一次触发时间（毫秒）';
COMMENT ON COLUMN QRTZ_TRIGGERS.prev_fire_time IS '下一次触发时间（默认为-1表示不触发）';
COMMENT ON COLUMN QRTZ_TRIGGERS.priority IS '优先级';
COMMENT ON COLUMN QRTZ_TRIGGERS.trigger_state IS '触发器状态';
COMMENT ON COLUMN QRTZ_TRIGGERS.trigger_type IS '触发器的类型';
COMMENT ON COLUMN QRTZ_TRIGGERS.start_time IS '开始时间';
COMMENT ON COLUMN QRTZ_TRIGGERS.end_time IS '结束时间';
COMMENT ON COLUMN QRTZ_TRIGGERS.calendar_name IS '日程表名称';
COMMENT ON COLUMN QRTZ_TRIGGERS.misfire_instr IS '补偿执行的策略';
COMMENT ON COLUMN QRTZ_TRIGGERS.job_data IS '存放持久化job对象';

-- ----------------------------
-- 3、 存储简单的 Trigger，包括重复次数，间隔，以及已触发的次数
-- ----------------------------
CREATE TABLE QRTZ_SIMPLE_TRIGGERS (
    sched_name           varchar(120)    NOT NULL,
    trigger_name         varchar(200)    NOT NULL,
    trigger_group        varchar(200)    NOT NULL,
    repeat_count         bigint          NOT NULL,
    repeat_interval      bigint          NOT NULL,
    times_triggered      bigint          NOT NULL,
    PRIMARY KEY (sched_name, trigger_name, trigger_group),
    FOREIGN KEY (sched_name, trigger_name, trigger_group) REFERENCES QRTZ_TRIGGERS(sched_name, trigger_name, trigger_group)
);

COMMENT ON TABLE QRTZ_SIMPLE_TRIGGERS IS '简单触发器的信息表';
COMMENT ON COLUMN QRTZ_SIMPLE_TRIGGERS.sched_name IS '调度名称';
COMMENT ON COLUMN QRTZ_SIMPLE_TRIGGERS.trigger_name IS 'qrtz_triggers表trigger_name的外键';
COMMENT ON COLUMN QRTZ_SIMPLE_TRIGGERS.trigger_group IS 'qrtz_triggers表trigger_group的外键';
COMMENT ON COLUMN QRTZ_SIMPLE_TRIGGERS.repeat_count IS '重复的次数统计';
COMMENT ON COLUMN QRTZ_SIMPLE_TRIGGERS.repeat_interval IS '重复的间隔时间';
COMMENT ON COLUMN QRTZ_SIMPLE_TRIGGERS.times_triggered IS '已经触发的次数';

-- ----------------------------
-- 4、 存储 Cron Trigger，包括 Cron 表达式和时区信息
-- ---------------------------- 
CREATE TABLE QRTZ_CRON_TRIGGERS (
    sched_name           varchar(120)    NOT NULL,
    trigger_name         varchar(200)    NOT NULL,
    trigger_group        varchar(200)    NOT NULL,
    cron_expression      varchar(200)    NOT NULL,
    time_zone_id         varchar(80),
    PRIMARY KEY (sched_name, trigger_name, trigger_group),
    FOREIGN KEY (sched_name, trigger_name, trigger_group) REFERENCES QRTZ_TRIGGERS(sched_name, trigger_name, trigger_group)
);

COMMENT ON TABLE QRTZ_CRON_TRIGGERS IS 'Cron类型的触发器表';
COMMENT ON COLUMN QRTZ_CRON_TRIGGERS.sched_name IS '调度名称';
COMMENT ON COLUMN QRTZ_CRON_TRIGGERS.trigger_name IS 'qrtz_triggers表trigger_name的外键';
COMMENT ON COLUMN QRTZ_CRON_TRIGGERS.trigger_group IS 'qrtz_triggers表trigger_group的外键';
COMMENT ON COLUMN QRTZ_CRON_TRIGGERS.cron_expression IS 'cron表达式';
COMMENT ON COLUMN QRTZ_CRON_TRIGGERS.time_zone_id IS '时区';

-- ----------------------------
-- 5、 Trigger 作为 Blob 类型存储(用于 Quartz 用户用 JDBC 创建他们自己定制的 Trigger 类型，JobStore 并不知道如何存储实例的时候)
-- ---------------------------- 
CREATE TABLE QRTZ_BLOB_TRIGGERS (
    sched_name           varchar(120)    NOT NULL,
    trigger_name         varchar(200)    NOT NULL,
    trigger_group        varchar(200)    NOT NULL,
    blob_data            bytea           NULL,
    PRIMARY KEY (sched_name, trigger_name, trigger_group),
    FOREIGN KEY (sched_name, trigger_name, trigger_group) REFERENCES QRTZ_TRIGGERS(sched_name, trigger_name, trigger_group)
);

COMMENT ON TABLE QRTZ_BLOB_TRIGGERS IS 'Blob类型的触发器表';
COMMENT ON COLUMN QRTZ_BLOB_TRIGGERS.sched_name IS '调度名称';
COMMENT ON COLUMN QRTZ_BLOB_TRIGGERS.trigger_name IS 'qrtz_triggers表trigger_name的外键';
COMMENT ON COLUMN QRTZ_BLOB_TRIGGERS.trigger_group IS 'qrtz_triggers表trigger_group的外键';
COMMENT ON COLUMN QRTZ_BLOB_TRIGGERS.blob_data IS '存放持久化Trigger对象';

-- ----------------------------
-- 6、 以 Blob 类型存储存放日历信息， quartz可配置一个日历来指定一个时间范围
-- ---------------------------- 
CREATE TABLE QRTZ_CALENDARS (
    sched_name           varchar(120)    NOT NULL,
    calendar_name        varchar(200)    NOT NULL,
    calendar             bytea           NOT NULL,
    PRIMARY KEY (sched_name, calendar_name)
);

COMMENT ON TABLE QRTZ_CALENDARS IS '日历信息表';
COMMENT ON COLUMN QRTZ_CALENDARS.sched_name IS '调度名称';
COMMENT ON COLUMN QRTZ_CALENDARS.calendar_name IS '日历名称';
COMMENT ON COLUMN QRTZ_CALENDARS.calendar IS '存放持久化calendar对象';

-- ----------------------------
-- 7、 存储已暂停的 Trigger 组的信息
-- ---------------------------- 
CREATE TABLE QRTZ_PAUSED_TRIGGER_GRPS (
    sched_name           varchar(120)    NOT NULL,
    trigger_group        varchar(200)    NOT NULL,
    PRIMARY KEY (sched_name, trigger_group)
);

COMMENT ON TABLE QRTZ_PAUSED_TRIGGER_GRPS IS '暂停的触发器表';
COMMENT ON COLUMN QRTZ_PAUSED_TRIGGER_GRPS.sched_name IS '调度名称';
COMMENT ON COLUMN QRTZ_PAUSED_TRIGGER_GRPS.trigger_group IS 'qrtz_triggers表trigger_group的外键';

-- ----------------------------
-- 8、 存储与已触发的 Trigger 相关的状态信息，以及相联 Job 的执行信息
-- ---------------------------- 
CREATE TABLE QRTZ_FIRED_TRIGGERS (
    sched_name           varchar(120)    NOT NULL,
    entry_id             varchar(95)     NOT NULL,
    trigger_name         varchar(200)    NOT NULL,
    trigger_group        varchar(200)    NOT NULL,
    instance_name        varchar(200)    NOT NULL,
    fired_time           bigint          NOT NULL,
    sched_time           bigint          NOT NULL,
    priority             integer         NOT NULL,
    state                varchar(16)     NOT NULL,
    job_name             varchar(200)    NULL,
    job_group            varchar(200)    NULL,
    is_nonconcurrent     varchar(1)      NULL,
    requests_recovery    varchar(1)      NULL,
    PRIMARY KEY (sched_name, entry_id)
);

COMMENT ON TABLE QRTZ_FIRED_TRIGGERS IS '已触发的触发器表';
COMMENT ON COLUMN QRTZ_FIRED_TRIGGERS.sched_name IS '调度名称';
COMMENT ON COLUMN QRTZ_FIRED_TRIGGERS.entry_id IS '调度器实例id';
COMMENT ON COLUMN QRTZ_FIRED_TRIGGERS.trigger_name IS 'qrtz_triggers表trigger_name的外键';
COMMENT ON COLUMN QRTZ_FIRED_TRIGGERS.trigger_group IS 'qrtz_triggers表trigger_group的外键';
COMMENT ON COLUMN QRTZ_FIRED_TRIGGERS.instance_name IS '调度器实例名';
COMMENT ON COLUMN QRTZ_FIRED_TRIGGERS.fired_time IS '触发的时间';
COMMENT ON COLUMN QRTZ_FIRED_TRIGGERS.sched_time IS '定时器制定的时间';
COMMENT ON COLUMN QRTZ_FIRED_TRIGGERS.priority IS '优先级';
COMMENT ON COLUMN QRTZ_FIRED_TRIGGERS.state IS '状态';
COMMENT ON COLUMN QRTZ_FIRED_TRIGGERS.job_name IS '任务名称';
COMMENT ON COLUMN QRTZ_FIRED_TRIGGERS.job_group IS '任务组名';
COMMENT ON COLUMN QRTZ_FIRED_TRIGGERS.is_nonconcurrent IS '是否并发';
COMMENT ON COLUMN QRTZ_FIRED_TRIGGERS.requests_recovery IS '是否接受恢复执行';

-- ----------------------------
-- 9、 存储少量的有关 Scheduler 的状态信息，假如是用于集群中，可以看到其他的 Scheduler 实例
-- ---------------------------- 
CREATE TABLE QRTZ_SCHEDULER_STATE (
    sched_name           varchar(120)    NOT NULL,
    instance_name        varchar(200)    NOT NULL,
    last_checkin_time    bigint          NOT NULL,
    checkin_interval     bigint          NOT NULL,
    PRIMARY KEY (sched_name, instance_name)
);

COMMENT ON TABLE QRTZ_SCHEDULER_STATE IS '调度器状态表';
COMMENT ON COLUMN QRTZ_SCHEDULER_STATE.sched_name IS '调度名称';
COMMENT ON COLUMN QRTZ_SCHEDULER_STATE.instance_name IS '实例名称';
COMMENT ON COLUMN QRTZ_SCHEDULER_STATE.last_checkin_time IS '上次检查时间';
COMMENT ON COLUMN QRTZ_SCHEDULER_STATE.checkin_interval IS '检查间隔时间';

-- ----------------------------
-- 10、 存储程序的悲观锁的信息(假如使用了悲观锁)
-- ---------------------------- 
CREATE TABLE QRTZ_LOCKS (
    sched_name           varchar(120)    NOT NULL,
    lock_name            varchar(40)     NOT NULL,
    PRIMARY KEY (sched_name, lock_name)
);

COMMENT ON TABLE QRTZ_LOCKS IS '存储的悲观锁信息表';
COMMENT ON COLUMN QRTZ_LOCKS.sched_name IS '调度名称';
COMMENT ON COLUMN QRTZ_LOCKS.lock_name IS '悲观锁名称';

-- ----------------------------
-- 11、 Quartz集群实现同步机制的行锁表
-- ---------------------------- 
CREATE TABLE QRTZ_SIMPROP_TRIGGERS (
    sched_name           varchar(120)    NOT NULL,
    trigger_name         varchar(200)    NOT NULL,
    trigger_group        varchar(200)    NOT NULL,
    str_prop_1           varchar(512)    NULL,
    str_prop_2           varchar(512)    NULL,
    str_prop_3           varchar(512)    NULL,
    int_prop_1           integer         NULL,
    int_prop_2           integer         NULL,
    long_prop_1          bigint          NULL,
    long_prop_2          bigint          NULL,
    dec_prop_1           numeric(13,4)   NULL,
    dec_prop_2           numeric(13,4)   NULL,
    bool_prop_1          varchar(1)      NULL,
    bool_prop_2          varchar(1)      NULL,
    PRIMARY KEY (sched_name, trigger_name, trigger_group),
    FOREIGN KEY (sched_name, trigger_name, trigger_group) REFERENCES QRTZ_TRIGGERS(sched_name, trigger_name, trigger_group)
);

COMMENT ON TABLE QRTZ_SIMPROP_TRIGGERS IS '同步机制的行锁表';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.sched_name IS '调度名称';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.trigger_name IS 'qrtz_triggers表trigger_name的外键';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.trigger_group IS 'qrtz_triggers表trigger_group的外键';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.str_prop_1 IS 'String类型的trigger的第一个参数';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.str_prop_2 IS 'String类型的trigger的第二个参数';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.str_prop_3 IS 'String类型的trigger的第三个参数';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.int_prop_1 IS 'int类型的trigger的第一个参数';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.int_prop_2 IS 'int类型的trigger的第二个参数';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.long_prop_1 IS 'long类型的trigger的第一个参数';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.long_prop_2 IS 'long类型的trigger的第二个参数';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.dec_prop_1 IS 'decimal类型的trigger的第一个参数';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.dec_prop_2 IS 'decimal类型的trigger的第二个参数';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.bool_prop_1 IS 'Boolean类型的trigger的第一个参数';
COMMENT ON COLUMN QRTZ_SIMPROP_TRIGGERS.bool_prop_2 IS 'Boolean类型的trigger的第二个参数';

