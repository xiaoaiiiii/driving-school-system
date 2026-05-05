const db = require('./src/config/database')

async function checkCourses() {
  try {
    console.log('查询数据库中的课程数据...')
    
    const [courses] = await db.query('SELECT * FROM Courses')
    console.log('课程总数:', courses.length)
    console.log('课程列表:')
    courses.forEach(course => {
      console.log(`  ID: ${course.course_id}, 标题: ${course.title}, 科目: ${course.subject_type}, 开始时间: ${course.start_time}, 教练ID: ${course.coach_id}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('查询失败:', error.message)
    process.exit(1)
  }
}

checkCourses()