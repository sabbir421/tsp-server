const { OTP_TYPES } = require('../constants');
const { toSmsRecipient } = require('./phone');

const SMS_API_URL = process.env.SMS_NET_BD_URL || 'https://api.sms.net.bd/sendsms';
const DEFAULT_SENDER_ID = 'TSP';
const BRAND = 'TSP';

const OTP_SMS_COPY = {
  [OTP_TYPES.REGISTRATION]: (otpCode, expiryMinutes) =>
    `${BRAND}\nYour registration OTP is ${otpCode}. Valid for ${expiryMinutes} minutes. Do not share this code.`,
  [OTP_TYPES.LOGIN]: (otpCode, expiryMinutes) =>
    `${BRAND}\nYour login OTP is ${otpCode}. Valid for ${expiryMinutes} minutes. Do not share this code.`,
  [OTP_TYPES.PASSWORD_RESET]: (otpCode, expiryMinutes) =>
    `${BRAND}\nYour password reset OTP is ${otpCode}. Valid for ${expiryMinutes} minutes. Do not share this code.`,
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

const getSenderId = () => {
  const configured = process.env.SMS_NET_BD_SENDER_ID;
  if (configured === '') return DEFAULT_SENDER_ID;
  if (configured && configured.toLowerCase() !== 'none') return configured;
  return DEFAULT_SENDER_ID;
};

const postSms = async ({ apiKey, msg, to, senderId }) => {
  const form = new URLSearchParams();
  form.append('api_key', apiKey);
  form.append('msg', msg);
  form.append('to', to);
  if (senderId) {
    form.append('sender_id', senderId);
  }

  const response = await fetch(SMS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  const payload = parseSmsResponse(await response.text());
  const errorCode = Number(payload.error);
  const failed = !response.ok || (Number.isFinite(errorCode) && errorCode !== 0);

  return { payload, errorCode, failed };
};

const sendOtpSms = async ({ phone, countryCode, otpCode, purpose }) => {
  const to = toSmsRecipient(phone, countryCode);
  const expiryMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 10;
  const buildMessage = OTP_SMS_COPY[purpose] || OTP_SMS_COPY[OTP_TYPES.LOGIN];
  const msg = buildMessage(otpCode, expiryMinutes);
  const apiKey = process.env.SMS_NET_BD_API_KEY;
  const senderId = getSenderId();

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] SMS OTP to ${to} from ${senderId}:\n${msg}`);
  }

  if (!apiKey || apiKey === 'YOUR_API_KEY') {
    if (process.env.NODE_ENV === 'development') {
      return { skipped: true };
    }
    throw { status: 500, message: 'SMS provider is not configured' };
  }

  try {
    let result = await postSms({ apiKey, msg, to, senderId });

    // 413 = unapproved / invalid sender ID — retry so OTP still goes out
    if (result.failed && result.errorCode === 413 && senderId) {
      console.warn(`SMS sender ID "${senderId}" was rejected. Retrying without header.`);
      result = await postSms({ apiKey, msg, to, senderId: null });
    }

    if (result.failed) {
      console.error('Failed to send OTP SMS:', result.payload);
      throw new Error(result.payload.msg || 'SMS provider rejected the request');
    }
  } catch (error) {
    if (error.status) throw error;
    console.error('Failed to send OTP SMS:', error.message);
    throw { status: 502, message: 'Failed to send verification SMS. Please try again later.' };
  }
};

module.exports = { sendOtpSms };
