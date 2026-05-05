const ResponseHandler = require('../utils/responseHandler')
const fs = require('fs')
const path = require('path')

const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString()
  
  const errorLog = {
    timestamp,
    method: req.method,
    url: req.url,
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code
    }
  }
  
  console.error('=== 错误日志 ===')
  console.error(errorLog)
  
  const logDir = path.join(__dirname, '../../logs')
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
  
  const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`)
  fs.appendFileSync(logFile, JSON.stringify(errorLog) + '\n')
  
  if (err.code === 'ER_DUP_ENTRY') {
    return res.json(ResponseHandler.error('99998', '数据已存在'))
  }
  
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.json(ResponseHandler.error('99997', '关联数据不存在'))
  }
  
  if (err.name === 'ValidationError') {
    return res.json(ResponseHandler.validationError(err.message))
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.json(ResponseHandler.unauthorized(err.message))
  }
  
  res.json(ResponseHandler.systemError())
}

module.exports = errorHandler
