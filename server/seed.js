const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Template = require('./models/Template');
const Certificate = require('./models/Certificate');
const GenerationBatch = require('./models/GenerationBatch');
const { createDefaultTemplateImage, generatePdfCertificate } = require('./utils/pdfGenerator');
const { saveCertificatePdf } = require('./utils/storage');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/certify_db';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected to MongoDB');

    // Clean existing seed users
    await User.deleteMany({ email: { $in: ['admin@certify.com', 'user@certify.com'] } });

    // 1. Create Admin User
    const admin = new User({
      name: 'System Admin',
      email: 'admin@certify.com',
      password: 'admin123', // Automatically hashed by pre-save hook
      role: 'admin'
    });
    admin.apiKeys.push({ key: 'certify_admin_demo_key_2026', name: 'Master Admin Key' });
    await admin.save();
    console.log('[Seed] Admin user created: admin@certify.com / admin123');

    // 2. Create Regular Demo User
    const user = new User({
      name: 'Alex Johnson',
      email: 'user@certify.com',
      password: 'user123',
      role: 'user'
    });
    user.apiKeys.push({ key: 'certify_user_demo_key_2026', name: 'Developer Key' });
    await user.save();
    console.log('[Seed] Regular user created: user@certify.com / user123');

    // 3. Create Default Template & Template Background Image
    const templateImagePath = path.join(__dirname, 'uploads', 'templates', 'default_template.png');
    await createDefaultTemplateImage(templateImagePath);

    let template = await Template.findOne({ isDefault: true });
    if (!template) {
      template = new Template({
        title: 'Classic Gold & Slate',
        description: 'Standard elegant landscape certificate template with gold border accents and official seal.',
        backgroundImageUrl: '/uploads/templates/default_template.png',
        isDefault: true,
        userId: admin._id
      });
      await template.save();
      console.log('[Seed] Default certificate template created.');
    }

    // 4. Create Sample Batch & Certificates
    const batchId = `BATCH-DEMO-${Date.now().toString(36).toUpperCase()}`;
    const batch = new GenerationBatch({
      batchId,
      userId: user._id,
      templateId: template._id,
      title: 'Spring 2026 AI Developer Cohort',
      fileName: 'sample_recipients.csv',
      fileType: 'csv',
      totalCount: 3,
      sentCount: 3,
      failedCount: 0,
      pendingCount: 0
    });
    await batch.save();

    const sampleRecipients = [
      { name: 'Sarah Connor', email: 'sarah.connor@example.com', course: 'Artificial Intelligence & Neural Networks' },
      { name: 'Marcus Wright', email: 'marcus.w@example.com', course: 'Full-Stack MERN Architecture' },
      { name: 'Kyle Reese', email: 'kyle.reese@example.com', course: 'Cybersecurity & Cloud Systems' }
    ];

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    for (const [idx, recipient] of sampleRecipients.entries()) {
      const certId = `CERT-DEMO-00${idx + 1}`;
      const verificationUrl = `${frontendUrl}/verify/${certId}`;

      const pdfBuffer = await generatePdfCertificate({
        recipientName: recipient.name,
        eventName: recipient.course,
        issueDate: new Date(),
        certificateId: certId,
        issuerName: 'Certify Technical Institute',
        verificationUrl
      });

      const filename = `${certId}.pdf`;
      const storageResult = await saveCertificatePdf(filename, pdfBuffer);
      const pdfUrl = storageResult.isCloudinary
        ? storageResult.url
        : `${process.env.BACKEND_URL || 'http://localhost:5000'}${storageResult.url}`;

      const cert = new Certificate({
        certificateId: certId,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        eventName: recipient.course,
        issueDate: new Date(),
        issuerName: 'Certify Technical Institute',
        issuerEmail: user.email,
        userId: user._id,
        batchId: batch._id,
        pdfUrl,
        pdfPublicId: storageResult.publicId || null,
        qrCodeData: verificationUrl,
        emailStatus: 'sent',
        metadata: new Map([
          ['Grade', 'Distinction'],
          ['Duration', '120 Hours']
        ])
      });
      await cert.save();
    }

    console.log('[Seed] Sample batch and 3 demo certificates generated!');
    console.log('[Seed] Seeding completed successfully!');
  } catch (error) {
    console.error('[Seed Error]', error);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
