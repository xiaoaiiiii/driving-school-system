# 驾校约课系统

基于 Vue 3 + Vite + Pinia + Vue Router (前端) 和 Node.js + Express + MySQL (后端) 开发的驾校约课系统。

## 系统架构

```
driving-school-system/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── components/    # 公共组件
│   │   ├── pages/        # 页面组件
│   │   ├── services/     # API服务
│   │   ├── stores/       # 状态管理
│   │   ├── router.js     # 路由配置
│   │   ├── main.js       # 入口文件
│   │   └── App.vue      # 根组件
│   ├── package.json
│   ├── vite.config.mjs
│   └── README.md
└── backend/           # 后端项目
    ├── src/
    │   ├── config/       # 配置文件
    │   ├── middleware/   # 中间件
    │   ├── models/       # 数据模型
    │   ├── services/     # 业务逻辑
    │   ├── controllers/  # 控制器
    │   ├── routes/       # 路由配置
    │   └── app.js        # 应用入口
    ├── init.sql         # 数据库脚本
    ├── package.json
    └── README.md
```

## 技术栈

### 前端
- Vue 3.5.16
- Vite 4.5.0
- Pinia 2.1.7
- Vue Router 4.2.5
- Ant Design Vue 4.2.6
- Axios 1.6.0
- Day.js 1.11.13

### 后端
- Node.js
- Express 4.18.2
- MySQL 8.0
- JWT (jsonwebtoken 9.0.2)
- bcryptjs 2.4.3

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

## 快速开始

### 1. 数据库初始化

```bash
# 登录 MySQL
mysql -u root -p

# 执行初始化脚本
source backend/init.sql
```

### 2. 后端启动

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量（修改 .env 文件）
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=driving_school
# JWT_SECRET=your_secret_key

# 启动服务（开发模式）
npm run dev

# 或启动服务（生产模式）
npm start
```

后端服务将运行在 http://localhost:3002

### 3. 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将运行在 http://localhost:5173

## 测试账号

系统初始化时已创建以下测试账号：

| 角色 | 用户名 | 密码 | 说明 |
|------|----------|--------|------|
| 管理员 | admin | admin123 | 系统管理员 |
| 教练 | instructor1 | instructor123 | 张教练 |
| 教练 | instructor2 | instructor123 | 李教练 |
| 学员 | student1 | student123 | 学员张三 |
| 学员 | student2 | student123 | 学员李四 |

## 核心功能说明

### 并发预约控制

预约课程接口实现了完善的并发控制：

1. **事务保护**: 使用数据库事务确保操作的原子性
2. **行锁**: 使用 `FOR UPDATE` 锁定课程记录，防止并发修改
3. **乐观锁**: 使用 `version` 字段防止超卖
4. **唯一约束**: 使用唯一索引 `uk_user_course` 防止重复预约
5. **库存检查**: 扣减前检查库存，扣减后验证影响行数

### 前端组件复用

前端项目复用了现有项目的以下组件和模式：

1. **Axios 请求封装** - 统一的请求/响应拦截器
2. **Table 组件** - 支持固定列、自定义插槽
3. **Form 组件** - 支持多种表单控件
4. **路由配置** - Hash 模式、路由守卫
5. **状态管理** - Pinia 模式、Composition API 风格

### 后端架构模式

后端项目采用经典的 MVC 架构：

- **Model**: 数据模型层，负责数据库操作
- **Service**: 业务逻辑层，负责业务规则处理
- **Controller**: 控制器层，负责请求处理和响应封装
- **Route**: 路由层，负责 URL 映射
- **Middleware**: 中间件层，负责横切关注点（认证、CORS、错误处理）

## API 接口文档

详细的 API 接口文档请查看：

- [后端 API 文档](./backend/README.md)

### 主要接口

#### 认证接口
- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册
- `GET /auth/userInfo` - 获取用户信息

#### 课程接口
- `GET /courses/list` - 获取课程列表
- `GET /courses/detail/:id` - 获取课程详情
- `POST /courses` - 创建课程（管理员）
- `PUT /courses/:id` - 更新课程（管理员）
- `DELETE /courses/:id` - 删除课程（管理员）

#### 预约接口
- `POST /appointments/book` - 预约课程
- `GET /appointments/my` - 获取我的预约
- `POST /appointments/cancel/:id` - 取消预约

## 响应格式

所有接口统一返回格式：

```json
{
  "respCode": "00000",
  "respData": {},
  "respMsg": "操作成功"
}
```

- `respCode`: 响应码，"00000"表示成功，其他表示失败
- `respData`: 响应数据
- `respMsg`: 响应消息

### 常见错误码

| 错误码 | 说明 |
|---------|------|
| 00000 | 成功 |
| 10001 | 认证失败或Token过期 |
| 99997 | 关联数据不存在 |
| 99998 | 数据已存在 |
| 99999 | 服务器内部错误 |

## 开发说明

### 前端开发

```bash
cd frontend
npm run dev
```

访问 http://localhost:5173

### 后端开发

```bash
cd backend
npm run dev
```

服务运行在 http://localhost:3002

### 生产构建

#### 前端构建

```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist` 目录

#### 后端部署

```bash
cd backend
npm install --production
npm start
```

## 注意事项

1. **生产环境配置**
   - 修改后端 `.env` 文件中的 `JWT_SECRET` 为强密码
   - 修改数据库密码为实际生产密码
   - 配置 HTTPS

2. **数据库配置**
   - 数据库默认使用 utf8mb4 字符集
   - 所有时间字段使用 DATETIME 类型
   - 时区设置为 +08:00

3. **安全建议**
   - 定期更新依赖包
   - 使用强密码策略
   - 启用 HTTPS
   - 配置防火墙规则

## 项目特色

1. **代码复用**: 前端复用了现有项目的组件和架构模式
2. **并发控制**: 后端实现了完善的并发预约控制机制
3. **统一规范**: 前后端采用统一的响应格式和错误处理
4. **角色权限**: 实现了基于角色的访问控制（RBAC）
5. **完整文档**: 提供了详细的 API 文档和使用说明

## 许可证

ISC

## 作者

整软

## 更新日志

### v1.0.0 (2026-01-16)
- 初始版本发布
- 实现学员、教练、管理员三大角色功能
- 实现课程浏览、预约、管理功能
- 实现并发预约控制
- 完善的前后端文档
