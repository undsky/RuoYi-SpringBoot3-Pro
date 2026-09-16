#!/usr/bin/env node

/**
 * 跨平台生产打包构建工具 (Windows, macOS, Linux)
 * 支持同时或分别构建 doudou-eggjs 与 doudou-vue3 的生产产物
 * 
 * 用法:
 *   node build.mjs               # 一键打包前后端（默认）
 *   node build.mjs --all         # 一键打包前后端
 *   node build.mjs --backend     # 仅打包 doudou-eggjs (npm run build)
 *   node build.mjs --frontend    # 仅打包 doudou-vue3 (pnpm run build:prod)
 *   node build.mjs --cwd <path>  # 指定项目根目录
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findProjectRoot } from './check.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 终端颜色
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

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    target: 'all', // 'all' | 'backend' | 'frontend'
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
${colors.bright}${colors.cyan}豆豆生产打包构建工具 (doudou-dev build)${colors.reset}

${colors.bright}用法:${colors.reset}
  node build.mjs [选项]

${colors.bright}选项:${colors.reset}
  --all, -a          同时构建后端 (doudou-eggjs) 和前端 (doudou-vue3) [默认]
  --backend, -b      仅构建后端产物 (doudou-eggjs: npm run build -> rec build -o dist)
  --frontend, -f     仅构建前端产物 (doudou-vue3: pnpm run build:prod -> vite build)
  --cwd <路径>       显式指定项目根目录路径
  --no-install       不自动安装缺失的 node_modules
  --help, -h         显示本帮助信息

${colors.bright}示例:${colors.reset}
  node build.mjs                  # 打包前后端全部产物
  node build.mjs --backend        # 仅打包后端
  node build.mjs --frontend       # 仅打包前端
`);
}

// 自动安装依赖
function ensureDependencies(projectDir, pkgManager, name) {
  const nodeModulesPath = path.join(projectDir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log(`[${name}] 未检测到 node_modules，正在执行 ${pkgManager} install 安装依赖...`, colors.yellow);
    try {
      execSync(`${pkgManager} install`, {
        cwd: projectDir,
        stdio: 'inherit',
        shell: true,
      });
      success(`[${name}] 依赖安装完成！`);
    } catch (err) {
      log(`[${name}] 依赖安装失败，请手动在 ${projectDir} 目录下执行 ${pkgManager} install`, colors.red);
      throw err;
    }
  }
}

// 执行命令封装为 Promise
function runCommand(command, args, cwd, name, color) {
  return new Promise((resolve, reject) => {
    log(`\n${color}========== [${name}] 开始构建: ${command} ${args.join(' ')} ==========${colors.reset}`);
    const startTime = Date.now();

    const child = spawn(command, args, {
      cwd,
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: '1',
      },
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      if (code === 0) {
        log(`${color}========== [${name}] 构建成功 (耗时: ${duration}s) ==========${colors.reset}\n`);
        resolve({ code, duration });
      } else {
        log(`${colors.red}========== [${name}] 构建失败 (退出码: ${code}) ==========${colors.reset}\n`);
        reject(new Error(`[${name}] 构建进程异常退出，退出码: ${code}`));
      }
    });
  });
}

// 统计目录大小
function getDirSize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let totalSize = 0;
  function calculate(itemPath) {
    try {
      const stat = fs.lstatSync(itemPath);
      if (stat.isSymbolicLink()) {
        return; // 忽略符号链接，避免死循环或失效链接
      }
      if (stat.isDirectory()) {
        const files = fs.readdirSync(itemPath);
        for (const file of files) {
          calculate(path.join(itemPath, file));
        }
      } else {
        totalSize += stat.size;
      }
    } catch {
      // 忽略无法访问的临时文件
    }
  }
  calculate(dirPath);
  return (totalSize / (1024 * 1024)).toFixed(2); // MB
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  // 1. 定位项目根目录
  const projectRoot = options.cwd ? path.resolve(options.cwd) : findProjectRoot(process.cwd());

  if (!projectRoot) {
    console.error(`${colors.red}错误: 未能找到包含 doudou-eggjs 与 doudou-vue3 的项目根目录！${colors.reset}`);
    process.exit(1);
  }

  const eggDir = path.join(projectRoot, 'doudou-eggjs');
  const vueDir = path.join(projectRoot, 'doudou-vue3');

  const buildBackend = options.target === 'all' || options.target === 'backend';
  const buildFrontend = options.target === 'all' || options.target === 'frontend';

  log(`\n${colors.bright}${colors.cyan}================ 豆豆项目生产打包 (doudou-dev build) ================${colors.reset}`);
  log(`项目根目录: ${projectRoot}`, colors.gray);

  // 2. 检查并安装缺失依赖
  if (options.autoInstall) {
    if (buildBackend && fs.existsSync(eggDir)) {
      ensureDependencies(eggDir, 'npm', 'EggJS 后端');
    }
    if (buildFrontend && fs.existsSync(vueDir)) {
      ensureDependencies(vueDir, 'pnpm', 'Vue3 前端');
    }
  }

  const results = [];

  // 3. 构建后端
  if (buildBackend) {
    if (fs.existsSync(eggDir)) {
      try {
        const res = await runCommand('npm', ['run', 'build'], eggDir, 'EggJS 后端', colors.cyan);
        const distDir = path.join(eggDir, 'dist');
        const sizeMb = getDirSize(distDir);
        results.push({
          name: '后端 (doudou-eggjs)',
          cmd: 'npm run build',
          output: distDir,
          size: `${sizeMb} MB`,
          duration: `${res.duration}s`,
          success: true,
        });
      } catch (err) {
        results.push({
          name: '后端 (doudou-eggjs)',
          cmd: 'npm run build',
          error: err.message,
          success: false,
        });
      }
    } else {
      log(`未找到后端目录: ${eggDir}`, colors.red);
    }
  }

  // 4. 构建前端
  if (buildFrontend) {
    if (fs.existsSync(vueDir)) {
      try {
        const res = await runCommand('pnpm', ['run', 'build:prod'], vueDir, 'Vue3 前端', colors.green);
        // 读取 vue 的构建输出目录（通常为 doudou-vue 或 dist）
        let outDirName = 'doudou-vue';
        const envProdPath = path.join(vueDir, '.env.production');
        if (fs.existsSync(envProdPath)) {
          const content = fs.readFileSync(envProdPath, 'utf8');
          const match = content.match(/VITE_OUT_DIR\s*=\s*([^\r\n#]+)/);
          if (match && match[1]) {
            outDirName = match[1].trim().replace(/^['"]|['"]$/g, '');
          }
        }
        const distDir = path.join(vueDir, outDirName);
        const fallbackDistDir = fs.existsSync(distDir) ? distDir : path.join(vueDir, 'dist');
        const sizeMb = getDirSize(fallbackDistDir);

        results.push({
          name: '前端 (doudou-vue3)',
          cmd: 'pnpm run build:prod',
          output: fallbackDistDir,
          size: `${sizeMb} MB`,
          duration: `${res.duration}s`,
          success: true,
        });
      } catch (err) {
        results.push({
          name: '前端 (doudou-vue3)',
          cmd: 'pnpm run build:prod',
          error: err.message,
          success: false,
        });
      }
    } else {
      log(`未找到前端目录: ${vueDir}`, colors.red);
    }
  }

  // 5. 打印打包总结
  log(`\n${colors.bright}${colors.cyan}======================== 打包结果汇总 ========================${colors.reset}`);
  let hasFailure = false;
  for (const item of results) {
    if (item.success) {
      log(`\n  ${colors.green}✔ ${item.name}${colors.reset}`);
      log(`    执行命令: ${item.cmd}`, colors.gray);
      log(`    产物目录: ${item.output}`);
      log(`    产物大小: ${item.size} | 构建耗时: ${item.duration}`, colors.gray);
    } else {
      hasFailure = true;
      log(`\n  ${colors.red}✖ ${item.name}${colors.reset}`);
      log(`    执行命令: ${item.cmd}`, colors.gray);
      log(`    失败原因: ${item.error}`, colors.red);
    }
  }
  log(`\n${colors.bright}${colors.cyan}==============================================================${colors.reset}\n`);

  if (hasFailure) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${colors.red}打包异常退出:${colors.reset}`, err);
  process.exit(1);
});
