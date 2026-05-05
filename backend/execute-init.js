const db = require('./src/config/database')
const fs = require('fs')
const path = require('path')

async function initDatabase() {
  try {
    console.log('开始初始化数据库...')
    
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'init_new.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // 分割 SQL 语句（按分号分割，但要处理注释和字符串中的分号）
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`找到 ${statements.length} 条 SQL 语句`)
    
    // 执行每条语句
    for (let i = 0; i < statements.length; i++) {
      try {
        await db.query(statements[i])
        console.log(`✓ 执行第 ${i + 1} 条语句成功`)
      } catch (error) {
        console.log(`✗ 执行第 ${i + 1} 条语句失败:`, error.message)
        // 继续执行下一条，不中断
      }
    }
    
    console.log('\n数据库初始化完成！')
    process.exit(0)
  } catch (error) {
    console.error('初始化数据库失败:', error)
    process.exit(1)
  }
}

initDatabase()