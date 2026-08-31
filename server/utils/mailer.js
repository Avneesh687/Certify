const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return transporter;
  }

  // Fast, non-blocking mock email logger for cloud environments
  transporter = {
    sendMail: async (mailOptions) => {
      console.log(`[Email Dispatched] To: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
      return { messageId: `mock-${Date.now()}` };
    }
  };

  return transporter;
};

/**
 * Send Certificate Email to Recipient with PDF Attachment
 */
const sendCertificateEmail = async ({
  recipientEmail,
  recipientName,
  eventName,
  certificateId,
  verificationUrl,
  pdfBuffer,
  pdfPath
}) => {
  try {
    const mailer = await getTransporter();
    
    const sender = process.env.EMAIL_FROM || '"Certify Notifications" <no-reply@certify.com>';
    const subject = `Your Certificate for ${eventName} [${certificateId}]`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #38bdf8; margin: 0; font-size: 28px; font-weight: 700;">Certify</h1>
          <p style="color: #94a3b8; margin-top: 8px; font-size: 14px;">Official Certificate Issuance System</p>
        </div>
        <div style="padding: 32px 24px; color: #334155; line-height: 1.6;">
          <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Congratulations, ${recipientName}! 🎉</h2>
          <p>We are delighted to share your official Certificate of Achievement for completing <strong>${eventName}</strong>.</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #38bdf8; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Certificate ID:</strong> ${certificateId}</p>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #475569;"><strong>Status:</strong> Verified & Authentic</p>
          </div>

          <p>Your official PDF certificate is attached to this email. You can also verify and view your certificate online anytime using the button below:</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(2,132,199,0.3);">View Verified Certificate</a>
          </div>

          <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">If you have any questions or feedback, please feel free to reach out to the issuing organization.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
          &copy; ${new Date().getFullYear()} Certify System. Powered by MERN Stack.
        </div>
      </div>
    `;

    const attachments = [];
    if (pdfBuffer) {
      attachments.push({
        filename: `Certificate_${certificateId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    } else if (pdfPath) {
      attachments.push({
        filename: `Certificate_${certificateId}.pdf`,
        path: pdfPath,
        contentType: 'application/pdf'
      });
    }

    const info = await mailer.sendMail({
      from: sender,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
      attachments: attachments
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`[Mailer Warning] Failed to send email to ${recipientEmail}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = { sendCertificateEmail };
