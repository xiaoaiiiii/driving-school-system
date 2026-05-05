<template>
  <div class="layout">
    <div class="layout-header">
      <div class="header-logo">驾校约课系统</div>
      <div class="header-user">
        <span class="user-name">{{ userInfo?.real_name || userInfo?.username }}</span>
        <a-dropdown>
          <a-avatar :size="32" style="background-color: #1890ff">
            {{ (userInfo?.real_name || userInfo?.username)?.charAt(0)?.toUpperCase() }}
          </a-avatar>
          <template #overlay>
            <a-menu>
              <a-menu-item key="logout" @click="handleLogout">
                <LogoutOutlined />
                退出登录
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
    <div class="layout-body">
      <div class="layout-sidebar">
        <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="inline"
          :style="{ height: '100%', borderRight: 0 }"
        >
          <a-menu-item key="courses" @click="navigateTo('/courses')">
            <BookOutlined />
            <span>课程列表</span>
          </a-menu-item>

          <!-- 学员显示学员端的"我的预约" -->
          <a-menu-item v-if="userInfo?.role === 'student'" key="appointments" @click="navigateTo('/appointments')">
            <CalendarOutlined />
            <span>我的预约</span>
          </a-menu-item>

          <!-- 教练显示教练端的"我的预约" -->
          <a-menu-item v-if="userInfo?.role === 'instructor' || userInfo?.role === 'coach'" key="instructor-appointments" @click="navigateTo('/instructor-appointments')">
            <CalendarOutlined />
            <span>我的预约</span>
          </a-menu-item>

          <!-- 只有教练显示"我的排课" -->
          <a-menu-item v-if="userInfo?.role === 'instructor' || userInfo?.role === 'coach'" key="instructor-courses" @click="navigateTo('/instructor-courses')">
            <SettingOutlined />
            <span>我的排课</span>
          </a-menu-item>

          <a-menu-item v-if="userInfo?.role === 'admin'" key="admin" @click="navigateTo('/admin')">
            <SettingOutlined />
            <span>管理后台</span>
          </a-menu-item>
        </a-menu>
      </div>
      <div class="layout-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { LogoutOutlined, BookOutlined, CalendarOutlined, SettingOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const selectedKeys = ref(['courses'])
const userInfo = computed(() => userStore.userInfo)

const navigateTo = (path) => {
  router.push(path)
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  const path = route.path
  if (path.includes('/admin')) {
    selectedKeys.value = ['admin']
  } else if (path.includes('/instructor-appointments')) {
    selectedKeys.value = ['instructor-appointments']
  } else if (path.includes('/appointments')) {
    selectedKeys.value = ['appointments']
  } else if (path.includes('/instructor-courses')) {
    selectedKeys.value = ['instructor-courses']
  } else if (path.includes('/courses')) {
    selectedKeys.value = ['courses']
  }
})
</script>

<style scoped>
.layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.layout-header {
  height: 64px;
  background: #001529;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  color: #fff;
}
.header-logo {
  font-size: 20px;
  font-weight: bold;
}
.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-name {
  font-size: 14px;
}
.layout-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.layout-sidebar {
  width: 200px;
  background: #fff;
  border-right: 1px solid #f0f0f0;
}
.layout-content {
  flex: 1;
  overflow: auto;
  background: #f0f2f5;
  padding: 24px;
}
</style>
