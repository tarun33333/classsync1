const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const User = require('./models/User');
const Session = require('./models/Session');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/classsync')
    .then(async () => {
        console.log('Connected to DB');

        const student = await User.findOne({ role: 'student', department: 'CSE' });
        if (!student) { console.log('No student found'); process.exit(); }

        console.log(`Checking duplicates for ${student.name} (${student._id})`);

        const allAttendance = await Attendance.find({ student: student._id }).sort({ timestamp: -1 });
        console.log(`Total Records: ${allAttendance.length}`);

        const sessionCounts = {};
        allAttendance.forEach(a => {
            const sid = a.session.toString();
            sessionCounts[sid] = (sessionCounts[sid] || 0) + 1;
        });

        let duplicates = 0;
        for (const [sid, count] of Object.entries(sessionCounts)) {
            if (count > 1) {
                console.log(`Duplicate Session ID: ${sid} has ${count} records`);
                duplicates++;
            }
        }

        if (duplicates === 0) {
            console.log('No duplicates found in database.');
            console.log('Sample Records:');
            allAttendance.slice(0, 5).forEach(a => console.log(` - Session: ${a.session}, Time: ${a.timestamp}`));
        } else {
            console.log(`Found ${duplicates} duplicate sessions.`);
        }

        process.exit();
    })
    .catch(err => { console.error(err); process.exit(1); });
