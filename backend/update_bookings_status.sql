USE driving_school;

-- 修改 Bookings 表的 status 字段，添加 'absent' 状态
ALTER TABLE `Bookings` 
MODIFY COLUMN `status` ENUM('booked', 'completed', 'cancelled', 'absent') 
NOT NULL DEFAULT 'booked' 
COMMENT '预约状态:booked=已预约,completed=已完成,cancelled=已取消,absent=缺席';

SELECT 'Bookings 表状态字段更新完成！' AS message;
