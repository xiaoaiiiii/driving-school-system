const db = require('./src/config/database')

async function checkDatabase() {
  console.log('正在连接数据库...\n')

  try {
    // 1. 查看所有表
    console.log('=== 1. 数据库表列表 ===')
    const [tables] = await db.query('SHOW TABLES')
    console.log(tables)
    console.log()

    // 2. 查看每个表的结构
    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0]
      console.log(`=== 2. ${tableName} 表结构 ===`)
      const [columns] = await db.query(`DESCRIBE ${tableName}`)
      console.table(columns)
      console.log()

      // 3. 查看数据量
      console.log(`=== 3. ${tableName} 表数据量 ===`)
      const [count] = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`)
      console.log(`数据量: ${count[0].count}`)
      console.log()

      // 4. 查看前 5 条数据
      if (count[0].count > 0) {
        console.log(`=== 4. ${tableName} 表前 5 条数据 ===`)
        const [rows] = await db.query(`SELECT * FROM ${tableName} LIMIT 5`)
        console.table(rows)
        console.log()
      }

      // 5. 查看建表语句
      console.log(`=== 5. ${tableName} 表创建语句 ===`)
      const [createTable] = await db.query(`SHOW CREATE TABLE ${tableName}`)
      console.log(createTable[0]['Create Table'])
      console.log('\n' + '='.repeat(80) + '\n')
    }

    process.exit(0)
  } catch (error) {
    console.error('错误:', error.message)
    console.error('错误详情:', error)
    process.exit(1)
  }
}

checkDatabase()