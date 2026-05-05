const ResponseHandler = require('../utils/responseHandler')

class Validator {
  static isPhone(phone) {
    const phoneReg = /^1[3-9]\d{9}$/
    return phoneReg.test(phone)
  }

  static isEmail(email) {
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailReg.test(email)
  }

  static isPositiveInteger(num) {
    return Number.isInteger(Number(num)) && Number(num) > 0
  }

  static isPositiveNumber(num) {
    return !isNaN(Number(num)) && Number(num) >= 0
  }

  static isDate(dateStr) {
    const date = new Date(dateStr)
    return !isNaN(date.getTime())
  }

  static validateRequired(value, fieldName) {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${fieldName}不能为空`)
    }
    return true
  }

  static validatePhone(phone, fieldName = '手机号') {
    this.validateRequired(phone, fieldName)
    if (!this.isPhone(phone)) {
      throw new Error(`${fieldName}格式不正确`)
    }
    return true
  }

  static validateEmail(email, fieldName = '邮箱') {
    if (email && !this.isEmail(email)) {
      throw new Error(`${fieldName}格式不正确`)
    }
    return true
  }

  static validatePositiveInteger(num, fieldName) {
    this.validateRequired(num, fieldName)
    if (!this.isPositiveInteger(num)) {
      throw new Error(`${fieldName}必须是正整数`)
    }
    return true
  }

  static validatePositiveNumber(num, fieldName) {
    this.validateRequired(num, fieldName)
    if (!this.isPositiveNumber(num)) {
      throw new Error(`${fieldName}必须是非负数`)
    }
    return true
  }

  static validateDate(dateStr, fieldName = '日期') {
    this.validateRequired(dateStr, fieldName)
    if (!this.isDate(dateStr)) {
      throw new Error(`${fieldName}格式不正确`)
    }
    return true
  }

  static validatePassword(password, fieldName = '密码') {
    this.validateRequired(password, fieldName)
    if (password.length < 6) {
      throw new Error(`${fieldName}长度不能少于6位`)
    }
    return true
  }

  static validateRole(role, fieldName = '角色') {
    this.validateRequired(role, fieldName)
    const validRoles = ['student', 'instructor', 'admin']
    if (!validRoles.includes(role)) {
      throw new Error(`${fieldName}不正确`)
    }
    return true
  }

  static validateSubject(subject, fieldName = '科目') {
    this.validateRequired(subject, fieldName)
    const validSubjects = ['subject2', 'subject3']
    if (!validSubjects.includes(subject)) {
      throw new Error(`${fieldName}不正确`)
    }
    return true
  }

  static validateTimeRange(startTime, endTime, startField = '开始时间', endField = '结束时间') {
    this.validateDate(startTime, startField)
    this.validateDate(endTime, endField)
    if (new Date(startTime) >= new Date(endTime)) {
      throw new Error(`${startField}必须早于${endField}`)
    }
    return true
  }
}

const validateRegister = (req, res, next) => {
  try {
    const { username, password, realName, phone, email, role } = req.body
    
    Validator.validateRequired(username, '用户名')
    Validator.validatePassword(password, '密码')
    Validator.validateRequired(realName, '真实姓名')
    Validator.validatePhone(phone, '手机号')
    // email是可选的，只有提供时才验证
    if (email) {
      Validator.validateEmail(email, '邮箱')
    }
    if (role) {
      Validator.validateRole(role, '角色')
    }
    
    next()
  } catch (error) {
    res.json(ResponseHandler.validationError(error.message))
  }
}

const validateCreateCourse = (req, res, next) => {
  try {
    const { name, subject, start_time, end_time, max_capacity, location } = req.body
    
    Validator.validateRequired(name, '课程名称')
    Validator.validateSubject(subject, '科目')
    Validator.validateTimeRange(start_time, end_time, '开始时间', '结束时间')
    Validator.validatePositiveInteger(max_capacity, '最大人数')
    Validator.validateRequired(location, '地点')
    
    next()
  } catch (error) {
    res.json(ResponseHandler.validationError(error.message))
  }
}

const validateUpdateCourse = (req, res, next) => {
  try {
    const { name, subject, start_time, end_time, max_capacity, location } = req.body
    
    if (name) {
      Validator.validateRequired(name, '课程名称')
    }
    if (subject) {
      Validator.validateSubject(subject, '科目')
    }
    if (start_time && end_time) {
      Validator.validateTimeRange(start_time, end_time, '开始时间', '结束时间')
    }
    if (max_capacity) {
      Validator.validatePositiveInteger(max_capacity, '最大人数')
    }
    
    next()
  } catch (error) {
    res.json(ResponseHandler.validationError(error.message))
  }
}

module.exports = {
  Validator,
  validateRegister,
  validateCreateCourse,
  validateUpdateCourse
}
