# 驾校约课系统 - 前端

基于 Vue 3 + Vite + Pinia + Vue Router + Ant Design Vue 开发的驾校约课系统前端。

## 技术栈

- Vue 3.5.16
- Vite 4.5.0
- Pinia 2.1.7
- Vue Router 4.2.5
- Ant Design Vue 4.2.6
- Axios 1.6.0
- Day.js 1.11.13

## 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 资源文件
│   ├── components/        # 公共组件
│   │   ├── Table/        # 表格组件
│   │   ├── Form/         # 表单组件
│   │   ├── Button/       # 按钮组件
│   │   ├── Modal/        # 模态框组件
│   │   ├── Empty/        # 空状态组件
│   │   └── Spin/        # 加载组件
│   ├── pages/            # 页面组件
│   │   ├── CourseList/   # 课程列表页
│   │   ├── MyAppointments/# 我的预约页
│   │   ├── Login/        # 登录页
│   │   ├── Layout/       # 布局组件
│   │   └── Admin/       # 管理后台
│   ├── services/         # API服务
│   │   ├── request.js   # Axios封装
│   │   ├── auth.js      # 认证API
│   │   └── courses.js   # 课程API
│   ├── stores/           # Pinia状态管理
│   │   ├── user.js      # 用户状态
│   │   └── course.js    # 课程状态
│   ├── styles/           # 样式文件
│   ├── router.js         # 路由配置
│   ├── main.js           # 入口文件
│   └── App.vue          # 根组件
├── index.html            # HTML模板
├── package.json          # 项目配置
├── vite.config.mjs      # Vite配置
└── jsconfig.json        # JS配置
```

## 功能特性

### 学员功能
- 课程浏览：按日期、科目筛选课程
- 在线预约：实时查看剩余名额，一键预约
- 我的预约：查看预约记录，支持取消预约

### 教练功能
- 查看自己的排课表

### 管理员功能
- 课程管理：增删改查课程信息
- 用户管理：查看和管理用户
- 预约管理：查看所有预约记录

## 安装依赖

```bash
npm install
```

## 开发运行

```bash
npm run dev
```

访问 http://localhost:5173

## 构建生产

```bash
npm run build
```

## 预览生产构建

```bash
npm run preview
```

## API 接口说明

### 认证接口
- POST `/api/auth/login` - 用户登录
- POST `/api/auth/register` - 用户注册
- POST `/api/auth/logout` - 用户登出
- GET `/api/auth/userInfo` - 获取用户信息

### 课程接口
- GET `/api/courses/list` - 获取课程列表
- GET `/api/courses/detail/:id` - 获取课程详情

### 预约接口
- POST `/api/appointments/book` - 预约课程
- GET `/api/appointments/my` - 获取我的预约
- POST `/api/appointments/cancel/:id` - 取消预约

### 管理接口
- GET `/api/admin/courses` - 获取所有课程
- POST `/api/admin/courses` - 添加课程
- PUT `/api/admin/courses/:id` - 更新课程
- DELETE `/api/admin/courses/:id` - 删除课程
- GET `/api/admin/users` - 获取所有用户
- GET `/api/admin/appointments` - 获取所有预约

## 组件复用说明

本项目复用了现有项目的以下组件和模式：

1. **Axios 请求封装** - 参考 `ude-t/src/services/test/request.js`
   - 统一的请求拦截器
   - 统一的响应拦截器
   - Token 自动注入
   - 错误统一处理

2. **Table 组件** - 复用 `ude-t/src/components/Table/index.vue`
   - 支持固定列
   - 支持自定义插槽
   - 支持加载状态
   - 支持空状态

3. **Form 组件** - 复用 `ude-t/src/components/Form/index.vue`
   - 支持多种表单控件
   - 支持表单验证
   - 支持自定义样式

4. **路由配置** - 参考 `ude-t/src/router.js`
   - Hash 模式
   - 路由守卫
   - 动态标题

5. **状态管理** - 参考 `ude-t/src/stores/`
   - Pinia 模式
   - Composition API 风格

## 注意事项

1. 后端 API 需要运行在 `http://localhost:3000`
2. 开发环境已配置代理，无需修改 API 地址
3. 登录后 Token 会存储在 localStorage
4. 部分管理功能需要后端 API 支持
