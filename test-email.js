require('dotenv').config();
const nodemailer = require('nodemailer');

// Test configurations - Titan Email first (GoDaddy Professional Email uses Titan)
const configs = [
  {
    name: 'Titan Email - Port 465 (SSL)',
    host: 'smtp.titan.email',
    port: 465,
    secure: true,
  },
  {
    name: 'Titan Email - Port 587 (STARTTLS)',
    host: 'smtp.titan.email',
    port: 587,
    secure: false,
  },
  {
    name: 'GoDaddy Workspace - Port 465',
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
  },
  {
    name: 'GoDaddy Workspace - Port 587',
    host: 'smtpout.secureserver.net',
    port: 587,
    secure: false,
  },
];

async function testConfig(config) {
  console.log(`\n🧪 Testing: ${config.name}`);
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure: ${config.secure}`);
  console.log(`   Email: ${process.env.SMTP_EMAIL}`);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    await transporter.verify();
    console.log(`   ✅ SUCCESS! This configuration works!`);
    console.log(`\n🎉 Use these settings in your .env file:`);
    console.log(`SMTP_HOST=${config.host}`);
    console.log(`SMTP_PORT=${config.port}`);
    console.log(`SMTP_SECURE=${config.secure}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting GoDaddy SMTP Configuration Test');
  console.log('==========================================\n');

  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.error('❌ Error: SMTP_EMAIL and SMTP_PASSWORD must be set in .env file');
    process.exit(1);
  }

  let foundWorking = false;

  for (const config of configs) {
    const success = await testConfig(config);
    if (success) {
      foundWorking = true;
      break;
    }
  }

  if (!foundWorking) {
    console.log('\n❌ None of the configurations worked.');
    console.log('\n📋 Troubleshooting Steps:');
    console.log('1. Verify your email and password are correct');
    console.log('2. Try logging into https://email.godaddy.com with these credentials');
    console.log('3. Check if SMTP is enabled in your GoDaddy email settings');
    console.log('4. Contact GoDaddy support to confirm SMTP settings for your account');
  }
}

runTests();
