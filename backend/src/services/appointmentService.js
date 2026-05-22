const db = require('../config/database')
const Course = require('../models/Course')
const Appointment = require('../models/Appointment')
const ResponseHandler = require('../utils/responseHandler')
const DataInitializer = require('./dataInitializer')
const courseService = require('./courseService')
const mockUserData = require('../data/mockUserData')

// Mock 预约数据
let mockAppointments = []
let nextAppointmentId = 1

// 从数据库初始化数据
const initializeFromDB = async () => {
  try {
    const appointmentsFromDB = await DataInitializer.loadAppointmentsFromDB()
    if (appointmentsFromDB && appointmentsFromDB.length > 0) {
      mockAppointments = appointmentsFromDB
      nextAppointmentId = Math.max(...mockAppointments.map(a => a.id), 0) + 1
      console.log(`从数据库加载了 ${mockAppointments.length} 个预约数据`)
      return true
    }
    return false
  } catch (error) {
    console.log('从数据库加载预约数据失败:', error.message)
    return false
  }
}

// 获取 mock 课程数据
const getMockCourse = (courseId) => {
  const mockCourses = courseService.mockCourses || []
  return mockCourses.find(c => c.id === parseInt(courseId))
}

class AppointmentService {
  async bookCourse(userId, courseId) {
    try {
      console.log('开始预约流程，用户ID:', userId, '课程ID:', courseId)
      
      // 使用数据库事务确保一致性
      const connection = await db.getConnection()
      
      try {
        await connection.beginTransaction()
        
        // 查找课程
        console.log('从数据库查找课程...')
        const [courseRows] = await connection.query(
          `SELECT course_id as id, 
                  title as name,
                  subject_type as subject,
                  start_time,
                  end_time,
                  location,
                  max_capacity as capacity,
                  max_capacity - current_count as stock,
                  current_count as booked_count,
                  coach_id,
                  status
           FROM Courses 
           WHERE course_id = ? AND status = 1 FOR UPDATE`,
          [courseId]
        )
        
        if (courseRows.length === 0) {
          await connection.rollback()
          console.log('课程不存在，courseId:', courseId)
          return {
            respCode: '99998',
            respData: null,
            respMsg: '课程不存在或已下架'
          }
        }
        
        let course = courseRows[0]
        // 转换 subject_type (2 -> subject2, 3 -> subject3)
        course.subject = course.subject === 2 ? 'subject2' : course.subject === 3 ? 'subject3' : course.subject
        console.log('从数据库找到课程:', course)
        
        if (course.stock <= 0) {
          await connection.rollback()
          return {
            respCode: '99998',
            respData: null,
            respMsg: '课程名额已满'
          }
        }
        
        // 查找用户
        console.log('从数据库查找用户...')
        const [userRows] = await connection.query(
          'SELECT user_id as id, username, remaining_hours FROM Users WHERE user_id = ?',
          [userId]
        )
        
        if (userRows.length === 0) {
          await connection.rollback()
          return {
            respCode: '99998',
            respData: null,
            respMsg: '用户不存在'
          }
        }
        
        const user = userRows[0]
        console.log('从数据库找到用户:', user)

        if (!user.remaining_hours || user.remaining_hours <= 0) {
          await connection.rollback()
          return {
            respCode: '99998',
            respData: null,
            respMsg: '剩余课时不足'
          }
        }
        
        // 检查重复预约
        console.log('检查是否已预约...')
        const [bookingRows] = await connection.query(
          'SELECT booking_id as id FROM Bookings WHERE student_id = ? AND course_id = ? AND (status = "booked" OR status = "confirmed")',
          [userId, courseId]
        )
        
        if (bookingRows.length > 0) {
          await connection.rollback()
          return {
            respCode: '99998',
            respData: null,
            respMsg: '您已预约过该课程'
          }
        }
        
        // 兼容唯一键 uk_student_course：若该学员对该课程曾有 cancelled 记录，复用该行 UPDATE 而非 INSERT
        const [existingRows] = await connection.query(
          'SELECT booking_id as id FROM Bookings WHERE student_id = ? AND course_id = ?',
          [userId, courseId]
        )

        let newAppointmentId
        if (existingRows.length > 0) {
          newAppointmentId = existingRows[0].id
          console.log('找到旧的 cancelled 预约，复用 booking_id:', newAppointmentId)
          await connection.query(
            'UPDATE Bookings SET status = "booked", created_at = CURRENT_TIMESTAMP WHERE booking_id = ?',
            [newAppointmentId]
          )
        } else {
          // 创建预约
          console.log('在数据库中创建预约...')
          const [bookingResult] = await connection.query(
            'INSERT INTO Bookings (student_id, course_id, status) VALUES (?, ?, "booked")',
            [userId, courseId]
          )
          newAppointmentId = bookingResult.insertId
          console.log('数据库预约创建成功，ID:', newAppointmentId)
        }
        
        // 更新课程名额和用户课时
        console.log('更新数据库中的课程名额和用户课时...')
        await connection.query(
          'UPDATE Courses SET current_count = current_count + 1 WHERE course_id = ?',
          [courseId]
        )
        await connection.query(
          'UPDATE Users SET remaining_hours = remaining_hours - 1 WHERE user_id = ?',
          [userId]
        )
        console.log('数据库更新成功')
        
        await connection.commit()
        
        return {
          respCode: '00000',
          respData: { bookingId: newAppointmentId },
          respMsg: '预约成功'
        }
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    } catch (error) {
      console.log('预约失败:', error.message)
      return {
        respCode: '99999',
        respData: null,
        respMsg: error.message || '预约失败'
      }
    }
  }

  async getMyAppointments(userId, status) {
    try {
      console.log('获取学员预约列表，学员ID:', userId, '状态:', status)
      
      let sql = `
        SELECT b.booking_id as id,
               b.status,
               b.created_at as create_time,
               c.course_id as course_id,
               c.title as course_name,
               c.subject_type as subject,
               c.start_time,
               c.end_time,
               c.location,
               u.name as instructor_name
        FROM Bookings b
        JOIN Courses c ON b.course_id = c.course_id
        JOIN Users u ON c.coach_id = u.user_id
        WHERE b.student_id = ?
      `
      const params = [userId]

      if (status) {
        // 转换状态
        let dbStatus = status
        if (status === 'confirmed') {
          dbStatus = 'booked'
        }
        sql += ' AND b.status = ?'
        params.push(dbStatus)
      }

      sql += ' ORDER BY b.created_at DESC'

      console.log('执行SQL:', sql, '参数:', params)
      const [rows] = await db.query(sql, params)
      console.log('查询结果:', rows)

      // 转换 subject_type (2 -> subject2, 3 -> subject3)
      // 转换状态 (booked -> confirmed)
      return rows.map(row => {
        let status = row.status
        if (status === 'booked') {
          status = 'confirmed'
        }
        return {
          ...row,
          subject: row.subject === 2 ? 'subject2' : row.subject === 3 ? 'subject3' : row.subject,
          status: status
        }
      })
    } catch (error) {
      console.log('数据库获取预约失败，使用mock数据:', error.message)
      
      // 使用 mock 数据
      let myAppointments = mockAppointments.filter(a => a.user_id === userId)
      
      if (status) {
        myAppointments = myAppointments.filter(a => a.status === status)
      }
      
      // 填充课程信息
      const mockCourses = courseService.mockCourses || []
      myAppointments = myAppointments.map(appt => {
        const course = mockCourses.find(c => c.id === appt.course_id)
        return {
          ...appt,
          course_name: course?.name,
          subject: course?.subject,
          start_time: course?.start_time,
          end_time: course?.end_time,
          location: course?.location,
          instructor_name: course?.instructor_name
        }
      })
      
      return myAppointments
    }
  }

  async cancelAppointment(appointmentId, userId) {
    try {
      console.log('取消预约，预约ID:', appointmentId, '用户ID:', userId)
      
      const connection = await db.getConnection()

      try {
        await connection.beginTransaction()

        const [appointmentRows] = await connection.query(
          'SELECT booking_id, student_id, course_id, status FROM Bookings WHERE booking_id = ? FOR UPDATE',
          [appointmentId]
        )

        if (!appointmentRows.length) {
          await connection.rollback()
          console.log('预约记录不存在')
          return {
            respCode: '99998',
            respData: null,
            respMsg: '预约记录不存在'
          }
        }

        const appointment = appointmentRows[0]
        console.log('找到预约:', appointment)

        if (appointment.student_id !== userId) {
          await connection.rollback()
          console.log('无权取消此预约')
          return {
            respCode: '99998',
            respData: null,
            respMsg: '无权取消此预约'
          }
        }

        if (appointment.status !== 'booked' && appointment.status !== 'confirmed') {
          await connection.rollback()
          console.log('该预约状态不允许取消')
          return {
            respCode: '99998',
            respData: null,
            respMsg: '该预约状态不允许取消'
          }
        }

        // 更新预约状态
        await connection.query(
          'UPDATE Bookings SET status = "cancelled" WHERE booking_id = ?',
          [appointmentId]
        )
        console.log('预约状态已更新为 cancelled')

        // 更新课程名额
        await connection.query(
          'UPDATE Courses SET current_count = current_count - 1 WHERE course_id = ?',
          [appointment.course_id]
        )
        console.log('课程名额已更新')

        // 返还用户课时
        await connection.query(
          'UPDATE Users SET remaining_hours = remaining_hours + 1 WHERE user_id = ?',
          [userId]
        )
        console.log('用户课时已返还')

        await connection.commit()
        console.log('取消预约成功')

        return {
          respCode: '00000',
          respData: null,
          respMsg: '取消成功'
        }
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    } catch (error) {
      console.error('取消预约失败:', error.message)
      return {
        respCode: '99999',
        respData: null,
        respMsg: error.message || '取消预约失败'
      }
    }
  }

  async getAllAppointments(filters = {}) {
    try {
      console.log('获取所有预约列表，筛选条件:', filters)
      
      let sql = `
        SELECT b.booking_id as id,
               b.status,
               b.created_at as create_time,
               c.course_id as course_id,
               c.title as course_name,
               u1.name as user_name,
               u2.name as instructor_name
        FROM Bookings b
        JOIN Courses c ON b.course_id = c.course_id
        JOIN Users u1 ON b.student_id = u1.user_id
        LEFT JOIN Users u2 ON c.coach_id = u2.user_id
        WHERE 1=1
      `
      const params = []

      if (filters.status) {
        sql += ' AND b.status = ?'
        params.push(filters.status)
      }

      if (filters.courseId) {
        sql += ' AND b.course_id = ?'
        params.push(filters.courseId)
      }

      sql += ' ORDER BY b.created_at DESC'

      console.log('执行SQL:', sql, '参数:', params)
      const [rows] = await db.query(sql, params)
      console.log('查询结果:', rows)
      
      return rows
    } catch (error) {
      console.error('getAllAppointments 发生错误:', error)
      throw error
    }
  }

  async checkIn(appointmentId, instructorId) {
    try {
      console.log('开始签到，预约ID:', appointmentId, '教练ID:', instructorId)
      
      // 只使用数据库，完全禁用 mock 数据
      const [appointmentRows] = await db.query(
        `SELECT b.booking_id, b.student_id, b.course_id, b.status, 
                c.coach_id 
         FROM Bookings b 
         JOIN Courses c ON b.course_id = c.course_id 
         WHERE b.booking_id = ?`,
        [appointmentId]
      )

      if (!appointmentRows.length) {
        console.log('预约记录不存在')
        return {
          respCode: '40012',
          respData: null,
          respMsg: '预约记录不存在'
        }
      }

      const appointment = appointmentRows[0]
      console.log('找到预约:', appointment)

      if (appointment.coach_id !== instructorId) {
        console.log('无权操作此预约')
        return {
          respCode: '40003',
          respData: null,
          respMsg: '无权操作此预约'
        }
      }

      if (appointment.status !== 'booked' && appointment.status !== 'confirmed') {
        console.log('该预约状态不允许签到')
        return {
          respCode: '40013',
          respData: null,
          respMsg: '该预约状态不允许签到'
        }
      }

      // 更新预约状态
      await db.query(
        'UPDATE Bookings SET status = "completed" WHERE booking_id = ?',
        [appointmentId]
      )

      // 签到时不再扣除课时（预约时已经扣除过了）
      console.log('签到成功，预约ID:', appointmentId)

      return {
        respCode: '00000',
        respData: null,
        respMsg: '签到成功'
      }
    } catch (error) {
      console.log('签到失败:', error.message)
      return {
        respCode: '99999',
        respData: null,
        respMsg: error.message || '签到失败'
      }
    }
  }

  async markAbsent(appointmentId, instructorId, refundHours = false) {
    try {
      console.log('开始标记缺席，预约ID:', appointmentId, '教练ID:', instructorId, '返还课时:', refundHours)
      
      // 只使用数据库，完全禁用 mock 数据
      const [appointmentRows] = await db.query(
        `SELECT b.booking_id, b.student_id, b.course_id, b.status, 
                c.coach_id 
         FROM Bookings b 
         JOIN Courses c ON b.course_id = c.course_id 
         WHERE b.booking_id = ?`,
        [appointmentId]
      )

      if (!appointmentRows.length) {
        console.log('预约记录不存在')
        return {
          respCode: '40014',
          respData: null,
          respMsg: '预约记录不存在'
        }
      }

      const appointment = appointmentRows[0]
      console.log('找到预约:', appointment)

      if (appointment.coach_id !== instructorId) {
        console.log('无权操作此预约')
        return {
          respCode: '40003',
          respData: null,
          respMsg: '无权操作此预约'
        }
      }

      if (appointment.status !== 'booked' && appointment.status !== 'confirmed') {
        console.log('该预约状态不允许标记缺席')
        return {
          respCode: '40015',
          respData: null,
          respMsg: '该预约状态不允许标记缺席'
        }
      }

      // 更新预约状态
      await db.query(
        'UPDATE Bookings SET status = "absent" WHERE booking_id = ?',
        [appointmentId]
      )

      // 如果选择返还课时，返还给学员
      if (refundHours) {
        await db.query(
          'UPDATE Users SET remaining_hours = remaining_hours + 1 WHERE user_id = ?',
          [appointment.student_id]
        )
        console.log('已返还课时给学员:', appointment.student_id)
      }

      console.log('标记缺席成功，预约ID:', appointmentId)
      return {
        respCode: '00000',
        respData: null,
        respMsg: refundHours ? '标记缺席成功，已返还课时' : '标记缺席成功'
      }
    } catch (error) {
      console.log('标记缺席失败:', error.message)
      return {
        respCode: '99999',
        respData: null,
        respMsg: error.message || '操作失败'
      }
    }
  }
}

// 初始化
const init = async () => {
  await initializeFromDB()
}

// 立即尝试初始化
init()

module.exports = new AppointmentService()
module.exports.mockAppointments = mockAppointments