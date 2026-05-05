const { Op } = require('sequelize')
const sequelize = require('../config/sequelize')
const { User, Course, Booking } = require('../models')

class BookingController {
  async create(req, res) {
    const transaction = await sequelize.transaction({
      isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    })

    try {
      const { courseId } = req.body
      const userId = req.user.id

      if (!courseId) {
        throw new Error('INVALID_PARAMS', '缺少课程ID')
      }

      const user = await User.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      })

      if (!user) {
        throw new Error('USER_NOT_FOUND', '用户不存在')
      }

      if (user.totalHours <= 0) {
        throw new Error('INSUFFICIENT_HOURS', '课时余额不足')
      }

      const course = await Course.findByPk(courseId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      })

      if (!course) {
        throw new Error('COURSE_NOT_FOUND', '课程不存在')
      }

      if (course.status !== 'ongoing') {
        throw new Error('COURSE_NOT_AVAILABLE', '课程不可预约')
      }

      if (course.bookedCount >= course.maxCapacity) {
        throw new Error('COURSE_FULL', '课程名额已满')
      }

      const existingBooking = await Booking.findOne({
        where: {
          userId,
          courseId,
          status: { [Op.in]: ['booked', 'checked_in'] }
        },
        transaction
      })

      if (existingBooking) {
        throw new Error('ALREADY_BOOKED', '您已预约该课程')
      }

      const conflictBooking = await Booking.findOne({
        where: {
          userId,
          status: { [Op.in]: ['booked', 'checked_in'] }
        },
        include: [{
          model: Course,
          as: 'course',
          where: {
            status: 'ongoing',
            [Op.or]: [
              {
                startTime: { [Op.lt]: course.endTime },
                endTime: { [Op.gt]: course.startTime }
              }
            ]
          }
        }],
        transaction
      })

      if (conflictBooking) {
        throw new Error('TIME_CONFLICT', `与已预约课程《${conflictBooking.course.name}》时间冲突`)
      }

      const booking = await Booking.create({
        userId,
        courseId,
        status: 'booked'
      }, { transaction })

      await Course.update({
        bookedCount: sequelize.literal('booked_count + 1')
      }, {
        where: { id: courseId },
        transaction
      })

      await User.update({
        totalHours: sequelize.literal('total_hours - 1')
      }, {
        where: { id: userId },
        transaction
      })

      await transaction.commit()

      const result = await Booking.findByPk(booking.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'realName', 'phone']
          },
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'name', 'subject', 'startTime', 'endTime', 'location']
          }
        ]
      })

      res.json({
        respCode: '00000',
        respData: result,
        respMsg: '预约成功'
      })
    } catch (error) {
      await transaction.rollback()

      const errorCode = error.message.includes(':') ? error.message.split(':')[0] : 'SYSTEM_ERROR'
      const errorMsg = error.message.includes(':') ? error.message.split(':')[1] : error.message

      const errorMap = {
        'INVALID_PARAMS': { code: '40001', msg: errorMsg || '参数错误' },
        'USER_NOT_FOUND': { code: '40002', msg: errorMsg || '用户不存在' },
        'INSUFFICIENT_HOURS': { code: '40003', msg: errorMsg || '课时余额不足' },
        'COURSE_NOT_FOUND': { code: '40004', msg: errorMsg || '课程不存在' },
        'COURSE_NOT_AVAILABLE': { code: '40005', msg: errorMsg || '课程不可预约' },
        'COURSE_FULL': { code: '40006', msg: errorMsg || '课程名额已满' },
        'ALREADY_BOOKED': { code: '40007', msg: errorMsg || '您已预约该课程' },
        'TIME_CONFLICT': { code: '40008', msg: errorMsg || '预约时间冲突' }
      }

      const errorInfo = errorMap[errorCode] || { code: '99999', msg: errorMsg || '系统错误' }

      res.json({
        respCode: errorInfo.code,
        respData: null,
        respMsg: errorInfo.msg
      })
    }
  }

  async list(req, res) {
    try {
      const userId = req.user.id

      const bookings = await Booking.findAll({
        where: { userId },
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'name', 'subject', 'startTime', 'endTime', 'location', 'status'],
            include: [
              {
                model: User,
                as: 'coach',
                attributes: ['id', 'realName', 'phone']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      })

      res.json({
        respCode: '00000',
        respData: bookings,
        respMsg: '获取成功'
      })
    } catch (error) {
      res.json({
        respCode: '99999',
        respData: null,
        respMsg: error.message
      })
    }
  }

  async cancel(req, res) {
    const transaction = await sequelize.transaction()

    try {
      const { id } = req.params
      const userId = req.user.id

      const booking = await Booking.findOne({
        where: { id, userId },
        transaction,
        lock: transaction.LOCK.UPDATE
      })

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND:预约记录不存在')
      }

      if (booking.status !== 'booked') {
        throw new Error('INVALID_STATUS:该预约状态不允许取消')
      }

      const course = await Course.findByPk(booking.courseId, {
        transaction,
        lock: transaction.LOCK.UPDATE
      })

      await Booking.update({
        status: 'cancelled'
      }, {
        where: { id },
        transaction
      })

      await Course.update({
        bookedCount: sequelize.literal('booked_count - 1')
      }, {
        where: { id: booking.courseId },
        transaction
      })

      await User.update({
        totalHours: sequelize.literal('total_hours + 1')
      }, {
        where: { id: userId },
        transaction
      })

      await transaction.commit()

      res.json({
        respCode: '00000',
        respData: null,
        respMsg: '取消成功'
      })
    } catch (error) {
      await transaction.rollback()

      const errorCode = error.message.includes(':') ? error.message.split(':')[0] : 'SYSTEM_ERROR'
      const errorMsg = error.message.includes(':') ? error.message.split(':')[1] : error.message

      const errorMap = {
        'BOOKING_NOT_FOUND': { code: '40009', msg: errorMsg || '预约记录不存在' },
        'INVALID_STATUS': { code: '40010', msg: errorMsg || '该预约状态不允许取消' }
      }

      const errorInfo = errorMap[errorCode] || { code: '99999', msg: errorMsg || '系统错误' }

      res.json({
        respCode: errorInfo.code,
        respData: null,
        respMsg: errorInfo.msg
      })
    }
  }
}

module.exports = new BookingController()
