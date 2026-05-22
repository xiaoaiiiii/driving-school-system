<template>
  <div class="course-list">
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
        <template #stock="{ item }">
          <span :class="{ 'text-danger': item.stock <= 0, 'text-warning': item.stock > 0 && item.stock < 3 }">
            {{ item.stock }} / {{ item.capacity }}
          </span>
        </template>
        <template #action="{ item }">
          <template v-if="isStudent">
            <a-popconfirm
              v-if="item.stock > 0 && !bookedCourseIds.has(item.id)"
              title="确定要预约该课程吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleBook(item)"
            >
              <Button type="primary" size="small">预约</Button>
            </a-popconfirm>
            <a-tooltip v-else-if="bookedCourseIds.has(item.id)" title="已预约">
              <Button type="primary" size="small" disabled>预约</Button>
            </a-tooltip>
            <a-tooltip v-else title="预约已满">
              <Button type="primary" size="small" disabled>预约</Button>
            </a-tooltip>
          </template>
          <template v-else-if="isInstructor || isAdmin">
            <Button
              type="primary"
              size="small"
              @click="handleViewDetail(item)"
            >
              查看详情
            </Button>
          </template>
          <template v-else>
            <span class="text-gray">-</span>
          </template>
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
          </Table>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import Table from '@/components/Table/index.vue'
import Form from '@/components/Form/index.vue'
import Button from '@/components/Button/index.vue'
import { courseApi } from '@/services/courses'
import { message } from 'ant-design-vue'

const userStore = useUserStore()
const loading = ref(false)
const courseList = ref([])
const detailModalVisible = ref(false)
const studentLoading = ref(false)
const currentCourse = ref(null)
// 学员已预约课程的 course.id 集合
const bookedCourseIds = ref(new Set())

const isInstructor = computed(() => {
  const role = userStore.userInfo?.role
  return role === 'instructor' || role === 'coach'
})

const isAdmin = computed(() => {
  return userStore.userInfo?.role === 'admin'
})

const isStudent = computed(() => {
  return userStore.userInfo?.role === 'student'
})

const filterForm = ref({
  date: {
    label: '日期',
    is: 'DatePicker',
    value: null,
    clearable: true
  },
  subject: {
    label: '科目',
    is: 'Select',
    value: undefined,
    options: [
      { label: '科目二', value: 'subject2' },
      { label: '科目三', value: 'subject3' }
    ],
    clearable: true
  }
})

const columns = [
  { key: 'name', title: '课程名称', width: '200px' },
  { key: 'subject', title: '科目', width: '100px' },
  { key: 'start_time', title: '开始时间', width: '180px' },
  { key: 'end_time', title: '结束时间', width: '180px' },
  { key: 'instructor_name', title: '教练', width: '120px' },
  { key: 'location', title: '地点', width: '200px' },
  { key: 'stock', title: '剩余名额', width: '120px' },
  { key: 'action', title: '操作', width: '120px' }
]

const studentColumns = [
  { key: 'user.real_name', title: '姓名', width: '120px' },
  { key: 'user.phone', title: '手机号', width: '140px' },
  { key: 'user.total_hours', title: '剩余课时', width: '120px' },
  { key: 'status', title: '状态', width: '120px' }
]

const fetchCourses = async () => {
  loading.value = true
  try {
    const params = {
      date: filterForm.value.date.value,
      subject: filterForm.value.subject.value
    }
    courseList.value = await courseApi.list(params)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchMyBookings = async () => {
  if (!isStudent.value) return
  try {
    const data = await courseApi.myAppointments()
    const list = Array.isArray(data) ? data : []
    const ids = list
      .filter(item => item.status === 'confirmed' || item.status === 'booked')
      .map(item => item.course_id)
      .filter(id => id !== undefined && id !== null)
    bookedCourseIds.value = new Set(ids)
  } catch (error) {
    console.error(error)
  }
}

const handleSearch = () => {
  fetchCourses()
}

const onFilterChange = (formData) => {
  filterForm.value = formData
}

const handleBook = async (course) => {
  try {
    await courseApi.book(course.id)
    message.success('预约成功')
    // 立刻把已预约的 course.id 加入集合，避免双击
    const next = new Set(bookedCourseIds.value)
    next.add(course.id)
    bookedCourseIds.value = next
    fetchCourses()
  } catch (error) {
    message.error(error.message || '预约失败')
  }
}

const handleViewDetail = async (course) => {
  studentLoading.value = true
  try {
    const detail = await courseApi.detail(course.id)
    // 把 bookings 数据扁平化，让自研 Table 组件能正常显示嵌套字段
    if (detail && Array.isArray(detail.bookings)) {
      detail.bookings = detail.bookings.map(booking => ({
        ...booking,
        'user.real_name': booking.user?.real_name || '',
        'user.phone': booking.user?.phone || '',
        'user.total_hours': booking.user?.total_hours ?? 0
      }))
    }
    currentCourse.value = detail
    detailModalVisible.value = true
  } catch (error) {
    message.error(error.message || '获取课程详情失败')
  } finally {
    studentLoading.value = false
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
  fetchMyBookings()
})
</script>

<style scoped>
.course-list {
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
.text-gray {
  color: #999;
}
.text-danger {
  color: #ff4d4f;
  font-weight: bold;
}
.text-warning {
  color: #faad14;
  font-weight: bold;
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
