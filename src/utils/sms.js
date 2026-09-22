const { OTP_TYPES } = require('../constants');
const { toSmsRecipient } = require('./phone');

const SMS_API_URL = process.env.SMS_NET_BD_URL || 'https://api.sms.net.bd/sendsms';

const OTP_SMS_COPY = {
  [OTP_TYPES.REGISTRATION]: (otpCode, expiryMinutes) =>
    `TrueSpace Property: your registration code is ${otpCode}. It expires in ${expiryMinutes} minutes.`,
  [OTP_TYPES.LOGIN]: (otpCode, expiryMinutes) =>
    `TrueSpace Property: your login code is ${otpCode}. It expires in ${expiryMinutes} minutes.`,
  [OTP_TYPES.PASSWORD_RESET]: (otpCode, expiryMinutes) =>
    `TrueSpace Property: your password reset code is ${otpCode}. It expires in ${expiryMinutes} minutes.`,
};

const parseSmsResponse = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return { msg: String(raw) };
  }
};

const sendOtpSms = async ({ phone, countryCode, otpCode, purpose }) => {
  const to = toSmsRecipient(phone, countryCode);
  const expiryMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 10;
  const buildMessage = OTP_SMS_COPY[purpose] || OTP_SMS_COPY[OTP_TYPES.LOGIN];
  const msg = buildMessage(otpCode, expiryMinutes);
  const apiKey = process.env.SMS_NET_BD_API_KEY;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] SMS OTP to ${to}: ${otpCode}`);
  }

  if (!apiKey || apiKey === 'YOUR_API_KEY') {
    if (process.env.NODE_ENV === 'development') {
      return { skipped: true };
    }
    throw { status: 500, message: 'SMS provider is not configured' };
  }

  const form = new URLSearchParams();
  form.append('api_key', apiKey);
  form.append('msg', msg);
  form.append('to', to);

  const senderId = process.env.SMS_NET_BD_SENDER_ID;
  if (senderId) {
    form.append('sender_id', senderId);
  }

  try {
    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    const payload = parseSmsResponse(await response.text());
    const errorCode = Number(payload.error);

    if (!response.ok || (Number.isFinite(errorCode) && errorCode !== 0)) {
      console.error('Failed to send OTP SMS:', payload);
      throw new Error(payload.msg || 'SMS provider rejected the request');
    }
  } catch (error) {
    if (error.status) throw error;
    console.error('Failed to send OTP SMS:', error.message);
    throw { status: 502, message: 'Failed to send verification SMS. Please try again later.' };
  }
};

module.exports = { sendOtpSms };
