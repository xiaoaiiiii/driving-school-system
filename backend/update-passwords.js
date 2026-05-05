const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
require('dotenv').config()

async function updatePassword() {
  try {
    console.log('正在连接数据库...')
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'driving_school'
    })
    
    console.log('✓ 数据库连接成功!')
    
    console.log('\n正在更新用户密码...')
    
    const hashedPassword = await bcrypt.hash('admin123', 10)
    console.log('密码哈希值:', hashedPassword)
    
    await connection.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, 'admin']
    )
    
    console.log('✓ admin 用户密码更新成功!')
    
    const hashedPassword1 = await bcrypt.hash('instructor123', 10)
    await connection.execute(
      'UPDATE users SET password = ? WHERE username IN (?, ?)',
      [hashedPassword1, 'instructor1', 'instructor2']
    )
    console.log('✓ 教练用户密码更新成功!')
    
    const hashedPassword2 = await bcrypt.hash('student123', 10)
    await connection.execute(
      'UPDATE users SET password = ? WHERE username IN (?, ?)',
      [hashedPassword2, 'student1', 'student2']
    )
    console.log('✓ 学员用户密码更新成功!')
    
    await connection.end()
    
  } catch (error) {
    console.error('错误:', error.message)
    process.exit(1)
  }
}

updatePassword()
