const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendMail = async ({ to, subject, html }) => {
  try {
    console.log('📧 Attempting to send email to:', to);
    console.log('📧 Email config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      from: process.env.EMAIL_FROM
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    // Don't throw error to prevent blocking the approval process
    // Just log the error and continue
    console.log('⚠️ Continuing without email notification...');
    return null;
  }
};
