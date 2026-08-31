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
  origin: true,
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
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'online',
    app: 'Certify - Bulk Certificate Generator & Verifier',
    database: states[dbState] || 'unknown',
    timestamp: new Date()
  });
});

// Database Connection with In-Memory MongoDB Fallback for local development
const connectDatabase = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/certify_db';

  try {
    console.log(`[Database] Connecting to MongoDB...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`[Database] Connected to MongoDB (${mongoose.connection.name}) successfully.`);
  } catch (err) {
    console.warn(`[Database] Connection to URI failed (${err.message}).`);
    
    // Only use MongoMemoryServer in local development
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Database] Launching In-Memory MongoDB server for local dev...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log(`[Database] In-Memory MongoDB running at: ${uri}`);
      } catch (memErr) {
        console.error('[Database Error] Failed to launch in-memory MongoDB:', memErr);
      }
    } else {
      console.error('[Database Error] Production database connection failed:', err);
    }
  }

  // Pre-generate default template image
  try {
    const templateImgPath = path.join(__dirname, 'uploads', 'templates', 'default_template.png');
    await createDefaultTemplateImage(templateImgPath);
  } catch (tErr) {
    console.warn('[Template Image Init]', tErr.message);
  }

  // Auto seed demo users if database is empty
  try {
    if (mongoose.connection.readyState === 1) {
      const User = require('./models/User');
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Database] Empty database detected. Running auto-seed...');
        await seedDatabase();
      }
    }
  } catch (seedErr) {
    console.error('[Auto-Seed Error]', seedErr.message);
  }
};

// Start Server AFTER connecting to DB
const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 Certify Backend API running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`=================================================`);
  });
};

startServer();
