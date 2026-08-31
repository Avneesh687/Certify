const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const Certificate = require('../models/Certificate');
const { generatePdfCertificate } = require('../utils/pdfGenerator');

/**
 * Public Verification Endpoint
 * GET /api/verify/:certificateId
 */
exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const cert = await Certificate.findOne({ certificateId: certificateId.trim() });

    if (!cert) {
      return res.status(404).json({
        success: false,
        isAuthentic: false,
        message: 'No record found matching this Certificate ID. The certificate may be invalid or forged.'
      });
    }

    if (cert.status === 'revoked') {
      return res.json({
        success: true,
        isAuthentic: false,
        message: 'This certificate has been revoked by the issuing organization.',
        certificate: {
          certificateId: cert.certificateId,
          recipientName: cert.recipientName,
          eventName: cert.eventName,
          issueDate: cert.issueDate,
          issuerName: cert.issuerName,
          status: cert.status
        }
      });
    }

    res.json({
      success: true,
      isAuthentic: true,
      message: 'Certificate is authentic and verified.',
      certificate: {
        certificateId: cert.certificateId,
        recipientName: cert.recipientName,
        recipientEmail: cert.recipientEmail,
        eventName: cert.eventName,
        issueDate: cert.issueDate,
        issuerName: cert.issuerName,
        status: cert.status,
        pdfUrl: cert.pdfUrl,
        viewUrl: `/api/verify/${cert.certificateId}/view`,
        qrCodeData: cert.qrCodeData,
        metadata: cert.metadata
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Stream Certificate PDF Inline (for iframes, browsers, and preview modals)
 * GET /api/verify/:certificateId/view
 */
exports.viewCertificatePdf = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = await Certificate.findOne({ certificateId: certificateId.trim() });

    if (!cert) {
      return res.status(404).send('Certificate not found.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Certificate_${cert.certificateId}.pdf"`);

    // 1. Check local disk fallback
    const localFilePath = path.join(__dirname, '..', 'uploads', 'certificates', `${cert.certificateId}.pdf`);
    if (fs.existsSync(localFilePath)) {
      return fs.createReadStream(localFilePath).pipe(res);
    }

    // 2. Fetch stream from Cloudinary
    if (cert.pdfUrl && cert.pdfUrl.startsWith('http')) {
      const client = cert.pdfUrl.startsWith('https') ? https : http;
      return client.get(cert.pdfUrl, (cloudRes) => {
        if (cloudRes.statusCode === 200) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="Certificate_${cert.certificateId}.pdf"`);
          return cloudRes.pipe(res);
        }

        // 3. Fallback: Regenerate PDF on-the-fly in real-time
        generatePdfCertificate({
          recipientName: cert.recipientName,
          eventName: cert.eventName,
          issueDate: cert.issueDate,
          certificateId: cert.certificateId,
          issuerName: cert.issuerName,
          verificationUrl: cert.qrCodeData
        }).then(buffer => res.send(buffer)).catch(err => res.status(500).send(err.message));
      }).on('error', async () => {
        const buffer = await generatePdfCertificate({
          recipientName: cert.recipientName,
          eventName: cert.eventName,
          issueDate: cert.issueDate,
          certificateId: cert.certificateId,
          issuerName: cert.issuerName,
          verificationUrl: cert.qrCodeData
        });
        res.send(buffer);
      });
    }

    // 4. Fallback: Regenerate PDF on-the-fly
    const buffer = await generatePdfCertificate({
      recipientName: cert.recipientName,
      eventName: cert.eventName,
      issueDate: cert.issueDate,
      certificateId: cert.certificateId,
      issuerName: cert.issuerName,
      verificationUrl: cert.qrCodeData
    });
    res.send(buffer);
  } catch (error) {
    res.status(500).send(`Failed to stream certificate: ${error.message}`);
  }
};

/**
 * Download Certificate PDF
 * GET /api/verify/:certificateId/download
 */
exports.downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = await Certificate.findOne({ certificateId: certificateId.trim() });

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Certificate_${cert.certificateId}.pdf"`);

    const filePath = path.join(__dirname, '..', 'uploads', 'certificates', `${cert.certificateId}.pdf`);
    if (fs.existsSync(filePath)) {
      return fs.createReadStream(filePath).pipe(res);
    }

    if (cert.pdfUrl && cert.pdfUrl.startsWith('http')) {
      const client = cert.pdfUrl.startsWith('https') ? https : http;
      return client.get(cert.pdfUrl, (cloudRes) => {
        if (cloudRes.statusCode === 200) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="Certificate_${cert.certificateId}.pdf"`);
          return cloudRes.pipe(res);
        }
        res.redirect(cert.pdfUrl);
      }).on('error', () => {
        res.redirect(cert.pdfUrl);
      });
    }

    res.redirect(cert.pdfUrl);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
