const bcrypt = require('bcryptjs');
const DataInitializer = require('../services/dataInitializer');

// 全局共享的用户数据
let mockUsers = [];
let nextUserId = 4;

// 从数据库初始化数据
const initializeFromDB = async () => {
  try {
    const usersFromDB = await DataInitializer.loadUsersFromDB();
    if (usersFromDB && usersFromDB.length > 0) {
      mockUsers = usersFromDB;
      nextUserId = Math.max(...mockUsers.map(u => u.id), 0) + 1;
      console.log(`从数据库加载了 ${mockUsers.length} 个用户数据`);
      return true;
    }
    return false;
  } catch (error) {
    console.log('从数据库加载用户数据失败，使用默认数据:', error.message);
    return false;
  }
};

// 验证用户名格式（仅英文加数字）
const validateUsernameFormat = (username) => {
  const regex = /^[a-zA-Z0-9]+$/;
  return regex.test(username);
};

// 获取所有用户
const getMockUsers = () => {
  return mockUsers;
};

// 根据用户名查找用户
const findUserByUsername = (username) => {
  return mockUsers.find(u => u.username === username);
};

// 根据ID查找用户
const findUserById = (id) => {
  return mockUsers.find(u => u.id === parseInt(id));
};

// 添加新用户
const addMockUser = (user) => {
  const newUser = {
    id: nextUserId++,
    ...user,
    create_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
  mockUsers.push(newUser);
  return newUser;
};

// 更新用户
const updateMockUser = (id, updates) => {
  const index = mockUsers.findIndex(u => u.id === parseInt(id));
  if (index !== -1) {
    mockUsers[index] = { ...mockUsers[index], ...updates };
    return mockUsers[index];
  }
  return null;
};

// 删除用户
const deleteMockUser = (id) => {
  const index = mockUsers.findIndex(u => u.id === parseInt(id));
  if (index !== -1) {
    return mockUsers.splice(index, 1)[0];
  }
  return null;
};

// 初始化默认数据
const initializeWithDefaults = () => {
  if (mockUsers.length === 0) {
    mockUsers = [
      {
        id: 1,
        username: 'admin',
        password: '$2a$10$wYCNS3uYmyudF.nh8AUhvuW6Vf.hre..rxVOc21Feei//F1G3jh.m',
        real_name: '系统管理员',
        phone: '13800138000',
        role: 'admin',
        status: 1,
        create_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: 2,
        username: 'coach1',
        password: '$2a$10$EXpF0u5x2LsPRGJBzKZDJeH8bwvRzZyPXpsFO1KHSawEn26HIfkf.',
        real_name: '张教练',
        phone: '13800138001',
        role: 'coach',
        status: 1,
        create_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: 3,
        username: 'student1',
        password: '$2a$10$xkdgx21DH6qkUeQ1S.oApO03Gfe/TX/3A8SC0bUvO23TTeItj6SP6',
        real_name: '张三',
        phone: '13800138002',
        role: 'student',
        status: 1,
        subject_stage: 'subject2',
        remaining_hours: 20,
        create_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    ];
    nextUserId = 4;
  }
};

// 初始化
const init = async () => {
  const dbLoaded = await initializeFromDB();
  if (!dbLoaded) {
    initializeWithDefaults();
  }
};

// 立即尝试初始化
init();

module.exports = {
  mockUsers,
  nextUserId,
  validateUsernameFormat,
  getMockUsers,
  findUserByUsername,
  findUserById,
  addMockUser,
  updateMockUser,
  deleteMockUser,
  initializeFromDB
};