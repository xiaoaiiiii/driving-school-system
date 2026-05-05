const { DataTypes } = require('sequelize')
const sequelize = require('../config/sequelize')

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '课程ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '课程名称'
  },
  subject: {
    type: DataTypes.ENUM('subject2', 'subject3'),
    allowNull: false,
    comment: '科目:科目二/科目三'
  },
  coachId: {
    type: DataTypes.INTEGER,
    field: 'coach_id',
    allowNull: false,
    comment: '教练ID'
  },
  startTime: {
    type: DataTypes.DATE,
    field: 'start_time',
    allowNull: false,
    comment: '开始时间'
  },
  endTime: {
    type: DataTypes.DATE,
    field: 'end_time',
    allowNull: false,
    comment: '结束时间'
  },
  maxCapacity: {
    type: DataTypes.INTEGER,
    field: 'max_capacity',
    allowNull: false,
    comment: '最大人数'
  },
  bookedCount: {
    type: DataTypes.INTEGER,
    field: 'booked_count',
    defaultValue: 0,
    comment: '已约人数'
  },
  status: {
    type: DataTypes.ENUM('ongoing', 'completed'),
    allowNull: false,
    defaultValue: 'ongoing',
    comment: '状态:进行中/已结课'
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '地点'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '课程描述'
  }
}, {
  tableName: 'courses',
  timestamps: true,
  createdAt: 'create_time',
  updatedAt: 'update_time',
  indexes: [
    {
      fields: ['coach_id'],
      name: 'idx_coach_id'
    },
    {
      fields: ['subject'],
      name: 'idx_subject'
    },
    {
      fields: ['start_time'],
      name: 'idx_start_time'
    },
    {
      fields: ['status'],
      name: 'idx_status'
    }
  ]
})

module.exports = Course
