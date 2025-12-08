const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    section: { type: String }, // Optional, can derive from Routine
    periodNo: { type: Number }, // 1-6
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    isActive: { type: Boolean, default: true },

    // Security
    otp: { type: String }, // 4 digit OTP
    qrCode: { type: String }, // Token for QR
    bssid: { type: String }, // Teacher's WiFi BSSID
    ssid: { type: String }, // Teacher's WiFi SSID
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
