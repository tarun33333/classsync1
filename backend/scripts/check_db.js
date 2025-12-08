require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const ClassRoutine = require('../models/ClassRoutine');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const ClassHistory = require('../models/ClassHistory');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/classsync')
    .then(async () => {
        console.log('--- Database Status ---');
        console.log('Users:', await User.countDocuments());
        console.log('ClassRoutines:', await ClassRoutine.countDocuments());
        console.log('Sessions (Active):', await Session.countDocuments());
        console.log('ClassHistories (Archived):', await ClassHistory.countDocuments());
        console.log('Attendances:', await Attendance.countDocuments());
        console.log('-----------------------');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
