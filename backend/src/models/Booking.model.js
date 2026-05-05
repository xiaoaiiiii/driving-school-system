const { DataTypes } = require('sequelize')
const sequelize = require('../config/sequelize')

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '预约ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id',
    allowNull: false,
    comment: '学员ID'
  },
  courseId: {
    type: DataTypes.INTEGER,
    field: 'course_id',
    allowNull: false,
    comment: '课程ID'
  },
  status: {
    type: DataTypes.ENUM('booked', 'checked_in', 'cancelled', 'absent'),
    allowNull: false,
    defaultValue: 'booked',
    comment: '状态:已预约/已签到/已取消/缺席'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'create_time',
  updatedAt: 'update_time',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'course_id'],
      name: 'uk_user_course'
    },
    {
      fields: ['course_id'],
      name: 'idx_course_id'
    },
    {
      fields: ['status'],
      name: 'idx_status'
    },
    {
      fields: ['create_time'],
      name: 'idx_create_time'
    }
  ]
})

module.exports = Booking
