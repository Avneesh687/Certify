const mongoose = require('mongoose');

const placeholderSchema = new mongoose.Schema({
  key: { type: String, required: true }, // e.g. 'recipientName', 'eventName', 'issueDate', 'certificateId'
  label: { type: String, required: true }, // e.g. 'Recipient Name'
  x: { type: Number, required: true }, // X coordinate on canvas (points)
  y: { type: Number, required: true }, // Y coordinate on canvas (points)
  fontSize: { type: Number, default: 24 },
  fontColor: { type: String, default: '#1e293b' }, // Hex color
  align: { type: String, enum: ['left', 'center', 'right'], default: 'center' }
});

const templateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  backgroundImageUrl: { type: String, required: true },
  imagePublicId: { type: String },
  dimensions: {
    width: { type: Number, default: 842 }, // Landscape A4 standard
    height: { type: Number, default: 595 }
  },
  placeholders: [placeholderSchema],
  qrCodePlacement: {
    x: { type: Number, default: 720 },
    y: { type: Number, default: 50 },
    size: { type: Number, default: 80 },
    enabled: { type: Boolean, default: true }
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', templateSchema);
