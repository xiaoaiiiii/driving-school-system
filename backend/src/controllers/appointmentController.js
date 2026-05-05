const appointmentService = require('../services/appointmentService')
const ResponseHandler = require('../utils/responseHandler')

class AppointmentController {
  async book(req, res) {
    try {
      const { courseId } = req.body
      const userId = req.user.id
      const result = await appointmentService.bookCourse(userId, courseId)
      // appointmentService 已经返回完整的 respCode 格式，直接返回
      res.json(result)
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async my(req, res) {
    try {
      const userId = req.user.id
      const { status } = req.query
      const appointments = await appointmentService.getMyAppointments(userId, status)
      res.json(ResponseHandler.success(appointments, '获取成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async cancel(req, res) {
    try {
      const { id } = req.params
      const userId = req.user.id
      const result = await appointmentService.cancelAppointment(id, userId)
      // cancelAppointment 返回完整的 respCode 格式，直接返回
      if (result && result.respCode) {
        res.json(result)
      } else {
        res.json(ResponseHandler.success(null, '取消成功'))
      }
    } catch (error) {
      res.json(ResponseHandler.error('99999', error.message))
    }
  }

  async listAll(req, res) {
    try {
      const filters = {
        status: req.query.status,
        courseId: req.query.courseId
      }
      const appointments = await appointmentService.getAllAppointments(filters)
      res.json(ResponseHandler.success(appointments, '获取成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async checkIn(req, res) {
    try {
      const { id } = req.params
      const instructorId = req.user.id
      const result = await appointmentService.checkIn(id, instructorId)
      // checkIn 返回完整的 respCode 格式，直接返回
      res.json(result)
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async markAbsent(req, res) {
    try {
      const { id } = req.params
      const { refundHours = false } = req.body
      const instructorId = req.user.id
      const result = await appointmentService.markAbsent(id, instructorId, refundHours)
      // markAbsent 返回完整的 respCode 格式，直接返回
      res.json(result)
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }
}

module.exports = new AppointmentController()
