const db = require('./src/config/database')

async function checkUsers() {
  try {
    console.log('查询数据库中的用户数据...')
    
    const [users] = await db.query('SELECT * FROM Users')
    console.log('用户总数:', users.length)
    console.log('用户列表:')
    users.forEach(user => {
      console.log(`  ID: ${user.user_id}, 用户名: ${user.username}, 姓名: ${user.name}, 角色: ${user.role}, 创建时间: ${user.created_at}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('查询失败:', error.message)
    process.exit(1)
  }
}

checkUsers()