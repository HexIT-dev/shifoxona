import nodemailer from 'nodemailer';

// Mock or real SMTP config
// For a real app, use environment variables
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'placeholder@ethereal.email',
    pass: 'placeholder'
  }
});

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    // In production, this would send a real email
    console.log(`Sending email to ${to}...`);
    // const info = await transporter.sendMail({ from: '"Hospital HMS" <noreply@hospital.com>', to, subject, text });
    // console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};
