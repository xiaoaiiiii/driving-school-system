import { COURSE_SRV, APPOINT_SRV } from './request'

export const courseApi = {
  list: (params) => COURSE_SRV.get('/list', { params }),
  detail: (id) => COURSE_SRV.get(`/detail/${id}`),
  book: (courseId) => APPOINT_SRV.post('/book', { courseId }),
  myAppointments: (params) => APPOINT_SRV.get('/my', { params }),
  cancel: (id) => APPOINT_SRV.post(`/cancel/${id}`)
}

export default courseApi
