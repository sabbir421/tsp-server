const { Op } = require('sequelize');
const { PasswordResetToken } = require('../schema');

const PasswordResetModel = {
  async create(userId, role, token) {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordResetToken.create({
      userId,
      role,
      token,
      expiresAt,
    });
  },

  async findValid(token) {
    return PasswordResetToken.findOne({
      where: {
        token,
        isUsed: false,
        expiresAt: { [Op.gt]: new Date() },
      },
    });
  },

  async markUsed(tokenId) {
    await PasswordResetToken.update({ isUsed: true }, { where: { id: tokenId } });
  },
};

module.exports = PasswordResetModel;
