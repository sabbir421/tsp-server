const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const UserModel = require('../models/userModel');
const OtpModel = require('../models/otpModel');
const PasswordResetModel = require('../models/passwordResetModel');
const { generateToken } = require('../utils/jwt');
const { generateOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/mailer');
const { USER_ROLES, OTP_TYPES } = require('../constants');

const toPlain = (record) => (record?.get ? record.get({ plain: true }) : record);

const formatUser = (user, role) => {
  const data = toPlain(user);
  return {
    id: data.id,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    countryCode: data.countryCode || '+880',
    role,
    isPhoneVerified: !!data.isPhoneVerified,
    isEmailVerified: !!data.isEmailVerified,
    isActive: data.isActive !== false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

const AuthService = {
  async register({ fullName, email, phone, countryCode, password, role, otpCode }) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw { status: 400, message: 'Invalid user role' };
    }

    const existingEmail = await UserModel.findByEmail(email, role);
    if (existingEmail) {
      throw { status: 409, message: 'Email already registered for this account type' };
    }

    const existingPhone = await UserModel.findByPhone(phone, role);
    if (existingPhone) {
      throw { status: 409, message: 'Phone number already registered for this account type' };
    }

    if (!otpCode) {
      throw { status: 400, message: 'OTP is required for registration' };
    }

    const validOtp = await OtpModel.findValid({
      otpCode,
      type: OTP_TYPES.REGISTRATION,
      phone,
      email,
      role,
    });

    if (!validOtp) {
      throw { status: 400, message: 'Invalid or expired OTP. Please resend OTP and try again.' };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = await UserModel.create({
      fullName,
      email,
      phone,
      countryCode,
      password: hashedPassword,
      role,
    });

    await OtpModel.markUsed(validOtp.id);
    await UserModel.markPhoneVerified(userId, role);

    const user = await UserModel.findById(userId, role);
    const token = generateToken({ id: user.id, role, email: user.email });

    return { user: formatUser(user, role), token };
  },

  async sendRegistrationOtp({ phone, email, role }) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw { status: 400, message: 'Invalid user role' };
    }

    const otpCode = generateOtp();
    await OtpModel.create({
      phone,
      email,
      otpCode,
      type: OTP_TYPES.REGISTRATION,
      role,
    });

    await sendOtpEmail({ to: email, otpCode, purpose: OTP_TYPES.REGISTRATION });

    return { message: 'OTP sent successfully' };
  },

  async login({ identifier, password, role }) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw { status: 400, message: 'Invalid user role' };
    }

    const user = await UserModel.findByIdentifierAndRole(identifier, role);
    if (!user) {
      throw { status: 401, message: 'Invalid credentials for selected role' };
    }

    if (!user.isActive) {
      throw { status: 403, message: 'Account is deactivated' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const token = generateToken({ id: user.id, role, email: user.email });
    return { user: formatUser(user, role), token };
  },

  async sendLoginOtp({ identifier, role }) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw { status: 400, message: 'Invalid user role' };
    }

    const user = await UserModel.findByIdentifierAndRole(identifier, role);
    if (!user) {
      throw { status: 404, message: 'No account found for this role' };
    }

    const otpCode = generateOtp();
    await OtpModel.create({
      userId: user.id,
      phone: user.phone,
      email: user.email,
      otpCode,
      type: OTP_TYPES.LOGIN,
      role,
    });

    await sendOtpEmail({ to: user.email, otpCode, purpose: OTP_TYPES.LOGIN });

    return { message: 'OTP sent successfully' };
  },

  async loginWithOtp({ identifier, otpCode, role }) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw { status: 400, message: 'Invalid user role' };
    }

    const user = await UserModel.findByIdentifierAndRole(identifier, role);
    if (!user) {
      throw { status: 401, message: 'Invalid credentials for selected role' };
    }

    const validOtp = await OtpModel.findValid({
      otpCode,
      type: OTP_TYPES.LOGIN,
      phone: user.phone,
      email: user.email,
      role,
    });

    if (!validOtp) {
      throw { status: 400, message: 'Invalid or expired OTP' };
    }

    await OtpModel.markUsed(validOtp.id);
    const token = generateToken({ id: user.id, role, email: user.email });
    return { user: formatUser(user, role), token };
  },

  async forgotPassword({ identifier, role }) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw { status: 400, message: 'Invalid user role' };
    }

    const user = await UserModel.findByIdentifierAndRole(identifier, role);
    if (!user) {
      throw { status: 404, message: 'No account found for this role' };
    }

    const resetToken = uuidv4();
    await PasswordResetModel.create(user.id, role, resetToken);

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&role=${role}`;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Password reset link: ${resetLink}`);
    }

    return {
      message: 'Password reset link sent successfully',
      ...(process.env.NODE_ENV === 'development' && { resetLink }),
    };
  },

  async sendPasswordResetOtp({ identifier, role }) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw { status: 400, message: 'Invalid user role' };
    }

    const user = await UserModel.findByIdentifierAndRole(identifier, role);
    if (!user) {
      throw { status: 404, message: 'No account found for this role' };
    }

    const otpCode = generateOtp();
    await OtpModel.create({
      userId: user.id,
      phone: user.phone,
      email: user.email,
      otpCode,
      type: OTP_TYPES.PASSWORD_RESET,
      role,
    });

    await sendOtpEmail({ to: user.email, otpCode, purpose: OTP_TYPES.PASSWORD_RESET });

    return { message: 'OTP sent successfully' };
  },

  async resetPasswordWithToken({ token, newPassword }) {
    const resetRecord = await PasswordResetModel.findValid(token);
    if (!resetRecord) {
      throw { status: 400, message: 'Invalid or expired reset token' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await UserModel.updatePassword(resetRecord.userId, hashedPassword, resetRecord.role);
    await PasswordResetModel.markUsed(resetRecord.id);

    return { message: 'Password reset successfully' };
  },

  async resetPasswordWithOtp({ identifier, otpCode, newPassword, role }) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw { status: 400, message: 'Invalid user role' };
    }

    const user = await UserModel.findByIdentifierAndRole(identifier, role);
    if (!user) {
      throw { status: 404, message: 'No account found for this role' };
    }

    const validOtp = await OtpModel.findValid({
      otpCode,
      type: OTP_TYPES.PASSWORD_RESET,
      phone: user.phone,
      email: user.email,
      role,
    });

    if (!validOtp) {
      throw { status: 400, message: 'Invalid or expired OTP' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await UserModel.updatePassword(user.id, hashedPassword, role);
    await OtpModel.markUsed(validOtp.id);

    return { message: 'Password reset successfully' };
  },

  async getProfile(userId, role) {
    const user = await UserModel.findById(userId, role);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    return formatUser(user, role);
  },

  async updateProfile(userId, role, body) {
    const user = await UserModel.findById(userId, role);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    const fullName = body.fullName?.trim();
    const email = body.email?.trim()?.toLowerCase();
    const phone = body.phone?.trim();
    const countryCode = body.countryCode?.trim() || '+880';

    if (!fullName) {
      throw { status: 400, message: 'Full name is required' };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw { status: 400, message: 'Valid email is required' };
    }
    if (!phone) {
      throw { status: 400, message: 'Phone number is required' };
    }

    const existingEmail = await UserModel.findByEmailExcludingId(email, role, userId);
    if (existingEmail) {
      throw { status: 409, message: 'Email already registered for this account type' };
    }

    const existingPhone = await UserModel.findByPhoneExcludingId(phone, role, userId);
    if (existingPhone) {
      throw { status: 409, message: 'Phone number already registered for this account type' };
    }

    const current = toPlain(user);
    const emailChanged = email !== current.email;
    const phoneChanged = phone !== current.phone;

    await UserModel.updateProfile(userId, role, {
      fullName,
      email,
      phone,
      countryCode,
      ...(emailChanged ? { isEmailVerified: false } : {}),
      ...(phoneChanged ? { isPhoneVerified: false } : {}),
    });

    const updated = await UserModel.findById(userId, role);
    return formatUser(updated, role);
  },
};

module.exports = AuthService;
