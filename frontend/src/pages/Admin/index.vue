<template>
  <div class="admin">
    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane key="courses" tab="课程管理">
        <div class="admin-section">
          <div class="section-header">
            <Button type="primary" @click="showAddModal = true">添加课程</Button>
          </div>
          <Table
            :columns="courseColumns"
            :data="courseList"
            :loading="loading"
          >
            <template #subject="{ item }">
              <a-tag :color="item.subject === 'subject2' ? 'blue' : 'green'">
                {{ item.subject === 'subject2' ? '科目二' : '科目三' }}
              </a-tag>
            </template>
            <template #status="{ item }">
              <a-tag :color="item.status ? 'green' : 'red'">
                {{ item.status ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template #action="{ item }">
              <Button type="primary" size="small" @click="handleViewCourseDetail(item)">查看详情</Button>
            </template>
          </Table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="users" tab="用户管理">
        <div class="admin-section">
          <div class="section-header">
            <a-space>
              <Button type="primary" @click="showAddUserModal('student')">
                <UserOutlined />
                注册学员
              </Button>
              <Button type="primary" @click="showAddUserModal('instructor')">
                <TeamOutlined />
                注册教练
              </Button>
            </a-space>
          </div>

          <div class="filter-bar">
            <a-select
              v-model:value="userFilter.role"
              placeholder="全部角色"
              style="width: 150px"
              allow-clear
              @change="fetchUsers"
            >
              <a-select-option value="student">学员</a-select-option>
              <a-select-option value="instructor">教练</a-select-option>
              <a-select-option value="admin">管理员</a-select-option>
            </a-select>

            <a-input-search
              v-model:value="userFilter.keyword"
              placeholder="搜索用户名/姓名/手机号"
              style="width: 300px"
              @search="fetchUsers"
            />
          </div>

          <Table
            :columns="userColumns"
            :data="filteredUserList"
            :loading="loading"
          >
            <template #role="{ item }">
              <a-tag :color="getRoleColor(item.role)">
                {{ getRoleText(item.role) }}
              </a-tag>
            </template>
            <template #status="{ item }">
              <a-tag :color="item.status ? 'green' : 'red'">
                {{ item.status ? '启用' : '禁用' }}
              </a-tag>
            </template>
            <template #action="{ item }">
              <a-space size="small">
                <a-button type="link" size="small" @click="showUserDetail(item)">
                  详情
                </a-button>
                <a-button type="link" size="small" @click="openEditUserModal(item)">
                  编辑
                </a-button>
                <a-button type="link" size="small" @click="showResetPasswordModal(item)">
                  修改密码
                </a-button>
                <a-popconfirm
                  v-if="item.status === 1"
                  title="确定要禁用该用户吗？"
                  @confirm="toggleUserStatus(item, 0)"
                >
                  <a-button type="link" size="small" danger>禁用</a-button>
                </a-popconfirm>
                <a-button
                  v-else
                  type="link"
                  size="small"
                  @click="toggleUserStatus(item, 1)"
                >
                  启用
                </a-button>
                <a-popconfirm
                  title="确定要删除该用户吗？此操作不可恢复！"
                  @confirm="deleteUser(item)"
                >
                  <a-button type="link" size="small" danger>删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </Table>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 添加课程弹窗 -->
    <a-modal
      v-model:open="showAddModal"
      title="添加课程"
      @ok="handleAddCourse"
      @cancel="showAddModal = false"
    >
      <a-form :model="courseForm" layout="vertical">
        <a-form-item label="课程名称" required>
          <a-input v-model:value="courseForm.name" placeholder="请输入课程名称" />
        </a-form-item>
        <a-form-item label="科目" required>
          <a-select v-model:value="courseForm.subject" placeholder="请选择科目">
            <a-select-option value="subject2">科目二</a-select-option>
            <a-select-option value="subject3">科目三</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="开始时间" required>
          <a-date-picker
            v-model:value="courseForm.start_time"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="结束时间" required>
          <a-date-picker
            v-model:value="courseForm.end_time"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="总名额" required>
          <a-input-number v-model:value="courseForm.max_capacity" :min="1" style="width: 100%" />
        </a-form-item>
        <a-form-item label="教练" required>
          <a-select v-model:value="courseForm.coach_id" placeholder="请选择教练">
            <a-select-option
              v-for="instructor in instructors"
              :key="instructor.id"
              :value="instructor.id"
            >
              {{ instructor.real_name || instructor.username }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="地点">
          <a-input v-model:value="courseForm.location" placeholder="请输入地点" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑课程弹窗 -->
    <a-modal
      v-model:open="showEditModal"
      title="编辑课程"
      @ok="handleEditCourse"
      @cancel="showEditModal = false"
    >
      <a-form :model="courseForm" layout="vertical">
        <a-form-item label="课程名称" required>
          <a-input v-model:value="courseForm.name" placeholder="请输入课程名称" />
        </a-form-item>
        <a-form-item label="科目" required>
          <a-select v-model:value="courseForm.subject" placeholder="请选择科目">
            <a-select-option value="subject2">科目二</a-select-option>
            <a-select-option value="subject3">科目三</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="开始时间" required>
          <a-date-picker
            v-model:value="courseForm.start_time"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="结束时间" required>
          <a-date-picker
            v-model:value="courseForm.end_time"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="总名额" required>
          <a-input-number v-model:value="courseForm.max_capacity" :min="1" style="width: 100%" />
        </a-form-item>
        <a-form-item label="教练" required>
          <a-select v-model:value="courseForm.coach_id" placeholder="请选择教练">
            <a-select-option
              v-for="instructor in instructors"
              :key="instructor.id"
              :value="instructor.id"
            >
              {{ instructor.real_name || instructor.username }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="地点">
          <a-input v-model:value="courseForm.location" placeholder="请输入地点" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看课程详情弹窗 -->
    <a-modal
      v-model:open="showCourseDetailModal"
      title="课程详情"
      :footer="null"
      width="800px"
    >
      <div v-if="currentCourse" class="course-detail">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="课程名称">
            {{ currentCourse.name }}
          </a-descriptions-item>
          <a-descriptions-item label="科目">
            <a-tag :color="currentCourse.subject === 'subject2' ? 'blue' : 'green'">
              {{ currentCourse.subject === 'subject2' ? '科目二' : '科目三' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="开始时间">
            {{ currentCourse.start_time }}
          </a-descriptions-item>
          <a-descriptions-item label="结束时间">
            {{ currentCourse.end_time }}
          </a-descriptions-item>
          <a-descriptions-item label="地点">
            {{ currentCourse.location }}
          </a-descriptions-item>
          <a-descriptions-item label="人数">
            {{ currentCourse.booked_count }} / {{ currentCourse.max_capacity }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="student-list" style="margin-top: 24px">
          <h3 style="margin-bottom: 16px; color: #333">预约学员</h3>
          <Table
            :columns="studentColumns"
            :data="currentCourse.bookings || []"
            :loading="studentLoading"
          >
            <template #status="{ item }">
              <a-tag :color="getStudentStatusColor(item.status)">
                {{ getStudentStatusText(item.status) }}
              </a-tag>
            </template>
          </Table>
        </div>
      </div>
    </a-modal>

    <!-- 添加用户弹窗 -->
    <a-modal
      v-model:open="showAddUser"
      :title="currentUserRole === 'student' ? '注册学员' : '注册教练'"
      @ok="handleAddUser"
      @cancel="showAddUser = false"
      width="600px"
    >
      <a-form :model="userForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="用户名" required>
              <a-input v-model:value="userForm.username" placeholder="请输入用户名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="密码" required>
              <a-input-password v-model:value="userForm.password" placeholder="请输入密码（至少6位）" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="真实姓名">
              <a-input v-model:value="userForm.real_name" placeholder="请输入真实姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手机号">
              <a-input v-model:value="userForm.phone" placeholder="请输入手机号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item v-if="currentUserRole === 'student'" label="初始课时">
          <a-input-number v-model:value="userForm.total_hours" :min="0" style="width: 100%" />
        </a-form-item>
        <a-form-item v-if="currentUserRole === 'student'" label="学习科目">
          <a-select v-model:value="userForm.subject_stage" placeholder="请选择学习科目" allow-clear>
            <a-select-option value="subject2">科目二</a-select-option>
            <a-select-option value="subject3">科目三</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 用户详情弹窗 -->
    <a-modal
      v-model:open="showUserDetailModal"
      title="用户详情"
      width="600px"
      :footer="null"
    >
      <a-descriptions :column="1" bordered v-if="currentUser">
        <a-descriptions-item label="用户名">{{ currentUser.username }}</a-descriptions-item>
        <a-descriptions-item label="真实姓名">{{ currentUser.real_name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="角色">
          <a-tag :color="getRoleColor(currentUser.role)">
            {{ getRoleText(currentUser.role) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="手机号">{{ currentUser.phone || '-' }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="currentUser.status ? 'green' : 'red'">
            {{ currentUser.status ? '启用' : '禁用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item v-if="currentUser.role === 'student'" label="剩余课时">
          {{ currentUser.total_hours || 0 }}
        </a-descriptions-item>
        <a-descriptions-item v-if="currentUser.role === 'student'" label="学习科目">
          {{ currentUser.subject_stage === 'subject2' ? '科目二' : currentUser.subject_stage === 'subject3' ? '科目三' : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ currentUser.create_time }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>

    <!-- 修改密码弹窗 -->
    <a-modal
      v-model:open="showResetPassword"
      title="修改密码"
      @ok="handleResetPassword"
      @cancel="showResetPassword = false"
    >
      <a-form :model="passwordForm" layout="vertical">
        <a-form-item label="新密码" required>
          <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码（至少6位）" />
        </a-form-item>
        <a-form-item label="确认密码" required>
          <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑用户弹窗 -->
    <a-modal
      v-model:open="showEditUserModal"
      title="编辑用户"
      @ok="handleEditUser"
      @cancel="showEditUserModal = false"
      width="600px"
    >
      <a-form :model="editUserForm" layout="vertical">
        <a-form-item label="真实姓名">
          <a-input v-model:value="editUserForm.real_name" placeholder="请输入真实姓名" />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input v-model:value="editUserForm.phone" placeholder="请输入手机号" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import Table from '@/components/Table/index.vue'
import Button from '@/components/Button/index.vue'
import { message } from 'ant-design-vue'
import { UserOutlined, TeamOutlined } from '@ant-design/icons-vue'
import { ADMIN_SRV, COURSE_SRV } from '@/services/request'
import dayjs from 'dayjs'

const activeKey = ref('courses')
const loading = ref(false)
const showAddModal = ref(false)
const showEditModal = ref(false)
const showCourseDetailModal = ref(false)
const showAddUser = ref(false)
const showUserDetailModal = ref(false)
const showResetPassword = ref(false)
const showEditUserModal = ref(false)
const currentUserRole = ref('student')
const courseList = ref([])
const userList = ref([])
const appointmentList = ref([])
const instructors = ref([])
const currentUser = ref(null)
const currentPasswordUser = ref(null)
const currentCourse = ref(null)
const editingCourseId = ref(null)
const editingUserId = ref(null)
const studentLoading = ref(false)

const userFilter = reactive({
  role: undefined,
  keyword: ''
})

const courseForm = ref({
  name: '',
  subject: undefined,
  start_time: null,
  end_time: null,
  max_capacity: 1,
  coach_id: undefined,
  location: ''
})

const userForm = ref({
  username: '',
  password: '',
  real_name: '',
  phone: '',
  subject_stage: null,
  total_hours: 20
})

const passwordForm = ref({
  newPassword: '',
  confirmPassword: ''
})

const editUserForm = ref({
  real_name: '',
  phone: ''
})

const studentColumns = [
  { key: 'user.real_name', title: '姓名', width: '120px' },
  { key: 'user.phone', title: '手机号', width: '140px' },
  { key: 'user.total_hours', title: '剩余课时', width: '120px' },
  { key: 'status', title: '状态', width: '100px' }
]

const courseColumns = [
  { key: 'name', title: '课程名称', width: '200px' },
  { key: 'subject', title: '科目', width: '100px' },
  { key: 'start_time', title: '开始时间', width: '180px' },
  { key: 'end_time', title: '结束时间', width: '180px' },
  { key: 'capacity', title: '总名额', width: '100px' },
  { key: 'stock', title: '剩余名额', width: '100px' },
  { key: 'instructor_name', title: '教练', width: '120px' },
  { key: 'location', title: '地点', width: '200px' },
  { key: 'status', title: '状态', width: '100px' },
  { key: 'action', title: '操作', width: '150px' }
]

const userColumns = [
  { key: 'username', title: '用户名', width: '150px' },
  { key: 'real_name', title: '真实姓名', width: '120px' },
  { key: 'phone', title: '手机号', width: '140px' },
  { key: 'role', title: '角色', width: '100px' },
  { key: 'status', title: '状态', width: '100px' },
  { key: 'create_time', title: '创建时间', width: '180px' },
  { key: 'action', title: '操作', width: '300px', fixed: 'right' }
]

const appointmentColumns = [
  { key: 'course_name', title: '课程名称', width: '200px' },
  { key: 'user_name', title: '学员', width: '120px' },
  { key: 'start_time', title: '开始时间', width: '180px' },
  { key: 'status', title: '状态', width: '100px' },
  { key: 'create_time', title: '预约时间', width: '180px' }
]

const filteredUserList = computed(() => {
  let list = userList.value
  if (userFilter.role) {
    list = list.filter(u => u.role === userFilter.role)
  }
  if (userFilter.keyword) {
    const keyword = userFilter.keyword.toLowerCase()
    list = list.filter(u =>
      u.username?.toLowerCase().includes(keyword) ||
      u.real_name?.toLowerCase().includes(keyword) ||
      u.phone?.includes(keyword)
    )
  }
  return list
})

const getRoleColor = (role) => {
  const colorMap = {
    'student': 'blue',
    'instructor': 'green',
    'admin': 'red'
  }
  return colorMap[role] || 'default'
}

const getRoleText = (role) => {
  const textMap = {
    'student': '学员',
    'instructor': '教练',
    'admin': '管理员'
  }
  return textMap[role] || role
}

const getStatusColor = (status) => {
  const colorMap = {
    'confirmed': 'green',
    'cancelled': 'red',
    'completed': 'blue'
  }
  return colorMap[status] || 'default'
}

const getStatusText = (status) => {
  const textMap = {
    'confirmed': '已确认',
    'cancelled': '已取消',
    'completed': '已完成'
  }
  return textMap[status] || status
}

const getStudentStatusColor = (status) => {
  const colorMap = {
    'confirmed': 'green',
    'completed': 'blue',
    'absent': 'red',
    'cancelled': 'default'
  }
  return colorMap[status] || 'default'
}

const getStudentStatusText = (status) => {
  const textMap = {
    'confirmed': '已预约',
    'completed': '已完成',
    'absent': '缺席',
    'cancelled': '已取消'
  }
  return textMap[status] || status
}

const handleViewCourseDetail = async (item) => {
  studentLoading.value = true
  try {
    const data = await ADMIN_SRV.get(`/courses/${item.id}`)
    console.log('获取课程详情返回:', data)
    
    // 把 bookings 数据扁平化，这样表格组件能正常显示
    if (data.bookings && data.bookings.length > 0) {
      data.bookings = data.bookings.map(booking => ({
        ...booking,
        'user.real_name': booking.user?.real_name || '',
        'user.phone': booking.user?.phone || '',
        'user.total_hours': booking.user?.total_hours || 0
      }))
    }
    
    currentCourse.value = data
    console.log('处理后的课程详情:', currentCourse.value)
    showCourseDetailModal.value = true
  } catch (error) {
    console.error(error)
    message.error('获取课程详情失败')
  } finally {
    studentLoading.value = false
  }
}

const openEditUserModal = (user) => {
  editingUserId.value = user.id
  editUserForm.value = {
    real_name: user.real_name || '',
    phone: user.phone || ''
  }
  showEditUserModal.value = true
}

const handleEditUser = async () => {
  if (!editUserForm.value.real_name && !editUserForm.value.phone) {
    message.warning('请至少填写一项信息')
    return
  }

  loading.value = true
  try {
    await ADMIN_SRV.put(`/users/${editingUserId.value}`, editUserForm.value)
    message.success('编辑用户成功')
    showEditUserModal.value = false
    fetchUsers()
  } catch (error) {
    message.error(error.message || '编辑用户失败')
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const params = {}
    if (userFilter.role) {
      params.role = userFilter.role
    }
    console.log('正在请求用户列表，参数:', params)
    const res = await ADMIN_SRV.get('/users', { params })
    console.log('用户列表返回数据:', res)
    userList.value = res || []
    console.log('用户列表已更新，长度:', userList.value.length)
  } catch (error) {
    console.error('获取用户列表失败:', error)
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const showAddUserModal = (role) => {
  currentUserRole.value = role
  userForm.value = {
    username: '',
    password: '',
    real_name: '',
    phone: '',
    subject_stage: null,
    total_hours: 20
  }
  showAddUser.value = true
}

const handleAddUser = async () => {
  if (!userForm.value.username || !userForm.value.password) {
    message.warning('请填写用户名和密码')
    return
  }
  if (userForm.value.password.length < 6) {
    message.warning('密码长度不能少于6位')
    return
  }

  loading.value = true
  try {
    const result = await ADMIN_SRV.post('/users', {
      ...userForm.value,
      role: currentUserRole.value
    })
    console.log('注册成功，返回数据:', result)
    message.success(`${currentUserRole.value === 'student' ? '学员' : '教练'}注册成功`)
    showAddUser.value = false
    console.log('开始刷新用户列表...')
    await fetchUsers()
    console.log('用户列表刷新完成，当前用户数:', userList.value.length)
    // 如果添加的是教练，也重新获取教练列表
    if (currentUserRole.value === 'instructor') {
      await fetchInstructors()
    }
  } catch (error) {
    console.error('注册失败:', error)
    message.error(error.message || '注册失败')
  } finally {
    loading.value = false
  }
}

const showUserDetail = (user) => {
  currentUser.value = user
  showUserDetailModal.value = true
}

const showResetPasswordModal = (user) => {
  currentPasswordUser.value = user
  passwordForm.value = {
    newPassword: '',
    confirmPassword: ''
  }
  showResetPassword.value = true
}

const handleResetPassword = async () => {
  if (!passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    message.warning('请填写新密码')
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    message.warning('密码长度不能少于6位')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    message.warning('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    await ADMIN_SRV.put(`/users/${currentPasswordUser.value.id}/password`, {
      newPassword: passwordForm.value.newPassword
    })
    message.success('密码修改成功')
    showResetPassword.value = false
  } catch (error) {
    message.error(error.message || '修改密码失败')
  } finally {
    loading.value = false
  }
}

const toggleUserStatus = async (user, status) => {
  loading.value = true
  try {
    await ADMIN_SRV.put(`/users/${user.id}/status`, { status })
    message.success(status === 1 ? '启用成功' : '禁用成功')
    fetchUsers()
    // 如果操作的是教练，也重新获取教练列表
    if (user.role === 'instructor') {
      fetchInstructors()
    }
  } catch (error) {
    message.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

const deleteUser = async (user) => {
  loading.value = true
  try {
    await ADMIN_SRV.delete(`/users/${user.id}`)
    message.success('删除成功')
    fetchUsers()
    // 如果删除的是教练，也重新获取教练列表
    if (user.role === 'instructor') {
      fetchInstructors()
    }
  } catch (error) {
    message.error(error.message || '删除失败')
  } finally {
    loading.value = false
  }
}

const handleAddCourse = async () => {
  if (!courseForm.value.name || !courseForm.value.subject || !courseForm.value.start_time || !courseForm.value.end_time || !courseForm.value.max_capacity || !courseForm.value.coach_id || !courseForm.value.location) {
    message.warning('请填写所有必填字段')
    return
  }

  loading.value = true
  try {
    const courseData = {
      name: courseForm.value.name,
      subject: courseForm.value.subject,
      start_time: courseForm.value.start_time ? courseForm.value.start_time.format('YYYY-MM-DD HH:mm:ss') : null,
      end_time: courseForm.value.end_time ? courseForm.value.end_time.format('YYYY-MM-DD HH:mm:ss') : null,
      max_capacity: courseForm.value.max_capacity,
      coach_id: courseForm.value.coach_id,
      location: courseForm.value.location,
      description: courseForm.value.description
    }
    
    await ADMIN_SRV.post('/courses', courseData)
    message.success('添加课程成功')
    showAddModal.value = false
    fetchCourses()
  } catch (error) {
    message.error(error.message || '添加课程失败')
  } finally {
    loading.value = false
  }
}

const handleEdit = (item) => {
  editingCourseId.value = item.id
  courseForm.value = {
    name: item.name,
    subject: item.subject,
    start_time: item.start_time ? dayjs(item.start_time) : null,
    end_time: item.end_time ? dayjs(item.end_time) : null,
    max_capacity: item.capacity || item.max_capacity || 1,
    coach_id: item.coach_id,
    location: item.location || '',
    description: item.description || ''
  }
  showEditModal.value = true
}

const handleEditCourse = async () => {
  if (!courseForm.value.name || !courseForm.value.subject || !courseForm.value.start_time || !courseForm.value.end_time || !courseForm.value.max_capacity || !courseForm.value.coach_id || !courseForm.value.location) {
    message.warning('请填写所有必填字段')
    return
  }

  loading.value = true
  try {
    const courseData = {
      name: courseForm.value.name,
      subject: courseForm.value.subject,
      start_time: courseForm.value.start_time ? courseForm.value.start_time.format('YYYY-MM-DD HH:mm:ss') : null,
      end_time: courseForm.value.end_time ? courseForm.value.end_time.format('YYYY-MM-DD HH:mm:ss') : null,
      max_capacity: courseForm.value.max_capacity,
      coach_id: courseForm.value.coach_id,
      location: courseForm.value.location,
      description: courseForm.value.description
    }
    
    await ADMIN_SRV.put(`/courses/${editingCourseId.value}`, courseData)
    message.success('编辑课程成功')
    showEditModal.value = false
    fetchCourses()
  } catch (error) {
    message.error(error.message || '编辑课程失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = async (item) => {
  loading.value = true
  try {
    await ADMIN_SRV.delete(`/courses/${item.id}`)
    message.success('删除课程成功')
    fetchCourses()
  } catch (error) {
    message.error(error.message || '删除课程失败')
  } finally {
    loading.value = false
  }
}

const fetchCourses = async () => {
  loading.value = true
  try {
    const data = await ADMIN_SRV.get('/courses')
    courseList.value = data || []
  } catch (error) {
    console.error(error)
    message.error('获取课程列表失败')
  } finally {
    loading.value = false
  }
}

const fetchInstructors = async () => {
  try {
    const data = await ADMIN_SRV.get('/instructors')
    instructors.value = data || []
  } catch (error) {
    console.error(error)
  }
}

const fetchAppointments = async () => {
  loading.value = true
  try {
    const data = await fetch('/api/admin/appointments').then(res => res.json())
    appointmentList.value = (data.respData || []).map(item => ({
      ...item,
      course_name: item.course?.name || '',
      user_name: item.user?.real_name || item.user?.username || ''
    }))
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCourses()
  fetchUsers()
  fetchInstructors()
})
</script>

<style scoped>
.admin {
  background: #fff;
  padding: 24px;
  border-radius: 4px;
}
.admin-section {
  min-height: 400px;
}
.section-header {
  margin-bottom: 16px;
}
.filter-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
