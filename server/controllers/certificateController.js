const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Certificate = require('../models/Certificate');
const GenerationBatch = require('../models/GenerationBatch');
const Template = require('../models/Template');
const { parseFile } = require('../utils/fileParser');
const { generatePdfCertificate } = require('../utils/pdfGenerator');
const { sendCertificateEmail } = require('../utils/mailer');
const { saveCertificatePdf, deleteCertificatePdf } = require('../utils/storage');

const getBaseUrl = (req) => {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  return `${protocol}://${host}`;
};

const getFrontendUrl = (req) => {
  return process.env.FRONTEND_URL || req.get('origin') || `${req.protocol}://${req.get('host')}`;
};

// 1. Parse CSV/Excel file in-memory and return rows & detected headers
exports.parseUploadedFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV or Excel file.' });
    }

    const originalName = req.file.originalname;
    const fileBuffer = req.file.buffer;

    const rows = await parseFile(fileBuffer, originalName);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded file is empty or invalid.' });
    }

    const headers = Object.keys(rows[0]);

    res.json({
      success: true,
      fileName: originalName,
      totalRows: rows.length,
      headers: headers,
      previewRows: rows.slice(0, 5),
      allRows: rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `File parsing failed: ${error.message}` });
  }
};

// 2. Generate PDF Certificate Preview
exports.previewCertificate = async (req, res) => {
  try {
    const {
      recipientName = 'Jane Doe',
      eventName = 'Full-Stack Web Development Bootcamp',
      issueDate = new Date(),
      issuerName = 'Certify Academy',
      templateId
    } = req.body;

    const dummyCertId = `PREVIEW-${Math.floor(1000 + Math.random() * 9000)}`;
    const verificationUrl = `${getFrontendUrl(req)}/#/verify/${dummyCertId}`;

    let templatePath = null;
    if (templateId) {
      const template = await Template.findById(templateId);
      if (template && template.backgroundImageUrl) {
        templatePath = template.backgroundImageUrl.startsWith('http')
          ? template.backgroundImageUrl
          : path.join(__dirname, '..', template.backgroundImageUrl);
      }
    }

    const pdfBuffer = await generatePdfCertificate({
      recipientName,
      eventName,
      issueDate,
      certificateId: dummyCertId,
      issuerName,
      verificationUrl,
      templatePath
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="certificate_preview.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: `Preview failed: ${error.message}` });
  }
};

// 3. Bulk Certificate Generation & Automated Email Dispatch
exports.bulkGenerateCertificates = async (req, res) => {
  try {
    const {
      recipients, // Array of objects
      nameKey = 'Name',
      emailKey = 'Email',
      eventKey = 'Course',
      dateKey = 'Date',
      issuerName = 'Certify Academy',
      batchTitle = 'Bulk Generation Batch',
      sendEmails = true,
      templateId
    } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'No recipient data provided.' });
    }

    const batchId = `BATCH-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const batch = new GenerationBatch({
      batchId,
      userId: req.user._id,
      title: batchTitle,
      totalCount: recipients.length,
      pendingCount: recipients.length
    });

    await batch.save();

    let templatePath = null;
    if (templateId) {
      const template = await Template.findById(templateId);
      if (template && template.backgroundImageUrl) {
        templatePath = template.backgroundImageUrl.startsWith('http')
          ? template.backgroundImageUrl
          : path.join(__dirname, '..', template.backgroundImageUrl);
        batch.templateId = template._id;
      }
    }

    const generatedCertificates = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const row of recipients) {
      const name = row[nameKey] || row['Name'] || row['recipientName'] || row['recipient_name'] || 'Recipient';
      const email = row[emailKey] || row['Email'] || row['email'] || row['recipientEmail'];
      const event = row[eventKey] || row['Course'] || row['Event'] || row['eventName'] || 'Certification Program';
      const rawDate = row[dateKey] || row['Date'] || row['issueDate'] || new Date();

      if (!email) {
        failedCount++;
        continue;
      }

      // Generate Unique Certificate ID
      const certificateId = `CERT-${Date.now().toString(36).toUpperCase()}-${uuidv4().substring(0, 5).toUpperCase()}`;
      const verificationUrl = `${getFrontendUrl(req)}/#/verify/${certificateId}`;

      // Generate PDF in Memory
      const pdfBuffer = await generatePdfCertificate({
        recipientName: name,
        eventName: event,
        issueDate: rawDate,
        certificateId,
        issuerName,
        verificationUrl,
        templatePath
      });

      // Save PDF to Cloudinary (or local fallback)
      const filename = `${certificateId}.pdf`;
      const storageResult = await saveCertificatePdf(filename, pdfBuffer);
      const pdfUrl = storageResult.isCloudinary ? storageResult.url : `${getBaseUrl(req)}${storageResult.url}`;

      // Email Dispatch
      let emailStatus = 'pending';
      let emailErrorMessage = null;

      if (sendEmails) {
        const mailResult = await sendCertificateEmail({
          recipientEmail: email,
          recipientName: name,
          eventName: event,
          certificateId,
          verificationUrl,
          pdfBuffer
        });

        if (mailResult.success) {
          emailStatus = 'sent';
          sentCount++;
        } else {
          emailStatus = 'failed';
          emailErrorMessage = mailResult.error;
          failedCount++;
        }
      }

      // Safe Date parsing
      let parsedDate = new Date(rawDate);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }

      // Sanitize metadata
      const cleanMetadata = new Map();
      if (row && typeof row === 'object') {
        for (const [k, v] of Object.entries(row)) {
          if (v !== undefined && v !== null) {
            cleanMetadata.set(String(k).replace(/\$/g, '_').replace(/\./g, '_'), String(v));
          }
        }
      }

      // Record Certificate in Database with Cloudinary Public ID
      const cert = new Certificate({
        certificateId,
        recipientName: name,
        recipientEmail: email,
        eventName: event,
        issueDate: parsedDate,
        issuerName,
        issuerEmail: req.user.email,
        userId: req.user._id,
        batchId: batch._id,
        pdfUrl,
        pdfPublicId: storageResult.publicId || null,
        qrCodeData: verificationUrl,
        emailStatus,
        emailErrorMessage,
        metadata: cleanMetadata
      });

      await cert.save();
      generatedCertificates.push(cert);
    }

    // Update batch stats
    batch.sentCount = sentCount;
    batch.failedCount = failedCount;
    batch.pendingCount = Math.max(0, recipients.length - (sentCount + failedCount));
    await batch.save();

    res.status(201).json({
      success: true,
      message: `Successfully generated ${generatedCertificates.length} certificates!`,
      batch,
      summary: {
        total: recipients.length,
        sent: sentCount,
        failed: failedCount
      },
      certificates: generatedCertificates
    });
  } catch (error) {
    console.error('[Bulk Generation Error]:', error);
    res.status(500).json({ success: false, message: `Bulk generation failed: ${error.message}` });
  }
};

// 4. Get User's Certificates with filters & search
exports.getCertificates = async (req, res) => {
  try {
    const { search, status, emailStatus, page = 1, limit = 20 } = req.query;

    const query = { userId: req.user._id };

    if (status) query.status = status;
    if (emailStatus) query.emailStatus = emailStatus;

    if (search) {
      query.$or = [
        { recipientName: { $regex: search, $options: 'i' } },
        { recipientEmail: { $regex: search, $options: 'i' } },
        { certificateId: { $regex: search, $options: 'i' } },
        { eventName: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Certificate.countDocuments(query);
    const certificates = await Certificate.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      certificates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Certificate by Certificate ID
exports.getCertificateById = async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }
    res.json({ success: true, certificate: cert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get User's Generation Batches
exports.getUserBatches = async (req, res) => {
  try {
    const batches = await GenerationBatch.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Delete Certificate (Deletes from Cloudinary and MongoDB)
exports.deleteCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const query = { certificateId };
    
    // Non-admin can only delete their own certificate
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const cert = await Certificate.findOne(query);
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found or unauthorized.' });
    }

    // 1. Delete PDF from Cloudinary / Local Storage
    await deleteCertificatePdf(cert.pdfPublicId, cert.pdfUrl);

    // 2. Delete Certificate Record from MongoDB
    await Certificate.deleteOne({ _id: cert._id });

    // 3. Update Generation Batch count if applicable
    if (cert.batchId) {
      await GenerationBatch.findByIdAndUpdate(cert.batchId, {
        $inc: { 
          totalCount: -1, 
          sentCount: cert.emailStatus === 'sent' ? -1 : 0,
          failedCount: cert.emailStatus === 'failed' ? -1 : 0
        }
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: `Certificate ${certificateId} and its cloud PDF file were successfully deleted.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `Delete failed: ${error.message}` });
  }
};

// 8. Bulk Delete Certificates (Deletes from Cloudinary and MongoDB)
exports.bulkDeleteCertificates = async (req, res) => {
  try {
    const { certificateIds } = req.body;
    if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No certificate IDs provided.' });
    }

    const query = {
      certificateId: { $in: certificateIds }
    };

    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const certs = await Certificate.find(query);

    for (const cert of certs) {
      await deleteCertificatePdf(cert.pdfPublicId, cert.pdfUrl);
      await Certificate.deleteOne({ _id: cert._id });
    }

    res.json({
      success: true,
      message: `Successfully deleted ${certs.length} certificates and their PDF storage.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Resend Certificate Email
exports.resendEmail = async (req, res) => {
  try {
    const cert = await Certificate.findOne({
      certificateId: req.params.certificateId,
      userId: req.user._id
    });

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found or unauthorized.' });
    }

    const verificationUrl = cert.qrCodeData || `${getFrontendUrl(req)}/verify/${cert.certificateId}`;

    // Regenerate on-the-fly or attach buffer
    const pdfBuffer = await generatePdfCertificate({
      recipientName: cert.recipientName,
      eventName: cert.eventName,
      issueDate: cert.issueDate,
      certificateId: cert.certificateId,
      issuerName: cert.issuerName,
      verificationUrl
    });

    const mailResult = await sendCertificateEmail({
      recipientEmail: cert.recipientEmail,
      recipientName: cert.recipientName,
      eventName: cert.eventName,
      certificateId: cert.certificateId,
      verificationUrl,
      pdfBuffer
    });

    if (mailResult.success) {
      cert.emailStatus = 'sent';
      cert.emailErrorMessage = null;
      await cert.save();

      res.json({ success: true, message: `Email resent to ${cert.recipientEmail}` });
    } else {
      cert.emailStatus = 'failed';
      cert.emailErrorMessage = mailResult.error;
      await cert.save();

      res.status(500).json({ success: false, message: `Failed to send email: ${mailResult.error}` });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
