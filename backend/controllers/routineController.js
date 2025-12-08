const ClassRoutine = require('../models/ClassRoutine');
const mongoose = require('mongoose');

// @desc    Get Teacher's Routines
// @route   GET /api/routines/teacher
// @access  Teacher
const getTeacherRoutines = async (req, res) => {
    try {
        const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        const routines = await ClassRoutine.aggregate([
            // 1. Unwind timetable to work with specific days
            { $unwind: "$timetable" },
            // 2. Filter by current day
            { $match: { "timetable.day": day } },
            // 3. Unwind periods to check individual slots
            { $unwind: "$timetable.periods" },
            // 4. Match the teacher
            {
                $match: {
                    "timetable.periods.teacher": new mongoose.Types.ObjectId(req.user._id)
                }
            },
            // 5. Project the desired structure
            {
                $project: {
                    _id: 0, // Don't return the routine ID for each period
                    dept: 1,
                    batch: 1,
                    semester: 1,
                    class: 1,
                    day: "$timetable.day",
                    period: "$timetable.periods"
                }
            }
        ]);

        // Transform to flat structure expected by frontend if needed, 
        // or just return the projected objects which contain keys: dept, batch, period info.
        // The previous frontend expected: { subject, section (now removed/mapped), startTime, endTime, etc. }

        // We map to a structure compatible with what the frontend likely expects, 
        // or a clean one. Let's return the projected data and frontend can adapt or we adapt here.
        // Previous return: { teacher, subject, section, day, startTime, endTime }

        const formattedRoutines = routines.map(r => ({
            _id: r.period._id, // if period has no _id (subdoc default), use null or omit
            teacher: r.period.teacher,
            subject: r.period.subject,
            dept: r.dept,
            batch: r.batch,
            semester: r.semester,
            day: r.day,
            startTime: r.period.startTime,
            endTime: r.period.endTime,
            periodNo: r.period.periodNo
        }));

        res.json(formattedRoutines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTeacherTimetable = async (req, res) => {
    try {
        const routines = await ClassRoutine.aggregate([
            { $unwind: "$timetable" },
            { $unwind: "$timetable.periods" },
            {
                $match: {
                    "timetable.periods.teacher": new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $project: {
                    _id: 0,
                    dept: 1,
                    batch: 1,
                    semester: 1,
                    class: 1,
                    day: "$timetable.day",
                    period: "$timetable.periods"
                }
            },
            { $sort: { day: 1, "period.startTime": 1 } } // Sort by day then time
        ]);

        const formatted = routines.map(r => ({
            teacher: r.period.teacher,
            subject: r.period.subject,
            dept: r.dept,
            batch: r.batch,
            semester: r.semester,
            day: r.day,
            startTime: r.period.startTime,
            endTime: r.period.endTime,
            periodNo: r.period.periodNo
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStudentTimetable = async (req, res) => {
    try {
        const routines = await ClassRoutine.aggregate([
            {
                $match: {
                    dept: req.user.department,
                    semester: req.user.currentSemester
                }
            },
            { $unwind: "$timetable" },
            { $unwind: "$timetable.periods" },
            {
                $lookup: {
                    from: "users",
                    localField: "timetable.periods.teacher",
                    foreignField: "_id",
                    as: "teacherDetails"
                }
            },
            { $unwind: { path: "$teacherDetails", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    subject: "$timetable.periods.subject",
                    startTime: "$timetable.periods.startTime",
                    endTime: "$timetable.periods.endTime",
                    periodNo: "$timetable.periods.periodNo",
                    teacher: {
                        name: "$teacherDetails.name"
                    },
                    day: "$timetable.day"
                }
            },
            { $sort: { day: 1, startTime: 1 } }
        ]);

        res.json(routines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getTeacherRoutines, getTeacherTimetable, getStudentTimetable };
