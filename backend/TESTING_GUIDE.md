# 数据库初始化与并发测试指南

## 文件说明

### 1. mockData.js - 数据库初始化脚本
批量生成测试数据，包括：
- 1个管理员账号
- 2个教练账号
- 10个测试学员账号
- 20个测试课程（分布在不同日期和科目）
- 1个只有1个名额的并发测试课程

### 2. concurrency-test.js - 并发压力测试脚本
模拟多个用户同时抢课，验证悲观锁机制是否生效。

---

## 使用步骤

### 第一步：启动后端服务

```bash
cd backend
npm run dev
```

确保后端服务运行在 http://localhost:3002

### 第二步：生成测试数据

```bash
node mockData.js
```

脚本会输出：
- 所有测试账号信息（密码均为：123456）
- 并发测试课程的ID（请记下这个ID）

**测试账号：**
- 管理员：admin / 123456
- 教练：instructor1、instructor2 / 123456
- 学员：student1 ~ student10 / 123456

### 第三步：运行并发测试

使用第一步记下的并发测试课程ID：

```bash
# 基本用法：5个用户同时抢课
node concurrency-test.js <课程ID>

# 指定并发用户数（例如：10个用户）
node concurrency-test.js <课程ID> 10
```

**示例：**
```bash
node concurrency-test.js 25 5
```

---

## 并发测试预期结果

### 成功情况（悲观锁生效）：
- 只有1个用户成功预约
- 其他4个用户都失败（显示"课程名额已满"或类似错误）
- 课程最终名额为0
- 控制台显示绿色提示：✓ 悲观锁机制验证成功!

### 失败情况（可能有超卖）：
- 超过1个用户成功预约
- 控制台显示红色警告：✗ 可能存在超卖问题，请检查!

---

## 使用 Postman 测试

如果你想用 Postman 手动测试：

### 1. 获取 Token

**请求：**
```
POST http://localhost:3002/api/auth/login
Content-Type: application/json

{
  "username": "student1",
  "password": "123456"
}
```

**响应：**
```json
{
  "respCode": "00000",
  "respData": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "respMsg": "登录成功"
}
```

### 2. 复制5个不同学员的Token

重复步骤1，分别用 student1 ~ student5 登录，获取5个Token。

### 3. 同时发起预约请求

在 Postman 中创建5个请求，使用不同的Token，同时发送：

**请求：**
```
POST http://localhost:3002/api/appointments/book
Content-Type: application/json
Authorization: Bearer <Token>

{
  "courseId": <并发测试课程ID>
}
```

### 4. 观察结果

- 只有1个请求应该返回成功
- 其他请求应该返回失败（respCode 不为 00000）

---

## 使用 curl 测试

### 简单的 bash 脚本（Linux/Mac）

创建 `test-concurrency.sh`：

```bash
#!/bin/bash

COURSE_ID=25
API_BASE=http://localhost:3002/api

# 登录并获取5个Token
tokens=()
for i in {1..5}; do
  response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"student$i\",\"password\":\"123456\"}")
  
  token=$(echo $response | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$token" ]; then
    tokens+=("$token")
    echo "学生$i 登录成功"
  fi
done

# 并发预约
echo "开始并发抢课..."
for i in {0..4}; do
  token=${tokens[$i]}
  user_num=$((i+1))
  
  (
    response=$(curl -s -X POST "$API_BASE/appointments/book" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d "{\"courseId\":$COURSE_ID}")
    
    resp_code=$(echo $response | grep -o '"respCode":"[^"]*"' | cut -d'"' -f4)
    resp_msg=$(echo $response | grep -o '"respMsg":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$resp_code" = "00000" ]; then
      echo -e "\033[32m✓ 学生$user_num: 成功 - $resp_msg\033[0m"
    else
      echo -e "\033[31m✗ 学生$user_num: 失败 - $resp_msg ($resp_code)\033[0m"
    fi
  ) &
done

wait
echo "测试完成"
```

使用方法：
```bash
chmod +x test-concurrency.sh
./test-concurrency.sh
```

---

## 技术说明

### 悲观锁实现

在 `appointmentService.js` 的 `bookCourse` 方法中：

```javascript
const [courseRows] = await connection.query(
  'SELECT id, name, stock, capacity, start_time, end_time, coach_id FROM courses WHERE id = ? AND status = 1 FOR UPDATE',
  [courseId]
)
```

`FOR UPDATE` 会锁定该行，直到事务提交或回滚，防止其他事务同时修改。

### 事务保证

```javascript
await connection.beginTransaction()

// ... 多个更新操作 ...

await connection.commit()
```

所有操作在同一事务中，要么全部成功，要么全部回滚。

---

## 常见问题

### Q: 数据库连接超时？
A: 确保 MySQL 服务已启动，并且 .env 中的数据库配置正确。

### Q: 并发测试时所有用户都失败？
A: 检查课程是否还有名额，以及课程状态是否为 1（进行中）。

### Q: 如何重置测试数据？
A: 再次运行 `node mockData.js`，它会跳过已存在的数据。
