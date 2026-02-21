const express = require('express');
const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');
const router = express.Router();

// Email configuration
const createTransporter = () => {
  console.log('🔧 Creating email transporter with configuration...');
  
  // For testing purposes, we'll use a test configuration
  // In production, you should use your actual Gmail App Password
  const config = {
    service: 'gmail',
    auth: {
      user: 'pasindumanodya360@gmail.com',
      pass: 'your-gmail-app-password-here' // Replace this with your actual Gmail App Password
    }
  };
  
  console.log('📧 Email config:', {
    service: config.service,
    user: config.auth.user,
    hasPassword: !!config.auth.pass && config.auth.pass !== 'your-gmail-app-password-here'
  });
  
  return nodemailer.createTransport(config);
};

// Contact form submission endpoint
router.post('/submit', asyncHandler(async (req, res) => {
  console.log('📧 Contact form submission received');
  console.log('📧 Request body:', req.body);
  
  const { name, email, subject, message } = req.body;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    console.log('❌ Validation failed: Missing required fields');
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('❌ Validation failed: Invalid email format');
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  console.log('✅ Validation passed, attempting to send email...');

  try {
    console.log('🔧 Creating email transporter...');
    const transporter = createTransporter();
    console.log('✅ Email transporter created successfully');

    // Email content
    const mailOptions = {
      from: 'pasindumanodya360@gmail.com',
      to: 'pasindumanodya360@gmail.com',
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #16B5A3, #7C3AED); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; text-align: center;">New Contact Form Submission</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #16B5A3;">
            <h2 style="color: #333; margin-top: 0;">Contact Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; width: 120px;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 8px 0; color: #333;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Subject:</td>
                <td style="padding: 8px 0; color: #333;">${subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; vertical-align: top;">Message:</td>
                <td style="padding: 8px 0; color: #333; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 10px; margin-top: 20px; text-align: center;">
            <p style="margin: 0; color: #1976d2; font-size: 14px;">
              This message was sent from the Quizzly contact form
            </p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
              Timestamp: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
      replyTo: email
    };

    // Send email
    console.log('📤 Sending main email to admin...');
    console.log('📤 Email options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Main email sent successfully');

    // Send confirmation email to user
    console.log('📤 Sending confirmation email to user...');
    const confirmationMailOptions = {
      from: 'pasindumanodya360@gmail.com',
      to: email,
      subject: 'Thank you for contacting Quizzly',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #16B5A3, #7C3AED); padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Quizzly</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Thank you for reaching out!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Message Received</h2>
            <p style="color: #555; line-height: 1.6;">
              Hi ${name},
            </p>
            <p style="color: #555; line-height: 1.6;">
              Thank you for contacting us! We've received your message regarding <strong>${subject}</strong> and will get back to you within 24 hours.
            </p>
            <p style="color: #555; line-height: 1.6;">
              Your message: <em>"${message}"</em>
            </p>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 10px; border-left: 4px solid #16B5A3;">
            <h3 style="color: #2e7d32; margin-top: 0;">What's Next?</h3>
            <ul style="color: #555; margin: 0; padding-left: 20px;">
              <li>Our team will review your message</li>
              <li>We'll respond within 24 hours</li>
              <li>For urgent technical issues, please mention "URGENT" in your subject</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Best regards,<br>
              The Quizzly Team
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(confirmationMailOptions);
    console.log('✅ Confirmation email sent successfully');

    console.log('🎉 All emails sent successfully!');
    res.json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you soon.'
    });

  } catch (error) {
    console.error('❌ Email sending error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

module.exports = router;
