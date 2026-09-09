const { Requirement } = require('../schema');

const RequirementModel = {
  async create(data) {
    const record = await Requirement.create(data);
    return record.id;
  },

  async findById(id) {
    return Requirement.findByPk(id);
  },

  async findByIdAndBuyer(id, buyerId) {
    return Requirement.findOne({ where: { id, buyerId } });
  },

  async findAllByBuyer(buyerId) {
    return Requirement.findAll({
      where: { buyerId },
      order: [['createdAt', 'DESC']],
    });
  },

  async findAllActive() {
    return Requirement.findAll({
      where: { status: 'active' },
      order: [['createdAt', 'DESC']],
    });
  },

  async findActiveById(id) {
    return Requirement.findOne({ where: { id, status: 'active' } });
  },

  async update(id, buyerId, data) {
    const [count] = await Requirement.update(data, { where: { id, buyerId } });
    return count > 0;
  },

  async delete(id, buyerId) {
    const count = await Requirement.destroy({ where: { id, buyerId } });
    return count > 0;
  },
};

module.exports = RequirementModel;
