const AuthService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/response');
const { USER_ROLES, ROLE_LABELS } = require('../constants');

const AuthController = {
  getRoles(req, res) {
    const roles = Object.values(USER_ROLES).map((value) => ({
      value,
      label: ROLE_LABELS[value],
    }));
    return successResponse(res, roles, 'Roles fetched successfully');
  },

  async register(req, res) {
    try {
      const result = await AuthService.register(req.body);
      return successResponse(res, result, 'Account created successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async sendRegistrationOtp(req, res) {
    try {
      const { phone, email, countryCode, role } = req.body;
      const result = await AuthService.sendRegistrationOtp({ phone, email, countryCode, role });
      return successResponse(res, result, result.message);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async login(req, res) {
    try {
      const result = await AuthService.login(req.body);
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async sendLoginOtp(req, res) {
    try {
      const result = await AuthService.sendLoginOtp(req.body);
      return successResponse(res, result, result.message);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async loginWithOtp(req, res) {
    try {
      const result = await AuthService.loginWithOtp(req.body);
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async forgotPassword(req, res) {
    try {
      const result = await AuthService.forgotPassword(req.body);
      return successResponse(res, result, result.message);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async sendPasswordResetOtp(req, res) {
    try {
      const result = await AuthService.sendPasswordResetOtp(req.body);
      return successResponse(res, result, result.message);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async resetPasswordWithToken(req, res) {
    try {
      const { token, newPassword } = req.body;
      const result = await AuthService.resetPasswordWithToken({ token, newPassword });
      return successResponse(res, result, result.message);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async resetPasswordWithOtp(req, res) {
    try {
      const result = await AuthService.resetPasswordWithOtp(req.body);
      return successResponse(res, result, result.message);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getProfile(req, res) {
    try {
      const user = await AuthService.getProfile(req.user.id, req.user.role);
      return successResponse(res, user, 'Profile fetched successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async updateProfile(req, res) {
    try {
      const user = await AuthService.updateProfile(req.user.id, req.user.role, req.body);
      return successResponse(res, user, 'Profile updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async updatePassword(req, res) {
    try {
      const result = await AuthService.updatePassword(req.user.id, req.user.role, req.body);
      return successResponse(res, result, result.message);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },
};

module.exports = AuthController;
