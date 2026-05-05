const db = require('./src/config/database')
const fs = require('fs')
const path = require('path')

async function addUserStatus() {
  try {
    console.log('开始为 Users 表添加 status 字段...')
    
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'add_user_status.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // 分割 SQL 语句
    const statements = sqlContent.split(';').filter(s => s.trim())
    
    // 执行每条 SQL 语句
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('执行 SQL:', statement.trim())
        await db.query(statement)
      }
    }
    
    console.log('✅ Users 表 status 字段添加成功！')
    console.log('现在 Users 表有 status 字段了')
    process.exit(0)
  } catch (error) {
    console.error('❌ 添加失败:', error.message)
    process.exit(1)
  }
}

addUserStatus()
