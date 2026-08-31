const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');
const fs = require('fs');

/**
 * Generate high-resolution PDF Certificate using pure vector pdf-lib
 * 100% pure JavaScript - No native C++/Cairo dependencies required.
 * Ultra-fast and 100% reliable across Windows, Linux, Render, Docker & Serverless.
 */
const generatePdfCertificate = async ({
  recipientName = 'Jane Doe',
  eventName = 'Certified Program',
  issueDate = new Date(),
  certificateId = 'CERT-DEMO',
  issuerName = 'Certify Academy',
  verificationUrl = '',
  templatePath = null
}) => {
  const pdfDoc = await PDFDocument.create();

  // Standard Landscape A4 dimensions in points (841.89 x 595.28)
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Embed Fonts
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  let customImageDrawn = false;

  // 1. Try loading custom background image if provided and exists
  if (templatePath && typeof templatePath === 'string' && fs.existsSync(templatePath)) {
    try {
      const imgBuffer = fs.readFileSync(templatePath);
      let embeddedImg;
      try {
        embeddedImg = await pdfDoc.embedPng(imgBuffer);
      } catch (e) {
        embeddedImg = await pdfDoc.embedJpg(imgBuffer);
      }
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight
      });
      customImageDrawn = true;
    } catch (err) {
      console.warn('[PDF Generator] Could not embed custom template image, rendering vector theme:', err.message);
    }
  }

  // 2. If no custom image, render native elegant Vector Certificate Frame
  if (!customImageDrawn) {
    // Soft Elegant Ivory Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(0.99, 0.98, 0.97) // #fdfcf7
    });

    // Inner White Card Area
    page.drawRectangle({
      x: 20,
      y: 20,
      width: pageWidth - 40,
      height: pageHeight - 40,
      color: rgb(1, 1, 1) // #ffffff
    });

    // Outer Navy Border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: pageWidth - 40,
      height: pageHeight - 40,
      borderColor: rgb(0.06, 0.09, 0.16), // #0f172a
      borderWidth: 6
    });

    // Inner Gold Accent Border
    page.drawRectangle({
      x: 32,
      y: 32,
      width: pageWidth - 64,
      height: pageHeight - 64,
      borderColor: rgb(0.85, 0.55, 0.08), // Gold #d97706
      borderWidth: 2
    });

    // Thin Slate Perimeter Line
    page.drawRectangle({
      x: 38,
      y: 38,
      width: pageWidth - 76,
      height: pageHeight - 76,
      borderColor: rgb(0.88, 0.91, 0.94),
      borderWidth: 1
    });

    // Top Header Ribbon Banner
    page.drawRectangle({
      x: pageWidth / 2 - 200,
      y: pageHeight - 46,
      width: 400,
      height: 6,
      color: rgb(0.06, 0.09, 0.16)
    });
    page.drawRectangle({
      x: pageWidth / 2 - 140,
      y: pageHeight - 52,
      width: 280,
      height: 3,
      color: rgb(0.85, 0.55, 0.08)
    });

    // Certificate Title
    const title = 'CERTIFICATE OF ACHIEVEMENT';
    const titleFontSize = 28;
    const titleWidth = fontTimesBold.widthOfTextAtSize(title, titleFontSize);
    page.drawText(title, {
      x: (pageWidth - titleWidth) / 2,
      y: pageHeight - 110,
      size: titleFontSize,
      font: fontTimesBold,
      color: rgb(0.06, 0.09, 0.16)
    });

    // Sub-title Ribbon
    const subtitle = 'PROUDLY PRESENTED TO';
    const subtitleFontSize = 12;
    const subtitleWidth = fontTimesItalic.widthOfTextAtSize(subtitle, subtitleFontSize);
    page.drawText(subtitle, {
      x: (pageWidth - subtitleWidth) / 2,
      y: pageHeight - 145,
      size: subtitleFontSize,
      font: fontTimesItalic,
      color: rgb(0.4, 0.45, 0.55)
    });

    // Completion Description
    const completionText = 'FOR SUCCESSFULLY COMPLETING THE REQUIREMENTS AND CURRICULUM OF';
    const completionFontSize = 10;
    const compWidth = fontHelvetica.widthOfTextAtSize(completionText, completionFontSize);
    page.drawText(completionText, {
      x: (pageWidth - compWidth) / 2,
      y: 290,
      size: completionFontSize,
      font: fontHelvetica,
      color: rgb(0.4, 0.45, 0.55)
    });

    // Left Signature Line (Date)
    page.drawLine({
      start: { x: 70, y: 120 },
      end: { x: 260, y: 120 },
      thickness: 1.5,
      color: rgb(0.8, 0.85, 0.9)
    });
    page.drawText('DATE OF ISSUANCE', {
      x: 115,
      y: 102,
      size: 9,
      font: fontHelveticaBold,
      color: rgb(0.45, 0.5, 0.6)
    });

    // Center Gold Seal Emblem
    page.drawCircle({
      x: pageWidth / 2,
      y: 125,
      size: 36,
      color: rgb(0.98, 0.93, 0.8),
      borderColor: rgb(0.85, 0.55, 0.08),
      borderWidth: 2
    });
    page.drawCircle({
      x: pageWidth / 2,
      y: 125,
      size: 30,
      borderColor: rgb(0.85, 0.55, 0.08),
      borderWidth: 1
    });
    const sealText = 'OFFICIAL';
    const sealText2 = 'VERIFIED';
    const s1Width = fontHelveticaBold.widthOfTextAtSize(sealText, 8);
    const s2Width = fontHelveticaBold.widthOfTextAtSize(sealText2, 8);
    page.drawText(sealText, {
      x: pageWidth / 2 - s1Width / 2,
      y: 128,
      size: 8,
      font: fontHelveticaBold,
      color: rgb(0.7, 0.4, 0.05)
    });
    page.drawText(sealText2, {
      x: pageWidth / 2 - s2Width / 2,
      y: 116,
      size: 8,
      font: fontHelveticaBold,
      color: rgb(0.7, 0.4, 0.05)
    });

    // Right Signature Line (Authorized Issuer)
    page.drawLine({
      start: { x: pageWidth - 260, y: 120 },
      end: { x: pageWidth - 70, y: 120 },
      thickness: 1.5,
      color: rgb(0.8, 0.85, 0.9)
    });
    page.drawText('AUTHORIZED SIGNATURE', {
      x: pageWidth - 220,
      y: 102,
      size: 9,
      font: fontHelveticaBold,
      color: rgb(0.45, 0.5, 0.6)
    });
  }

  // Draw Recipient Name (Centered)
  const nameText = recipientName || 'Recipient Name';
  const nameFontSize = 32;
  const nameWidth = fontTimesBold.widthOfTextAtSize(nameText, nameFontSize);
  page.drawText(nameText, {
    x: (pageWidth - nameWidth) / 2,
    y: 350,
    size: nameFontSize,
    font: fontTimesBold,
    color: rgb(0.06, 0.09, 0.16)
  });

  // Name Underline Accent
  page.drawLine({
    start: { x: (pageWidth - nameWidth) / 2 - 20, y: 340 },
    end: { x: (pageWidth + nameWidth) / 2 + 20, y: 340 },
    thickness: 1.5,
    color: rgb(0.85, 0.55, 0.08)
  });

  // Draw Event / Course Name (Centered)
  const eventText = eventName || 'Mastering Web Development';
  const eventFontSize = 20;
  const eventWidth = fontHelveticaBold.widthOfTextAtSize(eventText, eventFontSize);
  page.drawText(eventText, {
    x: (pageWidth - eventWidth) / 2,
    y: 250,
    size: eventFontSize,
    font: fontHelveticaBold,
    color: rgb(0.85, 0.45, 0.02) // Gold/Amber #d97706
  });

  // Format Date String
  const formattedDate = issueDate
    ? new Date(issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Draw Date (Left Side)
  const dateWidth = fontHelvetica.widthOfTextAtSize(formattedDate, 12);
  page.drawText(formattedDate, {
    x: 165 - dateWidth / 2,
    y: 130,
    size: 12,
    font: fontHelvetica,
    color: rgb(0.12, 0.16, 0.23)
  });

  // Draw Issuer Name (Right Side)
  const safeIssuer = issuerName || 'Certify Academy';
  const issuerWidth = fontHelveticaBold.widthOfTextAtSize(safeIssuer, 12);
  page.drawText(safeIssuer, {
    x: pageWidth - 165 - issuerWidth / 2,
    y: 130,
    size: 12,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.16, 0.23)
  });

  // Draw Unique Certificate ID at bottom-left corner
  const certIdText = `Certificate ID: ${certificateId}`;
  page.drawText(certIdText, {
    x: 45,
    y: 46,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.45, 0.5, 0.6)
  });

  // Generate & Embed QR Code (Bottom-Right Corner)
  if (verificationUrl) {
    try {
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        margin: 1,
        width: 150,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
      const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      const embeddedQrImage = await pdfDoc.embedPng(qrImageBytes);

      const qrSize = 65;
      page.drawImage(embeddedQrImage, {
        x: pageWidth - 105,
        y: 42,
        width: qrSize,
        height: qrSize
      });

      page.drawText('Scan to Verify', {
        x: pageWidth - 105,
        y: 32,
        size: 8,
        font: fontHelvetica,
        color: rgb(0.45, 0.5, 0.6)
      });
    } catch (qrErr) {
      console.warn('[PDF Generator] QR generation warning:', qrErr.message);
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

const createDefaultTemplateImage = async () => {
  return Buffer.from([]);
};

module.exports = {
  generatePdfCertificate,
  createDefaultTemplateImage
};
