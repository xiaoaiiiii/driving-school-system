<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>404</h1>
      <p>页面不存在</p>
      <a-button type="primary" @click="goHome">返回首页</a-button>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    const goHome = () => {
      router.push('/courses')
    }
    return { goHome }
  }
}
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f0f2f5;
}
.not-found-content {
  text-align: center;
}
.not-found-content h1 {
  font-size: 72px;
  color: #1890ff;
  margin-bottom: 16px;
}
.not-found-content p {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 24px;
}
</style>
