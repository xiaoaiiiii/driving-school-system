# 驾校约课系统 - 数据库适配说明

## 📋 表结构映射

本系统已完全适配新的表结构！下面是详细的字段映射说明。

---

## 🏗️ 表结构对比

### 1️⃣ 用户信息表（Users）

| 旧字段 | 新字段 | 数据类型 | 说明 |
|---------|----------|-----------|------|
| `id` | `user_id` | INT | 用户唯一标识 |
| `username` | `phone` | VARCHAR(11) | 手机号（登录账号） |
| `real_name` | `name` | VARCHAR(50) | 真实姓名 |
| `password` | `password` | VARCHAR(255) | 加密后的密码 |
| `role` | `role` | ENUM | 角色权限 |
| `subject_stage` | `subject_progress` | TINYINT | 当前科目进度（0=科目二，1=科目三） |
| `total_hours` | `remaining_hours` | INT | 剩余可用课时余额 |
| `status` | ❌ | - | 新表无此字段 |
| `create_time` | `created_at` | TIMESTAMP | 创建时间 |
| ❌ | `updated_at` | TIMESTAMP | 更新时间 |

### 2️⃣ 课程信息表（Courses）

| 旧字段 | 新字段 | 数据类型 | 说明 |
|---------|----------|-----------|------|
| `id` | `course_id` | INT | 课程唯一编号 |
| `name` | `title` | VARCHAR(100) | 课程标题 |
| `subject` | `subject_type` | TINYINT | 训练科目（2=科目二，3=科目三） |
| `start_time` | `start_time` | DATETIME | 训练开始时间 |
| `end_time` | `end_time` | DATETIME | 训练结束时间 |
| `location` | `location` | VARCHAR(255) | 训练场地 |
| `capacity` / `max_capacity` | `max_capacity` | INT | 最大容纳人数 |
| `stock` | ❌ | - | 新表用 `max_capacity - current_count` 计算 |
| `booked_count` | `current_count` | INT | 已预约人数 |
| `coach_id` | `coach_id` | INT | 所属教练ID |
| `instructor_name` | ❌ | - | 通过关联查询获取 |
| `status` | `status` | TINYINT | 状态（1=启用，0=禁用） |
| `create_time` | `created_at` | TIMESTAMP | 创建时间 |
| `update_time` | `updated_at` | TIMESTAMP | 更新时间 |

### 3️⃣ 预约记录表（Bookings）

| 旧字段 | 新字段 | 数据类型 | 说明 |
|---------|----------|-----------|------|
| `id` | `booking_id` | INT | 预约流水号 |
| `user_id` | `student_id` | INT | 学员ID |
| `course_id` | `course_id` | INT | 课程ID |
| `status` | `status` | ENUM | 预约状态 |
| ❌ | ❌ | - | 旧表: `confirmed`/`completed`/`cancelled` |
| ❌ | ❌ | - | 新表: `booked`/`completed`/`cancelled` |
| `create_time` | `created_at` | TIMESTAMP | 申请提交时间 |
| ❌ | `updated_at` | TIMESTAMP | 更新时间 |

---

## 🚀 使用步骤

### 步骤 1：初始化数据库

在 MySQL 中执行初始化脚本：

```bash
# 方法1：命令行执行
mysql -u root -p < backend/init_new.sql

# 方法2：使用 MySQL 管理工具
# 打开 backend/init_new.sql 文件并执行
```

### 步骤 2：确认数据库配置

检查 `backend/src/config/database.js` 中的配置：

```javascript
host: '192.168.2.135',  // 数据库主机
port: 3306,
user: 'root',
password: '123456',
database: 'driving_school'
```

如果您的数据库配置不同，请修改这些值。

### 步骤 3：启动后端服务

```bash
cd backend
npm start
```

启动成功后，您应该看到：

```
正在连接数据库...
数据库连接成功！
从数据库加载了 X 个用户数据
从数据库加载了 X 个课程数据
从数据库加载了 X 个预约数据
驾校约课系统后端服务运行在 http://localhost:3002
```

### 步骤 4：启动前端服务

```bash
cd frontend
npm run dev
```

---

## 🔑 默认账号

| 登录账号（手机号） | 密码 | 角色 | 真实姓名 |
|-------------------|--------|------|-----------|
| 13800138000 | 123456 | 管理员 | 系统管理员 |
| 13800138001 | 123456 | 教练 | 张教练 |
| 13800138002 | 123456 | 教练 | 李教练 |
| 13800138003 | 123456 | 学员 | 张三 |

⚠️ **重要提示**：新表结构中，`phone`（手机号）是登录账号，而不是原来的 `username`！

---

## 📊 字段映射详情

### 用户认证映射

| 功能 | 旧字段 | 新字段 | 说明 |
|------|--------|--------|------|
| 登录账号 | `username` | `phone` | 使用手机号登录 |
| 真实姓名 | `real_name` | `name` | 用户真实姓名 |
| 科目进度 | `subject_stage` | `subject_progress` | 0=科目二，1=科目三 |
| 课时余额 | `total_hours` | `remaining_hours` | 剩余课时 |

### 状态值映射

#### 预约状态

| 前端/旧表 | 新表 | 说明 |
|-----------|-------|------|
| `confirmed` | `booked` | 已预约 |
| `completed` | `completed` | 已完成 |
| `cancelled` | `cancelled` | 已取消 |

#### 科目类型

| 前端/旧表 | 新表 | 说明 |
|-----------|-------|------|
| `subject2` | 2 | 科目二 |
| `subject3` | 3 | 科目三 |

---

## 🔧 已更新的文件

### 模型文件
- ✅ `backend/src/models/Course.js` - 课程模型
- ✅ `backend/src/models/Appointment.js` - 预约模型
- ✅ `backend/src/models/User.js` - 用户模型

### 服务文件
- ✅ `backend/src/services/dataInitializer.js` - 数据初始化
- ✅ `backend/src/data/mockUserData.js` - Mock 用户数据

### 初始化脚本
- ✅ `backend/init_new.sql` - 新表结构初始化脚本

---

## ✨ 功能特性

### 数据持久化
- ✅ 所有数据写入数据库
- ✅ 重启服务后数据保留
- ✅ 数据库失败时自动降级到 Mock 数据

### 字段自动映射
- ✅ 查询时自动转换字段名
- ✅ 插入时自动映射字段
- ✅ 状态值自动转换

### 兼容性
- ✅ 前端代码无需修改
- ✅ API 接口保持不变
- ✅ 响应格式保持一致

---

## 🐛 故障排查

### 问题1：数据库连接失败

**现象**：启动时看到 "数据库连接失败"

**解决方案**：
1. 检查数据库服务是否启动
2. 检查 `database.js` 中的配置是否正确
3. 确认数据库 `driving_school` 是否已创建
4. 执行 `init_new.sql` 初始化表结构

### 问题2：登录失败

**现象**：使用旧账号登录失败

**解决方案**：
1. 使用**手机号**登录（不是 username）
2. 账号：`13800138000`（管理员）
3. 密码：`123456`

### 问题3：数据不保存

**现象**：操作成功但数据库没有数据

**原因**：数据库操作失败，系统自动降级到 Mock 数据

**解决方案**：
1. 检查数据库连接和权限
2. 查看后端错误日志
3. 修复数据库问题后重启服务

---

## 💡 备份建议

定期备份数据库：

```bash
# 备份
mysqldump -u root -p driving_school > backup_$(date +%Y%m%d).sql

# 恢复
mysql -u root -p driving_school < backup_20240101.sql
```