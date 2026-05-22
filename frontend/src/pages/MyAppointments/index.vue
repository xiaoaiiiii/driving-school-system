<template>
  <div class="my-appointments">
    <div class="page-header">
      <h2>我的预约</h2>
    </div>

    <div class="filter-bar">
      <a-select
        v-model:value="selectedStatus"
        placeholder="请选择状态"
        style="width: 200px"
        allow-clear
        @change="handleStatusChange"
      >
        <a-select-option value="confirmed">待参加</a-select-option>
        <a-select-option value="completed">已完成</a-select-option>
        <a-select-option value="cancelled">已取消</a-select-option>
        <a-select-option value="absent">缺席</a-select-option>
      </a-select>
    </div>

    <div class="table-container">
      <Table
        :columns="columns"
        :data="appointmentList"
        :loading="loading"
      >
        <template #subject="{ item }">
          <a-tag :color="item.subject === 'subject2' ? 'blue' : 'green'">
            {{ item.subject === 'subject2' ? '科目二' : '科目三' }}
          </a-tag>
        </template>
        <template #status="{ item }">
          <a-badge :status="getStatusBadgeStatus(item.status)" :text="getStatusText(item.status)" />
        </template>
        <template #action="{ item }">
          <Button
            v-if="item.status === 'confirmed'"
            type="danger"
            size="small"
            @click="handleCancel(item)"
            :disabled="isCancelDisabled(item) || cancellingIds.has(item.id)"
            :loading="cancellingIds.has(item.id)"
          >
            取消预约
          </Button>
          <a-tooltip v-if="item.status === 'confirmed' && isCancelDisabled(item)" title="距离课程开始不足2小时，无法取消">
            <QuestionCircleOutlined style="margin-left: 8px; color: #faad14" />
          </a-tooltip>
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Table from '@/components/Table/index.vue'
import Button from '@/components/Button/index.vue'
import { courseApi } from '@/services/courses'
import { message } from 'ant-design-vue'
import { QuestionCircleOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const appointmentList = ref([])
const selectedStatus = ref(undefined)
const cancellingIds = ref(new Set())

const columns = [
  { key: 'course_name', title: '课程名称', width: '200px' },
  { key: 'subject', title: '科目', width: '100px' },
  { key: 'start_time', title: '开始时间', width: '180px' },
  { key: 'end_time', title: '结束时间', width: '180px' },
  { key: 'instructor_name', title: '教练', width: '120px' },
  { key: 'location', title: '地点', width: '200px' },
  { key: 'status', title: '状态', width: '120px' },
  { key: 'create_time', title: '预约时间', width: '180px' },
  { key: 'action', title: '操作', width: '150px' }
]

const fetchAppointments = async () => {
  loading.value = true
  try {
    const params = selectedStatus.value ? { status: selectedStatus.value } : {}
    const data = await courseApi.myAppointments(params)
    appointmentList.value = data || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleStatusChange = () => {
  fetchAppointments()
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

const isCancelDisabled = (item) => {
  const courseStartTime = new Date(item.start_time)
  const now = new Date()
  const hoursDiff = (courseStartTime - now) / (1000 * 60 * 60)
  return hoursDiff < 2
}

const handleCancel = async (item) => {
  if (cancellingIds.value.has(item.id)) return
  cancellingIds.value.add(item.id)
  try {
    await courseApi.cancel(item.id)
    message.success('取消预约成功')
    fetchAppointments()
  } catch (error) {
    // request 拦截器已经对非 00000 弹过 message.error，这里不再重复提示
    console.error('取消预约失败:', error)
  } finally {
    cancellingIds.value.delete(item.id)
  }
}

onMounted(() => {
  fetchAppointments()
})
</script>

<style scoped>
.my-appointments {
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
}
.filter-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}
.table-container {
  min-height: 400px;
}
</style>
