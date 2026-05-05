const authService = require('../services/authService')

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body
      const result = await authService.login(username, password)
      res.json({
        respCode: '00000',
        respData: result,
        respMsg: '登录成功'
      })
    } catch (error) {
      res.json({
        respCode: '99999',
        respData: null,
        respMsg: error.message
      })
    }
  }

  async register(req, res) {
    try {
      const userData = req.body
      const user = await authService.register(userData)
      res.json({
        respCode: '00000',
        respData: user,
        respMsg: '注册成功'
      })
    } catch (error) {
      res.json({
        respCode: '99999',
        respData: null,
        respMsg: error.message
      })
    }
  }

  async logout(req, res) {
    res.json({
      respCode: '00000',
      respData: null,
      respMsg: '登出成功'
    })
  }

  async getUserInfo(req, res) {
    try {
      const user = await authService.getUserInfo(req.user.id)
      res.json({
        respCode: '00000',
        respData: user,
        respMsg: '获取成功'
      })
    } catch (error) {
      res.json({
        respCode: '99999',
        respData: null,
        respMsg: error.message
      })
    }
  }
}

module.exports = new AuthController()
