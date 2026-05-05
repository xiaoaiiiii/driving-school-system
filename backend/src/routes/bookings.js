const express = require('express')
const router = express.Router()
const bookingController = require('../controllers/bookingController')
const authMiddleware = require('../middleware/auth')

router.post('/', authMiddleware, bookingController.create)
router.get('/my', authMiddleware, bookingController.list)
router.post('/cancel/:id', authMiddleware, bookingController.cancel)

module.exports = router
