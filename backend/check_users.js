const db = require('./src/config/database')

async function checkUsers() {
  try {
    console.log('=== 查询数据库中的所有用户 ===')
    
    const [rows] = await db.query('SELECT * FROM Users ORDER BY created_at DESC')
    
    console.log(`\n共找到 ${rows.length} 个用户:\n`)
    
    rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.user_id}, 用户名: ${user.username}, 姓名: ${user.name}, 角色: ${user.role}, 状态: ${user.status}`)
    })
    
    console.log('\n=== 详细信息 ===')
    console.log(JSON.stringify(rows, null, 2))
    
    process.exit(0)
  } catch (error) {
    console.error('查询失败:', error)
    process.exit(1)
  }
}

checkUsers()
