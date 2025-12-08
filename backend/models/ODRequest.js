const mongoose = require('mongoose');

const odRequestSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true },
    odType: { type: String, enum: ['FullDay', 'Period'], default: 'FullDay' },
    periods: [{ type: Number }], // [1, 2, 3] etc.
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // De-normalized for faster querying by Advisor
    studentName: { type: String },
    studentRoll: { type: String },
    dept: { type: String },
    batch: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ODRequest', odRequestSchema);
