const db = require('../config/database')

class Course {
  // 根据ID查找课程
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT c.course_id as id, 
              c.title as name, 
              CASE c.subject_type 
                WHEN 2 THEN 'subject2' 
                WHEN 3 THEN 'subject3' 
                ELSE 'subject2' 
              END as subject,
              c.start_time, 
              c.end_time, 
              c.location, 
              c.max_capacity as capacity,
              c.max_capacity as max_capacity, 
              c.current_count as booked_count,
              (c.max_capacity - c.current_count) as stock,
              c.coach_id, 
              u.name as instructor_name,
              c.status,
              c.created_at as create_time,
              c.updated_at as update_time
       FROM Courses c
       LEFT JOIN Users u ON c.coach_id = u.user_id
       WHERE c.course_id = ?`,
      [id]
    )
    return rows[0]
  }

  // 查找所有课程
  static async findAll(filters = {}) {
    let sql = `SELECT c.course_id as id, 
                      c.title as name, 
                      CASE c.subject_type 
                        WHEN 2 THEN 'subject2' 
                        WHEN 3 THEN 'subject3' 
                        ELSE 'subject2' 
                      END as subject,
                      c.start_time, 
                      c.end_time, 
                      c.location, 
                      c.max_capacity as capacity,
                      c.max_capacity as max_capacity, 
                      c.current_count as booked_count,
                      (c.max_capacity - c.current_count) as stock,
                      c.coach_id, 
                      u.name as instructor_name,
                      c.status,
                      c.created_at as create_time,
                      c.updated_at as update_time
               FROM Courses c
               LEFT JOIN Users u ON c.coach_id = u.user_id`
    const params = []
    let whereAdded = false

    if (filters.date) {
      sql += whereAdded ? ' AND' : ' WHERE'
      whereAdded = true
      sql += ' DATE(c.start_time) = ?'
      params.push(filters.date)
    }

    if (filters.subject) {
      sql += whereAdded ? ' AND' : ' WHERE'
      whereAdded = true
      // 将 subject2/subject3 转换为 2/3
      const subjectType = filters.subject === 'subject3' ? 3 : 2
      sql += ' c.subject_type = ?'
      params.push(subjectType)
    }

    if (filters.instructorId) {
      sql += whereAdded ? ' AND' : ' WHERE'
      whereAdded = true
      sql += ' c.coach_id = ?'
      params.push(filters.instructorId)
    }

    sql += ' ORDER BY c.start_time DESC'

    const [rows] = await db.query(sql, params)
    return rows
  }

  // 创建课程
  static async create(courseData) {
    // 将 subject2/subject3 转换为 2/3
    const subjectType = courseData.subject === 'subject3' ? 3 : 2
    const max_capacity = courseData.max_capacity || courseData.capacity || 10
    
    const [result] = await db.query(
      `INSERT INTO Courses (title, subject_type, start_time, end_time, location, max_capacity, current_count, coach_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1)`,
      [
        courseData.name || courseData.title,
        subjectType,
        courseData.start_time,
        courseData.end_time,
        courseData.location,
        max_capacity,
        courseData.coach_id
      ]
    )
    return result.insertId
  }

  // 更新课程
  static async update(id, courseData) {
    const updates = []
    const params = []

    if (courseData.name !== undefined || courseData.title !== undefined) {
      updates.push('title = ?')
      params.push(courseData.name || courseData.title)
    }

    if (courseData.subject !== undefined) {
      updates.push('subject_type = ?')
      params.push(courseData.subject === 'subject3' ? 3 : 2)
    }

    if (courseData.start_time !== undefined) {
      updates.push('start_time = ?')
      params.push(courseData.start_time)
    }

    if (courseData.end_time !== undefined) {
      updates.push('end_time = ?')
      params.push(courseData.end_time)
    }

    if (courseData.location !== undefined) {
      updates.push('location = ?')
      params.push(courseData.location)
    }

    if (courseData.capacity !== undefined || courseData.max_capacity !== undefined) {
      updates.push('max_capacity = ?')
      params.push(courseData.capacity || courseData.max_capacity)
    }

    if (courseData.coach_id !== undefined) {
      updates.push('coach_id = ?')
      params.push(courseData.coach_id)
    }

    if (courseData.status !== undefined) {
      updates.push('status = ?')
      params.push(courseData.status)
    }

    if (updates.length === 0) {
      return false
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(id)

    const [result] = await db.query(
      `UPDATE Courses SET ${updates.join(', ')} WHERE course_id = ?`,
      params
    )
    return result.affectedRows > 0
  }

  // 删除课程
  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM Courses WHERE course_id = ?',
      [id]
    )
    return result.affectedRows > 0
  }

  // 更新课程人数（预约时减少，取消时增加）
  static async updateCurrentCount(courseId, delta) {
    const [result] = await db.query(
      `UPDATE Courses 
       SET current_count = current_count + ?, 
           updated_at = CURRENT_TIMESTAMP
       WHERE course_id = ? 
         AND current_count + ? >= 0
         AND current_count + ? <= max_capacity`,
      [delta, courseId, delta, delta]
    )
    return result.affectedRows > 0
  }
}

module.exports = Course