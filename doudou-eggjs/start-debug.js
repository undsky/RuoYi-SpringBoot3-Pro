const net = require('net');
const { spawn } = require('child_process');

// 检查端口是否被占用
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

// 查找可用端口
async function findAvailablePort(startPort, endPort) {
  for (let port = startPort; port <= endPort; port++) {
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
  }
  return null;
}

async function startDebug() {
  // 查找可用的调试端口 (9229-9239)
  const debugPort = await findAvailablePort(9229, 9239);
  if (!debugPort) {
    console.error('无法找到可用的调试端口 (9229-9239)');
    process.exit(1);
  }

  // 查找可用的 inspector-proxy 端口 (9999-10009)
  const inspectorPort = await findAvailablePort(9999, 10009);
  if (!inspectorPort) {
    console.error('无法找到可用的 inspector-proxy 端口 (9999-10009)');
    process.exit(1);
  }

  console.log(`使用调试端口: ${debugPort}`);
  console.log(`使用 inspector-proxy 端口: ${inspectorPort}`);

  // 启动 egg-bin debug
  const child = spawn('egg-bin', ['debug', `--inspect=${debugPort}`, `--proxy=${inspectorPort}`], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      EGG_DEBUG_PORT: debugPort,
      EGG_INSPECT_PROXY_PORT: inspectorPort
    }
  });

  child.on('error', (err) => {
    console.error('启动失败:', err);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code);
  });
}

startDebug();
