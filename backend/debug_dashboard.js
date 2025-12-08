const mongoose = require('mongoose');
const ClassRoutine = require('./models/ClassRoutine');
const Session = require('./models/Session');
const Attendance = require('./models/Attendance');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/classsync')
    .then(async () => {
        console.log('Connected.');

        // Find Student
        const student = await User.findOne({ role: 'student', department: 'CSE' });
        if (!student) {
            console.log('No CSE Student found');
            process.exit();
        }
        console.log(`Student: ${student.name}, Dept: ${student.department}, Sem: ${student.currentSemester}`);

        // Check Routines
        const routines = await ClassRoutine.find({
            dept: student.department,
            semester: student.currentSemester
        });
        console.log(`Found ${routines.length} routine(s) for this student.`);

        routines.forEach((r, i) => {
            console.log(`Routine ${i}: Batch ${r.batch}, Timetable Days: ${r.timetable.length}`);
            r.timetable.forEach(d => {
                console.log(`  Day: ${d.day}, Periods: ${d.periods.length}`);
                const subjects = d.periods.map(p => p.subject);
                const unique = new Set(subjects);
                if (unique.size !== subjects.length) {
                    console.log(`    WARNING: Duplicate subjects found on ${d.day}:`, subjects);
                } else {
                    console.log(`    Subjects: ${subjects.join(', ')}`);
                }
            });
        });

        // Check Attendance Stats
        const stats = await Attendance.aggregate([
            { $match: { student: student._id } },
            {
                $lookup: {
                    from: 'classhistories',
                    localField: 'session',
                    foreignField: '_id',
                    as: 'classDetails'
                }
            },
            { $unwind: '$classDetails' },
            {
                $group: {
                    _id: '$classDetails.subject',
                    count: { $sum: 1 }
                }
            }
        ]);
        console.log('Attendance Stats Grouping:', stats);

        process.exit();
    })
    .catch(err => console.error(err));
