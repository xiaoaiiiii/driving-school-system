-- 创建数据库
CREATE DATABASE IF NOT EXISTS driving_school DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE driving_school;

-- 用户信息表（Users）
CREATE TABLE IF NOT EXISTS `Users` (
  `user_id` INT NOT NULL AUTO_INCREMENT COMMENT '用户唯一标识',
  `username` VARCHAR(50) NOT NULL COMMENT '登录账号',
  `name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
  `phone` VARCHAR(11) NOT NULL COMMENT '手机号',
  `password` VARCHAR(255) NOT NULL COMMENT '加密后的密码',
  `role` ENUM('admin', 'coach', 'student') NOT NULL COMMENT '角色权限',
  `subject_progress` TINYINT NULL COMMENT '当前科目进度:0=科目二,1=科目三',
  `remaining_hours` INT NOT NULL DEFAULT 0 COMMENT '剩余可用课时余额',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态:1=启用,0=禁用',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';

-- 课程信息表（Courses）
CREATE TABLE IF NOT EXISTS `Courses` (
  `course_id` INT NOT NULL AUTO_INCREMENT COMMENT '课程唯一编号',
  `title` VARCHAR(100) NOT NULL COMMENT '课程标题',
  `subject_type` TINYINT NOT NULL COMMENT '训练科目:2=科目二,3=科目三',
  `start_time` DATETIME NOT NULL COMMENT '训练开始时间',
  `end_time` DATETIME NOT NULL COMMENT '训练结束时间',
  `location` VARCHAR(255) NULL COMMENT '训练场地',
  `max_capacity` INT NOT NULL COMMENT '最大容纳人数',
  `current_count` INT NOT NULL DEFAULT 0 COMMENT '已预约人数',
  `coach_id` INT NOT NULL COMMENT '所属教练ID',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态:1=启用,0=禁用',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`course_id`),
  KEY `idx_coach_id` (`coach_id`),
  KEY `idx_subject_type` (`subject_type`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_courses_coach` 
    FOREIGN KEY (`coach_id`) 
    REFERENCES `Users` (`user_id`) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程信息表';

-- 预约记录表（Bookings）
CREATE TABLE IF NOT EXISTS `Bookings` (
  `booking_id` INT NOT NULL AUTO_INCREMENT COMMENT '预约流水号',
  `student_id` INT NOT NULL COMMENT '学员ID',
  `course_id` INT NOT NULL COMMENT '课程ID',
  `status` ENUM('booked', 'completed', 'cancelled') NOT NULL DEFAULT 'booked' COMMENT '预约状态',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请提交时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`booking_id`),
  UNIQUE KEY `uk_student_course` (`student_id`, `course_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_bookings_student` 
    FOREIGN KEY (`student_id`) 
    REFERENCES `Users` (`user_id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_course` 
    FOREIGN KEY (`course_id`) 
    REFERENCES `Courses` (`course_id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约记录表';

-- 插入测试数据

-- 插入管理员（密码: 123456）
INSERT INTO `Users` (`username`, `name`, `phone`, `password`, `role`, `subject_progress`, `remaining_hours`) VALUES
('admin', '系统管理员', '13800138000', '$2a$10$wYCNS3uYmyudF.nh8AUhvuW6Vf.hre..rxVOc21Feei//F1G3jh.m', 'admin', NULL, 0)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- 插入教练（密码: 123456）
INSERT INTO `Users` (`username`, `name`, `phone`, `password`, `role`, `subject_progress`, `remaining_hours`) VALUES
('coach1', '张教练', '13800138001', '$2a$10$EXpF0u5x2LsPRGJBzKZDJeH8bwvRzZyPXpsFO1KHSawEn26HIfkf.', 'coach', NULL, 0)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- 插入学员（密码: 123456）
INSERT INTO `Users` (`username`, `name`, `phone`, `password`, `role`, `subject_progress`, `remaining_hours`) VALUES
('student1', '张三', '13800138002', '$2a$10$xkdgx21DH6qkUeQ1S.oApO03Gfe/TX/3A8SC0bUvO23TTeItj6SP6', 'student', 0, 20)
ON DUPLICATE KEY UPDATE `name` = `name`;

SELECT '数据库和表创建完成！' AS message;