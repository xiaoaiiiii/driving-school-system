const sequelize = require('./src/config/sequelize')

async function migrate() {
  try {
    console.log('开始数据库迁移...\n')

    await sequelize.authenticate()
    console.log('✓ 数据库连接成功')

    const queryInterface = sequelize.getQueryInterface()

    console.log('\n检查并更新 users 表...')
    const usersTableExists = await queryInterface.tableExists('users')
    if (usersTableExists) {
      const usersColumns = await queryInterface.describeTable('users')
      
      if (!usersColumns.subject_stage) {
        await queryInterface.addColumn('users', 'subject_stage', {
          type: sequelize.Sequelize.ENUM('subject2', 'subject3'),
          allowNull: true,
          comment: '科目阶段:科目二/科目三'
        })
        console.log('  ✓ 添加 subject_stage 字段')
      }
      
      if (!usersColumns.total_hours) {
        await queryInterface.addColumn('users', 'total_hours', {
          type: sequelize.Sequelize.DECIMAL(10, 2),
          defaultValue: 0,
          comment: '课时余额'
        })
        console.log('  ✓ 添加 total_hours 字段')
      }
    }

    console.log('\n检查并更新 courses 表...')
    const coursesTableExists = await queryInterface.tableExists('courses')
    if (coursesTableExists) {
      const coursesColumns = await queryInterface.describeTable('courses')
      
      if (!coursesColumns.coach_id && coursesColumns.instructor_id) {
        await queryInterface.renameColumn('courses', 'instructor_id', 'coach_id')
        console.log('  ✓ 重命名 instructor_id 为 coach_id')
      }
      
      if (!coursesColumns.max_capacity && coursesColumns.capacity) {
        await queryInterface.renameColumn('courses', 'capacity', 'max_capacity')
        console.log('  ✓ 重命名 capacity 为 max_capacity')
      }
      
      if (!coursesColumns.booked_count) {
        await queryInterface.addColumn('courses', 'booked_count', {
          type: sequelize.Sequelize.INTEGER,
          defaultValue: 0,
          comment: '已约人数'
        })
        console.log('  ✓ 添加 booked_count 字段')
      }
      
      if (coursesColumns.status) {
        const statusType = coursesColumns.status.type
        if (statusType.includes('tinyint')) {
          await queryInterface.changeColumn('courses', 'status', {
            type: sequelize.Sequelize.ENUM('ongoing', 'completed'),
            allowNull: false,
            defaultValue: 'ongoing',
            comment: '状态:进行中/已结课'
          })
          console.log('  ✓ 更新 status 字段为 ENUM 类型')
        }
      }

      const indexes = await queryInterface.showIndex('courses')
      const hasStartTimeIndex = indexes.some(idx => idx.name === 'idx_start_time')
      if (!hasStartTimeIndex) {
        await queryInterface.addIndex('courses', ['start_time'], {
          name: 'idx_start_time'
        })
        console.log('  ✓ 添加 start_time 索引')
      }
    }

    console.log('\n检查并更新 bookings 表...')
    const bookingsTableExists = await queryInterface.tableExists('bookings')
    const appointmentsTableExists = await queryInterface.tableExists('appointments')
    
    if (appointmentsTableExists && !bookingsTableExists) {
      await queryInterface.renameTable('appointments', 'bookings')
      console.log('  ✓ 重命名 appointments 表为 bookings')
    }
    
    if (bookingsTableExists) {
      const bookingsColumns = await queryInterface.describeTable('bookings')
      
      if (bookingsColumns.status) {
        const statusType = bookingsColumns.status.type
        if (statusType.includes('confirmed') || statusType.includes('cancelled')) {
          await queryInterface.changeColumn('bookings', 'status', {
            type: sequelize.Sequelize.ENUM('booked', 'checked_in', 'cancelled', 'absent'),
            allowNull: false,
            defaultValue: 'booked',
            comment: '状态:已预约/已签到/已取消/缺席'
          })
          console.log('  ✓ 更新 status 字段为新的 ENUM 类型')
        }
      }
    }

    await sequelize.sync({ alter: true })
    console.log('\n✓ 数据库表结构同步完成')

    const tables = await queryInterface.showAllTables()
    console.log('\n当前数据库表:')
    tables.forEach(table => {
      console.log(`  - ${table}`)
    })

    console.log('\n✓ 迁移完成!')
    process.exit(0)
  } catch (error) {
    console.error('✗ 迁移失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

migrate()
