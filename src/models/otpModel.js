const { Op } = require('sequelize');
const { OtpCode } = require('../schema');
const { OTP_TYPES } = require('../constants');

const OtpModel = {
  async create({ userId, email, phone, otpCode, type, role }) {
    const expiresAt = new Date(
      Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 10) * 60 * 1000
    );

    const otp = await OtpCode.create({
      userId: userId || null,
      email: email || null,
      phone: phone || null,
      otpCode,
      type,
      role: role || null,
      expiresAt,
    });

    return otp.id;
  },

  async findValid({ otpCode, type, phone, email, role }) {
    const baseWhere = {
      otpCode,
      type,
      isUsed: false,
      expiresAt: { [Op.gt]: new Date() },
      role,
    };

    if (type === OTP_TYPES.REGISTRATION && phone) {
      return OtpCode.findOne({
        where: { ...baseWhere, phone },
        order: [['createdAt', 'DESC']],
      });
    }

    const contactFilters = [];
    if (phone) contactFilters.push({ phone });
    if (email) contactFilters.push({ email });

    return OtpCode.findOne({
      where: {
        ...baseWhere,
        ...(contactFilters.length > 0 ? { [Op.or]: contactFilters } : {}),
      },
      order: [['createdAt', 'DESC']],
    });
  },

  async markUsed(otpId) {
    await OtpCode.update({ isUsed: true }, { where: { id: otpId } });
  },
};

module.exports = OtpModel;
