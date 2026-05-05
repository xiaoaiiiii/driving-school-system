const Course = require('../models/Course')
const Appointment = require('../models/Appointment')
const db = require('../config/database')
const DataInitializer = require('./dataInitializer')
const appointmentService = require('./appointmentService')
const mockUserData = require('../data/mockUserData')

// 教练数据映射
let instructorMap = {}

// 添加或更新教练映射
const updateInstructorMap = (instructor) => {
  if (instructor && instructor.id) {
    instructorMap[instructor.id] = instructor
  }
}

// 根据教练ID获取教练名字
const getInstructorName = (coachId) => {
  const instructor = instructorMap[coachId]
  return instructor ? (instructor.real_name || instructor.username) : '未知教练'
}

// 获取学员名字的映射
const studentMap = {}

// 添加或更新学员映射
const updateStudentMap = (student) => {
  if (student && student.id) {
    studentMap[student.id] = student
  }
}

// 根据学员ID获取学员信息
const getStudentInfo = (userId) => {
  return studentMap[userId] || { id: userId, real_name: '未知学员', phone: '' }
}

// Mock 课程数据
let mockCourses = []
let nextCourseId = 1

// 从数据库初始化数据
const initializeFromDB = async () => {
  try {
    const coursesFromDB = await DataInitializer.loadCoursesFromDB()
    if (coursesFromDB && coursesFromDB.length > 0) {
      mockCourses = coursesFromDB.map(course => ({
        ...course,
        instructor_name: course.instructor_name || getInstructorName(course.coach_id)
      }))
      nextCourseId = Math.max(...mockCourses.map(c => c.id), 0) + 1
      console.log(`从数据库加载了 ${mockCourses.length} 个课程数据`)
      
      // 初始化教练和学员映射
      const usersFromDB = await DataInitializer.loadUsersFromDB()
      if (usersFromDB) {
        usersFromDB.forEach(user => {
          if (user.role === 'instructor') {
            updateInstructorMap(user)
          }
          if (user.role === 'student') {
            updateStudentMap(user)
          }
        })
      }
      
      return true
    }
    return false
  } catch (error) {
    console.log('从数据库加载课程数据失败，使用默认数据:', error.message)
    return false
  }
}

class CourseService {
  async getCourses(filters = {}) {
    try {
      console.log('获取课程列表，筛选条件:', filters)
      // 从数据库查询课程 - 只使用数据库，完全禁用 mock 数据
      let sql = `
        SELECT course_id as id,
               title as name,
               subject_type as subject,
               start_time,
               end_time,
               location,
               max_capacity,
               max_capacity as capacity,
               current_count as booked_count,
               max_capacity - current_count as stock,
               coach_id,
               status
        FROM Courses
        WHERE status = 1
      `
      const params = []
      
      if (filters.date) {
        sql += ' AND DATE(start_time) = ?'
        params.push(filters.date)
      }
      
      if (filters.instructorId) {
        sql += ' AND coach_id = ?'
        params.push(filters.instructorId)
      }
      
      sql += ' ORDER BY start_time DESC'
      
      console.log('执行SQL:', sql, '参数:', params)
      const [rows] = await db.query(sql, params)
      console.log('查询结果:', rows)
      
      // 转换 subject_type (2 -> subject2, 3 -> subject3)
      let courses = rows.map(course => ({
        ...course,
        subject: course.subject === 2 ? 'subject2' : course.subject === 3 ? 'subject3' : course.subject
      }))
      
      // 获取教练信息
      for (let course of courses) {
        if (course.coach_id) {
          const [coachRows] = await db.query(
            'SELECT name FROM Users WHERE user_id = ?',
            [course.coach_id]
          )
          if (coachRows.length) {
            course.instructor_name = coachRows[0].name
          }
        }
      }
      
      console.log('返回课程列表，共', courses.length, '个课程')
      return courses
    } catch (error) {
      console.error('getCourses 发生错误:', error)
      throw error
    }
  }

  async getCourseById(id) {
    try {
      console.log('获取课程详情，课程ID:', id)
      // 从数据库查询课程 - 只使用数据库，完全禁用 mock 数据
      const [courseRows] = await db.query(
        `SELECT course_id as id,
                title as name,
                subject_type as subject,
                start_time,
                end_time,
                location,
                max_capacity,
                max_capacity as capacity,
                current_count as booked_count,
                max_capacity - current_count as stock,
                coach_id,
                status
         FROM Courses 
         WHERE course_id = ?`,
        [id]
      )
      
      if (!courseRows.length) {
        throw new Error('课程不存在')
      }
      
      let course = courseRows[0]
      
      // 转换 subject_type (2 -> subject2, 3 -> subject3)
      course.subject = course.subject === 2 ? 'subject2' : course.subject === 3 ? 'subject3' : course.subject
      
      // 获取教练信息
      if (course.coach_id) {
        const [coachRows] = await db.query(
          'SELECT name FROM Users WHERE user_id = ?',
          [course.coach_id]
        )
        if (coachRows.length) {
          course.instructor_name = coachRows[0].name
        }
      }
      
      // 获取课程的预约学员列表
      console.log('获取课程预约学员列表...')
      const [bookingRows] = await db.query(
        `SELECT b.booking_id as id,
                b.status,
                b.created_at as create_time,
                u.user_id,
                u.name as user_real_name,
                u.phone as user_phone,
                u.remaining_hours as user_total_hours
         FROM Bookings b
         JOIN Users u ON b.student_id = u.user_id
         WHERE b.course_id = ?
         ORDER BY b.created_at DESC`,
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
      
      console.log('课程详情:', course)
      return course
    } catch (error) {
      console.error('getCourseById 发生错误:', error)
      throw error
    }
  }

  async createCourse(courseData) {
    try {
      console.log('创建课程，验证教练:', courseData.coach_id)
      
      // 验证教练是否存在 - 使用正确的表名和列名
      const [instructorRows] = await db.query(
        'SELECT user_id as id, name as real_name, username FROM Users WHERE user_id = ? AND (role = ? OR role = ?) AND status = 1',
        [courseData.coach_id, 'coach', 'instructor']
      )
      
      if (!instructorRows.length) {
        console.log('教练不存在或已被禁用，查询结果为空')
        throw new Error('教练不存在或已被禁用')
      }
      
      console.log('找到教练:', instructorRows[0])
      
      // 只使用数据库，完全禁用 mock 数据
      const [dbResult] = await db.query(
        'INSERT INTO Courses (title, subject_type, start_time, end_time, location, max_capacity, coach_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          courseData.name,
          courseData.subject === 'subject2' ? 2 : 3,
          courseData.start_time,
          courseData.end_time,
          courseData.location || '',
          courseData.max_capacity || 10,
          courseData.coach_id,
          1
        ]
      )
      
      const courseId = dbResult.insertId
      console.log('课程创建成功，课程ID:', courseId)
      
      // 直接从数据库重新查询课程并返回
      const [newCourseRows] = await db.query(
        `SELECT course_id as id,
                title as name,
                subject_type as subject,
                start_time,
                end_time,
                location,
                max_capacity,
                max_capacity as capacity,
                current_count as booked_count,
                max_capacity - current_count as stock,
                coach_id,
                status
         FROM Courses 
         WHERE course_id = ?`,
        [courseId]
      )
      
      let course = newCourseRows[0]
      course.subject = course.subject === 2 ? 'subject2' : course.subject === 3 ? 'subject3' : course.subject
      course.instructor_name = instructorRows[0].real_name || instructorRows[0].username
      
      console.log('返回课程:', course)
      
      return course
    } catch (error) {
      console.error('createCourse 发生错误:', error)
      throw error
    }
  }

  async updateCourse(id, courseData) {
    try {
      console.log('更新课程，课程ID:', id, '数据:', courseData)
      
      // 检查课程是否存在
      const [courseRows] = await db.query('SELECT course_id FROM Courses WHERE course_id = ?', [id])
      if (!courseRows.length) {
        throw new Error('课程不存在')
      }
      
      // 如果提供了教练ID，验证教练是否存在 - 添加 status = 1 检查
      if (courseData.coach_id !== undefined) {
        const [instructorRows] = await db.query(
          'SELECT user_id, name, username FROM Users WHERE user_id = ? AND (role = ? OR role = ?) AND status = 1',
          [courseData.coach_id, 'coach', 'instructor']
        )
        
        if (!instructorRows.length) {
          console.log('教练不存在或已被禁用，查询结果为空')
          throw new Error('教练不存在或已被禁用')
        }
        
        courseData.instructor_id = courseData.coach_id
        courseData.instructor_name = instructorRows[0].name || instructorRows[0].username
      }
      
      // 转换 subject (subject2 -> 2, subject3 -> 3)
      let dbSubjectType = null
      if (courseData.subject === 'subject2') dbSubjectType = 2
      else if (courseData.subject === 'subject3') dbSubjectType = 3
      
      // 更新数据库
      const updateFields = []
      const params = []
      
      if (courseData.name !== undefined) {
        updateFields.push('title = ?')
        params.push(courseData.name)
      }
      if (dbSubjectType !== null) {
        updateFields.push('subject_type = ?')
        params.push(dbSubjectType)
      }
      if (courseData.start_time !== undefined) {
        updateFields.push('start_time = ?')
        params.push(courseData.start_time)
      }
      if (courseData.end_time !== undefined) {
        updateFields.push('end_time = ?')
        params.push(courseData.end_time)
      }
      if (courseData.coach_id !== undefined) {
        updateFields.push('coach_id = ?')
        params.push(courseData.coach_id)
      }
      if (courseData.location !== undefined) {
        updateFields.push('location = ?')
        params.push(courseData.location)
      }
      if (courseData.max_capacity !== undefined) {
        updateFields.push('max_capacity = ?')
        params.push(courseData.max_capacity)
      }
      
      if (updateFields.length > 0) {
        params.push(id)
        await db.query(
          `UPDATE Courses SET ${updateFields.join(', ')} WHERE course_id = ?`,
          params
        )
      }
      
      // 只使用数据库，完全禁用 mock 数据
      // 重新查询并返回课程
      const [updatedRows] = await db.query(
        `SELECT course_id as id,
                title as name,
                subject_type as subject,
                start_time,
                end_time,
                max_capacity,
                current_count as booked_count,
                max_capacity - current_count as stock,
                status,
                location,
                coach_id
         FROM Courses
         WHERE course_id = ?`,
        [id]
      )
      
      if (updatedRows.length) {
        let course = updatedRows[0]
        course.subject = course.subject === 2 ? 'subject2' : course.subject === 3 ? 'subject3' : course.subject
        course.capacity = course.max_capacity
        
        // 查询教练信息
        if (course.coach_id) {
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
        }
        
        console.log('返回更新后的课程:', course)
        return course
      }
      
      return null
    } catch (error) {
      console.error('updateCourse 发生错误:', error)
      throw error
    }
  }

  async deleteCourse(id) {
    try {
      console.log('删除课程，课程ID:', id)
      
      // 检查课程是否存在
      const [courseRows] = await db.query('SELECT course_id FROM Courses WHERE course_id = ?', [id])
      if (!courseRows.length) {
        throw new Error('课程不存在')
      }
      
      // 检查课程是否有预约
      const [bookingRows] = await db.query(
        'SELECT COUNT(*) as count FROM Bookings WHERE course_id = ?',
        [id]
      )
      
      if (bookingRows[0].count > 0) {
        throw new Error('该课程已有学员预约，无法删除')
      }
      
      // 只使用数据库，完全禁用 mock 数据
      await db.query('DELETE FROM Courses WHERE course_id = ?', [id])
      
      console.log('课程删除成功')
      return true
    } catch (error) {
      console.error('deleteCourse 发生错误:', error)
      throw error
    }
  }

  // 获取教练的预约列表
  async getInstructorAppointments(instructorId, filters = {}) {
    try {
      console.log('获取教练预约列表，教练ID:', instructorId)
      let sql = `
        SELECT
          b.booking_id as id,
          b.status,
          b.created_at as create_time,
          c.course_id as course_id,
          c.title as course_name,
          c.subject_type as subject,
          c.start_time,
          c.end_time,
          c.location,
          u.user_id as student_id,
          u.name as student_name,
          u.phone as student_phone
        FROM Bookings b
        JOIN Courses c ON b.course_id = c.course_id
        JOIN Users u ON b.student_id = u.user_id
        WHERE c.coach_id = ?
      `
      const params = [instructorId]

      if (filters.status) {
        sql += ' AND b.status = ?'
        params.push(filters.status)
      }

      if (filters.date) {
        sql += ' AND DATE(c.start_time) = ?'
        params.push(filters.date)
      }

      sql += ' ORDER BY c.start_time DESC, b.created_at DESC'

      console.log('执行SQL:', sql, '参数:', params)
      const [rows] = await db.query(sql, params)
      console.log('查询结果:', rows)
      
      // 转换 subject_type (2 -> subject2, 3 -> subject3)
      // 转换状态 (booked -> confirmed)
      const result = rows.map(row => ({
        ...row,
        subject: row.subject === 2 ? 'subject2' : row.subject === 3 ? 'subject3' : row.subject,
        status: row.status === 'booked' ? 'confirmed' : row.status
      }))
      
      console.log('返回教练预约列表，共', result.length, '条记录')
      return result
    } catch (error) {
      console.error('getInstructorAppointments 发生错误:', error)
      throw error
    }
  }
}

// 初始化默认数据
const initializeWithDefaults = () => {
  if (mockCourses.length === 0) {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    
    mockCourses = [
      {
        id: 1,
        name: '科目二倒车入库训练',
        subject: 'subject2',
        start_time: `${tomorrow.toISOString().split('T')[0]} 09:00:00`,
        end_time: `${tomorrow.toISOString().split('T')[0]} 10:00:00`,
        coach_id: 2,
        location: '训练场A区',
        description: '科目二基础训练，重点练习倒车入库',
        max_capacity: 5,
        capacity: 5,
        booked_count: 1,
        stock: 4,
        instructor_name: '张教练',
        status: 1,
        create_time: now.toISOString().slice(0, 19).replace('T', ' '),
        update_time: now.toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: 2,
        name: '科目三路考训练',
        subject: 'subject3',
        start_time: `${tomorrow.toISOString().split('T')[0]} 14:00:00`,
        end_time: `${tomorrow.toISOString().split('T')[0]} 15:00:00`,
        coach_id: 2,
        location: '训练路段B',
        description: '科目三路考综合训练',
        max_capacity: 4,
        capacity: 4,
        booked_count: 0,
        stock: 4,
        instructor_name: '张教练',
        status: 1,
        create_time: now.toISOString().slice(0, 19).replace('T', ' '),
        update_time: now.toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: 3,
        name: '科目二坡道定点停车',
        subject: 'subject2',
        start_time: `${dayAfter.toISOString().split('T')[0]} 10:00:00`,
        end_time: `${dayAfter.toISOString().split('T')[0]} 11:00:00`,
        coach_id: 2,
        location: '训练场A区',
        description: '坡道定点停车与起步专项训练',
        max_capacity: 3,
        capacity: 3,
        booked_count: 0,
        stock: 3,
        instructor_name: '张教练',
        status: 1,
        create_time: now.toISOString().slice(0, 19).replace('T', ' '),
        update_time: now.toISOString().slice(0, 19).replace('T', ' ')
      }
    ]
    nextCourseId = 4
    
    // 初始化教练和学员映射
    const mockUserData = require('../data/mockUserData')
    const users = mockUserData.getMockUsers()
    users.forEach(user => {
      if (user.role === 'instructor' || user.role === 'coach') {
        updateInstructorMap(user)
      }
      if (user.role === 'student') {
        updateStudentMap(user)
      }
    })
  }
}

// 初始化
const init = async () => {
  const dbLoaded = await initializeFromDB()
  if (!dbLoaded) {
    initializeWithDefaults()
  }
}

// 立即尝试初始化
init()

module.exports = new CourseService()
module.exports.updateInstructorMap = updateInstructorMap
module.exports.updateStudentMap = updateStudentMap
module.exports.mockCourses = mockCourses