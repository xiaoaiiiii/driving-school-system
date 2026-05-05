const express = require('express')
const router = express.Router()
const instructorController = require('../controllers/instructorController')
const authMiddleware = require('../middleware/auth')
const instructorAuth = require('../middleware/instructorAuth')

router.get('/courses', authMiddleware, instructorAuth, instructorController.getMyCourses)
router.get('/courses/:id', authMiddleware, instructorAuth, instructorController.getCourseDetail)
router.get('/courses/:id/students', authMiddleware, instructorAuth, instructorController.getCourseStudents)
router.post('/bookings/:id/checkin', authMiddleware, instructorAuth, instructorController.checkIn)
router.post('/bookings/:id/absent', authMiddleware, instructorAuth, instructorController.markAbsent)

module.exports = router
