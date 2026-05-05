const axios = require('axios')

const BASE_URL = 'http://localhost:3000/api'

let instructorToken = ''
let courseId = null
let bookingId = null

async function loginAsInstructor() {
  try {
    console.log('教练登录...')
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'instructor1',
      password: '123456'
    })
    
    if (response.data.respCode === '00000') {
      instructorToken = response.data.respData.token
      console.log('✓ 教练登录成功')
      return true
    } else {
      console.log('✗ 教练登录失败:', response.data.respMsg)
      return false
    }
  } catch (error) {
    console.log('✗ 登录请求失败:', error.message)
    return false
  }
}

async function getMyCourses() {
  try {
    console.log('\n获取我的课程列表 GET /api/instructor/courses')
    console.log('=====================================')
    
    const response = await axios.get(`${BASE_URL}/instructor/courses`, {
      headers: {
        'Authorization': `Bearer ${instructorToken}`
      }
    })
    
    console.log('响应码:', response.data.respCode)
    console.log('响应消息:', response.data.respMsg)
    console.log('课程数量:', response.data.respData?.length || 0)
    
    if (response.data.respData && response.data.respData.length > 0) {
      courseId = response.data.respData[0].id
      console.log('第一个课程ID:', courseId)
    }
    
    return response.data.respCode === '00000'
  } catch (error) {
    console.log('✗ 请求失败:', error.message)
    return false
  }
}

async function getCourseDetail() {
  if (!courseId) {
    console.log('\n✗ 没有可用的课程ID')
    return false
  }
  
  try {
    console.log('\n获取课程详情 GET /api/instructor/courses/:id')
    console.log('=====================================')
    
    const response = await axios.get(`${BASE_URL}/instructor/courses/${courseId}`, {
      headers: {
        'Authorization': `Bearer ${instructorToken}`
      }
    })
    
    console.log('响应码:', response.data.respCode)
    console.log('响应消息:', response.data.respMsg)
    console.log('课程名称:', response.data.respData?.name)
    console.log('预约学员数:', response.data.respData?.bookings?.length || 0)
    
    if (response.data.respData?.bookings && response.data.respData.bookings.length > 0) {
      bookingId = response.data.respData.bookings[0].id
      console.log('第一个预约ID:', bookingId)
    }
    
    return response.data.respCode === '00000'
  } catch (error) {
    console.log('✗ 请求失败:', error.message)
    return false
  }
}

async function getCourseStudents() {
  if (!courseId) {
    console.log('\n✗ 没有可用的课程ID')
    return false
  }
  
  try {
    console.log('\n获取课程学员列表 GET /api/instructor/courses/:id/students')
    console.log('=====================================')
    
    const response = await axios.get(`${BASE_URL}/instructor/courses/${courseId}/students`, {
      headers: {
        'Authorization': `Bearer ${instructorToken}`
      }
    })
    
    console.log('响应码:', response.data.respCode)
    console.log('响应消息:', response.data.respMsg)
    console.log('学员数量:', response.data.respData?.length || 0)
    
    if (response.data.respData && response.data.respData.length > 0) {
      console.log('\n学员列表:')
      response.data.respData.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.user.realName} - ${booking.status}`)
      })
    }
    
    return response.data.respCode === '00000'
  } catch (error) {
    console.log('✗ 请求失败:', error.message)
    return false
  }
}

async function checkInStudent() {
  if (!bookingId) {
    console.log('\n✗ 没有可用的预约ID')
    return false
  }
  
  try {
    console.log('\n学员签到 POST /api/instructor/bookings/:id/checkin')
    console.log('=====================================')
    
    const response = await axios.post(`${BASE_URL}/instructor/bookings/${bookingId}/checkin`, {}, {
      headers: {
        'Authorization': `Bearer ${instructorToken}`
      }
    })
    
    console.log('响应码:', response.data.respCode)
    console.log('响应消息:', response.data.respMsg)
    
    return response.data.respCode === '00000'
  } catch (error) {
    if (error.response) {
      console.log('响应码:', error.response.data.respCode)
      console.log('响应消息:', error.response.data.respMsg)
    } else {
      console.log('✗ 请求失败:', error.message)
    }
    return false
  }
}

async function markStudentAbsent(refundHours = false) {
  if (!bookingId) {
    console.log('\n✗ 没有可用的预约ID')
    return false
  }
  
  try {
    console.log('\n标记学员缺席 POST /api/instructor/bookings/:id/absent')
    console.log('=====================================')
    console.log('是否返还课时:', refundHours)
    
    const response = await axios.post(`${BASE_URL}/instructor/bookings/${bookingId}/absent`, {
      refundHours
    }, {
      headers: {
        'Authorization': `Bearer ${instructorToken}`
      }
    })
    
    console.log('响应码:', response.data.respCode)
    console.log('响应消息:', response.data.respMsg)
    
    return response.data.respCode === '00000'
  } catch (error) {
    if (error.response) {
      console.log('响应码:', error.response.data.respCode)
      console.log('响应消息:', error.response.data.respMsg)
    } else {
      console.log('✗ 请求失败:', error.message)
    }
    return false
  }
}

async function testPermission() {
  try {
    console.log('\n测试权限校验（使用学员账号）')
    console.log('=====================================')
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'student1',
      password: '123456'
    })
    
    if (response.data.respCode === '00000') {
      const studentToken = response.data.respData.token
      
      const testResponse = await axios.get(`${BASE_URL}/instructor/courses`, {
        headers: {
          'Authorization': `Bearer ${studentToken}`
        }
      }).catch(err => err.response)
      
      console.log('学员访问教练接口响应码:', testResponse.data.respCode)
      console.log('学员访问教练接口响应消息:', testResponse.data.respMsg)
    }
  } catch (error) {
    console.log('✗ 权限测试失败:', error.message)
  }
}

async function runTests() {
  console.log('驾校约课系统 - 教练端接口测试')
  console.log('============================\n')
  
  const loginSuccess = await loginAsInstructor()
  if (!loginSuccess) {
    console.log('\n✗ 测试终止：教练登录失败')
    return
  }
  
  await getMyCourses()
  await getCourseDetail()
  await getCourseStudents()
  
  await checkInStudent()
  
  await markStudentAbsent(true)
  
  await testPermission()
  
  console.log('\n测试完成!')
}

runTests()
