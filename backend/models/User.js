const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], required: true },

    // Student specific
    rollNumber: { type: String },
    macAddress: { type: String }, // Bound MAC address
    department: { type: String },
    section: { type: String },
    currentSemester: { type: Number, default: 1 },
    batch: { type: String }, // e.g. "2022-2026"

    // Teacher specific
    isAdvisor: { type: Boolean, default: false },
    advisorBatch: { type: String }, // e.g. "2022-2026"
    advisorDept: { type: String }, // e.g. "CSE"
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
