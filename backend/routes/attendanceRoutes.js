const express = require('express');
const router = express.Router();
const {
    verifyWifi,
    markAttendance,
    getSessionAttendance,
    getStudentHistory,
    getStudentDashboard,
    getStudentStats,
    getTeacherReports,
    getFilteredReports
} = require('../controllers/attendanceController');
const { protect, teacherOnly } = require('../middlewares/authMiddleware');

router.post('/verify-wifi', protect, verifyWifi);
router.post('/mark', protect, markAttendance);
router.get('/session/:sessionId', protect, teacherOnly, getSessionAttendance);
router.get('/reports', protect, teacherOnly, getTeacherReports);
router.get('/reports/filter', protect, teacherOnly, getFilteredReports); // New Route
router.get('/student', protect, getStudentHistory);
router.get('/dashboard', protect, getStudentDashboard);
router.get('/stats', protect, getStudentStats);

module.exports = router;
