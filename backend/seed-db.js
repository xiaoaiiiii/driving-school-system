const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
require('dotenv').config()

async function seedDatabase() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'driving_school',
    timezone: '+08:00'
  })

  try {
    console.log('开始写入测试数据...\n')

    const passwordHash = await bcrypt.hash('123456', 10)

    await pool.execute('DELETE FROM appointments')
    await pool.execute('DELETE FROM courses')
    await pool.execute('DELETE FROM users WHERE id > 3')

    console.log('✓ 清空现有测试数据')

    const [instructors] = await pool.execute('SELECT id FROM users WHERE role = ?', ['instructor'])
    const instructorIds = instructors.map(i => i.id)

    const studentUsers = [
      { username: 'student1', real_name: '张三', phone: '13800138003', email: 'student1@driving.com' },
      { username: 'student2', real_name: '李四', phone: '13800138004', email: 'student2@driving.com' },
      { username: 'student3', real_name: '王五', phone: '13800138005', email: 'student3@driving.com' },
      { username: 'student4', real_name: '赵六', phone: '13800138006', email: 'student4@driving.com' },
      { username: 'student5', real_name: '钱七', phone: '13800138007', email: 'student5@driving.com' },
      { username: 'student6', real_name: '孙八', phone: '13800138008', email: 'student6@driving.com' },
      { username: 'student7', real_name: '周九', phone: '13800138009', email: 'student7@driving.com' },
      { username: 'student8', real_name: '吴十', phone: '13800138010', email: 'student8@driving.com' }
    ]

    const studentIds = []
    for (const student of studentUsers) {
      const [result] = await pool.execute(
        'INSERT INTO users (username, password, role, real_name, phone, email) VALUES (?, ?, ?, ?, ?, ?)',
        [student.username, passwordHash, 'student', student.real_name, student.phone, student.email]
      )
      studentIds.push(result.insertId)
    }
    console.log(`✓ 插入 ${studentIds.length} 个学员账号`)

    const now = new Date()
    const courses = []

    for (let i = 0; i < 5; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      courses.push(
        { name: `科目二基础训练-${i + 1}`, subject: 'subject2', start_time: `${dateStr} 09:00:00`, end_time: `${dateStr} 11:00:00`, capacity: 5, stock: 5, instructor_id: instructorIds[0], location: '训练场A', description: '科目二基础操作训练' },
        { name: `科目二综合训练-${i + 1}`, subject: 'subject2', start_time: `${dateStr} 14:00:00`, end_time: `${dateStr} 17:00:00`, capacity: 3, stock: 3, instructor_id: instructorIds[0], location: '训练场B', description: '科目二综合操作训练' },
        { name: `科目三路考训练-${i + 1}`, subject: 'subject3', start_time: `${dateStr} 09:00:00`, end_time: `${dateStr} 12:00:00`, capacity: 4, stock: 4, instructor_id: instructorIds[1], location: '训练场C', description: '科目三路考训练' },
        { name: `科目三夜间训练-${i + 1}`, subject: 'subject3', start_time: `${dateStr} 18:00:00`, end_time: `${dateStr} 21:00:00`, capacity: 3, stock: 3, instructor_id: instructorIds[1], location: '训练场A', description: '科目三夜间驾驶训练' }
      )
    }

    const courseIds = []
    for (const course of courses) {
      const [result] = await pool.execute(
        'INSERT INTO courses (name, subject, start_time, end_time, capacity, stock, instructor_id, location, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [course.name, course.subject, course.start_time, course.end_time, course.capacity, course.stock, course.instructor_id, course.location, course.description]
      )
      courseIds.push(result.insertId)
    }
    console.log(`✓ 插入 ${courseIds.length} 个课程`)

    const bookedPairs = new Set()

    for (let i = 0; i < studentIds.length; i++) {
      const courseId1 = courseIds[i % courseIds.length]
      const courseId2 = courseIds[(i + courseIds.length) % courseIds.length]

      const pairKey1 = `${studentIds[i]}-${courseId1}`
      if (!bookedPairs.has(pairKey1)) {
        await pool.execute(
          'INSERT INTO appointments (user_id, course_id, status, remark) VALUES (?, ?, ?, ?)',
          [studentIds[i], courseId1, 'confirmed', '预约测试']
        )
        await pool.execute(
          'UPDATE courses SET stock = stock - 1 WHERE id = ?',
          [courseId1]
        )
        bookedPairs.add(pairKey1)
      }

      if (i < 4) {
        const pairKey2 = `${studentIds[i]}-${courseId2}`
        if (!bookedPairs.has(pairKey2)) {
          await pool.execute(
            'INSERT INTO appointments (user_id, course_id, status, remark) VALUES (?, ?, ?, ?)',
            [studentIds[i], courseId2, 'confirmed', '预约测试2']
          )
          await pool.execute(
            'UPDATE courses SET stock = stock - 1 WHERE id = ?',
            [courseId2]
          )
          bookedPairs.add(pairKey2)
        }
      }
    }
    console.log(`✓ 插入预约记录`)

    const cancelledPairKey = `${studentIds[0]}-${courseIds[0]}`
    if (!bookedPairs.has(cancelledPairKey)) {
      await pool.execute(
        'INSERT INTO appointments (user_id, course_id, status, remark) VALUES (?, ?, ?, ?)',
        [studentIds[0], courseIds[0], 'cancelled', '取消测试']
      )
      await pool.execute(
        'UPDATE courses SET stock = stock + 1 WHERE id = ?',
        [courseIds[0]]
      )
    }
    console.log(`✓ 插入已取消的预约记录`)

    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users')
    const [coursesCount] = await pool.execute('SELECT COUNT(*) as count FROM courses')
    const [appointments] = await pool.execute('SELECT COUNT(*) as count FROM appointments')

    console.log('\n========== 数据统计 ==========')
    console.log(`用户总数: ${users[0].count}`)
    console.log(`课程总数: ${coursesCount[0].count}`)
    console.log(`预约记录: ${appointments[0].count}`)
    console.log('============================\n')

    console.log('✅ 测试数据写入完成!')

    console.log('\n========== 测试账号 ==========')
    console.log('管理员: admin / 123456')
    console.log('教练: instructor1 / 123456')
    console.log('教练: instructor2 / 123456')
    for (let i = 1; i <= studentIds.length; i++) {
      console.log(`学员: student${i} / 123456`)
    }
    console.log('============================\n')

  } catch (error) {
    console.error('❌ 数据写入失败:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

seedDatabase()
