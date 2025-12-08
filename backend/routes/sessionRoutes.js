const express = require('express');
const router = express.Router();
const { startSession, endSession, getActiveSession } = require('../controllers/sessionController');
const { protect, teacherOnly } = require('../middlewares/authMiddleware');

router.post('/start', protect, teacherOnly, startSession);
router.post('/end', protect, teacherOnly, endSession);
router.get('/active', protect, teacherOnly, getActiveSession);

module.exports = router;
