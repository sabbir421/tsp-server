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
  const size = req.sizeSqFt ? `${req.sizeSqFt} sft ` : '';
  const location = [req.zone, req.city].filter(Boolean).join(', ');
  return `${size}${req.subType} in ${location || req.city}`;
};

const buildSummary = (req) => {
  const parts = [
    req.category === 'residential' ? 'Residential' : 'Commercial',
    req.bedrooms ? `${req.bedrooms} Bed` : null,
    req.area ? `Sector: ${req.area}` : null,
  ].filter(Boolean);
  return parts.join(' · ');
};

const formatRequirementForPublic = (record, suggestionsCount = 0) => {
  const formatted = formatRequirement(record);
  delete formatted.buyerId;
  return {
    ...formatted,
    sector: formatted.area || formatted.zone,
    budget: formatted.budgetDisplay,
    budgetNote: '',
    isLive: formatted.status === 'active',
    suggestionsCount,
    mustHaves: formatted.mustIncludeDetails ? [formatted.mustIncludeDetails] : [],
  };
};
  const data = toPlain(record);

  return {
    id: data.id,
    buyerId: data.buyerId,
    category: data.category,
    subType: data.subType,
    residentialNotes: data.residentialNotes,
    bedrooms: data.bedrooms,
    sizeSqFt: data.sizeSqFt,
    floor: data.floor,
    totalFloors: data.totalFloors,
    area: data.area,
    zone: data.zone,
    city: data.city,
    mustInclude: data.mustInclude,
    mustIncludeDetails: data.mustIncludeDetails,
    maxBudget: data.maxBudget,
    budgetDisplay: formatBudget(data.maxBudget),
    status: data.status,
    statusLabel: data.status === 'active' ? 'Active' : data.status === 'matched' ? 'Matched' : 'Closed',
    title: buildTitle(data),
    summary: buildSummary(data),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

const normalizePayload = (body) => {
  const category = body.category;
  if (!category || !['residential', 'commercial'].includes(category)) {
    const err = new Error('Please select Residential or Commercial');
    err.status = 400;
    throw err;
  }

  if (!body.subType?.trim()) {
    const err = new Error('Please select a property type');
    err.status = 400;
    throw err;
  }

  const maxBudget = parseNumber(body.maxBudget);
  if (!maxBudget || maxBudget <= 0) {
    const err = new Error('Please enter a valid maximum budget');
    err.status = 400;
    throw err;
  }

  if (!body.city?.trim()) {
    const err = new Error('Please select a city');
    err.status = 400;
    throw err;
  }

  return {
    category,
    subType: body.subType.trim(),
    residentialNotes: category === 'residential' ? body.residentialNotes?.trim() || null : null,
    bedrooms: category === 'residential' ? body.bedrooms?.trim() || null : null,
    sizeSqFt: parseNumber(body.sizeSqFt),
    floor: parseNumber(body.floor),
    totalFloors: parseNumber(body.totalFloors),
    area: body.area?.trim() || null,
    zone: body.zone?.trim() || null,
    city: body.city.trim(),
    mustInclude: parseBool(body.mustInclude),
    mustIncludeDetails: parseBool(body.mustInclude)
      ? body.mustIncludeDetails?.trim() || null
      : null,
    maxBudget,
    status: REQUIREMENT_STATUS.ACTIVE,
  };
};

const RequirementService = {
  async create(buyerId, body) {
    const data = normalizePayload(body);
    const id = await RequirementModel.create({ ...data, buyerId });
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
      const req = formatRequirement(record);
      const suggestionsCount = await MatchModel.countByRequirement(req.id);
      delete req.buyerId;
      formatted.push({
        ...req,
        sector: req.area || req.zone,
        budget: req.budgetDisplay,
        isLive: req.status === 'active',
        suggestionsCount,
        mustHaves: req.mustIncludeDetails ? [req.mustIncludeDetails] : [],
      });
    }

    return formatted;
  },
};

module.exports = RequirementService;
