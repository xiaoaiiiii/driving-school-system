require('dotenv').config()

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  port: process.env.PORT || 3001
}
