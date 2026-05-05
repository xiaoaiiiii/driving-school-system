const db = require('./src/config/database')
const fs = require('fs')
const path = require('path')

async function rebuildDatabase() {
  try {
    console.log('开始重建数据库...\n')
    
    // 1. 删除所有表（注意顺序，因为有外键约束）
    console.log('步骤1: 删除现有表...')
    const dropTables = [
      'DROP TABLE IF EXISTS Bookings',
      'DROP TABLE IF EXISTS Courses',
      'DROP TABLE IF EXISTS Users'
    ]
    
    for (const sql of dropTables) {
      try {
        await db.query(sql)
        console.log(`✓ ${sql}`)
      } catch (error) {
        console.log(`⚠ ${sql} - ${error.message}`)
      }
    }
    
    console.log('\n步骤2: 读取并执行 init_new.sql...')
    
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'init_new.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('SQL 文件内容长度:', sqlContent.length, '字符')
    
    // 直接使用 mysql2 的 multipleStatements 功能执行整个文件
    // 先创建一个支持 multipleStatements 的连接
    const mysql = require('mysql2/promise')
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '192.168.73.128',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'driving_school',
      multipleStatements: true
    })
    
    console.log('执行完整的 SQL 文件...')
    await connection.query(sqlContent)
    await connection.end()
    
    console.log('✅ SQL 文件执行成功！')
    
    console.log('\n✅ 数据库重建完成！')
    console.log('\n已创建的表:')
    console.log('  - Users (用户表)')
    console.log('  - Courses (课程表)')
    console.log('  - Bookings (预约表)')
    console.log('\n测试账号:')
    console.log('  - 管理员: admin / 123456')
    console.log('  - 教练: coach1 / 123456')
    console.log('  - 学员: student1 / 123456')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ 重建数据库失败:', error)
    process.exit(1)
  }
}

rebuildDatabase()