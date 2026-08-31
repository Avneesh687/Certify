const mongoose = require('mongoose');

const generationBatchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  title: { type: String, default: 'Bulk Generation Batch' },
  fileName: { type: String },
  fileType: { type: String, enum: ['csv', 'xlsx', 'json', 'manual'], default: 'csv' },
  totalCount: { type: Number, default: 0 },
  sentCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  pendingCount: { type: Number, default: 0 },
  zipUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GenerationBatch', generationBatchSchema);
