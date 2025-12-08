const ODRequest = require('../models/ODRequest');
const User = require('../models/User');

// @desc    Apply for OD
// @route   POST /api/od/apply
// @access  Student
const applyOD = async (req, res) => {
    const { fromDate, toDate, reason, odType, periods } = req.body;

    try {
        const student = await User.findById(req.user._id);

        const od = await ODRequest.create({
            student: req.user._id,
            fromDate,
            toDate,
            reason,
            odType,
            periods,
            studentName: student.name,
            studentRoll: student.rollNumber,
            dept: student.department,
            batch: student.batch // user model might need batch if not present, checking later
        });

        res.status(201).json(od);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get OD Requests for Advisor
// @route   GET /api/od/advisor
// @access  Teacher (Advisor)
const getAdvisorRequests = async (req, res) => {
    try {
        if (!req.user.isAdvisor) {
            return res.status(403).json({ message: 'Not an advisor' });
        }

        const requests = await ODRequest.find({
            dept: req.user.advisorDept,
            // You might want to filter by batch too if student has batch
            // checking User model again... 
            // seed.js adds 'batch' to Student. ensure User.js has it or flexible.
            status: 'Pending'
        }).sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update OD Status
// @route   PUT /api/od/:id
// @access  Teacher (Advisor)
const updateODStatus = async (req, res) => {
    const { status } = req.body; // 'Approved' or 'Rejected'

    try {
        if (!req.user.isAdvisor) {
            return res.status(403).json({ message: 'Not an advisor' });
        }

        const od = await ODRequest.findById(req.params.id);
        if (!od) {
            return res.status(404).json({ message: 'Request not found' });
        }

        od.status = status;
        od.approvedBy = req.user._id;
        await od.save();

        res.json(od);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Student OD History
// @route   GET /api/od/my
// @access  Student
const getMyODRequests = async (req, res) => {
    try {
        const requests = await ODRequest.find({ student: req.user._id })
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { applyOD, getAdvisorRequests, updateODStatus, getMyODRequests };
