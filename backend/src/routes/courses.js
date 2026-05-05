const express = require('express')
const router = express.Router()
const courseController = require('../controllers/courseController')
const authMiddleware = require('../middleware/auth')
const checkRole = require('../middleware/checkRole')
const { validateCreateCourse, validateUpdateCourse } = require('../middleware/validator')

router.get('/list', courseController.list)
router.get('/detail/:id', courseController.detail)
router.get('/instructor/appointments', authMiddleware, courseController.getInstructorAppointments)
router.post('/', authMiddleware, checkRole(['admin']), validateCreateCourse, courseController.create)
router.put('/:id', authMiddleware, checkRole(['admin']), validateUpdateCourse, courseController.update)
router.delete('/:id', authMiddleware, checkRole(['admin']), courseController.delete)

module.exports = router
