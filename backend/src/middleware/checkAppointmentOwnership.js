const Appointment = require('../models/Appointment')

const checkAppointmentOwnership = async (req, res, next) => {
  try {
    const appointmentId = req.params.id
    const userId = req.user.id

    const appointment = await Appointment.findById(appointmentId)

    if (!appointment) {
      return res.json({
        respCode: '40002',
        respData: null,
        respMsg: '预约不存在'
      })
    }

    if (appointment.user_id !== userId) {
      return res.json({
        respCode: '40003',
        respData: null,
        respMsg: '无权操作此预约'
      })
    }

    next()
  } catch (error) {
    return res.json({
      respCode: '99999',
      respData: null,
      respMsg: error.message || '操作失败'
    })
  }
}

module.exports = checkAppointmentOwnership
