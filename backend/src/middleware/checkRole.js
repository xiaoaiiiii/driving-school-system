const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.json({
        respCode: '10001',
        respData: null,
        respMsg: '未认证'
      })
    }

    // 支持两种角色名：instructor 和 coach
    let userRole = req.user.role
    if (userRole === 'coach') {
      userRole = 'instructor'
    }

    // 检查用户角色是否在允许列表中（同时支持两种角色名匹配
    let hasPermission = allowedRoles.includes(req.user.role) || 
                        (req.user.role === 'coach' && allowedRoles.includes('instructor'))

    if (!hasPermission) {
      return res.json({
        respCode: '40003',
        respData: null,
        respMsg: '权限不足'
      })
    }

    next()
  }
}

module.exports = checkRole
