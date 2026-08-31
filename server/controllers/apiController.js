const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Certificate = require('../models/Certificate');
const GenerationBatch = require('../models/GenerationBatch');
const { generatePdfCertificate } = require('../utils/pdfGenerator');
const { sendCertificateEmail } = require('../utils/mailer');
const { saveCertificatePdf } = require('../utils/storage');

const getBaseUrl = (req) => {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  return `${protocol}://${host}`;
};

const getFrontendUrl = (req) => {
  return process.env.FRONTEND_URL || req.get('origin') || `${req.protocol}://${req.get('host')}`;
};

/**
 * Programmatic REST API to issue a single certificate via API key
 * POST /api/v1/certificates/issue
 */
exports.issueCertificate = async (req, res) => {
  try {
    const {
      recipientName,
      recipientEmail,
      eventName,
      issueDate = new Date(),
      issuerName = 'Certify Organization',
      sendEmail = true
    } = req.body;

    if (!recipientName || !recipientEmail || !eventName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: recipientName, recipientEmail, eventName'
      });
    }

    const certificateId = `CERT-${Date.now().toString(36).toUpperCase()}-${uuidv4().substring(0, 5).toUpperCase()}`;
    const verificationUrl = `${getFrontendUrl(req)}/verify/${certificateId}`;

    // Generate PDF
    const pdfBuffer = await generatePdfCertificate({
      recipientName,
      eventName,
      issueDate,
      certificateId,
      issuerName,
      verificationUrl
    });

    const filename = `${certificateId}.pdf`;
    const storageResult = await saveCertificatePdf(filename, pdfBuffer);
    const pdfUrl = `${getBaseUrl(req)}${storageResult.url}`;

    let emailStatus = 'pending';
    let emailErrorMessage = null;

    if (sendEmail) {
      const mailResult = await sendCertificateEmail({
        recipientEmail,
        recipientName,
        eventName,
        certificateId,
        verificationUrl,
        pdfBuffer
      });

      if (mailResult.success) {
        emailStatus = 'sent';
      } else {
        emailStatus = 'failed';
        emailErrorMessage = mailResult.error;
      }
    }

    const cert = new Certificate({
      certificateId,
      recipientName,
      recipientEmail,
      eventName,
      issueDate: new Date(issueDate),
      issuerName,
      issuerEmail: req.user.email,
      userId: req.user._id,
      pdfUrl,
      qrCodeData: verificationUrl,
      emailStatus,
      emailErrorMessage
    });

    await cert.save();

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully via API',
      certificate: {
        certificateId: cert.certificateId,
        recipientName: cert.recipientName,
        recipientEmail: cert.recipientEmail,
        eventName: cert.eventName,
        issueDate: cert.issueDate,
        pdfUrl: cert.pdfUrl,
        verificationUrl: cert.qrCodeData,
        emailStatus: cert.emailStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
