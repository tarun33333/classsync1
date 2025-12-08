const mongoose = require('mongoose');

const classHistorySchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId, // Explicitly reuse Session ID
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    section: {
        type: String, // e.g., 'A', 'B'
        required: true
    },
    semester: {
        type: Number,
        required: true,
        default: 1
    },
    otp: {
        type: String
    },
    qrCode: {
        type: String
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date, // When the session ended
        default: Date.now
    },
    bssid: String,
    ssid: String,
    // Cached stats for quicker reporting
    presentCount: {
        type: Number,
        default: 0
    },
    absentCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ClassHistory', classHistorySchema);
