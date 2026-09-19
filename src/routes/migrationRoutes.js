const express = require('express');
const router = express.Router();
const {
  startMigration,
  getStatus,
  getLogs,
  retryMigration,
} = require('../controllers/migrationController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.post('/start', protect, adminOnly, startMigration);
router.get('/status', getStatus);
router.get('/logs', protect, adminOnly, getLogs);
router.post('/retry', protect, adminOnly, retryMigration);

module.exports = router;
