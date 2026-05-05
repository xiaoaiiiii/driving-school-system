import { AUTH_SRV } from './request'

export const authApi = {
  login: (data) => AUTH_SRV.post('/login', data),
  register: (data) => AUTH_SRV.post('/register', data),
  logout: () => AUTH_SRV.post('/logout'),
  getUserInfo: () => AUTH_SRV.get('/userInfo')
}

export default authApi
