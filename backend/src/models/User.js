const db = require('../config/database')

class User {
  // 根据ID查找用户
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT user_id as id, 
              username, 
              name as real_name, 
              phone, 
              password, 
              role, 
              status, 
              subject_progress,
              remaining_hours,
              created_at as create_time 
       FROM Users 
       WHERE user_id = ?`,
      [id]
    )
    return rows[0]
  }

  // 根据用户名查找用户（使用 username 作为登录账号）
  static async findByUsername(username) {
    const [rows] = await db.query(
      `SELECT user_id as id, 
              username, 
              name as real_name, 
              phone, 
              password, 
              role, 
              status, 
              subject_progress,
              remaining_hours,
              created_at as create_time 
       FROM Users 
       WHERE username = ?`,
      [username]
    )
    return rows[0]
  }

  // 创建用户
  static async create(userData) {
    const [result] = await db.query(
      `INSERT INTO Users (username, name, phone, password, role, subject_progress, remaining_hours) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.username,
        userData.real_name || userData.name,
        userData.phone,
        userData.password,
        userData.role,
        userData.subject_progress || null,
        userData.remaining_hours || 0
      ]
    )
    return result.insertId
  }

  // 查找所有用户
  static async findAll(filters = {}) {
    let sql = `SELECT user_id as id, 
                      username, 
                      name as real_name, 
                      phone, 
                      password, 
                      role, 
                      1 as status, 
                      subject_progress,
                      remaining_hours,
                      created_at as create_time 
               FROM Users 
               WHERE 1=1`
    const params = []
    let whereAdded = false

    if (filters.role) {
      sql += whereAdded ? ' AND' : ' WHERE'
      whereAdded = true
      sql += ' role = ?'
      params.push(filters.role)
    }

    if (filters.status !== undefined) {
      // 新表结构没有 status 字段，暂时跳过
    }

    sql += ' ORDER BY created_at DESC'

    const [rows] = await db.query(sql, params)
    return rows
  }

  // 更新用户
  static async update(id, userData) {
    const updates = []
    const params = []

    if (userData.username !== undefined) {
      updates.push('username = ?')
      params.push(userData.username)
    }

    if (userData.real_name !== undefined || userData.name !== undefined) {
      updates.push('name = ?')
      params.push(userData.real_name || userData.name)
    }

    if (userData.phone !== undefined) {
      updates.push('phone = ?')
      params.push(userData.phone)
    }

    if (userData.password !== undefined) {
      updates.push('password = ?')
      params.push(userData.password)
    }

    if (userData.role !== undefined) {
      updates.push('role = ?')
      params.push(userData.role)
    }

    if (userData.subject_progress !== undefined) {
      updates.push('subject_progress = ?')
      params.push(userData.subject_progress)
    }

    if (userData.remaining_hours !== undefined) {
      updates.push('remaining_hours = ?')
      params.push(userData.remaining_hours)
    }

    if (updates.length === 0) {
      return false
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(id)

    const [result] = await db.query(
      `UPDATE Users SET ${updates.join(', ')} WHERE user_id = ?`,
      params
    )
    return result.affectedRows > 0
  }

  // 删除用户
  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM Users WHERE user_id = ?',
      [id]
    )
    return result.affectedRows > 0
  }

  // 更新用户课时
  static async updateHours(userId, delta) {
    const [result] = await db.query(
      `UPDATE Users 
       SET remaining_hours = remaining_hours + ?, 
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ? 
         AND remaining_hours + ? >= 0`,
      [delta, userId, delta]
    )
    return result.affectedRows > 0
  }

  // 根据角色查找用户
  static async findByRole(role) {
    const [rows] = await db.query(
      `SELECT user_id as id, 
              username, 
              name as real_name, 
              phone, 
              role, 
              1 as status,
              created_at as create_time 
       FROM Users 
       WHERE role = ? 
       ORDER BY created_at DESC`,
      [role]
    )
    return rows
  }
}

module.exports = User