const Session = require('../models/Session');
const crypto = require('crypto');
const mongoose = require('mongoose');

// @desc    Start a new session
// @route   POST /api/sessions/start
// @access  Teacher
const startSession = async (req, res) => {
    const { subject, section, bssid, ssid } = req.body;

    try {
        // Strict Schedule Validation
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

        // Format current time to HH:MM for comparison
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        const ClassRoutine = require('../models/ClassRoutine');

        // Find if there is a routine for this teacher, subject, day, and time
        // We need to look into the nested arrays
        const routines = await ClassRoutine.aggregate([
            { $unwind: "$timetable" },
            { $match: { "timetable.day": currentDay } },
            { $unwind: "$timetable.periods" },
            {
                $match: {
                    "timetable.periods.teacher": new mongoose.Types.ObjectId(req.user._id),
                    "timetable.periods.subject": subject
                }
            }
        ]);

        const routine = routines.find(r => {
            const period = r.timetable.periods;
            return currentTime >= period.startTime && currentTime <= period.endTime;
        });

        if (!routine) {
            return res.status(400).json({
                message: `No active class found for ${subject} at ${currentTime} on ${currentDay}`
            });
        }

        // If found, proceeding with creating session.
        // Since 'section' isn't on the routine, we trust the teacher provided one or we omit validation for it against the routine itself.
        // But we DO need to ensure we don't start duplicate sessions.

        // logic below continues...

        // End any active sessions for this teacher
        await Session.updateMany(
            { teacher: req.user._id, isActive: true },
            { isActive: false, endTime: Date.now() }
        );

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const qrCode = crypto.randomBytes(16).toString('hex');

        const session = await Session.create({
            teacher: req.user._id,
            subject,
            section,
            bssid,
            ssid,
            otp,
            qrCode,
            isActive: true,
            routineId: routine._id,
            periodNo: routine.timetable.periods.periodNo // Save period number
        });

        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    End current session
// @route   POST /api/sessions/end
// @access  Teacher
// @desc    End current session
// @route   POST /api/sessions/end
// @access  Teacher
// @desc    End current session (Archive to History)
// @route   POST /api/sessions/end
// @access  Teacher
const endSession = async (req, res) => {
    const { sessionId } = req.body;

    try {
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // 1. Calculate Stats & Identify Absentees
        const User = require('../models/User');
        const Attendance = require('../models/Attendance');
        const ClassHistory = require('../models/ClassHistory');

        // Get all students in this section (Enrollment)
        const allStudents = await User.find({
            role: 'student',
            section: session.section
            // Department check should ideally be here too, but session has teacher ID, so we trust section is unique or handled.
            // Ideally: department: req.user.department
        }).select('_id');

        // Get all present students for this session
        const presentAttendance = await Attendance.find({
            session: sessionId
        }).select('student');

        const presentStudentIds = presentAttendance.map(a => a.student.toString());
        const absentStudents = allStudents.filter(s => !presentStudentIds.includes(s._id.toString()));

        // 2. Mark Absent Students in Attendance Collection (for record keeping)
        // Check for OD
        const ODRequest = require('../models/ODRequest');
        const sessionDate = new Date(session.createdAt);

        for (const student of absentStudents) {
            // Check if student has valid approved OD
            // Check if student has valid approved OD
            const od = await ODRequest.findOne({
                student: student._id,
                status: 'Approved',
                fromDate: { $lte: sessionDate },
                toDate: { $gte: sessionDate },
                $or: [
                    { odType: 'FullDay' },
                    {
                        odType: 'Period',
                        periods: session.periodNo
                    }
                ]
            });

            if (od) {
                // Mark as Present (OD)
                await Attendance.create({
                    session: sessionId,
                    student: student._id,
                    status: 'present',
                    method: 'od',
                    verified: true
                });
                // Add to present list for history count
                presentStudentIds.push(student._id.toString());
            } else {
                // Mark as Absent
                await Attendance.create({
                    session: sessionId,
                    student: student._id,
                    status: 'absent',
                    method: 'manual',
                    verified: true
                });
            }
        }

        // Recalculate absents after OD check
        const finalAbsentCount = allStudents.length - presentStudentIds.length;

        // 3. Create ClassHistory Record (Archive)
        // reuse session._id to keep foreign keys valid
        const history = await ClassHistory.create({
            _id: session._id,
            teacher: session.teacher,
            subject: session.subject,
            section: session.section,
            otp: session.otp,
            qrCode: session.qrCode,
            startTime: session.createdAt,
            endTime: Date.now(),
            bssid: session.bssid,
            ssid: session.ssid,
            presentCount: presentStudentIds.length,
            absentCount: finalAbsentCount
        });

        // 4. Delete Active Session
        await Session.deleteOne({ _id: sessionId });

        res.json({
            message: 'Session ended and archived',
            history
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active session for teacher
// @route   GET /api/sessions/active
// @access  Teacher
const getActiveSession = async (req, res) => {
    try {
        const session = await Session.findOne({ teacher: req.user._id, isActive: true });
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { startSession, endSession, getActiveSession };
