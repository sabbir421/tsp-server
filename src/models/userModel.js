const { Op } = require('sequelize');
const { getModelByRole } = require('../utils/userModelResolver');

const PUBLIC_ATTRIBUTES = {
  exclude: ['password'],
};

function getPhoneVariations(phone) {
  const raw = String(phone || '').trim();
  const digits = raw.replace(/\D/g, '');
  const variations = [{ phone: raw }];

  if (digits.length >= 10) {
    const local11 = digits.length === 11 ? digits : '0' + digits.slice(-10);
    const withoutZero = local11.slice(1);
    const withPlusCountry = '+88' + local11;
    const withCountryDigits = '88' + local11;

    variations.push(
      { phone: local11 },
      { phone: withoutZero },
      { phone: withPlusCountry },
      { phone: withCountryDigits }
    );
  }
  return variations;
}

const UserModel = {
  getModelByRole,

  async create(data) {
    const Model = getModelByRole(data.role);
    const user = await Model.create({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      countryCode: data.countryCode || '+880',
      password: data.password,
    });
    return user.id;
  },

  async findByEmail(email, role) {
    const Model = getModelByRole(role);
    return Model.findOne({ where: { email } });
  },

  async findByPhone(phone, role) {
    const Model = getModelByRole(role);
    if (!Model) return null;
    const phoneVars = getPhoneVariations(phone);
    return Model.findOne({
      where: {
        [Op.or]: phoneVars,
      },
    });
  },

  async findByIdentifierAndRole(identifier, role) {
    const Model = getModelByRole(role);
    if (!Model) return null;
    const raw = String(identifier || '').trim();
    const phoneVars = getPhoneVariations(raw);

    return Model.findOne({
      where: {
        [Op.or]: [{ email: raw }, ...phoneVars],
      },
    });
  },

  async findById(id, role) {
    const Model = getModelByRole(role);
    return Model.findByPk(id, { attributes: PUBLIC_ATTRIBUTES });
  },

  async updateProfile(userId, role, data) {
    const Model = getModelByRole(role);
    const [count] = await Model.update(data, { where: { id: userId } });
    return count > 0;
  },

  async findByEmailExcludingId(email, role, excludeId) {
    const Model = getModelByRole(role);
    return Model.findOne({
      where: {
        email,
        id: { [Op.ne]: excludeId },
      },
    });
  },

  async findByPhoneExcludingId(phone, role, excludeId) {
    const Model = getModelByRole(role);
    return Model.findOne({
      where: {
        phone,
        id: { [Op.ne]: excludeId },
      },
    });
  },

  async updatePassword(userId, hashedPassword, role) {
    const Model = getModelByRole(role);
    await Model.update({ password: hashedPassword }, { where: { id: userId } });
  },

  async markPhoneVerified(userId, role) {
    const Model = getModelByRole(role);
    await Model.update({ isPhoneVerified: true }, { where: { id: userId } });
  },
};

module.exports = UserModel;
