const db = require('../config/database')
const bcrypt = require('bcryptjs')

class DataInitializer {
  // 从数据库加载用户数据（适配新表结构，使用 username）
  static async loadUsersFromDB() {
    try {
      const [rows] = await db.query(
        `SELECT user_id as id, 
                username, 
                name as real_name, 
                phone, 
                password, 
                role, 
                status, 
                subject_progress,
                remaining_hours,
                created_at as create_time 
         FROM Users 
         ORDER BY user_id`
      )
      return rows
    } catch (error) {
      console.log('从数据库加载用户数据失败:', error.message)
      return null
    }
  }

  // 从数据库加载课程数据（适配新表结构）
  static async loadCoursesFromDB() {
    try {
      const [rows] = await db.query(
        `SELECT c.course_id as id, 
                c.title as name, 
                CASE c.subject_type 
                  WHEN 2 THEN 'subject2' 
                  WHEN 3 THEN 'subject3' 
                  ELSE 'subject2' 
                END as subject,
                c.start_time, 
                c.end_time, 
                c.location, 
                c.max_capacity as capacity,
                c.max_capacity as max_capacity, 
                c.current_count as booked_count,
                (c.max_capacity - c.current_count) as stock,
                c.coach_id, 
                u.name as instructor_name,
                c.status,
                c.created_at as create_time,
                c.updated_at as update_time
         FROM Courses c
         LEFT JOIN Users u ON c.coach_id = u.user_id
         WHERE c.status = 1
         ORDER BY c.start_time DESC`
      )
      return rows
    } catch (error) {
      console.log('从数据库加载课程数据失败:', error.message)
      return null
    }
  }

  // 从数据库加载预约数据（适配新表结构）
  static async loadAppointmentsFromDB() {
    try {
      const [rows] = await db.query(
        `SELECT booking_id as id, 
                student_id as user_id, 
                course_id, 
                CASE status 
                  WHEN 'booked' THEN 'confirmed'
                  WHEN 'completed' THEN 'completed'
                  WHEN 'cancelled' THEN 'cancelled'
                  ELSE 'confirmed'
                END as status,
                created_at as create_time 
         FROM Bookings 
         ORDER BY created_at DESC`
      )
      return rows
    } catch (error) {
      console.log('从数据库加载预约数据失败:', error.message)
      return null
    }
  }

  // 检查表是否存在
  static async checkTableExists(tableName) {
    try {
      const [rows] = await db.query(
        `SHOW TABLES LIKE ?`,
        [tableName]
      )
      return rows.length > 0
    } catch (error) {
      return false
    }
  }

  // 初始化默认数据（仅当数据库为空时）
  static async initializeDefaultData() {
    try {
      // 检查 Users 表是否存在
      const usersTableExists = await this.checkTableExists('Users')
      if (!usersTableExists) {
        console.log('Users 表不存在，跳过初始化，请先执行 init_new.sql')
        return false
      }

      // 检查是否已有用户
      const [userCount] = await db.query('SELECT COUNT(*) as count FROM Users')
      if (userCount[0].count > 0) {
        console.log('数据库已有数据，跳过初始化')
        return false
      }

      console.log('开始初始化默认数据...')

      // 插入管理员（密码: 123456）
      const adminPassword = await bcrypt.hash('123456', 10)
      await db.query(
        'INSERT INTO Users (username, name, phone, password, role, subject_progress, remaining_hours) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['admin', '系统管理员', '13800138000', adminPassword, 'admin', NULL, 0]
      )

      // 插入教练（密码: 123456）
      await db.query(
        'INSERT INTO Users (username, name, phone, password, role, subject_progress, remaining_hours) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['coach1', '张教练', '13800138001', adminPassword, 'coach', NULL, 0]
      )

      // 插入学员（密码: 123456）
      await db.query(
        'INSERT INTO Users (username, name, phone, password, role, subject_progress, remaining_hours) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['student1', '张三', '13800138002', adminPassword, 'student', 0, 20]
      )

      console.log('默认数据初始化完成！')
      return true
    } catch (error) {
      console.log('初始化默认数据失败:', error.message)
      console.log('请确保已执行 init_new.sql 创建数据库和表结构')
      return false
    }
  }

  // 初始化系统数据
  static async initialize() {
    try {
      console.log('正在连接数据库...')
      
      // 测试数据库连接
      await db.query('SELECT 1')
      console.log('数据库连接成功！')
      
      // 初始化默认数据
      await this.initializeDefaultData()
      
      return true
    } catch (error) {
      console.log('数据库初始化失败:', error.message)
      console.log('错误详情:', error)
      console.log('将使用 Mock 数据模式运行')
      return false
    }
  }
}

module.exports = DataInitializer