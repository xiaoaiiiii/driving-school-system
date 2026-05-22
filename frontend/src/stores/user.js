import { defineStore } from 'pinia'
import { ref } from 'vue'
import { normalizeEncoding } from '@/utils/encoding'

// 从 localStorage 安全读取持久化的 userInfo
const readPersistedUserInfo = () => {
  try {
    const raw = localStorage.getItem('userInfo')
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    // 解析失败时清掉脏数据，避免影响后续逻辑
    localStorage.removeItem('userInfo')
    return null
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  // 刷新后立刻可用：从 localStorage 恢复 userInfo
  const userInfo = ref(readPersistedUserInfo())

  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  const setUserInfo = (info) => {
    const normalized = normalizeEncoding(info)
    userInfo.value = normalized
    if (normalized) {
      try {
        localStorage.setItem('userInfo', JSON.stringify(normalized))
      } catch (e) {
        // 序列化失败时忽略，保持内存中的 userInfo 即可
      }
    } else {
      localStorage.removeItem('userInfo')
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    setToken,
    setUserInfo,
    logout
  }
})
