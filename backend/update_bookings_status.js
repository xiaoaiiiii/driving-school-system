const db = require('./src/config/database')
const fs = require('fs')
const path = require('path')

async function updateBookingsStatus() {
  try {
    console.log('开始更新 Bookings 表状态字段...')
    
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'update_bookings_status.sql')
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
    
    console.log('✅ Bookings 表状态字段更新成功！')
    console.log('现在 Bookings 表支持以下状态: booked, completed, cancelled, absent')
    process.exit(0)
  } catch (error) {
    console.error('❌ 更新失败:', error.message)
    process.exit(1)
  }
}

updateBookingsStatus()
