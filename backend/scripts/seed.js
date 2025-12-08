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
                    department: dept
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

            // Create a routine for the "current" semester batch (e.g., Sem 3)
            // Batch 2022-2026, Sem 3, Year 2

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

        // --- Create History Not Implemented for new complex schema in this seed run because it requires unrolling the nested structure ---
        // Leaving it empty for now to focus on the Schema Update success.

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
