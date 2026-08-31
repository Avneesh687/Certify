const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: { type: String, required: true, unique: true, index: true },
  recipientName: { type: String, required: true, trim: true },
  recipientEmail: { type: String, required: true, trim: true },
  eventName: { type: String, required: true, trim: true },
  issueDate: { type: Date, default: Date.now },
  issuerName: { type: String, default: 'Certify Academy' },
  issuerEmail: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'GenerationBatch' },
  pdfUrl: { type: String, required: true },
  pdfPublicId: { type: String },
  qrCodeData: { type: String },
  status: { type: String, enum: ['valid', 'revoked'], default: 'valid' },
  emailStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  emailErrorMessage: { type: String },
  metadata: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Certificate', certificateSchema);
