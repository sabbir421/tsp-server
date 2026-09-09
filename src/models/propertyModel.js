const { Op } = require('sequelize');
const { Property } = require('../schema');

const toPlain = (record) => (record?.get ? record.get({ plain: true }) : record);

const PropertyModel = {
  async create(data) {
    const property = await Property.create(data);
    return property.id;
  },

  async findById(id) {
    return Property.findByPk(id);
  },

  async findByIdAndSeller(id, sellerId) {
    return Property.findOne({ where: { id, sellerId } });
  },

  async findAllBySeller(sellerId) {
    return Property.findAll({
      where: { sellerId },
      order: [['createdAt', 'DESC']],
    });
  },

  async findAllAvailable() {
    return Property.findAll({
      where: {
        status: { [Op.in]: ['verified', 'pending', 'matched'] },
      },
      order: [['createdAt', 'DESC']],
    });
  },

  async update(id, sellerId, data) {
    const [count] = await Property.update(data, { where: { id, sellerId } });
    return count > 0;
  },

  async delete(id, sellerId) {
    const count = await Property.destroy({ where: { id, sellerId } });
    return count > 0;
  },

  async getStats(sellerId) {
    const properties = await Property.findAll({
      where: { sellerId },
      attributes: ['status', 'leads'],
    });

    const stats = {
      total: properties.length,
      verified: 0,
      matched: 0,
      pending: 0,
      totalLeads: 0,
    };

    properties.forEach((p) => {
      const row = toPlain(p);
      if (row.status === 'verified') stats.verified += 1;
      if (row.status === 'matched') stats.matched += 1;
      if (row.status === 'pending') stats.pending += 1;
      stats.totalLeads += row.leads || 0;
    });

    return stats;
  },

  async countBySeller(sellerId) {
    return Property.count({ where: { sellerId } });
  },
};

module.exports = PropertyModel;
