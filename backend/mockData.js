const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
require('dotenv').config()

async function mockData() {
  try {
    console.log('正在连接数据库...')
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'driving_school',
      multipleStatements: true
    })
    
    console.log('✓ 数据库连接成功!')
    
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    console.log('\n正在插入测试数据...')
    
    console.log('\n1. 插入管理员和教练账号...')
    await connection.query(`
      INSERT IGNORE INTO users (username, password, role, real_name, phone, email, status, create_time, update_time) VALUES
      ('admin', ?, 'admin', '系统管理员', '13800138000', 'admin@driving.com', 1, NOW(), NOW()),
      ('instructor1', ?, 'instructor', '张教练', '13800138001', 'instructor1@driving.com', 1, NOW(), NOW()),
      ('instructor2', ?, 'instructor', '李教练', '13800138002', 'instructor2@driving.com', 1, NOW(), NOW())
    `, [hashedPassword, hashedPassword, hashedPassword])
    console.log('   ✓ 管理员和教练账号插入完成')
    
    console.log('\n2. 插入10个测试学员...')
    const studentNames = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十', '钱十一', '陈十二']
    for (let i = 0; i < 10; i++) {
      const username = `student${i + 1}`
      const phone = `1390000${String(i + 1).padStart(4, '0')}`
      const email = `student${i + 1}@driving.com`
      const subjectStage = i % 2 === 0 ? 'subject2' : 'subject3'
      const totalHours = Math.floor(Math.random() * 20) + 10
      
      await connection.query(`
        INSERT IGNORE INTO users (username, password, role, real_name, phone, email, status, subject_stage, total_hours, create_time, update_time) 
        VALUES (?, ?, 'student', ?, ?, ?, 1, ?, ?, NOW(), NOW())
      `, [username, hashedPassword, studentNames[i], phone, email, subjectStage, totalHours])
    }
    console.log('   ✓ 10个测试学员插入完成')
    
    console.log('\n3. 插入20个测试课程...')
    const courseNames = {
      subject2: ['科目二基础训练', '科目二倒车入库', '科目二侧方停车', '科目二坡道起步', '科目二曲线行驶', '科目二综合训练'],
      subject3: ['科目三起步停车', '科目三直线行驶', '科目三加减档', '科目三变道超车', '科目三路口转弯', '科目三路考训练', '科目三夜间驾驶']
    }
    const locations = ['训练场A', '训练场B', '训练场C', '训练场D', '考试路段']
    const [coaches] = await connection.query('SELECT id FROM users WHERE role = "instructor"')
    const coachIds = coaches.map(c => c.id)
    
    const today = new Date()
    for (let i = 0; i < 20; i++) {
      const subject = i % 2 === 0 ? 'subject2' : 'subject3'
      const nameList = courseNames[subject]
      const name = nameList[i % nameList.length]
      const location = locations[i % locations.length]
      const coachId = coachIds[i % coachIds.length]
      
      const courseDate = new Date(today)
      courseDate.setDate(today.getDate() + Math.floor(i / 4))
      const dateStr = courseDate.toISOString().split('T')[0]
      
      const startHour = 9 + (i % 4) * 3
      const startTime = `${dateStr} ${String(startHour).padStart(2, '0')}:00:00`
      const endTime = `${dateStr} ${String(startHour + 2).padStart(2, '0')}:00:00`
      
      const maxCapacity = Math.floor(Math.random() * 5) + 2
      const stock = maxCapacity
      
      await connection.query(`
        INSERT INTO courses (name, subject, start_time, end_time, max_capacity, capacity, stock, coach_id, location, status, create_time, update_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
      `, [name, subject, startTime, endTime, maxCapacity, maxCapacity, stock, coachId, location])
    }
    console.log('   ✓ 20个测试课程插入完成')
    
    console.log('\n4. 插入一个只有1个名额的测试课程（用于并发测试）...')
    const testCourseDate = new Date(today)
    testCourseDate.setDate(today.getDate() + 7)
    const testDateStr = testCourseDate.toISOString().split('T')[0]
    const testStartTime = `${testDateStr} 14:00:00`
    const testEndTime = `${testDateStr} 16:00:00`
    
    const [testCourseResult] = await connection.query(`
      INSERT INTO courses (name, subject, start_time, end_time, max_capacity, capacity, stock, coach_id, location, status, create_time, update_time) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `, ['并发测试课程-仅1个名额', 'subject2', testStartTime, testEndTime, 1, 1, 1, coachIds[0], '测试训练场'])
    
    const testCourseId = testCourseResult.insertId
    console.log(`   ✓ 并发测试课程插入完成，课程ID: ${testCourseId}`)
    
    await connection.end()
    
    console.log('\n========================================')
    console.log('✓ 测试数据生成完成!')
    console.log('========================================')
    console.log('\n测试账号（密码均为: 123456）:')
    console.log('  管理员: admin')
    console.log('  教练: instructor1, instructor2')
    console.log('  学员: student1 ~ student10')
    console.log(`\n并发测试课程ID: ${testCourseId}`)
    console.log('\n========================================\n')
    
    return testCourseId
    
  } catch (error) {
    console.error('\n✗ 测试数据生成失败!')
    console.error('错误信息:', error.message)
    process.exit(1)
  }
}

mockData()
