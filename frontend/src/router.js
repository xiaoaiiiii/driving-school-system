import * as VueRouter from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from './stores/user'

const routes = [
  {
    name: 'Root',
    path: '/',
    redirect: '/login'
  },
  {
    name: 'Login',
    path: '/login',
    meta: { menu: '登录' },
    component: () => import('@/pages/Login/index.vue')
  },
  {
    name: 'Layout',
    path: '/',
    component: () => import('@/pages/Layout/index.vue'),
    redirect: '/courses',
    children: [
      {
        name: 'CourseList',
        path: 'courses',
        meta: { menu: '课程列表' },
        component: () => import('@/pages/CourseList/index.vue')
      },
      {
        name: 'MyAppointments',
        path: 'appointments',
        meta: { menu: '我的预约', roles: ['student'] },
        component: () => import('@/pages/MyAppointments/index.vue')
      },
      {
        name: 'InstructorAppointments',
        path: 'instructor-appointments',
        meta: { menu: '我的预约', roles: ['coach', 'instructor'] },
        component: () => import('@/pages/InstructorAppointments/index.vue')
      },
      {
        name: 'InstructorCourses',
        path: 'instructor-courses',
        meta: { menu: '我的排课', roles: ['coach', 'instructor'] },
        component: () => import('@/pages/InstructorCourses/index.vue')
      },
      {
        name: 'Admin',
        path: 'admin',
        meta: { menu: '管理后台', roles: ['admin'] },
        component: () => import('@/pages/Admin/index.vue')
      }
    ]
  },
  {
    name: 'NotFound',
    path: '/:pathMatch(.*)',
    component: () => import('@/pages/NotFound.vue')
  }
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.path !== '/login' && !token) {
    next('/login')
    return
  }
  
  if (to.path === '/login' && token) {
    // 如果用户已登录且访问登录页，根据角色重定向到对应首页
    const userStore = useUserStore()
    const userRole = userStore.userInfo?.role
    if (userRole === 'admin') {
      next('/admin')
    } else if (userRole === 'instructor' || userRole === 'coach') {
      next('/instructor-appointments')
    } else {
      next('/courses')
    }
    return
  }
  
  // 检查路由权限
  if (to.meta?.roles) {
    const userStore = useUserStore()
    const userRole = userStore.userInfo?.role
    
    // 如果路由有 roles 配置，检查用户角色是否在允许范围内
    if (userRole && !to.meta.roles.includes(userRole)) {
      message.error('无权访问')
      // 根据用户角色重定向到对应的首页
      if (userRole === 'admin') {
        next('/admin')
      } else if (userRole === 'instructor' || userRole === 'coach') {
        next('/instructor-appointments')
      } else {
        next('/courses')
      }
      return
    }
  }
  
  next()
})

router.afterEach((to) => {
  if (to.meta?.menu) {
    document.title = '驾校约课系统 - ' + to.meta.menu
  }
})

export default router
