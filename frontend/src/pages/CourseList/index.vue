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
          <template v-if="!isInstructor">
            <a-popconfirm
              v-if="item.stock > 0"
              title="确定要预约该课程吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleBook(item)"
            >
              <Button type="primary" size="small">预约</Button>
            </a-popconfirm>
            <a-tooltip v-else title="预约已满">
              <Button type="primary" size="small" disabled>预约</Button>
            </a-tooltip>
          </template>
          <template v-else>
            <span class="text-gray">-</span>
          </template>
        </template>
      </Table>
    </div>
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

const isInstructor = computed(() => {
  return userStore.userInfo?.role === 'instructor'
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
  { key: 'action', title: '操作', width: '100px' }
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
    fetchCourses()
  } catch (error) {
    message.error(error.message || '预约失败')
  }
}

onMounted(() => {
  fetchCourses()
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
</style>
