const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra') || require('fs');
const path = require('path');

/**
 * Generate a default certificate background image using Node Canvas
 * Width: 1200px, Height: 850px (High resolution landscape)
 */
const createDefaultTemplateImage = async (outputPath) => {
  const width = 1200;
  const height = 850;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background gradient (soft cream to crisp white)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#fdfbf7');
  bgGrad.addColorStop(0.5, '#ffffff');
  bgGrad.addColorStop(1, '#f8fafc');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer Decorative Dark Blue & Gold Borders
  ctx.strokeStyle = '#0f172a'; // Deep Navy
  ctx.lineWidth = 14;
  ctx.strokeRect(25, 25, width - 50, height - 50);

  ctx.strokeStyle = '#d97706'; // Gold
  ctx.lineWidth = 4;
  ctx.strokeRect(38, 38, width - 76, height - 76);

  ctx.strokeStyle = '#94a3b8'; // Slate accent
  ctx.lineWidth = 1;
  ctx.strokeRect(46, 46, width - 92, height - 92);

  // Decorative Corner Ornaments
  const corners = [
    [55, 55],
    [width - 55, 55],
    [width - 55, height - 55],
    [55, height - 55]
  ];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#d97706';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Top Header Banner Ribbon
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(width / 2 - 250, 48, 500, 8);
  ctx.fillStyle = '#d97706';
  ctx.fillRect(width / 2 - 180, 56, 360, 3);

  // Main Certificate Headers
  ctx.textAlign = 'center';

  // Title: CERTIFICATE OF ACHIEVEMENT
  ctx.font = 'bold 42px "Times New Roman", serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', width / 2, 125);

  ctx.font = 'italic 18px "Georgia", serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('PROUDLY PRESENTED TO', width / 2, 175);

  // Placeholder Line for Recipient Name
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 275);
  ctx.lineTo(width - 200, 275);
  ctx.stroke();

  // Completion Subtitle
  ctx.font = '18px "Georgia", serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('FOR SUCCESSFULLY COMPLETING THE REQUIREMENTS OF', width / 2, 340);

  // Placeholder Line for Event/Course
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(250, 430);
  ctx.lineTo(width - 250, 430);
  ctx.stroke();

  // Seal / Stamp Graphic (Center Bottom)
  const sealX = width / 2;
  const sealY = 620;

  // Gold Starburst/Circle Seal
  ctx.beginPath();
  ctx.arc(sealX, sealY, 48, 0, Math.PI * 2);
  ctx.fillStyle = '#d97706';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fef3c7';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(sealX, sealY, 40, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('OFFICIAL', sealX, sealY - 4);
  ctx.fillText('SEAL', sealX, sealY + 12);

  // Left & Right Signature Lines
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;

  // Left Signature Line (Date)
  ctx.beginPath();
  ctx.moveTo(120, 680);
  ctx.lineTo(360, 680);
  ctx.stroke();
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Date of Issue', 240, 705);

  // Right Signature Line (Authorized Issuer)
  ctx.beginPath();
  ctx.moveTo(width - 360, 680);
  ctx.lineTo(width - 120, 680);
  ctx.stroke();
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Authorized Signature', width - 240, 705);

  // Save Canvas Buffer to File
  const buffer = canvas.toBuffer('image/png');
  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);
  }
  return buffer;
};

/**
 * Generate PDF Certificate buffer using pdf-lib
 */
const generatePdfCertificate = async ({
  recipientName,
  eventName,
  issueDate,
  certificateId,
  issuerName = 'Certify Organization',
  verificationUrl,
  templatePath
}) => {
  const pdfDoc = await PDFDocument.create();
  
  // Standard Landscape A4 dimensions in points (841.89 x 595.28)
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Load Background Image
  let bgImageBuffer;
  if (templatePath && fs.existsSync(templatePath)) {
    bgImageBuffer = fs.readFileSync(templatePath);
  } else {
    // Generate default template image on the fly
    bgImageBuffer = await createDefaultTemplateImage();
  }

  let embeddedBgImage;
  try {
    embeddedBgImage = await pdfDoc.embedPng(bgImageBuffer);
  } catch (err) {
    embeddedBgImage = await pdfDoc.embedJpg(bgImageBuffer);
  }

  // Draw background image full page
  page.drawImage(embeddedBgImage, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight
  });

  // Embed Fonts
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  // Draw Recipient Name (Centered)
  const nameText = recipientName || 'Jane Doe';
  const nameFontSize = 32;
  const nameWidth = fontTimesBold.widthOfTextAtSize(nameText, nameFontSize);
  page.drawText(nameText, {
    x: (pageWidth - nameWidth) / 2,
    y: 410,
    size: nameFontSize,
    font: fontTimesBold,
    color: rgb(0.06, 0.09, 0.16) // #0f172a
  });

  // Draw Event / Course Name (Centered)
  const eventText = eventName || 'Mastering Web Development';
  const eventFontSize = 22;
  const eventWidth = fontHelveticaBold.widthOfTextAtSize(eventText, eventFontSize);
  page.drawText(eventText, {
    x: (pageWidth - eventWidth) / 2,
    y: 300,
    size: eventFontSize,
    font: fontHelveticaBold,
    color: rgb(0.85, 0.47, 0.02) // Gold #d97706
  });

  // Format Date String
  const formattedDate = issueDate
    ? new Date(issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Draw Date (Left Signature Section)
  const dateWidth = fontHelvetica.widthOfTextAtSize(formattedDate, 14);
  page.drawText(formattedDate, {
    x: 168 - dateWidth / 2,
    y: 135,
    size: 14,
    font: fontHelvetica,
    color: rgb(0.12, 0.16, 0.23)
  });

  // Draw Issuer Name (Right Signature Section)
  const issuerWidth = fontHelveticaBold.widthOfTextAtSize(issuerName, 14);
  page.drawText(issuerName, {
    x: pageWidth - 168 - issuerWidth / 2,
    y: 135,
    size: 14,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.16, 0.23)
  });

  // Draw Certificate ID at bottom-left corner
  const certIdText = `ID: ${certificateId}`;
  page.drawText(certIdText, {
    x: 45,
    y: 40,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.4, 0.45, 0.55)
  });

  // Generate & Embed QR Code (Bottom Right Corner)
  if (verificationUrl) {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 150,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
    const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const embeddedQrImage = await pdfDoc.embedPng(qrImageBytes);

    const qrSize = 75;
    page.drawImage(embeddedQrImage, {
      x: pageWidth - 110,
      y: 35,
      width: qrSize,
      height: qrSize
    });

    // Label below QR Code
    page.drawText('Scan to Verify', {
      x: pageWidth - 110,
      y: 24,
      size: 8,
      font: fontHelvetica,
      color: rgb(0.4, 0.45, 0.55)
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

/**
 * Generate a PNG preview of the certificate for live modal display
 */
const generateCertificatePreview = async (params) => {
  const pdfBuffer = await generatePdfCertificate(params);
  // Return the PDF buffer or data URL
  return `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
};

module.exports = {
  createDefaultTemplateImage,
  generatePdfCertificate,
  generateCertificatePreview
};
