/**
 * Email utility for sending emails
 * Currently logs to console in development
 * In production, configure with a real email service (SendGrid, AWS SES, etc.)
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const useEmailService = process.env.USE_EMAIL_SERVICE === 'true';

  // In development, log the email instead of sending
  if (isDevelopment && !useEmailService) {
    console.log('\n📧 Email would be sent:');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Body:', options.text || options.html);
    console.log('---\n');
    return true;
  }

  // In production or if email service is enabled, send actual email
  // TODO: Configure with your email service provider
  // Examples:
  
  // Option 1: Using Nodemailer
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: parseInt(process.env.SMTP_PORT || '587'),
  //   secure: false,
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASS,
  //   },
  // });
  // await transporter.sendMail({
  //   from: process.env.FROM_EMAIL,
  //   ...options,
  // });

  // Option 2: Using SendGrid
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   from: process.env.FROM_EMAIL,
  //   ...options,
  // });

  // Option 3: Using AWS SES
  // const AWS = require('aws-sdk');
  // const ses = new AWS.SES({ region: process.env.AWS_REGION });
  // await ses.sendEmail({
  //   Source: process.env.FROM_EMAIL,
  //   Destination: { ToAddresses: [options.to] },
  //   Message: {
  //     Subject: { Data: options.subject },
  //     Body: { Html: { Data: options.html } },
  //   },
  // }).promise();

  // For now, return true (email "sent")
  return true;
}

export function generatePasswordResetEmail(resetLink: string, userName: string): EmailOptions {
  return {
    to: '', // Will be set by caller
    subject: 'Reset Your Password - NM2TECH Timesheet',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h1 style="color: #2563eb; margin-top: 0;">NM2TECH LLC</h1>
            <h2 style="color: #333;">Password Reset Request</h2>
            
            <p>Hello ${userName},</p>
            
            <p>We received a request to reset your password for your NM2TECH Timesheet account.</p>
            
            <p style="margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </p>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${resetLink}</p>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              <strong>This link will expire in 1 hour.</strong>
            </p>
            
            <p style="color: #666; font-size: 14px;">
              If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; margin: 0;">
              This is an automated message from NM2TECH LLC Timesheet System.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      NM2TECH LLC - Password Reset Request
      
      Hello ${userName},
      
      We received a request to reset your password for your NM2TECH Timesheet account.
      
      Click the following link to reset your password:
      ${resetLink}
      
      This link will expire in 1 hour.
      
      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      
      ---
      This is an automated message from NM2TECH LLC Timesheet System.
    `,
  };
}

