# 驾校约课系统 - 后端

基于 Node.js + Express + MySQL + JWT 开发的驾校约课系统后端。

## 技术栈

- Node.js
- Express 4.18.2
- MySQL 8.0
- JWT (jsonwebtoken 9.0.2)
- bcryptjs 2.4.3
- CORS 2.8.5

## 项目结构

```
backend/
├── src/
│   ├── config/           # 配置文件
│   │   ├── database.js  # 数据库连接配置
│   │   └── index.js     # 应用配置
│   ├── middleware/       # 中间件
│   │   ├── auth.js      # JWT认证中间件
│   │   ├── cors.js      # CORS跨域中间件
│   │   └── errorHandler.js  # 错误处理中间件
│   ├── models/          # 数据模型
│   │   ├── User.js      # 用户模型
│   │   ├── Course.js    # 课程模型
│   │   └── Appointment.js # 预约模型
│   ├── services/        # 业务逻辑层
│   │   ├── authService.js       # 认证服务
│   │   ├── courseService.js     # 课程服务
│   │   └── appointmentService.js # 预约服务
│   ├── controllers/     # 控制器层
│   │   ├── authController.js    # 认证控制器
│   │   ├── courseController.js  # 课程控制器
│   │   └── appointmentController.js # 预约控制器
│   ├── routes/          # 路由配置
│   │   ├── auth.js      # 认证路由
│   │   ├── courses.js   # 课程路由
│   │   ├── appointments.js # 预约路由
│   │   └── admin.js     # 管理路由
│   └── app.js          # Express应用入口
├── init.sql            # 数据库初始化脚本
├── package.json         # 项目配置
└── .env                # 环境变量
```

## 功能特性

### 认证功能
- 用户登录
- 用户注册
- JWT Token 认证
- 获取用户信息

### 课程功能
- 获取课程列表（支持按日期、科目筛选）
- 获取课程详情
- 创建课程（管理员）
- 更新课程（管理员）
- 删除课程（管理员）

### 预约功能
- 预约课程（包含并发控制、库存扣减）
- 获取我的预约
- 取消预约（自动回滚库存）
- 获取所有预约（管理员）

### 并发控制
- 使用数据库事务保证数据一致性
- 使用 `FOR UPDATE` 锁定课程记录
- 使用乐观锁（version字段）防止超卖
- 唯一索引防止重复预约

## 安装依赖

```bash
cd backend
npm install
```

## 配置环境变量

复制 `.env` 文件并修改配置：

```env
PORT=3002
DB_HOST=192.168.2.135
DB_PORT=3306
DB_USER=root
DB_PASSWORD='123456'
DB_NAME=driving_school
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

## 初始化数据库

```bash
mysql -u root -p < init.sql
```

或使用 MySQL 客户端执行 `init.sql` 文件。

## 启动服务

### 开发模式（支持热重载）

```bash
npm run dev
```

### 生产模式

```bash
npm start
```

服务将运行在 http://localhost:3002

## API 接口文档

### 认证接口

#### 登录
- **接口**: `POST /auth/login`
- **请求体**:
  ```json
  {
    "username": "student1",
    "password": "student123"
  }
  ```
- **响应**:
  ```json
  {
    "respCode": "00000",
    "respData": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "userInfo": {
        "id": 1,
        "username": "student1",
        "real_name": "学员张三",
        "role": "student"
      }
    },
    "respMsg": "登录成功"
  }
  ```

#### 注册
- **接口**: `POST /auth/register`
- **请求体**:
  ```json
  {
    "username": "newuser",
    "password": "password123",
    "real_name": "新用户",
    "phone": "13800138000",
    "email": "user@example.com",
    "role": "student"
  }
  ```

#### 获取用户信息
- **接口**: `GET /auth/userInfo`
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  {
    "respCode": "00000",
    "respData": {
      "id": 1,
      "username": "student1",
      "real_name": "学员张三",
      "role": "student"
    },
    "respMsg": "获取成功"
  }
  ```

### 课程接口

#### 获取课程列表
- **接口**: `GET /courses/list`
- **查询参数**:
  - `date`: 日期筛选（可选）
  - `subject`: 科目筛选（subject2/subject3，可选）
- **响应**:
  ```json
  {
    "respCode": "00000",
    "respData": [
      {
        "id": 1,
        "name": "科目二基础训练",
        "subject": "subject2",
        "start_time": "2026-01-20 09:00:00",
        "end_time": "2026-01-20 11:00:00",
        "capacity": 5,
        "stock": 3,
        "instructor_id": 2,
        "instructor_name": "张教练",
        "location": "训练场A"
      }
    ],
    "respMsg": "获取成功"
  }
  ```

#### 获取课程详情
- **接口**: `GET /courses/detail/:id`

#### 创建课程（管理员）
- **接口**: `POST /courses`
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "name": "新课程",
    "subject": "subject2",
    "start_time": "2026-01-20 09:00:00",
    "end_time": "2026-01-20 11:00:00",
    "capacity": 5,
    "instructor_id": 2,
    "location": "训练场A",
    "description": "课程描述"
  }
  ```

#### 更新课程（管理员）
- **接口**: `PUT /courses/:id`
- **请求头**: `Authorization: Bearer {token}`

#### 删除课程（管理员）
- **接口**: `DELETE /courses/:id`
- **请求头**: `Authorization: Bearer {token}`

### 预约接口

#### 预约课程
- **接口**: `POST /appointments/book`
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "courseId": 1
  }
  ```
- **响应**:
  ```json
  {
    "respCode": "00000",
    "respData": {
      "appointmentId": 1,
      "courseId": 1,
      "courseName": "科目二基础训练",
      "startTime": "2026-01-20 09:00:00",
      "endTime": "2026-01-20 11:00:00",
      "instructorId": 2
    },
    "respMsg": "预约成功"
  }
  ```

#### 获取我的预约
- **接口**: `GET /appointments/my`
- **请求头**: `Authorization: Bearer {token}`

#### 取消预约
- **接口**: `POST /appointments/cancel/:id`
- **请求头**: `Authorization: Bearer {token}`

#### 获取所有预约（管理员）
- **接口**: `GET /appointments/list`
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  - `status`: 状态筛选（confirmed/cancelled/completed，可选）
  - `courseId`: 课程ID筛选（可选）

### 管理接口

#### 获取所有课程（管理员）
- **接口**: `GET /admin/courses`
- **请求头**: `Authorization: Bearer {token}`

#### 创建课程（管理员）
- **接口**: `POST /admin/courses`
- **请求头**: `Authorization: Bearer {token}`

#### 更新课程（管理员）
- **接口**: `PUT /admin/courses/:id`
- **请求头**: `Authorization: Bearer {token}`

#### 删除课程（管理员）
- **接口**: `DELETE /admin/courses/:id`
- **请求头**: `Authorization: Bearer {token}`

## 测试账号

系统初始化时已创建以下测试账号：

| 角色 | 用户名 | 密码 | 说明 |
|------|----------|--------|------|
| 管理员 | admin | admin123 | 系统管理员 |
| 教练 | instructor1 | instructor123 | 张教练 |
| 教练 | instructor2 | instructor123 | 李教练 |
| 学员 | student1 | student123 | 学员张三 |
| 学员 | student2 | student123 | 学员李四 |

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

## 并发控制说明

预约课程接口实现了完善的并发控制：

1. **事务保护**: 使用数据库事务确保操作的原子性
2. **行锁**: 使用 `FOR UPDATE` 锁定课程记录，防止并发修改
3. **乐观锁**: 使用 `version` 字段防止超卖
4. **唯一约束**: 使用唯一索引 `uk_user_course` 防止重复预约
5. **库存检查**: 扣减前检查库存，扣减后验证影响行数

预约流程：
```
开启事务
  ↓
锁定课程记录 (FOR UPDATE)
  ↓
检查库存 > 0
  ↓
检查是否已预约
  ↓
扣减库存 (stock - 1, version + 1)
  ↓
创建预约记录
  ↓
提交事务
```

## 注意事项

1. 生产环境请修改 `.env` 文件中的 `JWT_SECRET` 和数据库密码
2. 数据库默认使用 utf8mb4 字符集，支持 emoji 和特殊字符
3. 所有时间字段使用 DATETIME 类型，时区设置为 +08:00
4. 密码使用 bcrypt 加密，强度为 10
5. JWT Token 默认有效期为 7 天
