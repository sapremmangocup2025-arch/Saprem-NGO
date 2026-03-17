const { sendMail } = require('./src/utils/mail');
require('dotenv').config();

async function testEmail() {
  console.log('🧪 Testing email configuration...');
  console.log('📧 Environment variables:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'NOT SET');
  console.log('EMAIL_PASS first 4 chars:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 4) + '...' : 'NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

  if (!process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_PASS is not set in environment variables!');
    process.exit(1);
  }

  // Test direct nodemailer configuration
  const nodemailer = require('nodemailer');
  
  console.log('\n🔧 Testing direct nodemailer configuration...');
  const testTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    console.log('🔍 Verifying transporter...');
    await testTransporter.verify();
    console.log('✅ Transporter verification successful!');
    
    console.log('📧 Sending test email...');
    const info = await testTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'sapremmangocup2025@gmail.com', // Send to the correct email
      subject: 'SAPREM NGO - Direct Email Test',
      html: `
        <h2>Direct Email Configuration Test</h2>
        <p>This is a direct test email to verify Gmail App Password configuration.</p>
        <p>If you receive this email, the configuration is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });
    
    console.log('✅ Direct email test successful!');
    console.log('📧 Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Direct email test error:', error.message);
  }

  process.exit(0);
}

testEmail();