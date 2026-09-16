#!/usr/bin/env node

/**
 * 跨平台开发服务启动器 (Windows, macOS, Linux)
 * 支持同时或分别启动 doudou-eggjs 与 doudou-vue3
 * 
 * 用法:
 *   node dev.mjs                # 一键启动前后端（默认）
 *   node dev.mjs --all          # 一键启动前后端
 *   node dev.mjs --backend      # 仅启动 doudou-eggjs (npm run dev)
 *   node dev.mjs --frontend     # 仅启动 doudou-vue3 (pnpm dev)
 *   node dev.mjs --check        # 仅执行环境与依赖检查
 *   node dev.mjs --cwd <path>   # 指定项目根目录
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { findProjectRoot, runCheck } from './check.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 终端颜色
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

// 存储子进程用于退出时统一清理
const runningChildren = [];

// 优雅退出清理所有子进程
function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGTERM');
    }
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // 忽略已终止的进程
    }
  }
}

let isCleaningUp = false;
function cleanupAndExit(code = 0) {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log(`\n${colors.yellow}[doudou-dev] 正在关闭所有服务...${colors.reset}`);
  while (runningChildren.length > 0) {
    const child = runningChildren.pop();
    if (child && child.pid) {
      killProcessTree(child.pid);
    }
  }
  process.exit(code);
}

process.on('SIGINT', () => cleanupAndExit(0));
process.on('SIGTERM', () => cleanupAndExit(0));
process.on('exit', () => {
  while (runningChildren.length > 0) {
    const child = runningChildren.pop();
    if (child && child.pid) {
      killProcessTree(child.pid);
    }
  }
});

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    target: 'all', // 'all' | 'backend' | 'frontend' | 'check'
    cwd: null,
    autoInstall: true,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--all' || arg === '-a') {
      options.target = 'all';
    } else if (arg === '--backend' || arg === '--egg' || arg === '-b') {
      options.target = 'backend';
    } else if (arg === '--frontend' || arg === '--vue' || arg === '-f') {
      options.target = 'frontend';
    } else if (arg === '--check' || arg === '-c') {
      options.target = 'check';
    } else if (arg === '--no-install') {
      options.autoInstall = false;
    } else if (arg === '--cwd') {
      const nextArg = args[++i];
      if (!nextArg || nextArg.startsWith('-')) {
        console.error(`${colors.red}错误: --cwd 选项必须指定有效的项目根目录路径${colors.reset}`);
        process.exit(1);
      }
      options.cwd = nextArg;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
${colors.bright}${colors.cyan}豆豆开发环境一键启动工具 (doudou-dev)${colors.reset}

${colors.bright}用法:${colors.reset}
  node dev.mjs [选项]

${colors.bright}选项:${colors.reset}
  --all, -a          同时启动后端 (doudou-eggjs) 和前端 (doudou-vue3) [默认]
  --backend, -b      仅启动后端服务 (doudou-eggjs, npm run dev)
  --frontend, -f     仅启动前端管理端 (doudou-vue3, pnpm dev)
  --check, -c        仅执行环境自检与端口探测
  --cwd <路径>       显式指定项目根目录路径
  --no-install       不自动安装缺失的 node_modules
  --help, -h         显示本帮助信息

${colors.bright}示例:${colors.reset}
  node dev.mjs                  # 启动全部服务
  node dev.mjs --backend        # 仅调试后端
  node dev.mjs --frontend       # 仅调试前端
  node dev.mjs --check          # 环境体检
`);
}

// 管道转发输出并加前缀
function pipeOutput(stream, prefix, prefixColor) {
  if (!stream) return;
  const rl = readline.createInterface({ input: stream });
  rl.on('line', (line) => {
    console.log(`${prefixColor}${prefix}${colors.reset} ${line}`);
  });
}

// 自动安装依赖
async function ensureDependencies(projectDir, pkgManager, name) {
  const nodeModulesPath = path.join(projectDir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log(`${colors.yellow}[${name}] 未检测到 node_modules，正在执行 ${pkgManager} install 安装依赖...${colors.reset}`);
    try {
      execSync(`${pkgManager} install`, {
        cwd: projectDir,
        stdio: 'inherit',
        shell: true,
      });
      console.log(`${colors.green}[${name}] 依赖安装完成！${colors.reset}\n`);
    } catch (err) {
      console.error(`${colors.red}[${name}] 依赖安装失败，请手动在 ${projectDir} 目录下执行 ${pkgManager} install${colors.reset}`);
      throw err;
    }
  }
}

// 启动子服务
function startService({ name, cwd, command, args, prefixColor }) {
  console.log(`${prefixColor}[${name}] 正在启动: ${command} ${args.join(' ')} (目录: ${cwd})${colors.reset}`);

  // Windows 下必须使用 shell: true 以兼容 npm/pnpm 脚本
  const isWin = process.platform === 'win32';
  const child = spawn(command, args, {
    cwd,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: !isWin, // POSIX 下便于整组 kill
    env: {
      ...process.env,
      FORCE_COLOR: '1',
    },
  });

  runningChildren.push(child);

  pipeOutput(child.stdout, `[${name}]`, prefixColor);
  pipeOutput(child.stderr, `[${name}]`, colors.red);

  child.on('error', (err) => {
    console.error(`${colors.red}[${name}] 进程错误: ${err.message}${colors.reset}`);
  });

  child.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.log(`${colors.yellow}[${name}] 进程已退出，退出码: ${code}${colors.reset}`);
    } else if (signal) {
      console.log(`${colors.gray}[${name}] 进程已收到信号终止: ${signal}${colors.reset}`);
    }
  });

  return child;
}

// 主流程
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  // 1. 寻找项目根目录
  const projectRoot = options.cwd ? path.resolve(options.cwd) : findProjectRoot(process.cwd());

  if (!projectRoot) {
    console.error(`${colors.red}错误: 未能找到包含 doudou-eggjs 与 doudou-vue3 的项目根目录！${colors.reset}`);
    console.error(`请在 doudou-ai-coding 项目目录下运行，或通过 --cwd 参数指定路径。`);
    process.exit(1);
  }

  const eggDir = path.join(projectRoot, 'doudou-eggjs');
  const vueDir = path.join(projectRoot, 'doudou-vue3');

  // 2. 如果是纯检查模式
  if (options.target === 'check') {
    await runCheck({ cwd: projectRoot });
    return;
  }

  // 3. 执行启动前环境检查
  const checkResult = await runCheck({ cwd: projectRoot });

  const startBackend = options.target === 'all' || options.target === 'backend';
  const startFrontend = options.target === 'all' || options.target === 'frontend';

  // 4. 依赖检查与安装
  if (options.autoInstall) {
    if (startBackend && fs.existsSync(eggDir)) {
      await ensureDependencies(eggDir, 'npm', 'EggJS');
    }
    if (startFrontend && fs.existsSync(vueDir)) {
      await ensureDependencies(vueDir, 'pnpm', 'Vue3');
    }
  }

  console.log(`\n${colors.bright}${colors.green}>>> 启动服务中 (按 Ctrl+C 可停止全部服务) <<<${colors.reset}\n`);

  // 5. 启动后端 (doudou-eggjs: npm run dev)
  if (startBackend) {
    if (fs.existsSync(eggDir)) {
      startService({
        name: 'EggJS',
        cwd: eggDir,
        command: 'npm',
        args: ['run', 'dev'],
        prefixColor: colors.cyan,
      });
    } else {
      console.error(`${colors.red}未找到后端目录: ${eggDir}${colors.reset}`);
    }
  }

  // 6. 启动前端 (doudou-vue3: pnpm dev)
  if (startFrontend) {
    if (fs.existsSync(vueDir)) {
      // 稍微延迟 1 秒，让后端端口先建立
      if (startBackend) {
        await new Promise((r) => setTimeout(r, 1000));
      }
      startService({
        name: 'Vue3',
        cwd: vueDir,
        command: 'pnpm',
        args: ['dev'],
        prefixColor: colors.green,
      });
    } else {
      console.error(`${colors.red}未找到前端目录: ${vueDir}${colors.reset}`);
    }
  }
}

main().catch((err) => {
  console.error(`${colors.red}运行失败:${colors.reset}`, err);
  cleanupAndExit(1);
});
