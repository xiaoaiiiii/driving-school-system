const mysql = require('mysql2/promise')
require('dotenv').config()

async function checkData() {
  try {
    console.log('正在连接数据库...')
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'driving_school'
    })
    
    console.log('✓ 数据库连接成功!\n')
    
    console.log('=== 用户数据 ===')
    const [users] = await connection.execute('SELECT id, username, role, real_name FROM users')
    console.log(users)
    
    console.log('\n=== 课程数据 ===')
    const [courses] = await connection.execute('SELECT id, name, subject, start_time, max_capacity, booked_count, coach_id FROM courses')
    console.log(courses)
    
    console.log('\n=== 预约数据 ===')
    const [bookings] = await connection.execute('SELECT id, user_id, course_id, status FROM bookings')
    console.log(bookings)
    
    await connection.end()
    
  } catch (error) {
    console.error('错误:', error.message)
    process.exit(1)
  }
}

checkData()
