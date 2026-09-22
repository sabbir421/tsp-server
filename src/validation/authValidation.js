const { body } = require('express-validator');
const { USER_ROLES } = require('../constants');

const roleValidation = body('role')
  .notEmpty()
  .withMessage('Role is required')
  .isIn(Object.values(USER_ROLES))
  .withMessage('Invalid role');

const registerValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('countryCode').optional().trim(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  roleValidation,
  body('otpCode').notEmpty().withMessage('OTP is required'),
];

const loginValidation = [
  body('identifier').trim().notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
  roleValidation,
];

const sendRegistrationOtpValidation = [
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Valid email is required'),
  body('countryCode').optional().trim(),
  roleValidation,
];

const sendLoginOtpValidation = [
  body('identifier').trim().notEmpty().withMessage('Email or phone is required'),
  roleValidation,
];

const otpLoginValidation = [
  body('identifier').trim().notEmpty().withMessage('Email or phone is required'),
  body('otpCode').notEmpty().withMessage('OTP is required'),
  roleValidation,
];

const forgotPasswordValidation = [
  body('identifier').trim().notEmpty().withMessage('Email or phone is required'),
  roleValidation,
];

const resetPasswordValidation = [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const resetPasswordTokenValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  ...resetPasswordValidation,
];

const resetPasswordOtpValidation = [
  body('identifier').trim().notEmpty().withMessage('Email or phone is required'),
  body('otpCode').notEmpty().withMessage('OTP is required'),
  roleValidation,
  ...resetPasswordValidation,
];

const profileUpdateValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('countryCode').optional().trim(),
];

module.exports = {
  registerValidation,
  loginValidation,
  sendRegistrationOtpValidation,
  sendLoginOtpValidation,
  otpLoginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  resetPasswordTokenValidation,
  resetPasswordOtpValidation,
  profileUpdateValidation,
};
