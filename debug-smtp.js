require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 SMTP Debug Information');
console.log('========================\n');

const email = process.env.SMTP_EMAIL;
const password = process.env.SMTP_PASSWORD;

console.log('Email:', email);
console.log('Password length:', password ? password.length : 'NOT SET');
console.log('Password first char:', password ? password[0] : 'N/A');
console.log('Password last char:', password ? password[password.length - 1] : 'N/A');
console.log('Has quotes in password:', password ? (password.includes('"') || password.includes("'")) : false);
console.log('Has spaces:', password ? password.includes(' ') : false);
console.log('Has special chars:', password ? /[!@#$%^&*()+=\[\]{};':"\\|,.<>\/?]/.test(password) : false);

// Test with Titan - the correct server for GoDaddy Professional Email
async function testTitan() {
  console.log('\n🧪 Testing Titan Email SMTP (smtp.titan.email:465)...\n');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.titan.email',
    port: 465,
    secure: true,
    auth: {
      user: email,
      pass: password,
    },
    debug: true,
    logger: true,
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('\n✅ SUCCESS! Connection verified!');
    
    // Try sending a test email
    console.log('\nSending test email...');
    const info = await transporter.sendMail({
      from: `"MovieMart" <${email}>`,
      to: email, // Send to self
      subject: 'Test Email - SMTP Working!',
      text: 'If you receive this, your SMTP is configured correctly!',
      html: '<h1>SMTP Test Successful!</h1><p>Your email configuration is working.</p>',
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Error code:', error.code);
    if (error.response) {
      console.error('Server response:', error.response);
    }
  }
}

testTitan();
