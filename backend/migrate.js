const sequelize = require('./src/config/sequelize')
const { User, Course, Booking } = require('./src/models')

async function migrate() {
  try {
    console.log('开始数据库迁移...\n')

    await sequelize.authenticate()
    console.log('✓ 数据库连接成功')

    await sequelize.sync({ alter: true })
    console.log('✓ 数据库表结构同步完成')

    const tables = await sequelize.getQueryInterface().showAllTables()
    console.log('\n当前数据库表:')
    tables.forEach(table => {
      console.log(`  - ${table}`)
    })

    console.log('\n✓ 迁移完成!')
    process.exit(0)
  } catch (error) {
    console.error('✗ 迁移失败:', error.message)
    process.exit(1)
  }
}

migrate()
