USE driving_school;

-- 给 Users 表添加 status 字段
ALTER TABLE `Users` ADD COLUMN `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态:1=启用,0=禁用' AFTER `remaining_hours`;

-- 添加索引
ALTER TABLE `Users` ADD INDEX `idx_status` (`status`);

SELECT 'status 字段添加成功！' AS message;
