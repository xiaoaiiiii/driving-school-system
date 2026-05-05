const User = require('./User.model')
const Course = require('./Course.model')
const Booking = require('./Booking.model')

User.hasMany(Course, {
  foreignKey: 'coach_id',
  as: 'coachedCourses'
})

Course.belongsTo(User, {
  foreignKey: 'coach_id',
  as: 'coach'
})

User.hasMany(Booking, {
  foreignKey: 'user_id',
  as: 'bookings'
})

Booking.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
})

Course.hasMany(Booking, {
  foreignKey: 'course_id',
  as: 'bookings'
})

Booking.belongsTo(Course, {
  foreignKey: 'course_id',
  as: 'course'
})

module.exports = {
  User,
  Course,
  Booking
}
