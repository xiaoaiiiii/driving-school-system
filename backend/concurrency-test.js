const axios = require('axios')

const API_BASE = 'http://localhost:3002/api'

async function login(username, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username,
      password
    })
    if (response.data.respCode === '00000') {
      return response.data.respData.token
    }
    throw new Error(response.data.respMsg || '登录失败')
  } catch (error) {
    console.error(`用户 ${username} 登录失败:`, error.message)
    return null
  }
}

async function bookCourse(token, courseId, userId) {
  try {
    const response = await axios.post(
      `${API_BASE}/appointments/book`,
      { courseId },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    return {
      userId,
      success: response.data.respCode === '00000',
      respCode: response.data.respCode,
      respMsg: response.data.respMsg
    }
  } catch (error) {
    return {
      userId,
      success: false,
      respCode: '99999',
      respMsg: error.message
    }
  }
}

async function checkCourseStock(courseId) {
  try {
    const response = await axios.get(`${API_BASE}/courses/detail/${courseId}`)
    if (response.data.respCode === '00000') {
      return response.data.respData.stock
    }
    return null
  } catch (error) {
    console.error('查询课程名额失败:', error.message)
    return null
  }
}

async function runConcurrencyTest(courseId, userCount = 5) {
  console.log('========================================')
  console.log('并发压力测试开始')
  console.log('========================================')
  console.log(`测试课程ID: ${courseId}`)
  console.log(`模拟用户数: ${userCount}`)
  console.log()
  
  const initialStock = await checkCourseStock(courseId)
  console.log(`课程初始名额: ${initialStock}`)
  console.log()
  
  console.log('1. 正在登录测试用户...')
  const tokens = []
  for (let i = 1; i <= userCount; i++) {
    const username = `student${i}`
    const token = await login(username, '123456')
    if (token) {
      tokens.push({ userId: i, token })
      console.log(`   ✓ 学生${i} 登录成功`)
    }
  }
  console.log()
  
  if (tokens.length === 0) {
    console.error('没有用户登录成功，测试终止')
    return
  }
  
  console.log('2. 开始并发抢课...')
  console.log(`   同时发起 ${tokens.length} 个抢课请求...`)
  console.log()
  
  const promises = tokens.map(({ userId, token }) => 
    bookCourse(token, courseId, userId)
  )
  
  const results = await Promise.all(promises)
  
  console.log('3. 抢课结果统计:')
  console.log()
  
  const successCount = results.filter(r => r.success).length
  const failCount = results.length - successCount
  
  console.log(`   ✓ 成功: ${successCount} 人`)
  console.log(`   ✗ 失败: ${failCount} 人`)
  console.log()
  
  results.forEach((result, index) => {
    const status = result.success ? '✓' : '✗'
    const color = result.success ? '\x1b[32m' : '\x1b[31m'
    const reset = '\x1b[0m'
    console.log(`   ${color}${status} 学生${result.userId} - ${result.respMsg} (${result.respCode})${reset}`)
  })
  console.log()
  
  const finalStock = await checkCourseStock(courseId)
  console.log(`4. 课程最终名额: ${finalStock}`)
  console.log()
  
  console.log('========================================')
  console.log('并发压力测试完成')
  console.log('========================================')
  console.log()
  
  if (successCount === initialStock && finalStock === 0) {
    console.log('\x1b[32m✓ 悲观锁机制验证成功! 没有出现超卖现象\x1b[0m')
  } else {
    console.log('\x1b[31m✗ 可能存在超卖问题，请检查!\x1b[0m')
  }
  console.log()
}

const courseId = process.argv[2]
const userCount = parseInt(process.argv[3]) || 5

if (!courseId) {
  console.log('使用方法: node concurrency-test.js <课程ID> [并发用户数]')
  console.log('示例: node concurrency-test.js 10 5')
  console.log()
  console.log('提示: 请先运行 node mockData.js 获取测试课程ID')
  process.exit(1)
}

runConcurrencyTest(courseId, userCount).catch(console.error)
