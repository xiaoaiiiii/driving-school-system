const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const authMiddleware = require('../middleware/auth')
const checkRole = require('../middleware/checkRole')

// 用户管理
router.get('/users', authMiddleware, checkRole(['admin']), adminController.getUsers)
router.get('/users/:id', authMiddleware, checkRole(['admin']), adminController.getUserById)
router.post('/users', authMiddleware, checkRole(['admin']), adminController.createUser)
router.put('/users/:id', authMiddleware, checkRole(['admin']), adminController.updateUser)
router.delete('/users/:id', authMiddleware, checkRole(['admin']), adminController.deleteUser)
router.put('/users/:id/status', authMiddleware, checkRole(['admin']), adminController.toggleUserStatus)
router.put('/users/:id/password', authMiddleware, checkRole(['admin']), adminController.resetPassword)

// 课程管理
router.get('/courses', authMiddleware, checkRole(['admin']), adminController.getCourses)
router.get('/courses/:id', authMiddleware, checkRole(['admin']), adminController.getCourseById)
router.post('/courses', authMiddleware, checkRole(['admin']), adminController.createCourse)
router.put('/courses/:id', authMiddleware, checkRole(['admin']), adminController.updateCourse)
router.delete('/courses/:id', authMiddleware, checkRole(['admin']), adminController.deleteCourse)
router.delete('/courses/batch', authMiddleware, checkRole(['admin']), adminController.deleteExpiredCourses)

// 教练列表
router.get('/instructors', authMiddleware, checkRole(['admin']), adminController.getInstructors)

module.exports = router
