const express = require('express');
const router = express.Router();
const { applyOD, getAdvisorRequests, updateODStatus, getMyODRequests } = require('../controllers/odController');
const { protect, teacherOnly } = require('../middlewares/authMiddleware');

router.post('/apply', protect, applyOD);
router.get('/my', protect, getMyODRequests);
router.get('/advisor', protect, teacherOnly, getAdvisorRequests);
router.put('/:id', protect, teacherOnly, updateODStatus);

module.exports = router;
