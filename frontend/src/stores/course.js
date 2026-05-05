import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCourseStore = defineStore('course', () => {
  const courseList = ref([])
  const myAppointments = ref([])
  const currentCourse = ref(null)

  const setCourseList = (list) => {
    courseList.value = list
  }

  const setMyAppointments = (list) => {
    myAppointments.value = list
  }

  const setCurrentCourse = (course) => {
    currentCourse.value = course
  }

  const addAppointment = (appointment) => {
    myAppointments.value.unshift(appointment)
  }

  const removeAppointment = (id) => {
    const index = myAppointments.value.findIndex(item => item.id === id)
    if (index > -1) {
      myAppointments.value.splice(index, 1)
    }
  }

  return {
    courseList,
    myAppointments,
    currentCourse,
    setCourseList,
    setMyAppointments,
    setCurrentCourse,
    addAppointment,
    removeAppointment
  }
})
