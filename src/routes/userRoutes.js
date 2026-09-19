const express = require('express');
const router = express.Router();
const { getUsers, toggleUserStatus } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', protect, adminOnly, getUsers);
router.put('/:id/status', protect, adminOnly, toggleUserStatus);

module.exports = router;
