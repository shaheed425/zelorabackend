const mongoose = require('mongoose');

const migrationLogSchema = new mongoose.Schema(
  {
    sourceUrl: { type: String, required: true },
    productName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'skipped'],
      default: 'pending',
    },
    imagesFound: { type: Number, default: 0 },
    imagesImported: { type: Number, default: 0 },
    error: { type: String, default: '' },
    details: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MigrationLog', migrationLogSchema);
