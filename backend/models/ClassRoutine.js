const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
    periodNo: { type: Number, min: 1, max: 6, required: true },
    startTime: { type: String, required: true }, // e.g., "09:00"
    endTime: { type: String, required: true },   // e.g., "09:50"
    subject: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { _id: false });

const dayScheduleSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        required: true
    },
    periods: {
        type: [periodSchema],
        validate: [arrayLimit, '{PATH} exceeds the limit of 6']
    }
}, { _id: false });

function arrayLimit(val) {
    return val.length <= 6;
}

const classRoutineSchema = new mongoose.Schema({
    dept: { type: String, required: true, examples: ["CSE", "ECE", "EEE"] },
    batch: { type: String, required: true, examples: ["2021-2025", "2022-2026"] },
    semester: { type: Number, min: 1, max: 8, required: true },
    class: { type: Number, min: 1, max: 4, description: "Year of study" },
    timetable: {
        type: [dayScheduleSchema],
        validate: [timetableLimit, '{PATH} must have exactly 6 days']
    }
}, { timestamps: true });

function timetableLimit(val) {
    return val.length === 6;
}

module.exports = mongoose.model('ClassRoutine', classRoutineSchema);
