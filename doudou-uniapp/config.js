// 应用全局配置
const isDev = process.env.NODE_ENV === 'development'

export default {
  // 服务端接口基础路径
  // 注意：在真机或微信小程序调试时，localhost 会指向手机自身，需将开发地址修改为电脑局域网 IP（如 http://192.168.x.x:7001）
  baseUrl: isDev ? 'http://localhost:7001' : 'https://api.undsky.com',
  // 应用信息
  appInfo: {
    // 应用名称
    name: "doudou-app",
    // 应用版本
    version: "1.2.0",
    // 应用logo
    logo: "/static/logo.png",
    // 官方网站
    site_url: "https://www.undsky.com"
  }
}
