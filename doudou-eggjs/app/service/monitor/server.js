/*
 * @Description: 服务监控服务层
 * @Author: 姜彦汐
 * @Date: 2025-11-21
 */

const Service = require('egg').Service;
const os = require('os');
const { execSync } = require('child_process');
const dayjs = require('dayjs');

class ServerService extends Service {

  /**
   * 获取服务器信息
   * @return {object} 服务器信息
   */
  async getServerInfo() {
    const cpu = await this.getCpuInfo();
    const mem = this.getMemInfo();
    const sys = this.getSysInfo();
    const jvm = this.getJvmInfo();
    const sysFiles = await this.getSysFiles();
    
    return {
      cpu,
      mem,
      sys,
      jvm,
      sysFiles
    };
  }

  /**
   * 获取 CPU 信息（通过缓存上次采样实现 0 延迟获取使用率）
   * @return {object} CPU 信息
   */
  async getCpuInfo() {
    const cpus = os.cpus();
    
    if (!cpus || cpus.length === 0) {
      return {
        cpuNum: 0,
        total: 0,
        sys: 0,
        used: 0,
        wait: 0,
        free: 0
      };
    }
    
    const ticks = this.getCpuTicks();
    let prevTicks = this.app._lastCpuTicks;

    if (!prevTicks) {
      // 首次调用短暂停顿 100ms 进行即时采样
      prevTicks = ticks;
      await this.sleep(100);
      const newTicks = this.getCpuTicks();
      this.app._lastCpuTicks = newTicks;
      return this.calcCpuRatio(cpus.length, prevTicks, newTicks);
    }

    // 后续请求与上次采样比对，无需等待 1 秒
    this.app._lastCpuTicks = ticks;
    return this.calcCpuRatio(cpus.length, prevTicks, ticks);
  }

  /**
   * 计算 CPU 使用率百分比
   */
  calcCpuRatio(cpuNum, prevTicks, ticks) {
    const user = ticks.user - prevTicks.user;
    const nice = ticks.nice - prevTicks.nice;
    const sys = ticks.sys - prevTicks.sys;
    const idle = ticks.idle - prevTicks.idle;
    const irq = ticks.irq - prevTicks.irq;
    const iowait = 0;

    const total = user + nice + sys + idle + irq + iowait;
    if (total <= 0) {
      return { cpuNum, total: 0, sys: 0, used: 0, wait: 0, free: 100 };
    }

    const usedRatio = this.round(((user + nice) / total) * 100, 2);
    const sysRatio = this.round((sys / total) * 100, 2);
    const freeRatio = this.round((idle / total) * 100, 2);
    const totalRatio = this.round(((total - idle) / total) * 100, 2);

    return {
      cpuNum,
      total: totalRatio,
      sys: sysRatio,
      used: usedRatio,
      wait: 0,
      free: freeRatio
    };
  }

  /**
   * 获取 CPU 时间片总和
   * @return {object} CPU 时间片
   */
  getCpuTicks() {
    const cpus = os.cpus();
    let user = 0;
    let nice = 0;
    let sys = 0;
    let idle = 0;
    let irq = 0;
    
    cpus.forEach(cpu => {
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      idle += cpu.times.idle;
      irq += cpu.times.irq;
    });
    
    return { user, nice, sys, idle, irq };
  }

  /**
   * 获取内存信息
   * @return {object} 内存信息
   */
  getMemInfo() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    
    return {
      total: this.round(total / (1024 * 1024 * 1024), 2),
      used: this.round(used / (1024 * 1024 * 1024), 2),
      free: this.round(free / (1024 * 1024 * 1024), 2),
      usage: this.round((used / total) * 100, 2)
    };
  }

  /**
   * 获取系统信息
   * @return {object} 系统信息
   */
  getSysInfo() {
    return {
      computerName: os.hostname(),
      computerIp: this.getHostIp(),
      osName: this.getOsName(),
      osArch: os.arch(),
      userDir: process.cwd()
    };
  }

  /**
   * 获取 JVM（Node.js 运行时）信息
   * @return {object} JVM 信息
   */
  getJvmInfo() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    const startTime = Date.now() - uptime * 1000;
    
    // Node.js 中 heapTotal 相当于 JVM 的 total，rss 相当于 max
    const total = memUsage.heapTotal;
    const max = memUsage.rss;
    const used = memUsage.heapUsed;
    const free = total - used;
    
    return {
      total: this.round(total / (1024 * 1024), 2),
      max: this.round(max / (1024 * 1024), 2),
      used: this.round(used / (1024 * 1024), 2),
      free: this.round(free / (1024 * 1024), 2),
      usage: this.round((used / total) * 100, 2),
      name: 'Node.js',
      version: process.version,
      home: process.execPath,
      startTime: dayjs(startTime).format('YYYY-MM-DD HH:mm:ss'),
      runTime: this.getRunTime(uptime),
      inputArgs: process.execArgv.join(' ') || '-'
    };
  }

  /**
   * 获取磁盘信息
   * @return {array} 磁盘信息列表
   */
  async getSysFiles() {
    const sysFiles = [];
    
    try {
      const platform = os.platform();
      
      if (platform === 'win32') {
        // Windows 系统
        sysFiles.push(...this.getWindowsDiskInfo());
      } else if (platform === 'darwin') {
        // macOS 系统
        sysFiles.push(...this.getMacDiskInfo());
      } else {
        // Linux 系统
        sysFiles.push(...this.getLinuxDiskInfo());
      }
    } catch (err) {
      this.ctx.logger.error('获取磁盘信息失败：', err);
    }
    
    return sysFiles;
  }

  /**
   * 获取 Windows 磁盘信息
   * @return {array} 磁盘信息列表
   */
  getWindowsDiskInfo() {
    const sysFiles = [];
    
    try {
      // 使用 wmic 命令获取磁盘信息
      const output = execSync('wmic logicaldisk get caption,filesystem,size,freespace', { encoding: 'utf8' });
      const lines = output.trim().split('\n').slice(1); // 跳过标题行
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          const caption = parts[0];
          const filesystem = parts[1];
          const freespace = parseInt(parts[2] || 0);
          const size = parseInt(parts[3] || 0);
          
          if (size > 0) {
            const used = size - freespace;
            sysFiles.push({
              dirName: caption,
              sysTypeName: filesystem,
              typeName: caption,
              total: this.convertFileSize(size),
              free: this.convertFileSize(freespace),
              used: this.convertFileSize(used),
              usage: this.round((used / size) * 100, 2)
            });
          }
        }
      });
    } catch (err) {
      this.ctx.logger.error('获取 Windows 磁盘信息失败：', err);
    }
    
    return sysFiles;
  }

  /**
   * 获取 macOS 磁盘信息
   * @return {array} 磁盘信息列表
   */
  getMacDiskInfo() {
    const sysFiles = [];
    
    try {
      // 使用 df 命令获取磁盘信息
      const output = execSync('df -k', { encoding: 'utf8' });
      const lines = output.trim().split('\n').slice(1); // 跳过标题行
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 9) {
          const filesystem = parts[0];
          const total = parseInt(parts[1]) * 1024; // 转换为字节
          const used = parseInt(parts[2]) * 1024;
          const free = parseInt(parts[3]) * 1024;
          const mount = parts[8];
          
          // 只显示物理磁盘和主要挂载点
          if (filesystem.startsWith('/dev/') && (mount === '/' || mount.startsWith('/Volumes/'))) {
            sysFiles.push({
              dirName: mount,
              sysTypeName: 'apfs',
              typeName: filesystem,
              total: this.convertFileSize(total),
              free: this.convertFileSize(free),
              used: this.convertFileSize(used),
              usage: this.round((used / total) * 100, 2)
            });
          }
        }
      });
    } catch (err) {
      this.ctx.logger.error('获取 macOS 磁盘信息失败：', err);
    }
    
    return sysFiles;
  }

  /**
   * 获取 Linux 磁盘信息
   * @return {array} 磁盘信息列表
   */
  getLinuxDiskInfo() {
    const sysFiles = [];
    
    try {
      // 使用 df 命令获取磁盘信息
      const output = execSync('df -k', { encoding: 'utf8' });
      const lines = output.trim().split('\n').slice(1); // 跳过标题行
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 6) {
          const filesystem = parts[0];
          const total = parseInt(parts[1]) * 1024; // 转换为字节
          const used = parseInt(parts[2]) * 1024;
          const free = parseInt(parts[3]) * 1024;
          const mount = parts[5];
          
          // 只显示物理磁盘
          if (filesystem.startsWith('/dev/') && !filesystem.includes('loop')) {
            sysFiles.push({
              dirName: mount,
              sysTypeName: 'ext4',
              typeName: filesystem,
              total: this.convertFileSize(total),
              free: this.convertFileSize(free),
              used: this.convertFileSize(used),
              usage: this.round((used / total) * 100, 2)
            });
          }
        }
      });
    } catch (err) {
      this.ctx.logger.error('获取 Linux 磁盘信息失败：', err);
    }
    
    return sysFiles;
  }

  /**
   * 获取本机 IP 地址
   * @return {string} IP 地址
   */
  getHostIp() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // 跳过内部和非 IPv4 地址
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    
    return '127.0.0.1';
  }

  /**
   * 获取操作系统名称
   * @return {string} 操作系统名称
   */
  getOsName() {
    const platform = os.platform();
    const release = os.release();
    
    switch (platform) {
      case 'darwin':
        return `macOS ${release}`;
      case 'win32':
        return `Windows ${release}`;
      case 'linux':
        return `Linux ${release}`;
      default:
        return `${platform} ${release}`;
    }
  }

  /**
   * 获取运行时间
   * @param {number} uptime - 运行时间（秒）
   * @return {string} 格式化后的时间
   */
  getRunTime(uptime) {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    return `${days}天${hours}小时${minutes}分钟`;
  }

  /**
   * 字节转换
   * @param {number} size - 字节大小
   * @return {string} 转换后值
   */
  convertFileSize(size) {
    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;
    
    if (size >= gb) {
      return `${this.round(size / gb, 1)} GB`;
    } else if (size >= mb) {
      const value = size / mb;
      return value > 100 ? `${this.round(value, 0)} MB` : `${this.round(value, 1)} MB`;
    } else if (size >= kb) {
      const value = size / kb;
      return value > 100 ? `${this.round(value, 0)} KB` : `${this.round(value, 1)} KB`;
    } else {
      return `${size} B`;
    }
  }

  /**
   * 四舍五入保留小数
   * @param {number} value - 数值
   * @param {number} scale - 小数位数
   * @return {number} 四舍五入后的值
   */
  round(value, scale) {
    const multiplier = Math.pow(10, scale);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @return {Promise} Promise 对象
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ServerService;

