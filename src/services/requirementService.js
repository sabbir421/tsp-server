const RequirementModel = require('../models/requirementModel');
const MatchModel = require('../models/matchModel');
const { REQUIREMENT_STATUS } = require('../schema/requirementSchema');

const toPlain = (record) => (record?.get ? record.get({ plain: true }) : record);

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const parseBool = (value) => value === true || value === 'true' || value === 'yes';

const formatBudget = (amount) => {
  const num = Number(amount);
  if (Number.isNaN(num)) return String(amount);

  if (num >= 10000000) {
    return `৳ ${(num / 10000000).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  }
  if (num >= 100000) {
    return `৳ ${(num / 100000).toFixed(2).replace(/\.?0+$/, '')} L`;
  }
  return `৳ ${num.toLocaleString('en-BD')}`;
};

const buildTitle = (req) => {
  if (!req) return '';
  const size = req.sizeSqFt ? `${req.sizeSqFt} sft ` : '';
  const location = [req.zone, req.city].filter(Boolean).join(', ');
  const subType = req.subType || 'Property';
  return `${size}${subType} in ${location || req.city || ''}`;
};

const buildSummary = (req) => {
  if (!req) return '';
  const parts = [
    req.category === 'residential' ? 'Residential' : 'Commercial',
    req.bedrooms ? `${req.bedrooms} Bed` : null,
    req.area ? `Sector: ${req.area}` : null,
  ].filter(Boolean);
  return parts.join(' · ');
};

const formatRequirement = (record) => {
  if (!record) return null;
  const data = toPlain(record);
  if (!data) return null;

  return {
    id: data.id,
    buyerId: data.buyerId,
    category: data.category,
    subType: data.subType || '',
    residentialNotes: data.residentialNotes || null,
    bedrooms: data.bedrooms || null,
    sizeSqFt: data.sizeSqFt || null,
    floor: data.floor || null,
    totalFloors: data.totalFloors || null,
    area: data.area || null,
    zone: data.zone || null,
    city: data.city || '',
    mustInclude: !!data.mustInclude,
    mustIncludeDetails: data.mustIncludeDetails || null,
    maxBudget: data.maxBudget || 0,
    budgetDisplay: formatBudget(data.maxBudget),
    status: data.status,
    statusLabel: data.status === 'active' ? 'Active' : data.status === 'matched' ? 'Matched' : 'Closed',
    title: buildTitle(data),
    summary: buildSummary(data),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

const formatRequirementForPublic = (record, suggestionsCount = 0) => {
  const formatted = formatRequirement(record);
  if (!formatted) return null;
  delete formatted.buyerId;
  return {
    ...formatted,
    sector: formatted.area || formatted.zone || '',
    budget: formatted.budgetDisplay || '',
    budgetNote: '',
    isLive: formatted.status === 'active',
    suggestionsCount,
    mustHaves: formatted.mustIncludeDetails ? [formatted.mustIncludeDetails] : [],
  };
};

const normalizePayload = (body) => {
  let category = body.category;
  if (!category) {
    const pType = (body.propType || body.type || body.subType || '').toLowerCase();
    category = pType.includes('commercial') || pType.includes('office') || pType.includes('shop') ? 'commercial' : 'residential';
  } else {
    category = category.toLowerCase();
  }

  const subType = body.subType?.trim() || body.type?.trim() || body.propType?.trim() || 'Apartment';

  const maxBudget = parseNumber(body.maxBudget) || parseNumber(body.budget) || parseNumber(body.minBudget);
  if (!maxBudget || maxBudget <= 0) {
    const err = new Error('Please enter a valid maximum budget');
    err.status = 400;
    throw err;
  }

  const locationStr = body.location || body.area || (Array.isArray(body.areas) ? body.areas[0] : '') || '';
  const city = body.city?.trim() || 'Dhaka';
  const area = body.area?.trim() || body.subArea?.trim() || locationStr.split(',')[0].trim() || 'Dhaka';
  const zone = body.zone?.trim() || locationStr.split(',')[1]?.trim() || null;

  return {
    category,
    subType,
    residentialNotes: category === 'residential' ? body.residentialNotes?.trim() || body.notes?.trim() || null : null,
    bedrooms: category === 'residential' ? String(body.bedrooms || body.beds || '').trim() || null : null,
    sizeSqFt: parseNumber(body.sizeSqFt || body.minSize),
    floor: parseNumber(body.floor),
    totalFloors: parseNumber(body.totalFloors),
    area,
    zone,
    city,
    mustInclude: parseBool(body.mustInclude),
    mustIncludeDetails: parseBool(body.mustInclude)
      ? body.mustIncludeDetails?.trim() || null
      : body.notes?.trim() || body.mustIncludeDetails?.trim() || null,
    maxBudget,
    status: REQUIREMENT_STATUS.ACTIVE,
  };
};

const RequirementService = {
  async create(buyerId, body) {
    let finalBuyerId = buyerId;
    if (!finalBuyerId) {
      const { BuyerTenant } = require('../schema');
      const bcrypt = require('bcryptjs');
      const phone = body.phone?.trim() || '01700000000';
      let buyer = await BuyerTenant.findOne({ where: { phone } });
      if (!buyer) {
        const email = body.email?.trim() || `buyer_${Date.now()}_${Math.floor(Math.random() * 1000)}@truespace.com.bd`;
        const hashedPassword = await bcrypt.hash('123456', 10);
        buyer = await BuyerTenant.create({
          fullName: body.name?.trim() || 'Verified Buyer',
          email,
          phone,
          password: hashedPassword,
          isPhoneVerified: true,
          verificationStatus: 'verified',
        });
      }
      finalBuyerId = buyer.id;
    }

    const data = normalizePayload(body);
    const id = await RequirementModel.create({ ...data, buyerId: finalBuyerId });
    const record = await RequirementModel.findById(id);
    return formatRequirement(record);
  },

  async getMine(buyerId) {
    const records = await RequirementModel.findAllByBuyer(buyerId);
    return records.map(formatRequirement);
  },

  async getById(buyerId, id) {
    const record = await RequirementModel.findByIdAndBuyer(id, buyerId);
    if (!record) {
      const err = new Error('Requirement not found');
      err.status = 404;
      throw err;
    }
    return formatRequirement(record);
  },

  async update(buyerId, id, body) {
    const existing = await RequirementModel.findByIdAndBuyer(id, buyerId);
    if (!existing) {
      const err = new Error('Requirement not found');
      err.status = 404;
      throw err;
    }

    const data = normalizePayload(body);
    await RequirementModel.update(id, buyerId, data);
    const record = await RequirementModel.findById(id);
    return formatRequirement(record);
  },

  async remove(buyerId, id) {
    const existing = await RequirementModel.findByIdAndBuyer(id, buyerId);
    if (!existing) {
      const err = new Error('Requirement not found');
      err.status = 404;
      throw err;
    }

    await MatchModel.deleteByRequirementId(id);
    const deleted = await RequirementModel.delete(id, buyerId);
    if (!deleted) {
      const err = new Error('Requirement not found');
      err.status = 404;
      throw err;
    }
    return { message: 'Requirement deleted successfully' };
  },

  async getPublic() {
    const records = await RequirementModel.findAllActive();
    const formatted = [];

    for (const record of records) {
      if (!record) continue;
      const req = formatRequirement(record);
      if (!req) continue;
      const suggestionsCount = await MatchModel.countByRequirement(req.id).catch(() => 0);
      delete req.buyerId;
      formatted.push({
        ...req,
        sector: req.area || req.zone || '',
        budget: req.budgetDisplay || '',
        isLive: req.status === 'active',
        suggestionsCount: suggestionsCount || 0,
        mustHaves: req.mustIncludeDetails ? [req.mustIncludeDetails] : [],
      });
    }

    return formatted;
  },
};

module.exports = RequirementService;
