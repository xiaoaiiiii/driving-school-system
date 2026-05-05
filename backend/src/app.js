const express = require('express')
const cors = require('cors')
const config = require('./config')
const corsMiddleware = require('./middleware/cors')
const errorHandler = require('./middleware/errorHandler')
const DataInitializer = require('./services/dataInitializer')

const authRoutes = require('./routes/auth')
const courseRoutes = require('./routes/courses')
const appointmentRoutes = require('./routes/appointments')
const bookingRoutes = require('./routes/bookings')
const instructorRoutes = require('./routes/instructor')
const adminRoutes = require('./routes/admin')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(corsMiddleware)

app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/instructor', instructorRoutes)
app.use('/api/admin', adminRoutes)

app.get('/', (req, res) => {
  res.json({
    respCode: '00000',
    respData: {
      message: '驾校约课系统 API',
      version: '1.0.0'
    },
    respMsg: '服务正常运行'
  })
})

app.get('/api', (req, res) => {
  res.json({
    respCode: '00000',
    respData: {
      message: '驾校约课系统 API',
      version: '1.0.0'
    },
    respMsg: '服务正常运行'
  })
})

app.use(errorHandler)

app.use((req, res) => {
  res.status(404).json({
    respCode: '404',
    respData: null,
    respMsg: '接口不存在'
  })
})

// 初始化数据库并启动服务
const PORT = 3002

const startServer = async () => {
  try {
    await DataInitializer.initialize()
    app.listen(PORT, () => {
      console.log(`驾校约课系统后端服务运行在 http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('服务启动失败:', error)
    process.exit(1)
  }
}

startServer()
