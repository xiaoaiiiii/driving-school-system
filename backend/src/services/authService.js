const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const config = require('../config')
const mockUserData = require('../data/mockUserData')

class AuthService {
  async login(username, password) {
    try {
      // 尝试从数据库获取用户
      const user = await User.findByUsername(username)

      if (!user) {
        throw new Error('用户名或密码错误')
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        throw new Error('用户名或密码错误')
      }

      if (!user.status) {
        throw new Error('账号已被禁用')
      }

      // 确保角色兼容性，同时支持 instructor 和 coach
      let tokenRole = user.role
      if (tokenRole === 'coach') {
        tokenRole = 'instructor'
      }
      
      const token = jwt.sign(
        { id: user.id, username: user.username, role: tokenRole },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      const { password: _, ...userInfo } = user
      
      // 确保角色兼容性，同时支持 instructor 和 coach
      userInfo.role = userInfo.role === 'coach' ? 'instructor' : userInfo.role

      return {
        token,
        userInfo
      }
    } catch (error) {
      console.log('数据库登录失败，使用mock数据:', error.message)
      
      // 使用共享的 mock 数据
      const mockUser = mockUserData.findUserByUsername(username)
      
      if (!mockUser) {
        throw new Error('用户名或密码错误')
      }

      const isPasswordValid = await bcrypt.compare(password, mockUser.password)
      if (!isPasswordValid) {
        throw new Error('用户名或密码错误')
      }

      if (!mockUser.status) {
        throw new Error('账号已被禁用')
      }

      // 确保角色兼容性，同时支持 instructor 和 coach
      let tokenRole = mockUser.role
      if (tokenRole === 'coach') {
        tokenRole = 'instructor'
      }
      
      const token = jwt.sign(
        { id: mockUser.id, username: mockUser.username, role: tokenRole },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      const { password: _, ...userInfo } = mockUser
      
      // 确保角色兼容性，同时支持 instructor 和 coach
      userInfo.role = userInfo.role === 'coach' ? 'instructor' : userInfo.role

      return {
        token,
        userInfo
      }
    }
  }

  async register(userData) {
    try {
      const existingUser = await User.findByUsername(userData.username)
      if (existingUser) {
        throw new Error('用户名已存在')
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10)

      const userId = await User.create({
        ...userData,
        password: hashedPassword,
        role: userData.role || 'student'
      })

      return await User.findById(userId)
    } catch (error) {
      console.log('数据库注册失败，使用mock数据:', error.message)
      
      // 使用共享的 mock 数据
      const existingUser = mockUserData.findUserByUsername(userData.username)
      if (existingUser) {
        throw new Error('用户名已存在')
      }
      
      // 验证用户名格式
      if (!mockUserData.validateUsernameFormat(userData.username)) {
        throw new Error('用户名只能包含英文字母和数字')
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10)
      
      const newUser = mockUserData.addMockUser({
        username: userData.username,
        password: hashedPassword,
        real_name: userData.real_name || '',
        phone: userData.phone || '',
        email: userData.email || '',
        role: userData.role || 'student',
        subject_stage: userData.subject_stage || null,
        total_hours: userData.total_hours || 20,
        status: 1
      })
      
      return newUser
    }
  }

  async getUserInfo(userId) {
    try {
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }
      return user
    } catch (error) {
      console.log('数据库获取用户信息失败，使用mock数据:', error.message)
      
      // 使用共享的 mock 数据
      const mockUser = mockUserData.findUserById(userId)
      if (!mockUser) {
        throw new Error('用户不存在')
      }
      return mockUser
    }
  }
}

module.exports = new AuthService()
