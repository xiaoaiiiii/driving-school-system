USE driving_school;

-- 为 Users 表添加 status 字段
ALTER TABLE `Users` 
ADD COLUMN `status` TINYINT(1) NOT NULL DEFAULT 1 
COMMENT '状态:1=启用,0=禁用' 
AFTER `remaining_hours`;

-- 添加 status 索引
ALTER TABLE `Users` 
ADD INDEX `idx_status` (`status`);

-- 更新现有用户的状态为启用
UPDATE `Users` SET `status` = 1 WHERE `status` IS NULL;

SELECT 'Users 表 status 字段添加完成！' AS message;
