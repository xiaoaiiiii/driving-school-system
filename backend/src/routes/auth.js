const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/auth')
const { validateRegister } = require('../middleware/validator')

router.post('/login', authController.login)
router.post('/register', validateRegister, authController.register)
router.post('/logout', authController.logout)
router.get('/userInfo', authMiddleware, authController.getUserInfo)

module.exports = router
