const MatchModel = require('../models/matchModel');
const RequirementModel = require('../models/requirementModel');
const PropertyModel = require('../models/propertyModel');
const UserModel = require('../models/userModel');
const { USER_ROLES } = require('../constants');
const { MATCH_STATUS, VISIT_STATUS } = require('../schema/matchSchema');

const toPlain = (record) => (record?.get ? record.get({ plain: true }) : record);

const formatBudget = (amount) => {
  const num = Number(amount);
  if (Number.isNaN(num)) return String(amount || '0');
  if (num >= 10000000) {
    return `৳ ${(num / 10000000).toFixed(2).replace(/\.?0+$/, '')} Crore`;
  }
  if (num >= 100000) {
    return `৳ ${(num / 100000).toFixed(2).replace(/\.?0+$/, '')} Lakh`;
  }
  return `৳ ${num.toLocaleString('en-BD')}`;
};

const formatPrice = (price, propertyFor) => {
  const num = Number(price);
  if (Number.isNaN(num)) return String(price || '0');
  if (num >= 10000000) {
    return `৳ ${(num / 10000000).toFixed(2).replace(/\.?0+$/, '')} Crore`;
  }
  if (num >= 100000) {
    return `৳ ${(num / 100000).toFixed(2).replace(/\.?0+$/, '')} Lakh`;
  }
  if (propertyFor === 'rent') {
    return `৳ ${num.toLocaleString('en-BD')} / month`;
  }
  return `৳ ${num.toLocaleString('en-BD')}`;
};

const buildRequirementTitle = (req) => {
  const size = req.sizeSqFt ? `${req.sizeSqFt} sft ` : '';
  const location = [req.zone, req.city].filter(Boolean).join(', ');
  return `${size}${req.subType || req.propertyType || 'Property'} in ${location || req.city || 'Dhaka'}`;
};

const buildPropertyTitle = (property) => {
  if (property.title && property.title.trim()) return property.title.trim();
  const size = property.sizeSqFt ? `${property.sizeSqFt} sft ` : '';
  return `${size}${property.propertyType || 'Property'} in ${property.area || 'Dhaka'}`;
};

const buildPropertyDetails = (property) => {
  const parts = [
    property.bedrooms ? `${property.bedrooms} Bed` : null,
    property.bathrooms ? `${property.bathrooms} Bath` : null,
    property.balcony ? `${property.balcony} Balcony` : null,
    property.floor ? `Floor ${property.floor}` : null,
  ].filter(Boolean);
  return parts.join(' · ');
};

const parsePhotos = (photos) => {
  if (Array.isArray(photos)) return photos;
  if (typeof photos === 'string') {
    try {
      const parsed = JSON.parse(photos);
      return Array.isArray(parsed) ? parsed : [];
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
  if (photo.startsWith('http') || photo.startsWith('blob:') || photo.startsWith('/uploads/')) return photo;
  return `/uploads/properties/${photo.split('/').pop()}`;
};

const formatPropertyDetailsForBuyer = (propData) => {
  if (!propData) return null;
  const photos = parsePhotos(propData.photos);
  const amenities = parseAmenities(propData.amenities);

  return {
    id: propData.id,
    title: buildPropertyTitle(propData),
    propertyType: propData.propertyType,
    purpose: propData.purpose,
    propertyFor: propData.propertyFor,
    area: propData.area,
    sector: propData.sector,
    city: propData.city,
    address: propData.address,
    location: propData.location,
    map: propData.map,
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

const computeMatchScore = (requirement, property) => {
  let score = 45;

  const reqBudget = Number(requirement.maxBudget || requirement.budget);
  const propPrice = Number(property.price);
  if (!Number.isNaN(reqBudget) && reqBudget > 0 && !Number.isNaN(propPrice)) {
    if (propPrice <= reqBudget) score += 25;
    else if (propPrice <= reqBudget * 1.1) score += 10;
  }

  if (requirement.bedrooms && property.bedrooms && String(requirement.bedrooms) === String(property.bedrooms)) {
    score += 15;
  }

  if (requirement.city && property.city && requirement.city.toLowerCase() === property.city.toLowerCase()) {
    score += 5;
  }

  if (requirement.zone && property.area) {
    if (property.area.toLowerCase().includes(requirement.zone.toLowerCase())) {
      score += 10;
    }
  }

  return Math.min(score, 98);
};

const MatchService = {
  async getActiveRequirements(sellerId) {
    const rawRequirements = await RequirementModel.findAllActive();
    const matchedRequirementIds = await MatchModel.findRequirementIdsBySeller(sellerId);

    return rawRequirements.map((record) => {
      const data = toPlain(record);
      const isMatched = matchedRequirementIds.includes(data.id);
      return {
        id: data.id,
        propertyType: data.propertyType,
        subType: data.subType,
        purpose: data.purpose,
        city: data.city,
        zone: data.zone,
        location: [data.zone, data.city].filter(Boolean).join(', ') || data.city,
        minBudget: data.minBudget,
        maxBudget: data.maxBudget,
        budgetDisplay: `${formatBudget(data.minBudget)} - ${formatBudget(data.maxBudget)}`,
        sizeSqFt: data.sizeSqFt,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        timeline: data.timeline,
        notes: data.notes,
        preferredAreas: data.preferredAreas || [],
        alreadyMatched: isMatched,
        createdAt: data.createdAt,
      };
    });
  },

  async getActiveRequirement(requirementId, sellerId) {
    const requirement = await RequirementModel.findById(requirementId);
    if (!requirement) {
      const err = new Error('Requirement not found');
      err.status = 404;
      throw err;
    }
    const data = toPlain(requirement);
    const matchedIds = await MatchModel.findRequirementIdsBySeller(sellerId);
    return {
      ...data,
      alreadyMatched: matchedIds.includes(data.id),
      budgetDisplay: `${formatBudget(data.minBudget)} - ${formatBudget(data.maxBudget)}`,
    };
  },

  async createMatch(sellerId, body) {
    const requirementId = Number(body.requirementId);
    const propertyId = Number(body.propertyId);
    const sellerNote = (body.sellerNote || '').trim() || null;

    if (!requirementId || !propertyId) {
      const err = new Error('Requirement ID and Property ID are required');
      err.status = 400;
      throw err;
    }

    const requirement = await RequirementModel.findById(requirementId);
    if (!requirement) {
      const err = new Error('Requirement not found');
      err.status = 404;
      throw err;
    }
    const reqData = toPlain(requirement);

    const property = await PropertyModel.findByIdAndSeller(propertyId, sellerId);
    if (!property) {
      const err = new Error('Property not found or does not belong to you');
      err.status = 404;
      throw err;
    }
    const propData = toPlain(property);

    // Enforce admin approval requirement:
    if (propData.status !== 'verified' && propData.status !== 'approved') {
      const err = new Error('This property is pending admin approval. You can only suggest properties that have been approved by admin.');
      err.status = 403;
      throw err;
    }

    const existingMatch = await MatchModel.findByRequirementAndProperty(requirementId, propertyId);
    if (existingMatch) {
      const err = new Error('You have already suggested this property for this requirement');
      err.status = 409;
      throw err;
    }

    const matchScore = computeMatchScore(reqData, propData);

    const matchId = await MatchModel.create({
      requirementId,
      propertyId,
      sellerId,
      buyerId: reqData.buyerId || reqData.userId,
      matchScore,
      sellerNote,
      status: MATCH_STATUS.SENT,
      visitStatus: VISIT_STATUS.PENDING,
      visitRequested: false,
    });

    const created = await MatchModel.findById(matchId);
    return toPlain(created);
  },

  async getSellerMatches(sellerId) {
    const records = await MatchModel.findAllBySeller(sellerId);
    return Promise.all(
      records.map(async (record) => {
        const data = toPlain(record);
        const requirement = await RequirementModel.findById(data.requirementId);
        const property = await PropertyModel.findById(data.propertyId);
        const buyer = await UserModel.findById(data.buyerId, USER_ROLES.BUYER_TENANT);

        const reqData = requirement ? toPlain(requirement) : null;
        const propData = property ? toPlain(property) : null;
        const buyerData = buyer ? toPlain(buyer) : null;

        return {
          id: data.id,
          requirementId: data.requirementId,
          propertyId: data.propertyId,
          matchScore: data.matchScore,
          sellerNote: data.sellerNote,
          status: data.status,
          visitRequested: !!data.visitRequested,
          visitStatus: data.visitStatus,
          visitDate: data.visitDate,
          visitSlot: data.visitSlot,
          visitMode: data.visitMode,
          visitPeople: data.visitPeople,
          visitNotes: data.visitNotes,
          visitRequestedAt: data.visitRequestedAt,
          proposedDate: data.proposedDate,
          proposedTime: data.proposedTime,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          requirement: reqData
            ? {
                id: reqData.id,
                title: buildRequirementTitle(reqData),
                budgetDisplay: `${formatBudget(reqData.minBudget)} - ${formatBudget(reqData.maxBudget)}`,
                location: [reqData.zone, reqData.city].filter(Boolean).join(', '),
              }
            : null,
          property: propData
            ? {
                id: propData.id,
                title: buildPropertyTitle(propData),
                priceDisplay: formatPrice(propData.price, propData.propertyFor),
                area: propData.area,
              }
            : null,
          buyer: (data.visitRequested || data.status === MATCH_STATUS.INTERESTED) && buyerData
            ? {
                fullName: data.buyerName || buyerData.fullName || 'Buyer',
                phone: data.buyerPhone || `${buyerData.countryCode || ''}${buyerData.phone || ''}`,
                email: data.buyerEmail || buyerData.email,
              }
            : null,
        };
      })
    );
  },

  async getBuyerMatches(buyerId) {
    const allRecords = await MatchModel.findAllByBuyer(buyerId);

    // Only include matches that have NOT had a viewing requested yet
    const records = allRecords.filter((record) => {
      const data = toPlain(record);
      return !data.visitRequested && data.status !== 'interested';
    });

    return Promise.all(
      records.map(async (record) => {
        const data = toPlain(record);
        const property = await PropertyModel.findById(data.propertyId);
        const requirement = await RequirementModel.findById(data.requirementId);
        const seller = await UserModel.findById(data.sellerId, USER_ROLES.SELLER_AGENT);

        const propData = property ? toPlain(property) : null;
        const reqData = requirement ? toPlain(requirement) : null;
        const sellerData = seller ? toPlain(seller) : null;

        const photos = parsePhotos(propData?.photos).map(normalizePhotoPath).filter(Boolean);

        const reqTitle = reqData
          ? `${reqData.bedrooms ? `${reqData.bedrooms}-bed ` : ''}${reqData.subType || reqData.category || 'Property'} to ${reqData.purpose || 'buy'}`
          : `Requirement #${data.requirementId}`;
        const reqLocation = reqData ? (reqData.area || reqData.zone || reqData.city || 'Dhaka') : 'Dhaka';
        const reqBudget = reqData && reqData.maxBudget ? formatBudget(reqData.maxBudget) : '';
        const reqSummary = `For REQ-${data.requirementId}: ${reqTitle} in ${reqLocation}${reqBudget ? ` · Max ${reqBudget}` : ''}`;

        return {
          id: data.id,
          propertyId: data.propertyId,
          requirementId: data.requirementId,
          title: propData ? buildPropertyTitle(propData) : 'Suggested Property',
          details: propData ? buildPropertyDetails(propData) : '',
          price: propData ? formatPrice(propData.price, propData.propertyFor) : '',
          priceRaw: propData?.price,
          area: propData?.area,
          image: photos[0] || null,
          photos: photos,
          matchScore: data.matchScore,
          sellerNote: data.sellerNote,
          status: data.status,
          statusLabel: data.status === 'interested' ? 'Accepted' : 'New Suggestion',
          visitRequested: !!data.visitRequested,
          visitStatus: data.visitStatus,
          visitDate: data.visitDate,
          visitSlot: data.visitSlot,
          visitMode: data.visitMode,
          proposedDate: data.proposedDate,
          proposedTime: data.proposedTime,
          requirement: {
            id: data.requirementId,
            title: reqTitle,
            location: reqLocation,
            maxBudget: reqData?.maxBudget,
            budgetDisplay: reqBudget,
            summary: reqSummary,
          },
          requirementTitle: reqSummary,
          property: propData ? {
            ...formatPropertyDetailsForBuyer(propData),
            photos,
            photo: photos[0] || null,
            contactNumber: propData.contactNumber || propData.ownerPhone,
            ownerName: propData.ownerName || sellerData?.fullName,
          } : null,
          seller: sellerData
            ? {
                fullName: sellerData.fullName || 'Property Owner',
                phone: `${sellerData.countryCode || ''}${sellerData.phone || ''}` || sellerData.phone || propData?.contactNumber || 'Contact directly',
                email: sellerData.email || '',
              }
            : (propData ? {
                fullName: propData.ownerName || 'Property Owner',
                phone: propData.contactNumber || propData.ownerPhone || 'Contact directly',
                email: '',
              } : null),
          createdAt: data.createdAt,
        };
      })
    );
  },

  async requestViewing(matchId, buyerId, body) {
    const id = Number(matchId);
    if (!id) {
      const err = new Error('Invalid match ID');
      err.status = 400;
      throw err;
    }

    const record = await MatchModel.findByIdAndBuyer(id, buyerId);
    if (!record) {
      const err = new Error('Suggestion match not found');
      err.status = 404;
      throw err;
    }

    const buyer = await UserModel.findById(buyerId, USER_ROLES.BUYER_TENANT);
    const buyerData = buyer ? toPlain(buyer) : {};

    const visitDate = (body.date || body.visitDate || '').trim();
    const visitSlot = (body.slot || body.visitSlot || 'Morning (10:00 - 12:30)').trim();
    const visitMode = (body.mode || body.visitMode || 'direct').trim();
    const visitPeople = Number(body.people || body.visitPeople || 1);
    const visitNotes = (body.notes || body.visitNotes || '').trim() || null;
    const buyerName = (body.buyerName || buyerData.fullName || 'Buyer').trim();
    const buyerPhone = (body.buyerPhone || buyerData.phone || '').trim();
    const buyerEmail = (body.buyerEmail || buyerData.email || '').trim();

    if (!visitDate) {
      const err = new Error('Preferred visit date is required');
      err.status = 400;
      throw err;
    }

    await MatchModel.updateViewingRequest(id, {
      status: MATCH_STATUS.INTERESTED,
      visitRequested: true,
      visitStatus: VISIT_STATUS.PENDING,
      visitDate,
      visitSlot,
      visitMode,
      visitPeople,
      visitNotes,
      visitRequestedAt: new Date(),
      buyerName,
      buyerPhone,
      buyerEmail,
    });

    const updated = await MatchModel.findById(id);
    return toPlain(updated);
  },

  async acceptBuyerMatch(matchId, buyerId) {
    const id = Number(matchId);
    const record = await MatchModel.findByIdAndBuyer(id, buyerId);
    if (!record) {
      const err = new Error('Match not found');
      err.status = 404;
      throw err;
    }

    await MatchModel.updateStatus(id, MATCH_STATUS.INTERESTED);
    const updated = await MatchModel.findById(id);
    return toPlain(updated);
  },

  async getSellerSiteVisits(sellerId) {
    const records = await MatchModel.findSiteVisitsBySeller(sellerId);

    return Promise.all(
      records.map(async (record) => {
        const data = toPlain(record);
        const property = await PropertyModel.findById(data.propertyId);
        const requirement = await RequirementModel.findById(data.requirementId);
        const buyer = await UserModel.findById(data.buyerId, USER_ROLES.BUYER_TENANT);

        const propData = property ? toPlain(property) : null;
        const reqData = requirement ? toPlain(requirement) : null;
        const buyerData = buyer ? toPlain(buyer) : null;

        const photos = parsePhotos(propData?.photos).map(normalizePhotoPath).filter(Boolean);

        return {
          id: data.id,
          matchId: data.id,
          propertyId: data.propertyId,
          requirementId: data.requirementId,
          visitRequested: !!data.visitRequested,
          visitDate: data.visitDate || (data.updatedAt ? new Date(data.updatedAt).toISOString().split('T')[0] : '2026-10-31'),
          visitSlot: data.visitSlot || 'Morning (10:00 - 12:30)',
          visitMode: data.visitMode || 'direct',
          visitPeople: data.visitPeople || 1,
          visitNotes: data.visitNotes || '',
          visitRequestedAt: data.visitRequestedAt || data.updatedAt,
          visitStatus: data.visitStatus || 'pending',
          proposedDate: data.proposedDate,
          proposedTime: data.proposedTime,
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
                contactNumber: propData.ownerPhone || propData.contactNumber,
                photo: photos[0] || null,
              }
            : null,
          buyer: {
            id: buyerData?.id || data.buyerId,
            fullName: data.buyerName || buyerData?.fullName || 'Interested Buyer / Tenant',
            phone: data.buyerPhone || (buyerData ? `${buyerData.countryCode || ''}${buyerData.phone || ''}` : '017XXXXXXXX'),
            email: data.buyerEmail || buyerData?.email || 'buyer@example.com',
            isPhoneVerified: !!buyerData?.isPhoneVerified || true,
            isEmailVerified: !!buyerData?.isEmailVerified || true,
          },
        };
      })
    );
  },

  async getBuyerSiteVisits(buyerId) {
    const records = await MatchModel.findSiteVisitsByBuyer(buyerId);

    return Promise.all(
      records.map(async (record) => {
        const data = toPlain(record);
        const property = await PropertyModel.findById(data.propertyId);
        const requirement = await RequirementModel.findById(data.requirementId);
        const seller = await UserModel.findById(data.sellerId, USER_ROLES.SELLER_AGENT);

        const propData = property ? toPlain(property) : null;
        const reqData = requirement ? toPlain(requirement) : null;
        const sellerData = seller ? toPlain(seller) : null;
        const photos = parsePhotos(propData?.photos).map(normalizePhotoPath).filter(Boolean);

        return {
          id: data.id,
          matchId: data.id,
          propertyId: data.propertyId,
          requirementId: data.requirementId,
          visitDate: data.visitDate || '2026-10-31',
          visitSlot: data.visitSlot || 'Morning (10:00 - 12:30)',
          visitMode: data.visitMode || 'direct',
          visitStatus: data.visitStatus || 'pending',
          proposedDate: data.proposedDate,
          proposedTime: data.proposedTime,
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
                contactNumber: propData.ownerPhone || propData.contactNumber,
                photo: photos[0] || null,
              }
            : null,
          seller: sellerData
            ? {
                id: sellerData.id,
                fullName: sellerData.fullName,
                phone: `${sellerData.countryCode || ''}${sellerData.phone || ''}`,
                email: sellerData.email,
                isPhoneVerified: !!sellerData.isPhoneVerified,
              }
            : null,
        };
      })
    );
  },

  async confirmSiteVisit(matchId, sellerId) {
    const id = Number(matchId);
    const record = await MatchModel.findByIdAndSeller(id, sellerId);
    if (!record) {
      const err = new Error('Visit request not found');
      err.status = 404;
      throw err;
    }

    await MatchModel.updateVisitStatus(id, VISIT_STATUS.CONFIRMED);
    const updated = await MatchModel.findById(id);
    return toPlain(updated);
  },

  async proposeNewTime(matchId, sellerId, body) {
    const id = Number(matchId);
    const record = await MatchModel.findByIdAndSeller(id, sellerId);
    if (!record) {
      const err = new Error('Visit request not found');
      err.status = 404;
      throw err;
    }

    const proposedDate = (body.proposedDate || body.date || '').trim();
    const proposedTime = (body.proposedTime || body.time || '').trim();

    if (!proposedDate || !proposedTime) {
      const err = new Error('Proposed date and time are required');
      err.status = 400;
      throw err;
    }

    await MatchModel.updateViewingRequest(id, {
      visitStatus: VISIT_STATUS.RESCHEDULED,
      proposedDate,
      proposedTime,
    });

    const updated = await MatchModel.findById(id);
    return toPlain(updated);
  },

  async completeSiteVisit(matchId, userId, role) {
    const id = Number(matchId);
    const isBuyer = role === USER_ROLES.BUYER_TENANT;
    const record = isBuyer
      ? await MatchModel.findByIdAndBuyer(id, userId)
      : await MatchModel.findByIdAndSeller(id, userId);

    if (!record) {
      const err = new Error('Site visit not found');
      err.status = 404;
      throw err;
    }

    await MatchModel.updateVisitStatus(id, VISIT_STATUS.COMPLETED);
    const updated = await MatchModel.findById(id);
    return toPlain(updated);
  },

  async getBuyerStats(buyerId) {
    const total = await MatchModel.countByBuyer(buyerId);
    return { total, newMatches: total };
  },
};

module.exports = MatchService;
