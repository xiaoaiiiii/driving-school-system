-- 清空预约表和课程表
-- 使用前请先确认数据库连接

-- 清空预约表（bookings）
DELETE FROM bookings;

-- 清空课程表（courses）
DELETE FROM courses;

-- 重置自增ID（可选）
ALTER TABLE bookings AUTO_INCREMENT = 1;
ALTER TABLE courses AUTO_INCREMENT = 1;

SELECT '数据库清空完成！' AS message;