class ResponseHandler {
  static success(data = null, message = '操作成功') {
    return {
      respCode: '00000',
      respData: data,
      respMsg: message
    }
  }

  static error(code = '99999', message = '操作失败', data = null) {
    return {
      respCode: code,
      respData: data,
      respMsg: message
    }
  }

  static notFound(message = '资源不存在') {
    return this.error('40001', message)
  }

  static unauthorized(message = '未授权') {
    return this.error('40002', message)
  }

  static forbidden(message = '无权操作') {
    return this.error('40003', message)
  }

  static validationError(message = '参数验证失败') {
    return this.error('40004', message)
  }

  static tokenExpired(message = '登录已过期，请重新登录') {
    return this.error('10001', message)
  }

  static systemError(message = '系统错误') {
    return this.error('99999', message)
  }
}

module.exports = ResponseHandler
