-- ============================================
-- 驾校约课系统 - 数据库信息查看脚本
-- ============================================

USE driving_school;

-- 1. 查看数据库所有表
SELECT '=== 数据库表列表 ===' AS info;
SHOW TABLES;

-- 2. 查看每个表的结构
SELECT '=== Users 表结构 ===' AS info;
DESCRIBE Users;

SELECT '=== Courses 表结构 ===' AS info;
DESCRIBE Courses;

SELECT '=== Bookings 表结构 ===' AS info;
DESCRIBE Bookings;

-- 3. 查看表中的数据量
SELECT '=== 各表数据量统计 ===' AS info;
SELECT 
  'Users' AS table_name, 
  COUNT(*) AS row_count 
FROM Users
UNION ALL
SELECT 'Courses', COUNT(*) FROM Courses
UNION ALL
SELECT 'Bookings', COUNT(*) FROM Bookings;

-- 4. 查看 Users 表示例数据
SELECT '=== Users 表前 10 条数据 ===' AS info;
SELECT * FROM Users LIMIT 10;

-- 5. 查看 Courses 表示例数据
SELECT '=== Courses 表前 10 条数据 ===' AS info;
SELECT * FROM Courses LIMIT 10;

-- 6. 查看 Bookings 表示例数据
SELECT '=== Bookings 表前 10 条数据 ===' AS info;
SELECT * FROM Bookings LIMIT 10;

-- 7. 查看表创建语句
SELECT '=== Users 表创建语句 ===' AS info;
SHOW CREATE TABLE Users;

SELECT '=== Courses 表创建语句 ===' AS info;
SHOW CREATE TABLE Courses;

SELECT '=== Bookings 表创建语句 ===' AS info;
SHOW CREATE TABLE Bookings;