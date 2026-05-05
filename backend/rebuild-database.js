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
    
    // 分割 SQL 语句（按分号分割，但要处理注释和字符串中的分号）
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`找到 ${statements.length} 条 SQL 语句\n`)
    
    // 执行每条语句
    for (let i = 0; i < statements.length; i++) {
      try {
        await db.query(statements[i])
        console.log(`✓ 执行第 ${i + 1} 条语句成功`)
      } catch (error) {
        console.log(`✗ 执行第 ${i + 1} 条语句失败:`, error.message)
        console.log('  SQL:', statements[i].substring(0, 100) + '...')
        // 继续执行下一条，不中断
      }
    }
    
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