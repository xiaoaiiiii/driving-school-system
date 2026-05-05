<template>
  <div class="instructor-appointments">
    <div class="page-header">
      <h2>我的预约</h2>
      <p class="subtitle">查看学员对您课程的预约情况</p>
    </div>

    <div class="stats-cards">
      <a-card class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总预约数</div>
      </a-card>
      <a-card class="stat-card">
        <div class="stat-value" style="color: #1890ff">{{ stats.confirmed }}</div>
        <div class="stat-label">待参加</div>
      </a-card>
      <a-card class="stat-card">
        <div class="stat-value" style="color: #52c41a">{{ stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </a-card>
      <a-card class="stat-card">
        <div class="stat-value" style="color: #ff4d4f">{{ stats.absent }}</div>
        <div class="stat-label">缺席</div>
      </a-card>
    </div>

    <div class="filter-bar">
      <a-select
        v-model:value="filterForm.status"
        placeholder="预约状态"
        style="width: 150px"
        allow-clear
        @change="handleFilterChange"
      >
        <a-select-option value="confirmed">待参加</a-select-option>
        <a-select-option value="completed">已完成</a-select-option>
        <a-select-option value="cancelled">已取消</a-select-option>
        <a-select-option value="absent">缺席</a-select-option>
      </a-select>

      <a-date-picker
        v-model:value="filterForm.date"
        placeholder="选择日期"
        style="width: 150px"
        @change="handleFilterChange"
      />

      <a-button type="primary" @click="fetchAppointments">
        <SearchOutlined />
        查询
      </a-button>

      <a-button @click="resetFilter">
        <ReloadOutlined />
        重置
      </a-button>
    </div>

    <div class="table-container">
      <a-table
        :columns="columns"
        :data-source="appointmentList"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'student_name'">
            <a-space>
              <a-avatar :size="24" style="background-color: #1890ff">
                {{ record.student_name?.charAt(0)?.toUpperCase() }}
              </a-avatar>
              <span>{{ record.student_name }}</span>
            </a-space>
          </template>

          <template v-if="column.key === 'subject'">
            <a-tag :color="record.subject === 'subject2' ? 'blue' : 'green'">
              {{ record.subject === 'subject2' ? '科目二' : '科目三' }}
            </a-tag>
          </template>

          <template v-if="column.key === 'status'">
            <a-badge :status="getStatusBadgeStatus(record.status)" :text="getStatusText(record.status)" />
          </template>

          <template v-if="column.key === 'action'">
            <a-space>
              <a-button
                v-if="record.status === 'confirmed'"
                type="primary"
                size="small"
                @click="handleCheckIn(record)"
              >
                确认到课
              </a-button>
              <a-button
                v-if="record.status === 'confirmed'"
                size="small"
                danger
                @click="handleMarkAbsent(record)"
              >
                标记缺席
              </a-button>
              <span v-if="record.status !== 'confirmed'" style="color: #999">-</span>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 标记缺席弹窗 -->
    <a-modal
      v-model:open="absentModalVisible"
      title="标记缺席"
      @ok="confirmMarkAbsent"
      @cancel="absentModalVisible = false"
    >
      <p>确定要将学员 <strong>{{ currentAppointment?.student_name }}</strong> 标记为缺席吗？</p>
      <a-checkbox v-model:checked="refundHours">返还学员课时</a-checkbox>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message, notification } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { instructorApi } from '@/services/instructor'
import dayjs from 'dayjs'

const loading = ref(false)
const appointmentList = ref([])
const absentModalVisible = ref(false)
const currentAppointment = ref(null)
const refundHours = ref(false)

const filterForm = reactive({
  status: undefined,
  date: null
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

const columns = [
  { title: '学员姓名', key: 'student_name', width: 120 },
  { title: '手机号', dataIndex: 'student_phone', width: 140 },
  { title: '课程名称', dataIndex: 'course_name', width: 200 },
  { title: '科目', key: 'subject', width: 100 },
  { title: '上课时间', dataIndex: 'start_time', width: 180 },
  { title: '地点', dataIndex: 'location', width: 150 },
  { title: '状态', key: 'status', width: 100 },
  { title: '预约时间', dataIndex: 'create_time', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' }
]

const stats = computed(() => {
  const total = appointmentList.value.length
  const confirmed = appointmentList.value.filter(a => a.status === 'confirmed').length
  const completed = appointmentList.value.filter(a => a.status === 'completed').length
  const absent = appointmentList.value.filter(a => a.status === 'absent').length
  const cancelled = appointmentList.value.filter(a => a.status === 'cancelled').length
  return { total, confirmed, completed, absent, cancelled }
})

const fetchAppointments = async () => {
  loading.value = true
  try {
    const params = {}
    if (filterForm.status) {
      params.status = filterForm.status
    }
    if (filterForm.date) {
      params.date = filterForm.date.format('YYYY-MM-DD')
    }

    const data = await instructorApi.getMyAppointments(params)
    appointmentList.value = data || []
    pagination.total = appointmentList.value.length
  } catch (error) {
    console.error(error)
    message.error('获取预约列表失败')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.current = 1
  fetchAppointments()
}

const resetFilter = () => {
  filterForm.status = undefined
  filterForm.date = null
  pagination.current = 1
  fetchAppointments()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

const handleCheckIn = async (record) => {
  try {
    await instructorApi.checkIn(record.id)
    notification.success({
      message: '签到成功',
      description: `学员 ${record.student_name} 已确认到课`
    })
    fetchAppointments()
  } catch (error) {
    message.error(error.message || '签到失败')
  }
}

const handleMarkAbsent = (record) => {
  currentAppointment.value = record
  refundHours.value = false
  absentModalVisible.value = true
}

const confirmMarkAbsent = async () => {
  if (!currentAppointment.value) return

  try {
    await instructorApi.markAbsent(currentAppointment.value.id, {
      refundHours: refundHours.value
    })
    notification.success({
      message: '标记缺席成功',
      description: refundHours.value
        ? `已返还 ${currentAppointment.value.student_name} 的课时`
        : `${currentAppointment.value.student_name} 已被标记为缺席`
    })
    absentModalVisible.value = false
    fetchAppointments()
  } catch (error) {
    message.error(error.message || '操作失败')
  }
}

const getStatusBadgeStatus = (status) => {
  const statusMap = {
    'confirmed': 'processing',
    'completed': 'success',
    'cancelled': 'default',
    'absent': 'error'
  }
  return statusMap[status] || 'default'
}

const getStatusText = (status) => {
  const textMap = {
    'confirmed': '待参加',
    'completed': '已完成',
    'cancelled': '已取消',
    'absent': '缺席'
  }
  return textMap[status] || status
}

onMounted(() => {
  fetchAppointments()
})
</script>

<style scoped>
.instructor-appointments {
  background: #fff;
  padding: 24px;
  border-radius: 4px;
}

.page-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.stats-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.table-container {
  min-height: 400px;
}
</style>
