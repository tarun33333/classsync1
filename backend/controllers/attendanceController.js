const Attendance = require('../models/Attendance');
const Session = require('../models/Session');

// @desc    Verify WiFi and check eligibility
// @route   POST /api/attendance/verify-wifi
// @access  Student
const verifyWifi = async (req, res) => {
    const { sessionId, bssid } = req.body;

    try {
        const session = await Session.findById(sessionId);
        if (!session || !session.isActive) {
            return res.status(400).json({ message: 'Session is not active' });
        }

        // Check if already marked
        const existing = await Attendance.findOne({ session: sessionId, student: req.user._id });
        if (existing) {
            return res.status(400).json({ message: 'Attendance already marked' });
        }

        // Verify BSSID
        // In production, BSSID matching should be strict. 
        // For testing/simulators, we might relax this or check if BSSID is provided.
        // Strict BSSID Check (Bypass Removed)
        // Network Check Logic
        // 1. Wildcard: If Teacher is on Emulator (0.0.0.0), accept all.
        if (session.bssid && session.bssid !== '0.0.0.0') {

            // 2. Subnet Check (for Real Devices)
            // Extract "192.168.1" from "192.168.1.5"
            const getSubnet = (ip) => ip.includes('.') ? ip.split('.').slice(0, 3).join('.') : ip;

            const sessionSubnet = getSubnet(session.bssid);
            const studentSubnet = getSubnet(bssid);

            if (sessionSubnet !== studentSubnet) {
                return res.status(400).json({
                    message: `Please connect to the same WiFi as the Teacher.\n(Room: ${sessionSubnet}.x, You: ${studentSubnet}.x)`
                });
            }
        }

        res.json({ message: 'WiFi verified', sessionId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit OTP/QR for Attendance
// @route   POST /api/attendance/mark
// @access  Student
const markAttendance = async (req, res) => {
    const { sessionId, code, method } = req.body; // code can be OTP or QR token

    try {
        const session = await Session.findById(sessionId);
        if (!session || !session.isActive) {
            return res.status(400).json({ message: 'Session is not active' });
        }

        // STICT VALIDATION: Check Department and Section
        // Assumes req.user is populated with department and section
        // Depending on your User model, ensure these fields exist.
        // req.user is usually fetched by the 'protect' middleware.
        // We need to fetch the FULL user if protect middleware only has basic info, 
        // but typically protect middleware attaches the full user doc.

        // Let's verify req.user has these fields.
        // If the session has specific department/section, the student MUST match.
        // Note: 'department' on session is usually implied by the routine or teacher, 
        // but Session model schema needs to be checked. 
        // Based on seed.js, Session has subject/section/teacher but NOT explicitly department?
        // Wait, seed.js does NOT add department to Session.
        // It adds 'subject', 'section', 'teacher'.
        // Teacher has 'department'.
        // We can infer Session department from Teacher's department.

        // We need to populate teacher to check department.
        await session.populate('teacher');

        if (req.user.department !== session.teacher.department) {
            return res.status(403).json({ message: `You belong to ${req.user.department}, this class is for ${session.teacher.department}.` });
        }

        if (session.section && req.user.section !== session.section) {
            return res.status(403).json({ message: `You are in Section ${req.user.section}, this class is for Section ${session.section}.` });
        }

        // Verify Code
        if (method === 'otp') {
            if (session.otp !== code) {
                return res.status(400).json({ message: 'Invalid OTP' });
            }
        } else if (method === 'qr') {
            if (session.qrCode !== code) {
                return res.status(400).json({ message: 'Invalid QR Code' });
            }
        } else {
            return res.status(400).json({ message: 'Invalid method' });
        }

        // Check duplicate
        const existing = await Attendance.findOne({ session: sessionId, student: req.user._id });
        if (existing) {
            return res.status(400).json({ message: 'Attendance already marked' });
        }

        const attendance = await Attendance.create({
            session: sessionId,
            student: req.user._id,
            status: 'present',
            method,
            deviceMac: req.user.macAddress // Log the MAC used
        });

        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Live Attendance for Session (Full Class List)
// @route   GET /api/attendance/session/:sessionId
// @access  Teacher
const getSessionAttendance = async (req, res) => {
    try {
        const ClassHistory = require('../models/ClassHistory'); // Import History model

        // 1. Try finding in Active Sessions
        let session = await Session.findById(req.params.sessionId).populate('teacher');

        // 2. If not active, try ClassHistory (Archived)
        if (!session) {
            session = await ClassHistory.findById(req.params.sessionId).populate('teacher');
        }

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // 1. Fetch all students who SHOULD be in this class
        const User = require('../models/User'); // Import User model inside to ensure availability
        const enrolledStudents = await User.find({
            role: 'student',
            department: session.teacher.department,
            section: session.section
        }).select('name rollNumber');

        // 2. Fetch existing attendance records
        const attendanceRecords = await Attendance.find({ session: session._id });

        // 3. Merge Lists
        const fullReport = enrolledStudents.map(student => {
            const record = attendanceRecords.find(ar => ar.student.toString() === student._id.toString());

            return {
                student: {
                    name: student.name,
                    rollNumber: student.rollNumber,
                    _id: student._id
                },
                status: record ? record.status : 'absent', // Default to absent if no record
                method: record ? record.method : null,
                createdAt: record ? record.createdAt : null
            };
        });

        res.json(fullReport);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Student History
// @route   GET /api/attendance/student
// @access  Student
// @desc    Get Student History (Active + Archived)
// @route   GET /api/attendance/student
// @access  Student
const getStudentHistory = async (req, res) => {
    try {
        const Session = require('../models/Session');
        const ClassHistory = require('../models/ClassHistory');

        // 1. Fetch Attendance Records (without populate first)
        const attendance = await Attendance.find({ student: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        // 2. Collect Session IDs
        const sessionIds = attendance.map(a => a.session);

        // 3. Fetch from Active Sessions
        const activeSessions = await Session.find({ _id: { $in: sessionIds } }).select('subject startTime endTime');

        // 4. Fetch from Class History
        const archivedSessions = await ClassHistory.find({ _id: { $in: sessionIds } }).select('subject startTime endTime');

        // 5. Create Lookup Map
        const sessionMap = {};
        activeSessions.forEach(s => sessionMap[s._id.toString()] = s);
        archivedSessions.forEach(s => sessionMap[s._id.toString()] = s);

        // 6. Attach Session Data
        const historyWithDetails = attendance.map(record => {
            const sessionData = sessionMap[record.session.toString()];
            return {
                ...record,
                session: sessionData || { subject: 'Unknown Session', startTime: record.createdAt, endTime: record.createdAt }
            };
        });

        res.json(historyWithDetails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get Student Dashboard (Today's Periods)
// @route   GET /api/attendance/dashboard
// @access  Student
const getStudentDashboard = async (req, res) => {
    try {
        // 1. Get current day in IST
        const day = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });

        // 2. Fetch seeded routines for this student's dept & semester using Aggregation
        const ClassRoutine = require('../models/ClassRoutine');
        const relevantRoutines = await ClassRoutine.aggregate([
            {
                $match: {
                    dept: req.user.department,
                    semester: req.user.currentSemester
                }
            },
            { $unwind: "$timetable" },
            { $match: { "timetable.day": day } },
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
                    teacher: {
                        name: "$teacherDetails.name",
                        department: "$teacherDetails.department"
                    },
                    day: "$timetable.day"
                }
            },
            { $sort: { startTime: 1 } }
        ]);

        // 3. Fetch ANY active sessions for this student's section (Real-time check)
        const activeSessions = await Session.find({
            section: req.user.section,
            isActive: true
        }).populate('teacher', 'name');

        // 4. Build Dashboard Data
        // Start with scheduled routines
        let dashboardData = await Promise.all(relevantRoutines.map(async (routine) => {
            // Check if this routine is currently active
            const activeSession = activeSessions.find(s => s.subject === routine.subject);

            let status = 'upcoming';
            let sessionId = null;
            let teacherName = routine.teacher ? routine.teacher.name : 'Unknown';

            if (activeSession) {
                status = 'ongoing';
                sessionId = activeSession._id;
                teacherName = activeSession.teacher ? activeSession.teacher.name : teacherName;

                // Check attendance
                const attendance = await Attendance.findOne({ session: activeSession._id, student: req.user._id });
                if (attendance) status = 'present';
            }

            return {
                subject: routine.subject,
                day: routine.day,
                startTime: routine.startTime,
                endTime: routine.endTime,
                status,
                sessionId,
                teacherName
            };
        }));

        // 5. Inject Ad-hoc Active Sessions (Classes not in routine but running)
        for (const session of activeSessions) {
            const isAlreadyListed = dashboardData.some(d => d.subject === session.subject && d.status !== 'upcoming');

            if (!isAlreadyListed) {
                // Check if user already marked attendance for this ad-hoc session
                let status = 'ongoing';
                const attendance = await Attendance.findOne({ session: session._id, student: req.user._id });
                if (attendance) status = 'present';

                dashboardData.unshift({ // Add to top
                    subject: session.subject,
                    day: day,
                    startTime: 'Live', // Special indicator
                    endTime: 'Now',
                    status,
                    sessionId: session._id,
                    teacherName: session.teacher ? session.teacher.name : 'Unknown'
                });
            }
        }

        res.json(dashboardData);
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Student Stats (for Summary)
// @route   GET /api/attendance/stats
// @access  Student
const getStudentStats = async (req, res) => {
    try {
        const ClassHistory = require('../models/ClassHistory'); // Ensure model is loaded
        const currentSem = req.user.currentSemester || 1;
        const selectedSem = parseInt(req.query.semester) || currentSem;

        // 1. Calculate Overall History (Graph Data)
        // We need to join Attendance -> ClassHistory to get the semester of each attended class
        const graphAgg = await Attendance.aggregate([
            { $match: { student: req.user._id } },
            {
                $lookup: {
                    from: 'classhistories', // Collection name for ClassHistory
                    localField: 'session',
                    foreignField: '_id',
                    as: 'classDetails'
                }
            },
            { $unwind: '$classDetails' },
            {
                $group: {
                    _id: '$classDetails.semester',
                    present: {
                        $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
                    },
                    total: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const graphData = graphAgg.map(g => ({
            semester: g._id,
            percentage: Math.round((g.present / g.total) * 100)
        }));

        // 2. Detailed Stats for Selected Semester (Pie Chart)
        const statsAgg = await Attendance.aggregate([
            { $match: { student: req.user._id, status: 'present' } },
            {
                $lookup: {
                    from: 'classhistories',
                    localField: 'session',
                    foreignField: '_id',
                    as: 'classDetails'
                }
            },
            { $unwind: '$classDetails' },
            { $match: { 'classDetails.semester': selectedSem } },
            {
                $group: {
                    _id: '$classDetails.subject',
                    presentCount: { $sum: 1 }
                }
            }
        ]);

        res.json({
            stats: statsAgg,
            graphData,
            currentSemester: currentSem,
            selectedSemester: selectedSem
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Teacher Reports (Past Sessions)
// @route   GET /api/attendance/reports
// @access  Teacher
// @desc    Get Teacher Reports (Past Sessions from History)
// @route   GET /api/attendance/reports
// @access  Teacher
const getTeacherReports = async (req, res) => {
    try {
        const ClassHistory = require('../models/ClassHistory');
        const history = await ClassHistory.find({ teacher: req.user._id })
            .sort({ endTime: -1 })
            .limit(10);

        const reports = history.map(h => ({
            sessionId: h._id,
            subject: h.subject,
            section: h.section,
            date: h.startTime,
            presentCount: h.presentCount,
            absentCount: h.absentCount
        }));

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Reports filtered by Date (from History)
// @route   GET /api/attendance/reports/filter
// @access  Teacher
const getFilteredReports = async (req, res) => {
    const { date } = req.query;
    try {
        const ClassHistory = require('../models/ClassHistory');

        // Create date range for the selected day
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        // Find HISTORY for this teacher on this day
        // Note: We use startTime to filter, as that's when class happened.
        const history = await ClassHistory.find({
            teacher: req.user._id,
            startTime: { $gte: start, $lte: end }
        }).sort({ startTime: 1 });

        const reports = history.map(h => ({
            sessionId: h._id,
            subject: h.subject,
            section: h.section,
            date: h.startTime, // Use startTime as the date
            isActive: false, // History is always inactive
            presentCount: h.presentCount,
            absentCount: h.absentCount
        }));

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { verifyWifi, markAttendance, getSessionAttendance, getStudentHistory, getStudentDashboard, getStudentStats, getTeacherReports, getFilteredReports };
