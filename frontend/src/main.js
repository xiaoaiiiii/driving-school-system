import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import router from './router'
import App from './App.vue'
import './styles/reset.css'

// ===== 新会话检测：浏览器新开标签 / 新窗口 / 重新打开本系统时强制跳到登录页 =====
// sessionStorage 在同一标签页内刷新仍然存在，但新开标签 / 新窗口 / 关闭重开会被清空，
// 利用这一特性可区分"新会话"（必须重新登录）与"当前标签内刷新"（保持登录态）。
const SESSION_INIT_KEY = 'app_session_initialized'
const isNewSession = !sessionStorage.getItem(SESSION_INIT_KEY)

if (isNewSession) {
  sessionStorage.setItem(SESSION_INIT_KEY, '1')
  // 清除可能残留的登录信息，强制让用户重新登录
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  // 把 hash 替换为 #/login，避免初始 URL 残留（例如 #/admin）
  if (location.hash !== '#/login' && location.hash !== '#' && location.hash !== '') {
    location.replace(location.pathname + location.search + '#/login')
  }
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Antd)

app.mount('#app')
