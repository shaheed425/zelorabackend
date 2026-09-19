const migrationService = require('../services/migrationService');
const MigrationLog = require('../models/MigrationLog');

// @desc    Start catalogue migration (Admin)
// @route   POST /api/migration/start
const startMigration = async (req, res, next) => {
  try {
    const { downloadImages = true } = req.body;
    const result = await migrationService.startCatalogueMigration({ downloadImages });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(202).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current migration status
// @route   GET /api/migration/status
const getStatus = async (req, res, next) => {
  try {
    const status = migrationService.getMigrationStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

// @desc    Get migration logs
// @route   GET /api/migration/logs
const getLogs = async (req, res, next) => {
  try {
    const logs = await MigrationLog.find().sort({ timestamp: -1 }).limit(100);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

// @desc    Retry failed migration (Admin)
// @route   POST /api/migration/retry
const retryMigration = async (req, res, next) => {
  try {
    const result = await migrationService.startCatalogueMigration({ downloadImages: true });
    res.status(202).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startMigration,
  getStatus,
  getLogs,
  retryMigration,
};
