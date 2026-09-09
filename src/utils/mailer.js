const nodemailer = require('nodemailer');
const { OTP_TYPES } = require('../constants');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const OTP_EMAIL_COPY = {
  [OTP_TYPES.REGISTRATION]: {
    subject: 'Verify your email — TrueSpace Property',
    heading: 'Confirm your registration',
    body: 'Use the code below to complete your TrueSpace Property registration.',
  },
  [OTP_TYPES.LOGIN]: {
    subject: 'Your login code — TrueSpace Property',
    heading: 'Login verification code',
    body: 'Use the code below to sign in to your TrueSpace Property account.',
  },
  [OTP_TYPES.PASSWORD_RESET]: {
    subject: 'Password reset code — TrueSpace Property',
    heading: 'Reset your password',
    body: 'Use the code below to reset your TrueSpace Property account password.',
  },
};

const sendOtpEmail = async ({ to, otpCode, purpose }) => {
  const copy = OTP_EMAIL_COPY[purpose] || OTP_EMAIL_COPY[OTP_TYPES.LOGIN];
  const expiryMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 10;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1e3a5f; margin-bottom: 8px;">${copy.heading}</h2>
      <p style="color: #1f2937; font-size: 14px;">${copy.body}</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #f97316; margin: 24px 0;">${otpCode}</p>
      <p style="color: #6b7280; font-size: 13px;">
        This code expires in ${expiryMinutes} minutes. If you didn't request this, you can safely ignore this email.
      </p>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">— TrueSpace Property</p>
    </div>
  `;

  const text = `${copy.heading}\n\n${copy.body}\n\nYour code: ${otpCode}\n\nThis code expires in ${expiryMinutes} minutes.`;

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: copy.subject,
      html,
      text,
    });
  } catch (error) {
    console.error('Failed to send OTP email:', error.message);
    throw { status: 502, message: 'Failed to send verification email. Please try again later.' };
  }
};

module.exports = { sendOtpEmail };
