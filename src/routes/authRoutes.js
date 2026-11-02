const express = require('express');
const AuthController = require('../controller/authController');
const { authenticate, validateRequest } = require('../middleware/authMiddleware');
const {
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
} = require('../validation/authValidation');

const router = express.Router();

router.get('/roles', AuthController.getRoles);

router.post('/register', registerValidation, validateRequest, AuthController.register);
router.post(
  '/send-registration-otp',
  sendRegistrationOtpValidation,
  validateRequest,
  AuthController.sendRegistrationOtp
);

router.post('/login', loginValidation, validateRequest, AuthController.login);
router.post('/send-login-otp', sendLoginOtpValidation, validateRequest, AuthController.sendLoginOtp);
router.post('/login-otp', otpLoginValidation, validateRequest, AuthController.loginWithOtp);

router.post('/forgot-password', forgotPasswordValidation, validateRequest, AuthController.forgotPassword);
router.post('/send-reset-otp', forgotPasswordValidation, validateRequest, AuthController.sendPasswordResetOtp);
router.post('/reset-password', resetPasswordTokenValidation, validateRequest, AuthController.resetPasswordWithToken);
router.post('/reset-password-otp', resetPasswordOtpValidation, validateRequest, AuthController.resetPasswordWithOtp);

router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, profileUpdateValidation, validateRequest, AuthController.updateProfile);
router.put('/update-password', authenticate, AuthController.updatePassword);
router.post('/change-password', authenticate, AuthController.updatePassword);

module.exports = router;
