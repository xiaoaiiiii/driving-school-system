import axios from 'axios'
import router from '@/router'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'

const request = (opt = {}) => {
  const { baseURL = '/api', path = '' } = opt
  const srv = axios.create({
    baseURL: baseURL + path,
    withCredentials: true,
    timeout: 30000,
  })

  srv.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
      return config
    },
    error => {
      console.log(error)
      return Promise.reject(error)
    }
  )

  srv.interceptors.response.use(
    response => {
      const { respCode, respData, respMsg } = response.data
      if (respCode === '00000') {
        return respData
      } else if (respCode === '10001') {
        message.error('登录已过期，请重新登录')
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
        return Promise.reject(respMsg)
      } else {
        message.error(respMsg || '请求失败')
        return Promise.reject(respMsg)
      }
    },
    error => {
      if (error.message !== 'Network Error') {
        message.error(error.message || '网络错误')
      }
      return Promise.reject(error)
    }
  )

  return srv
}

export const AUTH_SRV = request({ path: '/auth' })
export const COURSE_SRV = request({ path: '/courses' })
export const APPOINT_SRV = request({ path: '/appointments' })
export const ADMIN_SRV = request({ path: '/admin' })

export default request
