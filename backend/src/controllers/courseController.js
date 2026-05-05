const courseService = require('../services/courseService')
const ResponseHandler = require('../utils/responseHandler')

class CourseController {
  async list(req, res) {
    try {
      const filters = {
        date: req.query.date,
        subject: req.query.subject
      }
      const courses = await courseService.getCourses(filters)
      res.json(ResponseHandler.success(courses, '获取成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async detail(req, res) {
    try {
      const { id } = req.params
      const course = await courseService.getCourseById(id)
      if (!course) {
        return res.json(ResponseHandler.notFound('课程不存在'))
      }
      res.json(ResponseHandler.success(course, '获取成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async create(req, res) {
    try {
      const courseData = req.body
      const course = await courseService.createCourse(courseData)
      res.json(ResponseHandler.success({ id: course }, '创建成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params
      const courseData = req.body
      await courseService.updateCourse(id, courseData)
      res.json(ResponseHandler.success(null, '更新成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params
      await courseService.deleteCourse(id)
      res.json(ResponseHandler.success(null, '删除成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  // 获取教练的预约列表
  async getInstructorAppointments(req, res) {
    try {
      const instructorId = req.user.id
      const filters = {
        status: req.query.status,
        date: req.query.date
      }
      const appointments = await courseService.getInstructorAppointments(instructorId, filters)
      res.json(ResponseHandler.success(appointments, '获取成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }
}

module.exports = new CourseController()
