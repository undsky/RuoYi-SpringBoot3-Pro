#!/usr/bin/env node

/**
 * 跨平台环境与依赖检查脚本 (Windows, macOS, Linux)
 * 检查 Node.js 版本、包管理器 (npm, pnpm)、端口占用 (7001, 8001, 6379)、依赖安装状态
 */

import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 终端颜色格式化
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function success(msg) {
  console.log(`  ${colors.green}✔${colors.reset} ${msg}`);
}

function warn(msg) {
  console.log(`  ${colors.yellow}⚠${colors.reset} ${msg}`);
}

function error(msg) {
  console.log(`  ${colors.red}✖${colors.reset} ${msg}`);
}

// 检查单地址端口连通性
function checkSingleHostPort(port, host, timeout = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// 检查端口是否被占用/可连接（同时探测 IPv4 与 IPv6 回环地址，防止 Vite/Node 仅监听 ::1 时漏检）
function checkPort(port, host = null, timeout = 800) {
  if (host) {
    return checkSingleHostPort(port, host, timeout);
  }
  return checkSingleHostPort(port, '127.0.0.1', timeout).then((open) => {
    if (open) return true;
    return checkSingleHostPort(port, '::1', timeout);
  });
}

// 查找项目根目录（寻找包含 doudou-eggjs 与 doudou-vue3 的目录）
export function findProjectRoot(startDir = process.cwd()) {
  let current = path.resolve(startDir);

  while (true) {
    const hasEgg = fs.existsSync(path.join(current, 'doudou-eggjs', 'package.json'));
    const hasVue = fs.existsSync(path.join(current, 'doudou-vue3', 'package.json'));
    if (hasEgg && hasVue) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break; // 已到达系统盘符或根目录
    }
    current = parent;
  }

  return null;
}

// 检查命令是否可用
function checkCommand(command) {
  try {
    const isWin = process.platform === 'win32';
    const checkCmd = isWin ? `where ${command}` : `which ${command}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// 主检查流程
export async function runCheck(options = {}) {
  log(`\n${colors.bright}${colors.cyan}================ 豆豆开发环境自检 (doudou-dev) ================${colors.reset}\n`);

  let allGood = true;

  // 1. 操作系统与平台信息
  log(`[1] 系统环境信息:`);
  log(`  平台: ${process.platform} (${process.arch})`, colors.gray);
  
  // 2. Node.js 版本检查 (要求 >= 20.0.0)
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (majorVersion >= 20) {
    success(`Node.js 版本: ${nodeVersion} (满足 >= 20.0.0 要求)`);
  } else {
    warn(`Node.js 版本: ${nodeVersion} (推荐 >= 20.0.0，低版本可能在 Egg.js 3 运行时出现兼容问题)`);
  }

  // 3. 包管理器检查
  log(`\n[2] 包管理器检查:`);
  const hasNpm = checkCommand('npm');
  if (hasNpm) {
    try {
      const npmVer = execSync('npm --version', { encoding: 'utf8' }).trim();
      success(`npm 已安装: v${npmVer}`);
    } catch {
      success(`npm 已安装`);
    }
  } else {
    error(`未检测到 npm，请先安装 Node.js 与 npm`);
    allGood = false;
  }

  const hasPnpm = checkCommand('pnpm');
  if (hasPnpm) {
    try {
      const pnpmVer = execSync('pnpm --version', { encoding: 'utf8' }).trim();
      success(`pnpm 已安装: v${pnpmVer}`);
    } catch {
      success(`pnpm 已安装`);
    }
  } else {
    error(`未检测到 pnpm (doudou-vue3 强制要求 pnpm)。请运行: npm install -g pnpm`);
    allGood = false;
  }

  // 4. 定位项目根目录
  log(`\n[3] 仓库项目定位:`);
  const targetDir = options.cwd || process.cwd();
  const projectRoot = findProjectRoot(targetDir);

  if (projectRoot) {
    success(`已识别项目根目录: ${projectRoot}`);

    const eggDir = path.join(projectRoot, 'doudou-eggjs');
    const vueDir = path.join(projectRoot, 'doudou-vue3');

    // 检查后端依赖
    const eggModules = fs.existsSync(path.join(eggDir, 'node_modules'));
    if (eggModules) {
      success(`后端依赖: doudou-eggjs/node_modules 已就绪`);
    } else {
      warn(`后端依赖未安装: doudou-eggjs/node_modules 不存在 (启动时可自动安装或手动执行 cd doudou-eggjs && npm install)`);
    }

    // 检查前端依赖
    const vueModules = fs.existsSync(path.join(vueDir, 'node_modules'));
    if (vueModules) {
      success(`前端依赖: doudou-vue3/node_modules 已就绪`);
    } else {
      warn(`前端依赖未安装: doudou-vue3/node_modules 不存在 (启动时可自动安装或手动执行 cd doudou-vue3 && pnpm install)`);
    }
  } else {
    warn(`未能自动定位包含 doudou-eggjs 与 doudou-vue3 的根目录 (当前位置: ${targetDir})`);
  }

  // 5. 端口与基础服务连通性检查
  log(`\n[4] 端口与服务状态探测:`);

  // Redis (6379)
  const redisOnline = await checkPort(6379);
  if (redisOnline) {
    success(`Redis 端口 (6379): 正在运行并可连通`);
  } else {
    warn(`Redis 端口 (6379): 未检测到连通 (Egg.js 依赖 Redis 提供缓存、限流和 Bull 任务队列，启动前请确保 Redis 已启动)`);
  }

  // 后端端口 (7001)
  const eggPortUsed = await checkPort(7001);
  if (eggPortUsed) {
    warn(`后端端口 (7001): 当前已被占用 (如已有后端在运行请留意，或需释放端口)`);
  } else {
    success(`后端端口 (7001): 空闲可用`);
  }

  // 前端端口 (8001)
  const vuePortUsed = await checkPort(8001);
  if (vuePortUsed) {
    warn(`前端端口 (8001): 当前已被占用 (Vite 启动时可能会自动递增至 8002 等端口)`);
  } else {
    success(`前端端口 (8001): 空闲可用`);
  }

  log(`\n${colors.bright}${colors.cyan}===============================================================${colors.reset}\n`);

  return {
    allGood,
    projectRoot,
    hasPnpm,
    redisOnline,
  };
}

// 直接以脚本运行
if (process.argv[1] === __filename) {
  runCheck().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
