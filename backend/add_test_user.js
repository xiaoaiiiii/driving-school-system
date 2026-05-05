const db = require('./src/config/database')
const bcrypt = require('bcryptjs')

async function addTestUser() {
  try {
    console.log('开始添加测试用户...')
    
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    // 插入测试学员
    await db.query(
      'INSERT INTO Users (username, name, phone, password, role, subject_progress, remaining_hours, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['teststudent', '测试学员', '13900000001', hashedPassword, 'student', 0, 20, 1]
    )
    console.log('✅ 测试学员添加成功！用户名: teststudent, 密码: 123456')
    
    // 插入测试教练
    await db.query(
      'INSERT INTO Users (username, name, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['testcoach', '测试教练', '13900000002', hashedPassword, 'coach', 1]
    )
    console.log('✅ 测试教练添加成功！用户名: testcoach, 密码: 123456')
    
    console.log('\n测试用户添加完成！请重启后端服务后刷新前端页面查看。')
    process.exit(0)
  } catch (error) {
    console.error('❌ 添加失败:', error.message)
    if (error.message.includes('Duplicate entry')) {
      console.log('提示: 这些用户可能已经存在了，请先删除或使用其他用户名。')
    }
    process.exit(1)
  }
}

addTestUser()
