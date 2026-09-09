const MatchModel = require('../models/matchModel');
const RequirementModel = require('../models/requirementModel');
const PropertyModel = require('../models/propertyModel');
const UserModel = require('../models/userModel');
const { USER_ROLES } = require('../constants');
const { MATCH_STATUS, VISIT_STATUS } = require('../schema/matchSchema');

const toPlain = (record) => (record?.get ? record.get({ plain: true }) : record);

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

const formatPrice = (price, propertyFor) => {
  const num = Number(price);
  if (Number.isNaN(num)) return String(price);
  if (num >= 10000000) {
    return `৳ ${(num / 10000000).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  }
  if (num >= 100000) {
    return `৳ ${(num / 100000).toFixed(2).replace(/\.?0+$/, '')} L`;
  }
  if (propertyFor === 'rent') {
    return `৳ ${num.toLocaleString('en-BD')} /mo`;
  }
  return `৳ ${num.toLocaleString('en-BD')}`;
};

const buildRequirementTitle = (req) => {
  const size = req.sizeSqFt ? `${req.sizeSqFt} sft ` : '';
  const location = [req.zone, req.city].filter(Boolean).join(', ');
  return `${size}${req.subType} in ${location || req.city}`;
};

const buildPropertyTitle = (property) => {
  const size = property.sizeSqFt ? `${property.sizeSqFt} sft ` : '';
  return `${size}${property.propertyType} in ${property.area}`;
};

const buildPropertyDetails = (property) => {
  const parts = [
    property.bedrooms ? `${property.bedrooms} Bed` : null,
    property.bathrooms ? `${property.bathrooms} Bath` : null,
    property.balcony ? `${property.balcony} Balcony` : null,
  ].filter(Boolean);
  return parts.join(' · ');
};

const parsePhotos = (photos) => {
  if (Array.isArray(photos)) return photos;
  if (typeof photos === 'string') {
    try {
      return JSON.parse(photos);
    } catch {
      return [];
    }
  }
  return [];
};

const parseAmenities = (amenities) => {
  if (Array.isArray(amenities)) return amenities;
  if (typeof amenities === 'string') {
    try {
      const parsed = JSON.parse(amenities);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizePhotoPath = (photo) => {
  if (!photo) return null;
  if (photo.startsWith('/uploads/')) return photo;
  return `/uploads/properties/${photo.split('/').pop()}`;
};

/** Full listing details for buyers — never includes contact / seller identity. */
const formatPropertyDetailsForBuyer = (propData) => {
  if (!propData) return null;
  const photos = parsePhotos(propData.photos);
  const amenities = parseAmenities(propData.amenities);

  return {
    id: propData.id,
    propertyType: propData.propertyType,
    purpose: propData.purpose,
    propertyFor: propData.propertyFor,
    area: propData.area,
    sector: propData.sector,
    city: propData.city,
    address: propData.address,
    location: propData.location,
    sizeSqFt: propData.sizeSqFt,
    landAreaKatha: propData.landAreaKatha,
    price: propData.price,
    priceDisplay: formatPrice(propData.price, propData.propertyFor),
    priceNegotiable: !!propData.priceNegotiable,
    bedrooms: propData.bedrooms,
    bathrooms: propData.bathrooms,
    balcony: propData.balcony,
    floor: propData.floor,
    totalFloors: propData.totalFloors,
    amenities,
    otherAmenity: propData.otherAmenity || null,
    status: propData.status,
    photos: photos.map(normalizePhotoPath).filter(Boolean),
  };
};

const getMatchStatusLabel = (status) => {
  if (status === MATCH_STATUS.SENT) return 'Sent';
  if (status === MATCH_STATUS.VIEWED) return 'Viewed';
  if (status === MATCH_STATUS.INTERESTED) return 'Accepted';
  if (status === MATCH_STATUS.DECLINED) return 'Declined';
  return 'Unknown';
};

const computeMatchScore = (requirement, property) => {
  let score = 40;

  const reqBudget = Number(requirement.maxBudget);
  const propPrice = Number(property.price);
  if (!Number.isNaN(reqBudget) && !Number.isNaN(propPrice)) {
    if (propPrice <= reqBudget) score += 25;
    else if (propPrice <= reqBudget * 1.1) score += 10;
  }

  if (requirement.bedrooms && property.bedrooms && requirement.bedrooms === property.bedrooms) {
    score += 15;
  }

  if (requirement.city && property.city && requirement.city.toLowerCase() === property.city.toLowerCase()) {
    score += 10;
  }

  if (requirement.zone) {
    const zone = requirement.zone.toLowerCase();
    const area = (property.area || '').toLowerCase();
    const location = (property.location || '').toLowerCase();
    if (area.includes(zone) || location.includes(zone)) score += 10;
  }

  if (requirement.sizeSqFt && property.sizeSqFt) {
    const ratio =
      Math.min(Number(requirement.sizeSqFt), Number(property.sizeSqFt)) /
      Math.max(Number(requirement.sizeSqFt), Number(property.sizeSqFt));
    score += Math.round(ratio * 10);
  }

  return Math.min(100, Math.max(0, score));
};

const formatRequirementForSeller = (record) => {
  const data = toPlain(record);
  return {
    id: data.id,
    buyerRef: `Buyer #${data.buyerId}`,
    category: data.category,
    categoryLabel: data.category === 'residential' ? 'Residential' : 'Commercial',
    subType: data.subType,
    bedrooms: data.bedrooms,
    sizeSqFt: data.sizeSqFt,
    area: data.area,
    zone: data.zone,
    city: data.city,
    maxBudget: data.maxBudget,
    budgetDisplay: formatBudget(data.maxBudget),
    title: buildRequirementTitle(data),
    summary: [
      data.category === 'residential' ? 'Residential' : 'Commercial',
      data.bedrooms ? `${data.bedrooms} Bed` : null,
      data.zone,
      data.city,
    ]
      .filter(Boolean)
      .join(' · '),
    mustInclude: data.mustInclude,
    mustIncludeDetails: data.mustIncludeDetails,
    residentialNotes: data.residentialNotes,
    createdAt: data.createdAt,
    isNew: Date.now() - new Date(data.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
  };
};

const formatMatchForSeller = async (record) => {
  const data = toPlain(record);
  const requirement = await RequirementModel.findById(data.requirementId);
  const property = await PropertyModel.findById(data.propertyId);
  const reqData = requirement ? toPlain(requirement) : null;
  const propData = property ? toPlain(property) : null;

  return {
    id: data.id,
    requirementId: data.requirementId,
    propertyId: data.propertyId,
    matchScore: data.matchScore,
    sellerNote: data.sellerNote,
    status: data.status,
    statusLabel: getMatchStatusLabel(data.status),
    title: reqData && propData
      ? `${buildPropertyTitle(propData)} → ${buildRequirementTitle(reqData)}`
      : 'Match suggestion',
    requirementTitle: reqData ? buildRequirementTitle(reqData) : null,
    propertyTitle: propData ? buildPropertyTitle(propData) : null,
    createdAt: data.createdAt,
  };
};

const formatMatchForBuyer = async (record) => {
  const data = toPlain(record);
  const requirement = await RequirementModel.findById(data.requirementId);
  const property = await PropertyModel.findById(data.propertyId);
  const reqData = requirement ? toPlain(requirement) : null;
  const propData = property ? toPlain(property) : null;
  const propertyDetails = formatPropertyDetailsForBuyer(propData);
  const photos = propertyDetails?.photos || [];

  return {
    id: data.id,
    matchScore: data.matchScore,
    sellerNote: data.sellerNote,
    status: data.status,
    statusLabel: propData?.status === 'verified' ? 'Verified' : 'Pending',
    requirementTitle: reqData ? buildRequirementTitle(reqData) : null,
    price: propData ? formatPrice(propData.price, propData.propertyFor) : null,
    title: propData ? buildPropertyTitle(propData) : 'Property match',
    details: propData ? buildPropertyDetails(propData) : null,
    image: photos[0] || null,
    // Full property details before and after accept — contact stays gated to site visits
    property: propertyDetails,
    createdAt: data.createdAt,
  };
};

const MatchService = {
  async getActiveRequirements(sellerId) {
    const records = await RequirementModel.findAllActive();
    const matchedIds = new Set(await MatchModel.findRequirementIdsBySeller(sellerId));

    return records.map((record) => {
      const formatted = formatRequirementForSeller(record);
      return {
        ...formatted,
        alreadyMatched: matchedIds.has(formatted.id),
      };
    });
  },

  async getActiveRequirement(id, sellerId) {
    const record = await RequirementModel.findActiveById(id);
    if (!record) {
      const err = new Error('Requirement not found or no longer active');
      err.status = 404;
      throw err;
    }
    const formatted = formatRequirementForSeller(record);
    const existing = await MatchModel.findByRequirementAndSeller(id, sellerId);
    return {
      ...formatted,
      alreadyMatched: !!existing,
    };
  },

  async createMatch(sellerId, body) {
    const requirementId = Number(body.requirementId);
    const propertyId = Number(body.propertyId);

    if (!requirementId || !propertyId) {
      const err = new Error('Requirement and property are required');
      err.status = 400;
      throw err;
    }

    const requirement = await RequirementModel.findActiveById(requirementId);
    if (!requirement) {
      const err = new Error('Requirement not found or no longer active');
      err.status = 404;
      throw err;
    }

    const property = await PropertyModel.findByIdAndSeller(propertyId, sellerId);
    if (!property) {
      const err = new Error('Property not found or does not belong to you');
      err.status = 404;
      throw err;
    }

    const alreadySent = await MatchModel.findByRequirementAndSeller(requirementId, sellerId);
    if (alreadySent) {
      const err = new Error('You have already sent a match for this requirement. Only one match is allowed.');
      err.status = 409;
      throw err;
    }

    const existing = await MatchModel.findByRequirementAndProperty(requirementId, propertyId);
    if (existing) {
      const err = new Error('This property has already been matched to this requirement');
      err.status = 409;
      throw err;
    }

    const reqData = toPlain(requirement);
    const propData = toPlain(property);
    const matchScore = computeMatchScore(reqData, propData);

    const id = await MatchModel.create({
      requirementId,
      propertyId,
      sellerId,
      buyerId: reqData.buyerId,
      matchScore,
      sellerNote: body.sellerNote?.trim() || null,
      status: MATCH_STATUS.SENT,
    });

    const record = await MatchModel.findById(id);
    return formatMatchForSeller(record);
  },

  async getSellerMatches(sellerId) {
    const records = await MatchModel.findAllBySeller(sellerId);
    return Promise.all(records.map(formatMatchForSeller));
  },

  async getBuyerMatches(buyerId) {
    const records = await MatchModel.findAllByBuyer(buyerId);
    return Promise.all(records.map(formatMatchForBuyer));
  },

  async acceptBuyerMatch(matchId, buyerId) {
    const id = Number(matchId);
    if (!id) {
      const err = new Error('Invalid match id');
      err.status = 400;
      throw err;
    }

    const record = await MatchModel.findByIdAndBuyer(id, buyerId);
    if (!record) {
      const err = new Error('Match not found');
      err.status = 404;
      throw err;
    }

    const current = toPlain(record);
    if (current.status === MATCH_STATUS.DECLINED) {
      const err = new Error('Declined matches cannot be accepted');
      err.status = 409;
      throw err;
    }

    if (current.status !== MATCH_STATUS.INTERESTED) {
      await MatchModel.updateStatus(id, MATCH_STATUS.INTERESTED);
    }

    const updated = await MatchModel.findById(id);
    return formatMatchForBuyer(updated);
  },

  async getSellerSiteVisits(sellerId) {
    const records = await MatchModel.findAllBySellerAndStatus(sellerId, MATCH_STATUS.INTERESTED);

    const visits = await Promise.all(
      records.map(async (record) => {
        const data = toPlain(record);
        const property = await PropertyModel.findById(data.propertyId);
        const requirement = await RequirementModel.findById(data.requirementId);
        const buyer = await UserModel.findById(data.buyerId, USER_ROLES.BUYER_TENANT);

        const propData = property ? toPlain(property) : null;
        const reqData = requirement ? toPlain(requirement) : null;
        const buyerData = buyer ? toPlain(buyer) : null;

        return {
          id: data.id,
          visitStatus: data.visitStatus || VISIT_STATUS.PENDING,
          visitStatusLabel: data.visitStatus === VISIT_STATUS.COMPLETED ? 'Completed' : 'Pending',
          acceptedAt: data.updatedAt,
          createdAt: data.createdAt,
          matchScore: data.matchScore,
          sellerNote: data.sellerNote,
          requirementTitle: reqData ? buildRequirementTitle(reqData) : null,
          property: propData
            ? {
                id: propData.id,
                title: buildPropertyTitle(propData),
                details: buildPropertyDetails(propData),
                priceDisplay: formatPrice(propData.price, propData.propertyFor),
                area: propData.area,
                city: propData.city,
                address: propData.address,
                contactNumber: propData.contactNumber,
              }
            : null,
          buyer: buyerData
            ? {
                id: buyerData.id,
                fullName: buyerData.fullName,
                email: buyerData.email,
                phone: `${buyerData.countryCode || ''}${buyerData.phone || ''}`,
                isPhoneVerified: !!buyerData.isPhoneVerified,
                isEmailVerified: !!buyerData.isEmailVerified,
              }
            : null,
        };
      })
    );

    return visits;
  },

  async getBuyerSiteVisits(buyerId) {
    const records = await MatchModel.findAllByBuyer(buyerId);
    const accepted = records.filter((r) => toPlain(r).status === MATCH_STATUS.INTERESTED);

    const visits = await Promise.all(
      accepted.map(async (record) => {
        const data = toPlain(record);
        const property = await PropertyModel.findById(data.propertyId);
        const requirement = await RequirementModel.findById(data.requirementId);
        const seller = await UserModel.findById(data.sellerId, USER_ROLES.SELLER_AGENT);

        const propData = property ? toPlain(property) : null;
        const reqData = requirement ? toPlain(requirement) : null;
        const sellerData = seller ? toPlain(seller) : null;

        return {
          id: data.id,
          visitStatus: data.visitStatus || VISIT_STATUS.PENDING,
          visitStatusLabel: data.visitStatus === VISIT_STATUS.COMPLETED ? 'Completed' : 'Pending',
          acceptedAt: data.updatedAt,
          createdAt: data.createdAt,
          matchScore: data.matchScore,
          sellerNote: data.sellerNote,
          requirementTitle: reqData ? buildRequirementTitle(reqData) : null,
          property: propData
            ? {
                id: propData.id,
                title: buildPropertyTitle(propData),
                details: buildPropertyDetails(propData),
                priceDisplay: formatPrice(propData.price, propData.propertyFor),
                area: propData.area,
                city: propData.city,
                address: propData.address,
                contactNumber: propData.contactNumber,
              }
            : null,
          seller: sellerData
            ? {
                id: sellerData.id,
                fullName: sellerData.fullName,
                email: sellerData.email,
                phone: `${sellerData.countryCode || ''}${sellerData.phone || ''}`,
                isPhoneVerified: !!sellerData.isPhoneVerified,
                isEmailVerified: !!sellerData.isEmailVerified,
              }
            : null,
        };
      })
    );

    return visits;
  },

  async completeSiteVisit(matchId, userId, role) {
    const id = Number(matchId);
    if (!id) {
      const err = new Error('Invalid match id');
      err.status = 400;
      throw err;
    }

    const isBuyer = role === USER_ROLES.BUYER_TENANT;
    const record = isBuyer
      ? await MatchModel.findByIdAndBuyer(id, userId)
      : await MatchModel.findByIdAndSeller(id, userId);

    if (!record) {
      const err = new Error('Site visit not found');
      err.status = 404;
      throw err;
    }

    const current = toPlain(record);
    if (current.status !== MATCH_STATUS.INTERESTED) {
      const err = new Error('Only accepted matches can be marked as visited');
      err.status = 409;
      throw err;
    }

    if (current.visitStatus !== VISIT_STATUS.COMPLETED) {
      await MatchModel.updateVisitStatus(id, VISIT_STATUS.COMPLETED);
    }

    if (isBuyer) {
      const visits = await this.getBuyerSiteVisits(userId);
      return visits.find((v) => v.id === id);
    }

    const visits = await this.getSellerSiteVisits(userId);
    return visits.find((v) => v.id === id);
  },

  async getBuyerStats(buyerId) {
    const total = await MatchModel.countByBuyer(buyerId);
    const recent = await MatchModel.findAllByBuyer(buyerId);
    const newCount = recent.filter(
      (m) => Date.now() - new Date(toPlain(m).createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;

    return {
      total,
      newMatches: newCount,
    };
  },
};

module.exports = MatchService;
