const db = require('../config/database')
const bcrypt = require('bcryptjs')
const ResponseHandler = require('../utils/responseHandler')
const courseService = require('../services/courseService')
const { updateInstructorMap, updateStudentMap } = require('../services/courseService')
const mockUserData = require('../data/mockUserData')

// 使用共享的用户数据
let mockUsers = mockUserData.getMockUsers()
let nextUserId = mockUserData.nextUserId

// 初始化教练映射和学生映射
mockUsers.forEach(user => {
  if (user.role === 'instructor') {
    updateInstructorMap(user)
  }
  if (user.role === 'student') {
    updateStudentMap(user)
  }
})

class AdminController {
  async getUsers(req, res) {
    try {
      const { role, status } = req.query
      console.log('getUsers 被调用，查询参数:', { role, status })
      
      let users = []
      
      // 只使用数据库查询！完全禁用 mock 数据
      let sql = `SELECT user_id as id, 
                        username, 
                        name as real_name, 
                        phone, 
                        role, 
                        status, 
                        subject_progress,
                        remaining_hours,
                        remaining_hours as total_hours,
                        created_at as create_time 
                 FROM Users 
                 WHERE 1=1`
      const params = []
      
      if (role) {
        // 转换角色：前端传的是instructor，数据库存的是coach
        const dbRole = role === 'instructor' ? 'coach' : role
        sql += ' AND role = ?'
        params.push(dbRole)
      }
      
      sql += ' ORDER BY created_at DESC'
      
      console.log('执行 SQL:', sql, '参数:', params)
      const [rows] = await db.query(sql, params)
      console.log('数据库查询结果行数:', rows.length)
      console.log('数据库原始结果:', rows)
      
      // 统一角色名称：将coach转换为instructor
      users = rows.map(user => ({
        ...user,
        role: user.role === 'coach' ? 'instructor' : user.role
      }))
      
      console.log('返回用户列表:', users.map(u => ({ id: u.id, username: u.username, role: u.role, status: u.status })))
      console.log('完整用户列表:', users)
      
      res.json(ResponseHandler.success(users, '获取成功'))
    } catch (error) {
      console.error('getUsers 发生错误:', error)
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params
      console.log('getUserById 被调用，用户ID:', id)
      
      // 只使用数据库！完全禁用 mock 数据
      const [rows] = await db.query(
        `SELECT user_id as id, 
                username, 
                name as real_name, 
                phone, 
                role, 
                status, 
                subject_progress,
                remaining_hours,
                remaining_hours as total_hours,
                created_at as create_time 
         FROM Users 
         WHERE user_id = ?`,
        [id]
      )
      
      if (!rows.length) {
        console.log('用户不存在')
        return res.json(ResponseHandler.notFound('用户不存在'))
      }
      
      // 统一角色名称：将coach转换为instructor
      const user = {
        ...rows[0],
        role: rows[0].role === 'coach' ? 'instructor' : rows[0].role
      }
      
      console.log('返回用户详情:', user)
      res.json(ResponseHandler.success(user, '获取成功'))
    } catch (error) {
      console.error('getUserById 发生错误:', error)
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async createUser(req, res) {
    try {
      const { username, password, real_name, phone, role, subject_stage, total_hours } = req.body
      console.log('收到注册请求:', { username, real_name, phone, role, subject_stage, total_hours })
      
      if (!username || !password) {
        return res.json(ResponseHandler.validationError('用户名和密码不能为空'))
      }
      
      if (password.length < 6) {
        return res.json(ResponseHandler.validationError('密码长度不能少于6位'))
      }
      
      // 验证用户名格式（仅英文加数字）
      const usernameRegex = /^[a-zA-Z0-9]+$/
      if (!usernameRegex.test(username)) {
        return res.json(ResponseHandler.validationError('用户名只能包含英文字母和数字'))
      }
      
      // 只使用数据库！完全禁用 mock 数据
      console.log('检查用户名是否存在:', username)
      const [existingRows] = await db.query(
        'SELECT user_id FROM Users WHERE username = ?',
        [username]
      )
      
      if (existingRows.length > 0) {
        console.log('用户名已存在:', username)
        return res.json(ResponseHandler.error('99997', '用户名已存在'))
      }
      
      console.log('用户名可用，准备创建用户')
      const hashedPassword = await bcrypt.hash(password, 10)
      
      // 转换 subject_stage (subject2 -> 0, subject3 -> 1)
      let dbSubjectProgress = null
      if (subject_stage === 'subject2') dbSubjectProgress = 0
      else if (subject_stage === 'subject3') dbSubjectProgress = 1
      
      // 统一角色名称：将instructor转换为coach（数据库使用coach）
      const dbRole = role === 'instructor' ? 'coach' : role
      
      console.log('执行数据库插入:', { username, real_name, phone, dbRole, dbSubjectProgress, total_hours })
      const [dbResult] = await db.query(
        'INSERT INTO Users (username, name, phone, password, role, subject_progress, remaining_hours, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [username, real_name || username, phone || '', hashedPassword, dbRole || 'student', dbSubjectProgress, total_hours || 20, 1]
      )
      
      console.log('数据库插入成功，insertId:', dbResult.insertId)
      
      // 创建返回的用户对象
      const newUser = {
        id: dbResult.insertId,
        username,
        real_name: real_name || username,
        phone: phone || '',
        role: role || 'student',
        subject_stage: subject_stage,
        total_hours: total_hours || 20,
        remaining_hours: total_hours || 20,
        status: 1
      }
      
      // 如果是教练，更新教练映射
      if (newUser && (newUser.role === 'instructor' || newUser.role === 'coach')) {
        updateInstructorMap(newUser)
      }
      
      // 如果是学生，更新学生映射
      if (newUser && newUser.role === 'student') {
        updateStudentMap(newUser)
      }
      
      console.log('用户创建完成！')
      res.json(ResponseHandler.success({ id: dbResult.insertId }, '用户创建成功'))
    } catch (error) {
      console.error('createUser 发生错误:', error)
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params
      
      // 只使用数据库！完全禁用 mock 数据
      if (parseInt(id) === req.user.id) {
        return res.json(ResponseHandler.error('99998', '不能删除自己的账号'))
      }
      
      const [userRows] = await db.query(
        'SELECT user_id as id, role FROM Users WHERE user_id = ?',
        [id]
      )
      
      if (!userRows.length) {
        return res.json(ResponseHandler.notFound('用户不存在'))
      }
      
      const [bookingRows] = await db.query(
        'SELECT COUNT(*) as count FROM Bookings WHERE student_id = ?',
        [id]
      )
      
      if (bookingRows[0].count > 0) {
        return res.json(ResponseHandler.error('99996', '该用户有预约记录，无法删除'))
      }
      
      await db.query('DELETE FROM Users WHERE user_id = ?', [id])
      
      res.json(ResponseHandler.success(null, '用户删除成功'))
    } catch (error) {
      console.error('deleteUser 发生错误:', error)
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params
      const { status } = req.body
      console.log('toggleUserStatus 被调用，用户ID:', id, '状态:', status)
      
      // 只使用数据库！完全禁用 mock 数据
      if (parseInt(id) === req.user.id && status === 0) {
        return res.json(ResponseHandler.error('99998', '不能禁用自己的账号'))
      }
      
      const [userRows] = await db.query(
        'SELECT user_id as id, username, status FROM Users WHERE user_id = ?',
        [id]
      )
      
      if (!userRows.length) {
        return res.json(ResponseHandler.notFound('用户不存在'))
      }
      
      console.log('找到用户:', userRows[0])
      
      // 更新数据库中的 status 字段
      await db.query(
        'UPDATE Users SET status = ? WHERE user_id = ?',
        [status, id]
      )
      
      console.log('数据库 status 更新成功')
      
      res.json(ResponseHandler.success(null, status === 1 ? '启用成功' : '禁用成功'))
    } catch (error) {
      console.error('toggleUserStatus 发生错误:', error)
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async resetPassword(req, res) {
    try {
      const { id } = req.params
      const { newPassword } = req.body
      
      if (!newPassword || newPassword.length < 6) {
        return res.json(ResponseHandler.validationError('新密码长度不能少于6位'))
      }
      
      // 只使用数据库！完全禁用 mock 数据
      const [userRows] = await db.query(
        'SELECT user_id, username FROM Users WHERE user_id = ?',
        [id]
      )
      
      if (!userRows.length) {
        return res.json(ResponseHandler.notFound('用户不存在'))
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      
      await db.query(
        'UPDATE Users SET password = ? WHERE user_id = ?',
        [hashedPassword, id]
      )
      
      res.json(ResponseHandler.success(null, '密码重置成功'))
    } catch (error) {
      console.error('resetPassword 发生错误:', error)
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params
      const { real_name, phone } = req.body
      console.log('更新用户信息，用户ID:', id, '数据:', { real_name, phone })
      
      if (!real_name && !phone) {
        return res.json(ResponseHandler.validationError('请至少填写一项信息'))
      }
      
      // 尝试使用数据库
      try {
        const [userRows] = await db.query(
          'SELECT user_id FROM Users WHERE user_id = ?',
          [id]
        )
        
        if (!userRows.length) {
          return res.json(ResponseHandler.notFound('用户不存在'))
        }
        
        const updateFields = []
        const params = []
        
        if (real_name !== undefined) {
          updateFields.push('name = ?')
          params.push(real_name)
        }
        if (phone !== undefined) {
          updateFields.push('phone = ?')
          params.push(phone)
        }
        
        if (updateFields.length > 0) {
          params.push(id)
          await db.query(
            `UPDATE Users SET ${updateFields.join(', ')} WHERE user_id = ?`,
            params
          )
        }
      } catch (dbError) {
        console.log('数据库更新用户失败:', dbError.message)
        return res.json(ResponseHandler.systemError(dbError.message))
      }
      
      res.json(ResponseHandler.success(null, '更新成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async getCourses(req, res) {
    try {
      const courses = await courseService.getCourses()
      res.json(ResponseHandler.success(courses, '获取成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async getCourseById(req, res) {
    try {
      const { id } = req.params
      console.log('获取课程详情，课程ID:', id)
      
      let course = null
      
      // 尝试使用数据库查询
      try {
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
                  location,
                  coach_id
           FROM Courses
           WHERE course_id = ?`,
          [id]
        )

        if (!courseRows.length) {
          return res.json(ResponseHandler.notFound('课程不存在'))
        }

        course = courseRows[0]

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

        // 查询教练信息
        const [instructorRows] = await db.query(
          `SELECT user_id as id,
                  name as real_name
           FROM Users
           WHERE user_id = ?`,
          [course.coach_id]
        )
        if (instructorRows.length) {
          course.instructor_name = instructorRows[0].real_name
        }

      } catch (dbError) {
        console.log('数据库获取课程详情失败:', dbError.message)
        return res.json(ResponseHandler.systemError(dbError.message))
      }
      
      res.json(ResponseHandler.success(course, '获取成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async createCourse(req, res) {
    try {
      const { name, subject, start_time, end_time, max_capacity, coach_id, location, description } = req.body
      
      const courseId = await courseService.createCourse({
        name, subject, start_time, end_time, max_capacity, coach_id, location, description
      })
      
      res.json(ResponseHandler.success({ id: courseId }, '课程创建成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async updateCourse(req, res) {
    try {
      const { id } = req.params
      const courseData = req.body
      await courseService.updateCourse(id, courseData)
      res.json(ResponseHandler.success(null, '更新成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async deleteCourse(req, res) {
    try {
      const { id } = req.params
      await courseService.deleteCourse(id)
      res.json(ResponseHandler.success(null, '课程删除成功'))
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async deleteExpiredCourses(req, res) {
    try {
      const { ids } = req.body
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.json(ResponseHandler.validationError('请选择要删除的课程'))
      }
      
      const connection = await db.getConnection()
      
      try {
        await connection.beginTransaction()
        
        for (const id of ids) {
          const [appointmentRows] = await connection.query(
            'SELECT COUNT(*) as count FROM bookings WHERE course_id = ?',
            [id]
          )
          
          if (appointmentRows[0].count > 0) {
            await connection.rollback()
            return res.json(ResponseHandler.error('99996', `课程ID ${id} 已有学员预约，无法删除`))
          }
          
          const [courseRows] = await connection.query(
            'SELECT id FROM courses WHERE id = ?',
            [id]
          )
          
          if (!courseRows.length) {
            await connection.rollback()
            return res.json(ResponseHandler.notFound(`课程ID ${id} 不存在`))
          }
        }
        
        const placeholders = ids.map(() => '?').join(',')
        await connection.query(
          `DELETE FROM courses WHERE id IN (${placeholders})`,
          ids
        )
        
        await connection.commit()
        
        res.json(ResponseHandler.success(null, `成功删除 ${ids.length} 个课程`))
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    } catch (error) {
      res.json(ResponseHandler.systemError(error.message))
    }
  }

  async getInstructors(req, res) {
    try {
      let instructors = []
      
      // 只使用数据库！完全禁用 mock 数据
      const [rows] = await db.query(
        `SELECT user_id as id, 
                username, 
                name as real_name, 
                phone,
                status 
         FROM Users 
         WHERE (role = 'coach' OR role = 'instructor') AND status = 1`
      )
      instructors = rows
      
      console.log('获取教练列表，共', instructors.length, '个教练')
      
      res.json(ResponseHandler.success(instructors, '获取成功'))
    } catch (error) {
      console.error('getInstructors 发生错误:', error)
      res.json(ResponseHandler.systemError(error.message))
    }
  }
}

module.exports = new AdminController()
