require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const ClassRoutine = require('../models/ClassRoutine');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const ClassHistory = require('../models/ClassHistory');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/classsync')
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => console.error(err));

const seedData = async () => {
    try {
        // Clear all data
        await User.deleteMany({});
        await ClassRoutine.deleteMany({});
        await Session.deleteMany({});
        await Attendance.deleteMany({});
        await ClassHistory.deleteMany({});

        console.log('Cleared existing data...');

        const departments = ['CSE', 'ECE', 'MECH'];
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Time slots (6 slots)
        const timeSlots = [
            { start: '09:00', end: '10:00' },
            { start: '10:00', end: '11:00' },
            { start: '11:00', end: '12:00' },
            { start: '13:00', end: '14:00' },
            { start: '14:00', end: '15:00' },
            { start: '15:00', end: '16:00' }
        ];

        // --- Create Users ---
        console.log('Creating Users...');

        const teachersByDept = {};
        const studentsByDept = {};

        for (const dept of departments) {
            teachersByDept[dept] = [];
            studentsByDept[dept] = [];

            // Create 2 Teachers per Dept
            for (let i = 1; i <= 2; i++) {
                const teacher = await User.create({
                    name: `Teacher ${dept} ${i}`,
                    email: `teacher${i}.${dept.toLowerCase()}@test.com`,
                    password: '111',
                    role: 'teacher',
                    department: dept,
                    // Make first CSE teacher an advisor
                    isAdvisor: (dept === 'CSE' && i === 1),
                    advisorBatch: (dept === 'CSE' && i === 1) ? '2022-2026' : undefined,
                    advisorDept: (dept === 'CSE' && i === 1) ? 'CSE' : undefined
                });
                teachersByDept[dept].push(teacher);
            }

            // Create 2 Students per Dept
            for (let i = 1; i <= 2; i++) {
                const student = await User.create({
                    name: `Student ${dept} ${i}`,
                    email: `student${i}.${dept.toLowerCase()}@test.com`,
                    password: '111',
                    role: 'student',
                    rollNumber: `${dept}10${i}`,
                    department: dept,
                    section: 'A',
                    currentSemester: 3,
                    batch: '2022-2026' // Assuming current 3rd sem is this batch
                });
                studentsByDept[dept].push(student);
            }
        }

        // --- Create Routines (Nested Structure) ---
        console.log('Creating Nested Class Routines...');

        const deptSubjects = {
            'CSE': ['Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems', 'Computer Networks', 'Software Engineering'],
            'ECE': ['Circuit Theory', 'Digital Logic', 'Signals & Systems', 'Microprocessors', 'Analog Electronics', 'Control Systems'],
            'MECH': ['Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Machine Design', 'Manufacturing Tech', 'Heat Transfer']
        };

        for (const dept of departments) {
            const deptTeachers = teachersByDept[dept];
            const subjects = deptSubjects[dept];

            const timetable = [];

            for (const day of days) {
                const periods = [];
                // strict ordered slots 0 to 5
                for (let slot = 0; slot < 6; slot++) {
                    // Alternate teachers: Slots 0,2,4 -> Teacher 1; Slots 1,3,5 -> Teacher 2
                    const teacherIndex = slot % 2;
                    const teacher = deptTeachers[teacherIndex];

                    periods.push({
                        periodNo: slot + 1,
                        startTime: timeSlots[slot].start,
                        endTime: timeSlots[slot].end,
                        subject: subjects[slot],
                        teacher: teacher._id
                    });
                }
                timetable.push({ day, periods });
            }

            await ClassRoutine.create({
                dept,
                batch: '2022-2026',
                semester: 3,
                class: 2,
                timetable
            });
        }

        console.log('Class Routines Created!');

        // --- Create Historical Data (Past 7 Days) ---
        console.log('Creating Historical Data...');

        const cseTeacher = teachersByDept['CSE'][0];
        const cseStudent = studentsByDept['CSE'][0];
        const cseSubjects = deptSubjects['CSE'];

        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

            if (dayName === 'Sunday') continue; // Skip Sunday

            // Create 6 sessions per day
            for (let slot = 0; slot < 6; slot++) {
                const startTime = new Date(date);
                const [sh, sm] = timeSlots[slot].start.split(':');
                startTime.setHours(parseInt(sh), parseInt(sm), 0);

                const endTime = new Date(date);
                const [eh, em] = timeSlots[slot].end.split(':');
                endTime.setHours(parseInt(eh), parseInt(em), 0);

                // Create Session (Inactive)
                const session = await Session.create({
                    teacher: cseTeacher._id,
                    subject: cseSubjects[slot],
                    section: 'A',
                    periodNo: slot + 1,
                    startTime: startTime,
                    endTime: endTime,
                    isActive: false
                });

                // Determine Attendance Status (Randomly absent)
                const isPresent = Math.random() > 0.2; // 80% attendance
                const status = isPresent ? 'present' : 'absent';

                // Create Attendance
                if (status === 'present') {
                    await Attendance.create({
                        session: session._id,
                        student: cseStudent._id,
                        status: 'present',
                        method: 'manual',
                        verified: true,
                        timestamp: startTime
                    });
                } else {
                    await Attendance.create({
                        session: session._id,
                        student: cseStudent._id,
                        status: 'absent',
                        method: 'manual',
                        verified: false,
                        timestamp: startTime
                    });
                }

                // Create ClassHistory
                await ClassHistory.create({
                    _id: session._id,
                    teacher: cseTeacher._id,
                    subject: cseSubjects[slot],
                    section: 'A',
                    semester: 3, // Current Sem
                    startTime: startTime,
                    endTime: endTime,
                    presentCount: isPresent ? 1 : 0,
                    absentCount: isPresent ? 0 : 1
                });
            }
        }

        // --- Create Past Semester Data (Sem 1 & 2) ---
        console.log('Creating Past Semester Data...');
        const pastSems = [1, 2];
        for (const sem of pastSems) {
            // Simulate ~50 classes per semester summary
            for (let i = 0; i < 50; i++) {
                const isPresent = Math.random() > (sem === 1 ? 0.3 : 0.1); // Sem 1: 70%, Sem 2: 90%

                // Create a "Dummy" session ID for aggregation
                const dummySessionId = new mongoose.Types.ObjectId();
                const sessionDate = new Date();
                sessionDate.setMonth(sessionDate.getMonth() - ((3 - sem) * 6)); // Back in time

                await Attendance.create({
                    session: dummySessionId,
                    student: cseStudent._id,
                    status: isPresent ? 'present' : 'absent',
                    method: 'manual',
                    verified: true,
                    timestamp: sessionDate
                });

                // Create ClassHistory for aggregation
                await ClassHistory.create({
                    _id: dummySessionId,
                    teacher: cseTeacher._id,
                    subject: cseSubjects[i % 6],
                    section: 'A',
                    semester: sem,
                    startTime: sessionDate,
                    endTime: sessionDate,
                    presentCount: 1,
                    absentCount: 0
                });
            }
        }

        console.log('Historical Data Seeding Complete!');
        console.log('Seeding Complete!');
        console.log('Credentials:');
        console.log('  Teacher (ECE): teacher1.ece@test.com / 111');
        console.log('  Student (CSE): student1.cse@test.com / 111');

        process.exit();

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedData();
