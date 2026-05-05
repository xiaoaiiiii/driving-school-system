const { User, Course, Booking } = require('./src/models')
const sequelize = require('./src/config/sequelize')
const bcrypt = require('bcryptjs')

async function prepareTestData() {
  try {
    console.log('准备测试数据...\n')

    await sequelize.sync({ alter: true })
    console.log('✓ 数据库表同步完成')

    const passwordHash = await bcrypt.hash('123456', 10)

    const [instructor] = await User.findOrCreate({
      where: { username: 'instructor1' },
      defaults: {
        username: 'instructor1',
        password: passwordHash,
        role: 'instructor',
        realName: '张教练',
        phone: '13800138001',
        totalHours: 100
      }
    })
    console.log('✓ 教练账号准备完成')

    const [student] = await User.findOrCreate({
      where: { username: 'student1' },
      defaults: {
        username: 'student1',
        password: passwordHash,
        role: 'student',
        realName: '学员张三',
        phone: '13800138003',
        totalHours: 10
      }
    })
    console.log('✓ 学员账号准备完成')

    const [course] = await Course.findOrCreate({
      where: {
        coachId: instructor.id,
        name: '科目二基础训练',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      defaults: {
        name: '科目二基础训练',
        subject: 'subject2',
        coachId: instructor.id,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        maxCapacity: 5,
        bookedCount: 1,
        status: 'ongoing',
        location: '训练场A',
        description: '科目二基础操作训练'
      }
    })
    console.log('✓ 测试课程准备完成')

    const [booking] = await Booking.findOrCreate({
      where: {
        userId: student.id,
        courseId: course.id
      },
      defaults: {
        userId: student.id,
        courseId: course.id,
        status: 'booked'
      }
    })
    console.log('✓ 测试预约准备完成')

    console.log('\n测试数据准备完成!')
    console.log('=====================')
    console.log('教练账号: instructor1 / 123456')
    console.log('学员账号: student1 / 123456')
    console.log('课程ID:', course.id)
    console.log('预约ID:', booking.id)

    process.exit(0)
  } catch (error) {
    console.error('✗ 准备测试数据失败:', error.message)
    process.exit(1)
  }
}

prepareTestData()
