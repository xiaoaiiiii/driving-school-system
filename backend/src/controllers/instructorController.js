const db = require('../config/database')
const config = require('../config')

class InstructorController {
  // 获取教练的课程列表
  async getMyCourses(req, res) {
    try {
      const instructorId = req.user.id
      const { status, date } = req.query

      console.log('获取教练课程列表，教练ID:', instructorId, '筛选:', { status, date })

      let sql = `
        SELECT course_id as id,
               title as name,
               subject_type as subject,
               start_time,
               end_time,
               max_capacity,
               current_count as booked_count,
               status,
               location
        FROM Courses
        WHERE coach_id = ?
      `
      const params = [instructorId]

      if (status !== undefined && status !== '') {
        sql += ' AND status = ?'
        params.push(status)
      }

      if (date) {
        sql += ' AND DATE(start_time) = ?'
        params.push(date)
      }

      sql += ' ORDER BY start_time ASC'

      console.log('执行SQL:', sql, '参数:', params)
      const [rows] = await db.query(sql, params)
      console.log('查询结果:', rows)

      // 转换 subject_type (2 -> subject2, 3 -> subject3)
      const courses = rows.map(course => ({
        ...course,
        subject: course.subject === 2 ? 'subject2' : course.subject === 3 ? 'subject3' : course.subject
      }))

      res.json({
        respCode: '00000',
        respData: courses,
        respMsg: '获取成功'
      })
    } catch (error) {
      console.log('获取教练课程列表失败:', error.message)
      res.json({
        respCode: '99999',
        respData: null,
        respMsg: error.message
      })
    }
  }

  // 获取课程详情
  async getCourseDetail(req, res) {
    try {
      const { id } = req.params
      const instructorId = req.user.id

      console.log('获取课程详情，课程ID:', id, '教练ID:', instructorId)

      // 查询课程
      const [courseRows] = await db.query(
        `SELECT course_id as id,
                title as name,
                subject_type as subject,
                start_time,
                end_time,
                max_capacity,
                current_count as booked_count,
                status,
                location
         FROM Courses
         WHERE course_id = ? AND coach_id = ?`,
        [id, instructorId]
      )

      if (!courseRows.length) {
        return res.json({
          respCode: '40011',
          respData: null,
          respMsg: '课程不存在或无权访问'
        })
      }

      let course = courseRows[0]

      // 转换 subject_type (2 -> subject2, 3 -> subject3)
      course.subject = course.subject === 2 ? 'subject2' : course.subject === 3 ? 'subject3' : course.subject

      // 查询预约学员
      const [bookingRows] = await db.query(
        `SELECT b.booking_id as id,
                b.status,
                b.created_at as create_time,
                u.user_id as user_id,
                u.name as user_real_name,
                u.phone as user_phone,
                u.remaining_hours as user_total_hours
         FROM Bookings b
         JOIN Users u ON b.student_id = u.user_id
         WHERE b.course_id = ?
         ORDER BY b.created_at ASC`,
        [id]
      )

      console.log('预约学员列表:', bookingRows)
      course.bookings = bookingRows.map(booking => {
        // 转换状态
        let status = booking.status
        if (status === 'booked') {
          status = 'confirmed'
        }
        return {
          id: booking.id,
          status: status,
          create_time: booking.create_time,
          user: {
            id: booking.user_id,
            real_name: booking.user_real_name,
            phone: booking.user_phone,
            total_hours: booking.user_total_hours
          }
        }
      })

      res.json({
        respCode: '00000',
        respData: course,
        respMsg: '获取成功'
      })
    } catch (error) {
      console.log('获取课程详情失败:', error.message)
      res.json({
        respCode: '99999',
        respData: null,
        respMsg: error.message
      })
    }
  }

  // 确认到课
  async checkIn(req, res) {
    try {
      const { id } = req.params
      const instructorId = req.user.id

      console.log('确认到课，预约ID:', id, '教练ID:', instructorId)

      // 开始事务
      const connection = await db.getConnection()
      await connection.beginTransaction()

      try {
        // 查询预约记录并验证权限
        const [bookingRows] = await connection.query(
          `SELECT b.*, c.coach_id
           FROM Bookings b
           JOIN Courses c ON b.course_id = c.course_id
           WHERE b.booking_id = ?`,
          [id]
        )

        if (!bookingRows.length) {
          throw new Error('BOOKING_NOT_FOUND:预约记录不存在或无权操作')
        }

        const booking = bookingRows[0]

        if (booking.coach_id !== instructorId) {
          throw new Error('BOOKING_NOT_FOUND:预约记录不存在或无权操作')
        }

        // 转换状态判断
        let bookingStatus = booking.status
        if (bookingStatus === 'confirmed') {
          bookingStatus = 'booked'
        }

        if (bookingStatus !== 'booked') {
          throw new Error('INVALID_STATUS:该预约状态不允许签到')
        }

        // 更新预约状态
        await connection.query(
          'UPDATE Bookings SET status = "completed" WHERE booking_id = ?',
          [id]
        )

        // 提交事务
        await connection.commit()

        res.json({
          respCode: '00000',
          respData: null,
          respMsg: '签到成功'
        })
      } catch (error) {
        // 回滚事务
        await connection.rollback()
        throw error
      } finally {
        // 释放连接
        connection.release()
      }
    } catch (error) {
      console.log('确认到课失败:', error.message)

      const errorCode = error.message.includes(':') ? error.message.split(':')[0] : 'SYSTEM_ERROR'
      const errorMsg = error.message.includes(':') ? error.message.split(':')[1] : error.message

      const errorMap = {
        'BOOKING_NOT_FOUND': { code: '40012', msg: errorMsg || '预约记录不存在或无权操作' },
        'INVALID_STATUS': { code: '40013', msg: errorMsg || '该预约状态不允许签到' }
      }

      const errorInfo = errorMap[errorCode] || { code: '99999', msg: errorMsg || '系统错误' }

      res.json({
        respCode: errorInfo.code,
        respData: null,
        respMsg: errorInfo.msg
      })
    }
  }

  // 标记缺席
  async markAbsent(req, res) {
    try {
      const { id } = req.params
      const { refundHours = false } = req.body
      const instructorId = req.user.id

      console.log('标记缺席，预约ID:', id, '返还课时:', refundHours, '教练ID:', instructorId)

      // 开始事务
      const connection = await db.getConnection()
      await connection.beginTransaction()

      try {
        // 查询预约记录并验证权限
        const [bookingRows] = await connection.query(
          `SELECT b.*, c.coach_id, b.student_id
           FROM Bookings b
           JOIN Courses c ON b.course_id = c.course_id
           WHERE b.booking_id = ?`,
          [id]
        )

        if (!bookingRows.length) {
          throw new Error('BOOKING_NOT_FOUND:预约记录不存在或无权操作')
        }

        const booking = bookingRows[0]

        if (booking.coach_id !== instructorId) {
          throw new Error('BOOKING_NOT_FOUND:预约记录不存在或无权操作')
        }

        // 转换状态判断
        let bookingStatus = booking.status
        if (bookingStatus === 'confirmed') {
          bookingStatus = 'booked'
        }

        if (bookingStatus !== 'booked') {
          throw new Error('INVALID_STATUS:该预约状态不允许标记缺席')
        }

        // 更新预约状态
        await connection.query(
          'UPDATE Bookings SET status = "absent" WHERE booking_id = ?',
          [id]
        )

        // 如果返还课时
        if (refundHours) {
          await connection.query(
            'UPDATE Users SET remaining_hours = remaining_hours + 1 WHERE user_id = ?',
            [booking.student_id]
          )
        }

        // 提交事务
        await connection.commit()

        res.json({
          respCode: '00000',
          respData: null,
          respMsg: refundHours ? '标记缺席成功，已返还课时' : '标记缺席成功'
        })
      } catch (error) {
        // 回滚事务
        await connection.rollback()
        throw error
      } finally {
        // 释放连接
        connection.release()
      }
    } catch (error) {
      console.log('标记缺席失败:', error.message)

      const errorCode = error.message.includes(':') ? error.message.split(':')[0] : 'SYSTEM_ERROR'
      const errorMsg = error.message.includes(':') ? error.message.split(':')[1] : error.message

      const errorMap = {
        'BOOKING_NOT_FOUND': { code: '40014', msg: errorMsg || '预约记录不存在或无权操作' },
        'INVALID_STATUS': { code: '40015', msg: errorMsg || '该预约状态不允许标记缺席' }
      }

      const errorInfo = errorMap[errorCode] || { code: '99999', msg: errorMsg || '系统错误' }

      res.json({
        respCode: errorInfo.code,
        respData: null,
        respMsg: errorInfo.msg
      })
    }
  }

  // 获取课程学员列表
  async getCourseStudents(req, res) {
    try {
      const { id } = req.params
      const instructorId = req.user.id

      console.log('获取课程学员列表，课程ID:', id, '教练ID:', instructorId)

      // 验证课程权限
      const [courseRows] = await db.query(
        'SELECT course_id FROM Courses WHERE course_id = ? AND coach_id = ?',
        [id, instructorId]
      )

      if (!courseRows.length) {
        return res.json({
          respCode: '40016',
          respData: null,
          respMsg: '课程不存在或无权访问'
        })
      }

      // 查询预约学员
      const [bookingRows] = await db.query(
        `SELECT b.booking_id as id,
                b.status,
                b.created_at as create_time,
                u.user_id,
                u.name as real_name,
                u.phone,
                u.remaining_hours as total_hours,
                c.title as course_name,
                c.start_time,
                c.end_time,
                c.location
         FROM Bookings b
         JOIN Users u ON b.student_id = u.user_id
         JOIN Courses c ON b.course_id = c.course_id
         WHERE b.course_id = ?
         ORDER BY b.created_at ASC`,
        [id]
      )

      console.log('学员列表:', bookingRows)
      const bookings = bookingRows.map(booking => {
        // 转换状态
        let status = booking.status
        if (status === 'booked') {
          status = 'confirmed'
        }
        return {
          ...booking,
          status: status,
          user: {
            id: booking.user_id,
            real_name: booking.real_name,
            phone: booking.phone,
            total_hours: booking.total_hours
          },
          course: {
            name: booking.course_name,
            start_time: booking.start_time,
            end_time: booking.end_time,
            location: booking.location
          }
        }
      })

      res.json({
        respCode: '00000',
        respData: bookings,
        respMsg: '获取成功'
      })
    } catch (error) {
      console.log('获取课程学员列表失败:', error.message)
      res.json({
        respCode: '99999',
        respData: null,
        respMsg: error.message
      })
    }
  }
}

module.exports = new InstructorController()