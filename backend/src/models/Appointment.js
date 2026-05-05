const db = require('../config/database')

class Appointment {
  // 根据ID查找预约
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT b.booking_id as id, 
              b.student_id as user_id, 
              b.course_id, 
              CASE b.status 
                WHEN 'booked' THEN 'confirmed'
                WHEN 'completed' THEN 'completed'
                WHEN 'cancelled' THEN 'cancelled'
                ELSE 'confirmed'
              END as status,
              b.created_at as create_time,
              c.title as course_name,
              CASE c.subject_type 
                WHEN 2 THEN 'subject2' 
                WHEN 3 THEN 'subject3' 
                ELSE 'subject2' 
              END as subject,
              c.start_time,
              c.end_time,
              c.location,
              c.coach_id,
              u.name as instructor_name
       FROM Bookings b
       LEFT JOIN Courses c ON b.course_id = c.course_id
       LEFT JOIN Users u ON c.coach_id = u.user_id
       WHERE b.booking_id = ?`,
      [id]
    )
    return rows[0]
  }

  // 根据用户ID查找预约
  static async findByUserId(userId, status) {
    let sql = `SELECT b.booking_id as id, 
                      b.student_id as user_id, 
                      b.course_id, 
                      CASE b.status 
                        WHEN 'booked' THEN 'confirmed'
                        WHEN 'completed' THEN 'completed'
                        WHEN 'cancelled' THEN 'cancelled'
                        ELSE 'confirmed'
                      END as status,
                      b.created_at as create_time,
                      c.title as course_name,
                      CASE c.subject_type 
                        WHEN 2 THEN 'subject2' 
                        WHEN 3 THEN 'subject3' 
                        ELSE 'subject2' 
                      END as subject,
                      c.start_time,
                      c.end_time,
                      c.location,
                      u.name as instructor_name
               FROM Bookings b
               LEFT JOIN Courses c ON b.course_id = c.course_id
               LEFT JOIN Users u ON c.coach_id = u.user_id
               WHERE b.student_id = ?`
    const params = [userId]

    if (status) {
      // 转换状态
      let dbStatus = status
      if (status === 'confirmed') dbStatus = 'booked'
      sql += ' AND b.status = ?'
      params.push(dbStatus)
    }

    sql += ' ORDER BY b.created_at DESC'

    const [rows] = await db.query(sql, params)
    return rows
  }

  // 根据课程ID查找预约
  static async findByCourseId(courseId) {
    const [rows] = await db.query(
      `SELECT b.booking_id as id, 
              b.student_id as user_id, 
              b.course_id, 
              CASE b.status 
                WHEN 'booked' THEN 'confirmed'
                WHEN 'completed' THEN 'completed'
                WHEN 'cancelled' THEN 'cancelled'
                ELSE 'confirmed'
              END as status,
              b.created_at as create_time,
              u.name as user_name,
              u.phone
       FROM Bookings b
       LEFT JOIN Users u ON b.student_id = u.user_id
       WHERE b.course_id = ? AND b.status = 'booked'
       ORDER BY b.created_at DESC`,
      [courseId]
    )
    return rows
  }

  // 查找所有预约
  static async findAll(filters = {}) {
    let sql = `SELECT b.booking_id as id, 
                      b.student_id as user_id, 
                      b.course_id, 
                      CASE b.status 
                        WHEN 'booked' THEN 'confirmed'
                        WHEN 'completed' THEN 'completed'
                        WHEN 'cancelled' THEN 'cancelled'
                        ELSE 'confirmed'
                      END as status,
                      b.created_at as create_time,
                      c.title as course_name,
                      CASE c.subject_type 
                        WHEN 2 THEN 'subject2' 
                        WHEN 3 THEN 'subject3' 
                        ELSE 'subject2' 
                      END as subject,
                      c.start_time,
                      c.end_time,
                      u.name as user_name,
                      u.phone
               FROM Bookings b
               LEFT JOIN Courses c ON b.course_id = c.course_id
               LEFT JOIN Users u ON b.student_id = u.user_id
               WHERE 1=1`
    const params = []

    if (filters.status) {
      let dbStatus = filters.status
      if (filters.status === 'confirmed') dbStatus = 'booked'
      sql += ' AND b.status = ?'
      params.push(dbStatus)
    }

    if (filters.courseId) {
      sql += ' AND b.course_id = ?'
      params.push(filters.courseId)
    }

    sql += ' ORDER BY b.created_at DESC'

    const [rows] = await db.query(sql, params)
    return rows
  }

  // 创建预约
  static async create(appointmentData) {
    const [result] = await db.query(
      'INSERT INTO Bookings (student_id, course_id, status) VALUES (?, ?, "booked")',
      [appointmentData.user_id, appointmentData.course_id]
    )
    return result.insertId
  }

  // 更新预约状态
  static async updateStatus(id, status) {
    // 转换状态
    let dbStatus = status
    if (status === 'confirmed') dbStatus = 'booked'
    
    const [result] = await db.query(
      'UPDATE Bookings SET status = ? WHERE booking_id = ?',
      [dbStatus, id]
    )
    return result.affectedRows > 0
  }

  // 删除预约
  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM Bookings WHERE booking_id = ?',
      [id]
    )
    return result.affectedRows > 0
  }

  // 检查是否已存在预约
  static async exists(userId, courseId) {
    const [rows] = await db.query(
      'SELECT booking_id FROM Bookings WHERE student_id = ? AND course_id = ? AND status = "booked"',
      [userId, courseId]
    )
    return rows.length > 0
  }
}

module.exports = Appointment