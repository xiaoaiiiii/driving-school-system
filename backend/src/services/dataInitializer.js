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

  // 获取表的实际名称（兼容不同平台大小写规则）
  static async getActualTableName(tableName) {
    try {
      const [rows] = await db.query(
        `SELECT TABLE_NAME
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND LOWER(TABLE_NAME) = LOWER(?)
         LIMIT 1`,
        [tableName]
      )
      return rows[0]?.TABLE_NAME || null
    } catch (error) {
      return null
    }
  }

  // 检查表是否存在
  static async checkTableExists(tableName) {
    const actualName = await this.getActualTableName(tableName)
    return !!actualName
  }

  // 自动修复数据库结构与常见乱码数据
  static async ensureSchemaAndEncoding() {
    try {
      const usersTableName = await this.getActualTableName('Users')
      if (usersTableName) {
        const [statusColumnRows] = await db.query(
          `SELECT COUNT(*) as count
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
             AND LOWER(TABLE_NAME) = LOWER(?)
             AND COLUMN_NAME = 'status'`,
          [usersTableName]
        )

        if (!statusColumnRows[0]?.count) {
          console.log(`检测到 ${usersTableName}.status 缺失，开始自动补齐...`)
          await db.query(
            `ALTER TABLE \`${usersTableName}\` ADD COLUMN \`status\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态:1=启用,0=禁用' AFTER \`remaining_hours\``
          )
          await db.query(`ALTER TABLE \`${usersTableName}\` ADD INDEX \`idx_status\` (\`status\`)`)
          console.log(`${usersTableName}.status 字段补齐完成`)
        }

        await db.query(`UPDATE \`${usersTableName}\` SET \`status\` = 1 WHERE \`status\` IS NULL`)

        // 修复用户姓名乱码，避免用户管理和课程教练字段展示异常
        await db.query(
          `UPDATE \`${usersTableName}\`
           SET \`name\` = CONVERT(CAST(CONVERT(\`name\` USING latin1) AS BINARY) USING utf8mb4)
           WHERE \`name\` REGEXP 'Ã|Â|â|ç|æ|å|ä'`
        )
      }

      const coursesTableName = await this.getActualTableName('Courses')
      if (coursesTableName) {
        // 修复 UTF-8 被当作 latin1 存储导致的中文乱码（仅处理明显脏数据）
        await db.query(
          `UPDATE \`${coursesTableName}\`
           SET \`title\` = CONVERT(CAST(CONVERT(\`title\` USING latin1) AS BINARY) USING utf8mb4)
           WHERE \`title\` REGEXP 'Ã|Â|â|ç|æ|å|ä'`
        )

        await db.query(
          `UPDATE \`${coursesTableName}\`
           SET \`location\` = CONVERT(CAST(CONVERT(\`location\` USING latin1) AS BINARY) USING utf8mb4)
           WHERE \`location\` REGEXP 'Ã|Â|â|ç|æ|å|ä'`
        )
      }

      // 强制当前连接会话使用 utf8mb4，避免不同平台默认字符集差异
      await db.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')

      console.log('数据库结构与编码检查完成')
      return true
    } catch (error) {
      console.log('数据库结构/编码自动修复失败:', error.message)
      return false
    }
  }

  // 初始化默认数据（仅当数据库为空时）
  static async initializeDefaultData() {
    try {
      const usersTableName = await this.getActualTableName('Users')
      if (!usersTableName) {
        console.log('Users 表不存在，跳过初始化，请先执行 init_new.sql')
        return false
      }

      // 检查是否已有用户
      const [userCount] = await db.query(`SELECT COUNT(*) as count FROM \`${usersTableName}\``)
      if (userCount[0].count > 0) {
        console.log('数据库已有数据，跳过初始化')
        return false
      }

      console.log('开始初始化默认数据...')

      // 插入管理员（密码: 123456）
      const adminPassword = await bcrypt.hash('123456', 10)
      await db.query(
        `INSERT INTO \`${usersTableName}\` (username, name, phone, password, role, subject_progress, remaining_hours) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['admin', '系统管理员', '13800138000', adminPassword, 'admin', NULL, 0]
      )

      // 插入教练（密码: 123456）
      await db.query(
        `INSERT INTO \`${usersTableName}\` (username, name, phone, password, role, subject_progress, remaining_hours) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['coach1', '张教练', '13800138001', adminPassword, 'coach', NULL, 0]
      )

      // 插入学员（密码: 123456）
      await db.query(
        `INSERT INTO \`${usersTableName}\` (username, name, phone, password, role, subject_progress, remaining_hours) VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
      
      // 自动修复数据库表结构与编码问题（跨平台兜底）
      await this.ensureSchemaAndEncoding()

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