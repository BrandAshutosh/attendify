const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const formatDate = require('../utils/dateFormattter');

const attendanceSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    clientId: { type: Number },
    userId: { type: Number, required: true, ref: 'userCollection' },
    date: { type: String },
    loginTime: { type: Date },
    logoutTime: { type: Date },
    loginLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String }
    },
    logoutLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String }
    },
    loginImageUrl: { type: String },
    logoutImageUrl: { type: String },
    loginDeviceInfo: {
      deviceId: { type: String },
      os: { type: String },
      browser: { type: String },
      ip: { type: String }
    },
    logoutDeviceInfo: {
      deviceId: { type: String },
      os: { type: String },
      browser: { type: String },
      ip: { type: String }
    },
    faceVerification: {
      loginVerified: { type: Boolean, default: false },
      logoutVerified: { type: Boolean, default: false },
      loginConfidence: { type: Number },
      logoutConfidence: { type: Number },
      failedReason: { type: String }
    },
    isLate: { type: Boolean, default: false },
    isEarlyLogout: { type: Boolean, default: false },
    isOnLeave: { type: Boolean, default: false },
    isHoliday: { type: Boolean, default: false },
    isWorkingDay: { type: Boolean, default: true },
    totalHours: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    flags: {type:String},
    notes: { type: String },
    createdBy: { type: String },
    updatedBy: { type: String },
    creatorIp: { type: String },
    updatorIp: { type: String },
  },
  { timestamps: true }
);

attendanceSchema.plugin(AutoIncrement, { id: 'attendance_id_seq', inc_field: '_id' });

attendanceSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    ret.createdAt = ret.createdAt ? formatDate(ret.createdAt) : '';
    ret.updatedAt = ret.updatedAt ? formatDate(ret.updatedAt) : '';
    return ret;
  }
});

const Attendance = mongoose.model('attendanceCollection', attendanceSchema);
module.exports = Attendance;