const fs = require('fs');
const path = require('path');
const PropertyModel = require('../models/propertyModel');
const { PROPERTY_STATUS } = require('../schema/propertySchema');

const toPlain = (record) => (record?.get ? record.get({ plain: true }) : record);

const STATUS_LABELS = {
  pending: 'Pending Approval',
  verified: 'Verified',
  matched: 'Matched',
};

const parseJsonField = (value, fallback = []) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const parseBool = (value) => value === true || value === 'true' || value === 'yes';

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const formatPrice = (price, propertyFor) => {
  const num = Number(price);
  if (Number.isNaN(num)) return String(price);

  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  }
  if (num >= 100000) {
    return `${(num / 100000).toFixed(2).replace(/\.?0+$/, '')} L`;
  }
  if (propertyFor === 'rent') {
    return `${num.toLocaleString('en-BD')} /mo`;
  }
  return num.toLocaleString('en-BD');
};

const buildTitle = (property) => {
  const size = property.sizeSqFt ? `${property.sizeSqFt} sft ` : '';
  return `${size}${property.propertyType} in ${property.area}`;
};

const buildMeta = (property) => {
  const parts = [
    property.propertyFor === 'sale' ? 'Sale' : 'Rent',
    property.bedrooms ? `${property.bedrooms} Bed` : null,
    property.bathrooms ? `${property.bathrooms} Bath` : null,
  ].filter(Boolean);
  return parts.join(' • ');
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

const formatProperty = (record) => {
  const data = toPlain(record);
  const photoPaths = parsePhotos(data.photos);

  const cleanPhotos = photoPaths
    .filter((p) => typeof p === 'string' && p.trim())
    .map((p) => `/uploads/properties/${path.basename(p)}`);

  return {
    id: data.id,
    sellerId: data.sellerId,
    propertyType: data.propertyType,
    purpose: data.purpose,
    propertyFor: data.propertyFor,
    area: data.area,
    sector: data.sector,
    city: data.city,
    address: data.address,
    sizeSqFt: data.sizeSqFt,
    landAreaKatha: data.landAreaKatha,
    price: data.price,
    priceDisplay: formatPrice(data.price, data.propertyFor),
    priceNegotiable: data.priceNegotiable,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    balcony: data.balcony,
    floor: data.floor,
    totalFloors: data.totalFloors,
    amenities: parseJsonField(data.amenities, []),
    otherAmenity: data.otherAmenity,
    useMap: data.useMap,
    location: data.location,
    contactNumber: data.contactNumber,
    whatsappNumber: data.whatsappNumber,
    preferredContact: parseJsonField(data.preferredContact, []),
    bestTime: data.bestTime,
    photos: cleanPhotos,
    status: data.status,
    statusLabel: STATUS_LABELS[data.status] || data.status,
    views: data.views,
    leads: data.leads,
    title: buildTitle(data),
    meta: buildMeta(data),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

const formatPropertyForBrowse = (record) => {
  const formatted = formatProperty(record);
  delete formatted.contactNumber;
  delete formatted.whatsappNumber;
  delete formatted.preferredContact;
  delete formatted.bestTime;
  delete formatted.sellerId;
  return formatted;
};

const normalizeBody = (body) => ({
  propertyType: body.propertyType,
  purpose: body.purpose,
  propertyFor: body.propertyFor,
  area: body.area?.trim(),
  sector: body.sector?.trim() || null,
  city: body.city,
  address: body.address?.trim(),
  sizeSqFt: parseNumber(body.sizeSqFt),
  landAreaKatha: parseNumber(body.landAreaKatha),
  price: parseNumber(body.price),
  priceNegotiable: parseBool(body.priceNegotiable),
  bedrooms: body.bedrooms || null,
  bathrooms: body.bathrooms || null,
  balcony: body.balcony || null,
  floor: parseNumber(body.floor),
  totalFloors: parseNumber(body.totalFloors),
  amenities: parseJsonField(body.amenities),
  otherAmenity: body.otherAmenity?.trim() || null,
  useMap: parseBool(body.useMap),
  location: body.location?.trim() || null,
  contactNumber: body.contactNumber?.trim(),
  whatsappNumber: body.whatsappNumber?.trim() || null,
  preferredContact: parseJsonField(body.preferredContact),
  bestTime: body.bestTime || null,
});

const validatePropertyData = (data) => {
  if (!data.propertyType) throw { status: 400, message: 'Property type is required' };
  if (!data.area) throw { status: 400, message: 'Area / locality is required' };
  if (!data.city) throw { status: 400, message: 'City is required' };
  if (!data.address) throw { status: 400, message: 'Address is required' };
  if (!data.price || data.price <= 0) throw { status: 400, message: 'Valid price is required' };
  if (!data.contactNumber) throw { status: 400, message: 'Contact number is required' };
};

const getPhotoFilenames = (files) => (files || []).map((f) => f.filename);

const deletePhotoFiles = (photos) => {
  const uploadsDir = path.join(__dirname, '../../uploads/properties');
  (photos || []).forEach((photo) => {
    const filename = path.basename(photo);
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

const PropertyService = {
  async create(sellerId, body, files) {
    const data = normalizeBody(body);
    validatePropertyData(data);

    const photos = getPhotoFilenames(files);
    const propertyId = await PropertyModel.create({
      sellerId,
      ...data,
      photos,
      status: PROPERTY_STATUS.PENDING,
    });

    const property = await PropertyModel.findById(propertyId);
    return formatProperty(property);
  },

  async getMine(sellerId) {
    const properties = await PropertyModel.findAllBySeller(sellerId);
    return properties.map(formatProperty);
  },

  async getById(sellerId, id) {
    const property = await PropertyModel.findByIdAndSeller(id, sellerId);
    if (!property) {
      throw { status: 404, message: 'Property not found' };
    }
    return formatProperty(property);
  },

  async update(sellerId, id, body, files) {
    const existing = await PropertyModel.findByIdAndSeller(id, sellerId);
    if (!existing) {
      throw { status: 404, message: 'Property not found' };
    }

    const data = normalizeBody(body);
    validatePropertyData(data);

    const existingData = toPlain(existing);
    let photos = parsePhotos(existingData.photos);

    if (body.keepPhotos) {
      const keep = parseJsonField(body.keepPhotos);
      const removed = photos.filter((p) => !keep.includes(path.basename(p)));
      deletePhotoFiles(removed);
      photos = keep;
    }

    if (files?.length) {
      photos = [...photos, ...getPhotoFilenames(files)];
    }

    await PropertyModel.update(id, sellerId, { ...data, photos });
    const property = await PropertyModel.findById(id);
    return formatProperty(property);
  },

  async remove(sellerId, id) {
    const property = await PropertyModel.findByIdAndSeller(id, sellerId);
    if (!property) {
      throw { status: 404, message: 'Property not found' };
    }

    const data = toPlain(property);
    deletePhotoFiles(parsePhotos(data.photos));
    await PropertyModel.delete(id, sellerId);
    return { message: 'Property deleted successfully' };
  },

  async getStats(sellerId) {
    return PropertyModel.getStats(sellerId);
  },

  async getAvailable() {
    const properties = await PropertyModel.findAllAvailable();
    return properties.map(formatPropertyForBrowse);
  },

  async getPublicById(id) {
    const property = await PropertyModel.findById(id);
    if (!property) {
      throw { status: 404, message: 'Property not found' };
    }
    return formatPropertyForBrowse(property);
  },
};

module.exports = PropertyService;
