const { Op } = require('sequelize');
const { PropertyMatch } = require('../schema');

const MatchModel = {
  async create(data) {
    const record = await PropertyMatch.create(data);
    return record.id;
  },

  async findById(id) {
    return PropertyMatch.findByPk(id);
  },

  async findByIdAndBuyer(id, buyerId) {
    return PropertyMatch.findOne({ where: { id, buyerId } });
  },

  async findByIdAndSeller(id, sellerId) {
    return PropertyMatch.findOne({ where: { id, sellerId } });
  },

  async findByRequirementAndProperty(requirementId, propertyId) {
    return PropertyMatch.findOne({ where: { requirementId, propertyId } });
  },

  async findByRequirementAndSeller(requirementId, sellerId) {
    return PropertyMatch.findOne({ where: { requirementId, sellerId } });
  },

  async findRequirementIdsBySeller(sellerId) {
    const records = await PropertyMatch.findAll({
      where: { sellerId },
      attributes: ['requirementId'],
    });
    return records.map((r) => (r.get ? r.get({ plain: true }) : r).requirementId);
  },

  async findAllBySeller(sellerId) {
    return PropertyMatch.findAll({
      where: { sellerId },
      order: [['createdAt', 'DESC']],
    });
  },

  async findAllBySellerAndStatus(sellerId, status) {
    return PropertyMatch.findAll({
      where: { sellerId, status },
      order: [['createdAt', 'DESC']],
    });
  },

  async findAllByBuyer(buyerId) {
    return PropertyMatch.findAll({
      where: { buyerId },
      order: [['createdAt', 'DESC']],
    });
  },

  async findSiteVisitsBySeller(sellerId) {
    return PropertyMatch.findAll({
      where: {
        sellerId,
        [Op.or]: [
          { visitRequested: true },
          { status: 'interested' },
          { visitStatus: { [Op.in]: ['pending', 'confirmed', 'completed', 'rescheduled'] } },
        ],
      },
      order: [['updatedAt', 'DESC']],
    });
  },

  async findSiteVisitsByBuyer(buyerId) {
    return PropertyMatch.findAll({
      where: {
        buyerId,
        [Op.or]: [
          { visitRequested: true },
          { status: 'interested' },
          { visitStatus: { [Op.in]: ['pending', 'confirmed', 'completed', 'rescheduled'] } },
        ],
      },
      order: [['updatedAt', 'DESC']],
    });
  },

  async countByRequirement(requirementId) {
    return PropertyMatch.count({ where: { requirementId } });
  },

  async countBySeller(sellerId) {
    return PropertyMatch.count({ where: { sellerId } });
  },

  async countByBuyer(buyerId) {
    return PropertyMatch.count({ where: { buyerId } });
  },

  async updateStatus(id, status) {
    const [count] = await PropertyMatch.update({ status }, { where: { id } });
    return count > 0;
  },

  async updateVisitStatus(id, visitStatus) {
    const [count] = await PropertyMatch.update({ visitStatus }, { where: { id } });
    return count > 0;
  },

  async updateViewingRequest(id, visitData) {
    const [count] = await PropertyMatch.update(visitData, { where: { id } });
    return count > 0;
  },

  async deleteByRequirementId(requirementId) {
    return PropertyMatch.destroy({ where: { requirementId } });
  },
};

module.exports = MatchModel;
