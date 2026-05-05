const axios = require('axios')

const BASE_URL = 'http://localhost:3000/api'

let authToken = ''

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'student1',
      password: '123456'
    })
    
    if (response.data.respCode === '00000') {
      authToken = response.data.respData.token
      console.log('✓ 登录成功')
      return true
    } else {
      console.log('✗ 登录失败:', response.data.respMsg)
      return false
    }
  } catch (error) {
    console.log('✗ 登录请求失败:', error.message)
    return false
  }
}

async function testBooking() {
  try {
    console.log('\n测试预约接口 POST /api/bookings')
    console.log('=====================================')
    
    const response = await axios.post(`${BASE_URL}/bookings`, {
      courseId: 1
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    console.log('响应码:', response.data.respCode)
    console.log('响应消息:', response.data.respMsg)
    console.log('响应数据:', JSON.stringify(response.data.respData, null, 2))
    
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

async function testGetMyBookings() {
  try {
    console.log('\n测试获取我的预约 GET /api/bookings/my')
    console.log('=====================================')
    
    const response = await axios.get(`${BASE_URL}/bookings/my`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    console.log('响应码:', response.data.respCode)
    console.log('响应消息:', response.data.respMsg)
    console.log('预约数量:', response.data.respData?.length || 0)
    
    return response.data.respCode === '00000'
  } catch (error) {
    console.log('✗ 请求失败:', error.message)
    return false
  }
}

async function testCancelBooking(bookingId) {
  try {
    console.log('\n测试取消预约 POST /api/bookings/cancel/:id')
    console.log('=====================================')
    
    const response = await axios.post(`${BASE_URL}/bookings/cancel/${bookingId}`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
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

async function runTests() {
  console.log('驾校约课系统 - 预约接口测试')
  console.log('============================\n')
  
  const loginSuccess = await login()
  if (!loginSuccess) {
    console.log('\n✗ 测试终止：登录失败')
    return
  }
  
  await testBooking()
  await testGetMyBookings()
  
  console.log('\n测试完成!')
}

runTests()
