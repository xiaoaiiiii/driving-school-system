const express = require('express')
const router = express.Router()
const appointmentController = require('../controllers/appointmentController')
const authMiddleware = require('../middleware/auth')
const checkAppointmentOwnership = require('../middleware/checkAppointmentOwnership')
const instructorAuth = require('../middleware/instructorAuth')

router.post('/book', authMiddleware, appointmentController.book)
router.get('/my', authMiddleware, appointmentController.my)
router.post('/cancel/:id', authMiddleware, checkAppointmentOwnership, appointmentController.cancel)
router.get('/list', authMiddleware, appointmentController.listAll)
router.post('/check-in/:id', authMiddleware, instructorAuth, appointmentController.checkIn)
router.post('/mark-absent/:id', authMiddleware, instructorAuth, appointmentController.markAbsent)

module.exports = router
