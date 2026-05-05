const db = require('./src/config/database')

async function addStatusColumn() {
  try {
    console.log('正在添加 status 字段...')
    
    // 检查字段是否已存在
    const [columns] = await db.query(
      "SHOW COLUMNS FROM Users LIKE 'status'"
    )
    
    if (columns.length > 0) {
      console.log('status 字段已存在，跳过添加')
    } else {
      // 添加 status 字段
      await db.query(`
        ALTER TABLE Users 
        ADD COLUMN status TINYINT(1) NOT NULL DEFAULT 1 
        COMMENT '状态:1=启用,0=禁用' 
        AFTER remaining_hours
      `)
      console.log('status 字段添加成功')
      
      // 添加索引
      await db.query(`
        ALTER TABLE Users 
        ADD INDEX idx_status (status)
      `)
      console.log('idx_status 索引添加成功')
    }
    
    // 更新现有用户的状态为 1（启用）
    await db.query(`
      UPDATE Users SET status = 1 WHERE status IS NULL
    `)
    console.log('现有用户状态已更新')
    
    console.log('操作完成！')
    process.exit(0)
  } catch (error) {
    console.error('添加 status 字段失败:', error)
    process.exit(1)
  }
}

addStatusColumn()
