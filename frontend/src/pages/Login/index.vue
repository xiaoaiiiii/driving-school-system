<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>驾校约课系统</h1>
        <p>欢迎登录</p>
      </div>
      <a-form
        :model="formData"
        @finish="handleLogin"
        layout="vertical"
      >
        <a-form-item
          label="用户名"
          name="username"
          :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <a-input
            v-model:value="formData.username"
            placeholder="请输入用户名"
            size="large"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="密码"
          name="password"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password
            v-model:value="formData.password"
            placeholder="请输入密码"
            size="large"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>
        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            block
            :loading="loading"
          >
            登录
          </a-button>
        </a-form-item>
      </a-form>
      <div class="login-footer">
        <span>还没有账号？</span>
        <a @click="goToRegister">立即注册</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { authApi } from '@/services/auth'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const formData = ref({
  username: '',
  password: ''
})

const handleLogin = async () => {
  loading.value = true
  try {
    const res = await authApi.login(formData.value)
    userStore.setToken(res.token)
    userStore.setUserInfo(res.userInfo)
    message.success('登录成功')
    // 根据用户角色进行不同的重定向
    if (res.userInfo.role === 'admin') {
      router.push('/admin')
    } else if (res.userInfo.role === 'student') {
      router.push('/courses')
    } else if (res.userInfo.role === 'instructor' || res.userInfo.role === 'coach') {
      router.push('/instructor-appointments')
    } else {
      router.push('/courses')
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  message.info('注册功能暂未开放')
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}
.login-header p {
  font-size: 14px;
  color: #999;
}
.login-footer {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}
.login-footer a {
  color: #1890ff;
  cursor: pointer;
}
</style>
