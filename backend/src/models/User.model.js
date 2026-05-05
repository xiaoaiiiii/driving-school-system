const { DataTypes } = require('sequelize')
const sequelize = require('../config/sequelize')

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码(加密)'
  },
  role: {
    type: DataTypes.ENUM('student', 'instructor', 'admin'),
    allowNull: false,
    defaultValue: 'student',
    comment: '角色:学员/教练/管理员'
  },
  realName: {
    type: DataTypes.STRING(50),
    field: 'real_name',
    allowNull: true,
    comment: '真实姓名'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '手机号'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '邮箱'
  },
  subjectStage: {
    type: DataTypes.ENUM('subject2', 'subject3'),
    field: 'subject_stage',
    allowNull: true,
    comment: '科目阶段:科目二/科目三'
  },
  totalHours: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'total_hours',
    defaultValue: 0,
    comment: '课时余额'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态:1启用,0禁用'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'create_time',
  updatedAt: 'update_time',
  indexes: [
    {
      unique: true,
      fields: ['username'],
      name: 'uk_username'
    },
    {
      fields: ['role'],
      name: 'idx_role'
    },
    {
      fields: ['status'],
      name: 'idx_status'
    }
  ]
})

module.exports = User
