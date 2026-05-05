<template>
  <div class="instructor-courses">
    <div class="filter-bar">
      <Form
        :col="4"
        :formData="filterForm"
        @update:formData="onFilterChange"
      />
      <Button type="primary" @click="handleSearch">查询</Button>
    </div>

    <div class="table-container">
      <Table
        :columns="columns"
        :data="courseList"
        :loading="loading"
      >
        <template #subject="{ item }">
          <a-tag :color="item.subject === 'subject2' ? 'blue' : 'green'">
            {{ item.subject === 'subject2' ? '科目二' : '科目三' }}
          </a-tag>
        </template>
        <template #status="{ item }">
          <a-tag :color="item.status === 1 ? 'green' : 'gray'">
            {{ item.status === 1 ? '进行中' : '已结束' }}
          </a-tag>
        </template>
        <template #action="{ item }">
          <Button
            type="primary"
            size="small"
            @click="handleViewDetail(item)"
          >
            查看详情
          </Button>
        </template>
      </Table>
    </div>

    <a-modal
      v-model:open="detailModalVisible"
      title="课程详情"
      width="800px"
      :footer="null"
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

        <div class="student-list">
          <h3>预约学员</h3>
          <Table
            :columns="studentColumns"
            :data="currentCourse.bookings || []"
            :loading="studentLoading"
          >
            <template #status="{ item }">
              <a-tag :color="getStatusColor(item.status)">
                {{ getStatusText(item.status) }}
              </a-tag>
            </template>
            <template #action="{ item }">
              <Button
                v-if="item.status === 'confirmed'"
                type="primary"
                size="small"
                @click="handleCheckIn(item)"
                style="margin-right: 8px"
              >
                确认到课
              </Button>
              <Button
                v-if="item.status === 'confirmed'"
                type="default"
                size="small"
                danger
                @click="handleMarkAbsent(item)"
              >
                学员缺席
              </Button>
            </template>
          </Table>
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="absentModalVisible"
      title="标记缺席"
      @ok="confirmMarkAbsent"
      @cancel="absentModalVisible = false"
    >
      <p>是否要返还该学员的课时？</p>
      <a-checkbox v-model:checked="refundHours">返还课时</a-checkbox>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message, notification } from 'ant-design-vue'
import Table from '@/components/Table/index.vue'
import Form from '@/components/Form/index.vue'
import Button from '@/components/Button/index.vue'
import { courseApi } from '@/services/courses'
import { instructorApi } from '@/services/instructor'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)
const studentLoading = ref(false)
const courseList = ref([])
const detailModalVisible = ref(false)
const absentModalVisible = ref(false)
const currentCourse = ref(null)
const currentBooking = ref(null)
const refundHours = ref(false)

const filterForm = ref({
  date: {
    label: '日期',
    is: 'DatePicker',
    value: null,
    clearable: true
  },
  status: {
    label: '状态',
    is: 'Select',
    value: undefined,
    options: [
      { label: '进行中', value: 1 },
      { label: '已结束', value: 0 }
    ],
    clearable: true
  }
})

const columns = [
  { key: 'name', title: '课程名称', width: '200px' },
  { key: 'subject', title: '科目', width: '100px' },
  { key: 'start_time', title: '开始时间', width: '180px' },
  { key: 'end_time', title: '结束时间', width: '180px' },
  { key: 'location', title: '地点', width: '200px' },
  { key: 'status', title: '状态', width: '100px' },
  { key: 'action', title: '操作', width: '120px' }
]

const studentColumns = [
  { key: 'user.real_name', title: '姓名', width: '120px' },
  { key: 'user.phone', title: '手机号', width: '140px' },
  { key: 'user.total_hours', title: '剩余课时', width: '120px' },
  { key: 'status', title: '状态', width: '120px' },
  { key: 'action', title: '操作', width: '200px' }
]

const fetchCourses = async () => {
  loading.value = true
  try {
    const params = {
      date: filterForm.value.date.value,
      status: filterForm.value.status.value
    }
    courseList.value = await courseApi.list(params)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchCourses()
}

const onFilterChange = (formData) => {
  filterForm.value = formData
}

const handleViewDetail = async (course) => {
  studentLoading.value = true
  try {
    const detail = await courseApi.detail(course.id)
    currentCourse.value = detail
    detailModalVisible.value = true
  } catch (error) {
    message.error(error.message || '获取课程详情失败')
  } finally {
    studentLoading.value = false
  }
}

const handleCheckIn = async (booking) => {
  try {
    await instructorApi.checkIn(booking.id)
    notification.success({
      message: '签到成功',
      description: '学员已确认到课，课时已扣除'
    })
    await handleViewDetail(currentCourse.value)
  } catch (error) {
    message.error(error.message || '签到失败')
  }
}

const handleMarkAbsent = (booking) => {
  currentBooking.value = booking
  refundHours.value = false
  absentModalVisible.value = true
}

const confirmMarkAbsent = async () => {
  try {
    await instructorApi.markAbsent(currentBooking.value.id, {
      refundHours: refundHours.value
    })
    notification.success({
      message: '标记缺席成功',
      description: refundHours.value ? '已返还学员课时' : ''
    })
    absentModalVisible.value = false
    await handleViewDetail(currentCourse.value)
  } catch (error) {
    message.error(error.message || '操作失败')
  }
}

const getStatusColor = (status) => {
  const colorMap = {
    confirmed: 'blue',
    completed: 'green',
    cancelled: 'gray',
    absent: 'red'
  }
  return colorMap[status] || 'default'
}

const getStatusText = (status) => {
  const textMap = {
    confirmed: '已预约',
    completed: '已完成',
    cancelled: '已取消',
    absent: '缺席'
  }
  return textMap[status] || status
}

onMounted(() => {
  fetchCourses()
})
</script>

<style scoped>
.instructor-courses {
  background: #fff;
  padding: 24px;
  border-radius: 4px;
}
.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}
.table-container {
  min-height: 400px;
}
.course-detail {
  margin-bottom: 24px;
}
.student-list {
  margin-top: 24px;
}
.student-list h3 {
  margin-bottom: 16px;
  color: #333;
}
</style>
