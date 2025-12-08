const mongoose = require('mongoose');
const User = require('../models/User');
const ClassRoutine = require('../models/ClassRoutine');
require('dotenv').config();

const addTestData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const dept = 'CIVIL';
        const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });

        // 1. Create Teacher
        const teacher = await User.create({
            name: 'Civil Teacher',
            email: 'teacher.civil@test.com',
            password: '111',
            role: 'teacher',
            department: dept
        });
        console.log('Teacher Created:', teacher.email);

        // 2. Create Student
        const student = await User.create({
            name: 'Civil Student',
            email: 'student.civil@test.com',
            password: '111',
            role: 'student',
            rollNumber: 'CIVIL101',
            department: dept,
            section: 'A',
            currentSemester: 1
        });
        console.log('Student Created:', student.email);

        // 3. Create Class Routine for TODAY, NOW
        const now = new Date();
        const startHour = now.getHours();
        const startMin = now.getMinutes();

        // Format time as HH:MM
        const startTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
        const endTime = `${String(startHour + 1).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;

        const routine = await ClassRoutine.create({
            teacher: teacher._id,
            subject: 'Structural Engineering',
            section: 'A',
            day: dayName,
            startTime, // Starts NOW
            endTime
        });
        console.log(`Class Routine Created: ${routine.subject} (${dayName} ${startTime}-${endTime})`);

        console.log('DONE. You can now login.');
        process.exit();

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

addTestData();
