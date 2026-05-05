const checkRole = require('./checkRole')

const instructorAuth = (req, res, next) => {
  return checkRole(['instructor', 'admin'])(req, res, next)
}

module.exports = instructorAuth
