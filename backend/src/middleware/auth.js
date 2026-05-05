const jwt = require('jsonwebtoken')
const config = require('../config')

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.json({
        respCode: '10001',
        respData: null,
        respMsg: '未提供认证令牌'
      })
    }

    const decoded = jwt.verify(token, config.jwt.secret)
    req.user = decoded
    next()
  } catch (error) {
    return res.json({
      respCode: '10001',
      respData: null,
      respMsg: '认证令牌无效或已过期'
    })
  }
}

module.exports = authMiddleware
