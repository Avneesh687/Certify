const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiRoutes = require('./routes/apiRoutes');
const seedDatabase = require('./seed');
const { createDefaultTemplateImage } = require('./utils/pdfGenerator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploaded files (PDFs & Templates)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1', apiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Certify - Bulk Certificate Generator & Verifier',
    timestamp: new Date()
  });
});

// Database Connection with In-Memory MongoDB Fallback
const connectDatabase = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/certify_db';

  try {
    console.log(`[Database] Attempting connection to ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('[Database] Connected to MongoDB successfully.');
  } catch (err) {
    console.warn('[Database] Local MongoDB unavailable. Launching In-Memory MongoDB server...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`[Database] In-Memory MongoDB running at: ${uri}`);
    } catch (memErr) {
      console.error('[Database Error] Failed to launch in-memory MongoDB:', memErr);
    }
  }

  // Pre-generate default template image
  const templateImgPath = path.join(__dirname, 'uploads', 'templates', 'default_template.png');
  await createDefaultTemplateImage(templateImgPath);

  // Auto seed demo users if database is empty
  const User = require('./models/User');
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('[Database] Empty database detected. Running auto-seed...');
    await seedDatabase();
  }
};

// Start Server
app.listen(PORT, async () => {
  await connectDatabase();
  console.log(`=================================================`);
  console.log(`🚀 Certify Backend API running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`=================================================`);
});
