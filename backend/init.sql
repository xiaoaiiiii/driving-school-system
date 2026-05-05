-- 创建数据库
CREATE DATABASE IF NOT EXISTS driving_school DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE driving_school;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(加密)',
  `role` ENUM('student', 'instructor', 'admin') NOT NULL DEFAULT 'student' COMMENT '角色',
  `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态:1启用,0禁用',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 课程表
CREATE TABLE IF NOT EXISTS `courses` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '课程ID',
  `name` VARCHAR(100) NOT NULL COMMENT '课程名称',
  `subject` ENUM('subject2', 'subject3') NOT NULL COMMENT '科目:科目二/科目三',
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `end_time` DATETIME NOT NULL COMMENT '结束时间',
  `capacity` INT(11) NOT NULL COMMENT '总名额',
  `stock` INT(11) NOT NULL COMMENT '剩余名额',
  `instructor_id` INT(11) NOT NULL COMMENT '教练ID',
  `location` VARCHAR(200) DEFAULT NULL COMMENT '地点',
  `description` TEXT DEFAULT NULL COMMENT '课程描述',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态:1启用,0禁用',
  `version` INT(11) NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_instructor_id` (`instructor_id`),
  KEY `idx_subject` (`subject`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_courses_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程表';

-- 预约记录表
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '预约ID',
  `user_id` INT(11) NOT NULL COMMENT '学员ID',
  `course_id` INT(11) NOT NULL COMMENT '课程ID',
  `status` ENUM('confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'confirmed' COMMENT '状态:已确认/已取消/已完成',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_course` (`user_id`, `course_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_status` (`status`),
  KEY `idx_create_time` (`create_time`),
  CONSTRAINT `fk_appointments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_appointments_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约记录表';

-- 插入测试数据

-- 插入管理员账号 (密码: admin123)
INSERT INTO `users` (`username`, `password`, `role`, `real_name`, `phone`, `email`) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p96ldmc5aLGX0e', 'admin', '系统管理员', '13800138000', 'admin@driving.com')
ON DUPLICATE KEY UPDATE `username` = `username`;

-- 插入教练账号 (密码: instructor123)
INSERT INTO `users` (`username`, `password`, `role`, `real_name`, `phone`, `email`) VALUES
('instructor1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p96ldmc5aLGX0e', 'instructor', '张教练', '13800138001', 'instructor1@driving.com'),
('instructor2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p96ldmc5aLGX0e', 'instructor', '李教练', '13800138002', 'instructor2@driving.com')
ON DUPLICATE KEY UPDATE `username` = `username`;

-- 插入学员账号 (密码: student123)
INSERT INTO `users` (`username`, `password`, `role`, `real_name`, `phone`, `email`) VALUES
('student1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p96ldmc5aLGX0e', 'student', '学员张三', '13800138003', 'student1@driving.com'),
('student2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p96ldmc5aLGX0e', 'student', '学员李四', '13800138004', 'student2@driving.com')
ON DUPLICATE KEY UPDATE `username` = `username`;

-- 插入测试课程
INSERT INTO `courses` (`name`, `subject`, `start_time`, `end_time`, `capacity`, `stock`, `instructor_id`, `location`, `description`) VALUES
('科目二基础训练', 'subject2', '2026-01-20 09:00:00', '2026-01-20 11:00:00', 5, 5, 2, '训练场A', '科目二基础操作训练'),
('科目二综合训练', 'subject2', '2026-01-20 14:00:00', '2026-01-20 17:00:00', 3, 3, 2, '训练场B', '科目二综合操作训练'),
('科目三路考训练', 'subject3', '2026-01-21 09:00:00', '2026-01-21 12:00:00', 4, 4, 3, '训练场C', '科目三路考训练'),
('科目三夜间训练', 'subject3', '2026-01-21 18:00:00', '2026-01-21 21:00:00', 3, 3, 3, '训练场A', '科目三夜间驾驶训练')
ON DUPLICATE KEY UPDATE `name` = `name`;
