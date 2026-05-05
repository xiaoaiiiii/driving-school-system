const mysql = require('mysql2/promise')
require('dotenv').config()

async function insertTestData() {
  try {
    console.log('正在连接数据库...')
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'driving_school',
      multipleStatements: true
    })
    
    console.log('✓ 数据库连接成功!')
    
    console.log('\n正在插入测试数据...')
    
    const sql = `
      -- 插入管理员账号 (密码: admin123)
      INSERT INTO users (username, password, role, real_name, phone, email, create_time, update_time) VALUES
      ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p96ldmc5aLGX0e', 'admin', '系统管理员', '13800138000', 'admin@driving.com', NOW(), NOW())
      ON DUPLICATE KEY UPDATE username = username;
                
      -- 插入教练账号 (密码: instructor123)
      INSERT INTO users (username, password, role, real_name, phone, email, create_time, update_time) VALUES
      ('instructor1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p96ldmc5aLGX0e', 'instructor', '张教练', '13800138001', 'instructor1@driving.com', NOW(), NOW()),
      ('instructor2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p96ldmc5aLGX0e', 'instructor', '李教练', '13800138002', 'instructor2@driving.com', NOW(), NOW())
      ON DUPLICATE KEY UPDATE username = username;
      
      -- 插入学员账号 (密码: student123)
      INSERT INTO users (username, password, role, real_name, phone, email, create_time, update_time) VALUES
      ('student1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p96ldmc5aLGX0e', 'student', '学员张三', '13800138003', 'student1@driving.com', NOW(), NOW()),
      ('student2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p96ldmc5aLGX0e', 'student', '学员李四', '13800138004', 'student2@driving.com', NOW(), NOW())
      ON DUPLICATE KEY UPDATE username = username;
      
      -- 插入测试课程 (使用 max_capacity 和 booked_count 字段)
      INSERT INTO courses (name, subject, start_time, end_time, max_capacity, booked_count, coach_id, location, description) VALUES
      ('科目二基础训练', 'subject2', '2026-01-20 09:00:00', '2026-01-20 11:00:00', 5, 0, 2, '训练场A', '科目二基础操作训练'),
      ('科目二综合训练', 'subject2', '2026-01-20 14:00:00', '2026-01-20 17:00:00', 3, 0, 2, '训练场B', '科目二综合操作训练'),
      ('科目三路考训练', 'subject3', '2026-01-21 09:00:00', '2026-01-21 12:00:00', 4, 0, 3, '训练场C', '科目三路考训练'),
      ('科目三夜间训练', 'subject3', '2026-01-21 18:00:00', '2026-01-21 21:00:00', 3, 0, 3, '训练场A', '科目三夜间驾驶训练')
      ON DUPLICATE KEY UPDATE name = name;
    `
    
    await connection.query(sql)
    console.log('✓ 测试数据插入成功!')
    
    await connection.end()
    
  } catch (error) {
    console.error('✗ 测试数据插入失败!')
    console.error('错误信息:', error.message)
    process.exit(1)
  }
}

insertTestData()
