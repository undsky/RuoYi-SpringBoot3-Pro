import { getToken } from '@/utils/auth'

// 登录页面
const loginPage = "/pages/login"
  
// 页面白名单
const whiteList = [
  '/pages/login', '/pages/register', '/pages/common/webview/index'
]

// 检查地址白名单
function checkWhite(url) {
  const raw = url.split('?')[0]
  const path = raw.startsWith('/') ? raw : '/' + raw
  return whiteList.indexOf(path) !== -1
}

// 页面跳转验证拦截器
let list = ["navigateTo", "redirectTo", "reLaunch", "switchTab"]
list.forEach(item => {
  uni.addInterceptor(item, {
    invoke(to) {
      const raw = to.url.split('?')[0]
      const path = raw.startsWith('/') ? raw : '/' + raw
      if (getToken()) {
        if (path === loginPage) {
          uni.reLaunch({ url: "/pages/index" })
          return false
        }
        return true
      } else {
        if (checkWhite(to.url)) {
          return true
        }
        uni.reLaunch({ url: loginPage })
        return false
      }
    },
    fail(err) {
      console.log(err)
    }
  })
})
