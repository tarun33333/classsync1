const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['present', 'absent'], default: 'present' },
    method: { type: String, enum: ['wifi', 'otp', 'qr', 'manual'], required: true },
    verified: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now },
    deviceMac: { type: String } // MAC used for this attendance
}, { timestamps: true });

// Prevent duplicate attendance for same session
attendanceSchema.index({ session: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
