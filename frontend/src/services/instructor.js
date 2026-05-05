import { APPOINT_SRV, COURSE_SRV } from './request'

export const instructorApi = {
  // 获取教练的预约列表
  getMyAppointments: (params) => COURSE_SRV.get('/instructor/appointments', { params }),

  // 签到
  checkIn: (id) => APPOINT_SRV.post(`/check-in/${id}`),

  // 标记缺席
  markAbsent: (id, data) => APPOINT_SRV.post(`/mark-absent/${id}`, data)
}

export default instructorApi
