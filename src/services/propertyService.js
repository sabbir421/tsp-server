const path = require('path');
const PropertyModel = require('../models/propertyModel');
const { PROPERTY_STATUS } = require('../schema/propertySchema');
const { uploadMulterFiles, uploadMulterFile } = require('../utils/s3Service');

const toPlain = (record) => (record?.get ? record.get({ plain: true }) : record);

const STATUS_LABELS = {
  pending: 'Pending Approval',
  verified: 'Verified',
  matched: 'Matched',
};

const parseJsonField = (value, fallback = []) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;
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
  if (Number.isNaN(num) || !num) return String(price || '0');

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

const buildTitle = (p) => {
  if (p.title && p.title.trim()) return p.title.trim();
  const cat = p.cat || p.propertyType || 'Property';
  const beds = p.bedrooms ? `${p.bedrooms}-bed ` : '';
  const area = p.area || 'Dhaka';
  return `${beds}${cat} in ${area}`;
};

const SQFT_MAP = {
  Katha: 720,
  Bigha: 14400,
  'Square Feet': 1,
  Acre: 43560,
};

const formatProperty = (record) => {
  const data = toPlain(record);
  const photos = parseJsonField(data.photos, []);
  const documents = parseJsonField(data.documents, []);
  const mx = parseJsonField(data.mx, {});
  const vt = parseJsonField(data.vt, {});

  return {
    id: data.id,
    sellerId: data.sellerId,
    title: data.title || buildTitle(data),
    provider: data.provider || 'Owner',
    propertyType: data.propertyType,
    cat: data.mx?.cat || (data.propertyType === 'Plot' ? 'Land' : data.propertyType === 'Commercial' ? 'Commercial Space' : 'Flat'),
    purpose: data.purpose || (data.propertyFor === 'rent' ? 'Rent' : 'Sale'),
    propertyFor: data.propertyFor,
    area: data.area,
    sector: data.sector,
    city: data.city || 'Dhaka',
    address: data.address,
    map: data.map,
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
    ownerName: data.ownerName,
    ownerPhone: data.ownerPhone || data.contactNumber,
    visit: data.visit,
    photos,
    floorPlan: data.floorPlan,
    videoUrl: data.videoUrl,
    documents,
    mx,
    vt,
    status: data.status || 'pending',
    statusLabel: STATUS_LABELS[data.status] || data.status,
    views: data.views || 0,
    leads: data.leads || 0,
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
  delete formatted.address; // private in TSP
  delete formatted.ownerPhone;
  return formatted;
};

const normalizeBody = (body) => {
  const mx = parseJsonField(body.mx, {});
  const vt = parseJsonField(body.vt, {});

  const purpose = body.purpose || (body.propertyFor === 'rent' ? 'Rent' : 'Sale');
  const propertyFor = (body.propertyFor || (purpose === 'Rent' ? 'rent' : 'sale')).toLowerCase();

  const cat = body.cat || (body.propertyType === 'Plot' ? 'Land' : body.propertyType === 'Commercial' ? 'Commercial Space' : 'Flat');
  let propertyType = body.propertyType;
  if (!propertyType) {
    if (cat === 'Land') propertyType = 'Plot';
    else if (cat === 'Commercial Space') propertyType = 'Commercial';
    else propertyType = mx.aptType || 'Apartment';
  }

  // Calculate size in sqft
  let sizeSqFt = parseNumber(body.sizeSqFt || mx.size);
  let landAreaKatha = parseNumber(body.landAreaKatha);
  if (cat === 'Land' && mx.lsize) {
    const lsize = Number(mx.lsize);
    const multiplier = SQFT_MAP[mx.lunit] || 720;
    if (lsize > 0) {
      sizeSqFt = Math.round(lsize * multiplier);
      if (mx.lunit === 'Katha') landAreaKatha = lsize;
      else landAreaKatha = Number((sizeSqFt / 720).toFixed(2));
    }
  }

  // Calculate price
  const price = parseNumber(body.price || mx.price) || 0;

  const bedrooms = cat === 'Flat' ? String(mx.beds || body.bedrooms || '') : null;
  const bathrooms = cat === 'Land' ? null : String(mx.baths || body.bathrooms || '');
  const balcony = cat === 'Flat' ? String(mx.balc || body.balcony || '') : null;
  const floor = cat === 'Land' ? '-' : String(mx.flevel || body.floor || '');
  const totalFloors = parseNumber(mx.tfloors || body.totalFloors);

  const amenities = Array.isArray(mx.amen)
    ? mx.amen
    : parseJsonField(body.amenities, []);

  const contactNumber = (body.ownerPhone || body.contactNumber || '').trim();
  const ownerName = (body.ownerName || '').trim();
  const ownerPhone = (body.ownerPhone || contactNumber).trim();

  return {
    title: (body.title || '').trim(),
    provider: body.provider || 'Owner',
    propertyType,
    purpose,
    propertyFor,
    area: (body.area || '').trim(),
    sector: (body.sector || '').trim() || null,
    city: body.city || 'Dhaka',
    address: (body.address || '').trim(),
    map: body.map || null,
    sizeSqFt,
    landAreaKatha,
    price,
    priceNegotiable: parseBool(body.priceNegotiable),
    bedrooms,
    bathrooms,
    balcony,
    floor,
    totalFloors,
    amenities,
    otherAmenity: body.otherAmenity?.trim() || null,
    useMap: parseBool(body.useMap ?? true),
    location: body.location?.trim() || null,
    contactNumber: contactNumber || '01000000000',
    whatsappNumber: body.whatsappNumber?.trim() || null,
    preferredContact: parseJsonField(body.preferredContact, []),
    bestTime: body.bestTime || null,
    ownerName,
    ownerPhone,
    visit: body.visit || 'Weekends',
    floorPlan: body.floorPlan || null,
    videoUrl: body.videoUrl || null,
    mx,
    vt,
  };
};

const validatePropertyData = (data) => {
  if (!data.propertyType) throw { status: 400, message: 'Property type is required' };
  if (!data.area) throw { status: 400, message: 'Property area / location is required' };
  if (!data.address) throw { status: 400, message: 'Property exact address is required' };
  if (!data.price || data.price <= 0) throw { status: 400, message: 'Valid price is required' };
};

const PropertyService = {
  async create(sellerId, body, files) {
    const data = normalizeBody(body);
    validatePropertyData(data);

    // Process uploaded files with AWS S3
    let photos = parseJsonField(body.photos, []);
    let documents = parseJsonField(body.documents, []);
    let floorPlan = body.floorPlan || null;

    if (Array.isArray(files) && files.length > 0) {
      const photoFiles = files.filter((f) => f.fieldname === 'photos' || f.fieldname === 'photo');
      const docFiles = files.filter((f) => f.fieldname === 'documents' || f.fieldname.includes('doc'));
      const fpFiles = files.filter((f) => f.fieldname === 'floorPlan');

      if (photoFiles.length) {
        const uploadedPhotos = await uploadMulterFiles(photoFiles, 'properties');
        photos = [...photos, ...uploadedPhotos];
      }

      if (docFiles.length) {
        const uploadedDocs = await uploadMulterFiles(docFiles, 'documents');
        documents = [...documents, ...uploadedDocs];
      }

      if (fpFiles.length) {
        floorPlan = await uploadMulterFile(fpFiles[0], 'floorplans');
      }

      // Handle any verification tag files
      const vtFiles = files.filter((f) => f.fieldname.startsWith('vt_'));
      if (vtFiles.length && data.vt) {
        for (const file of vtFiles) {
          const uploadedUrl = await uploadMulterFile(file, 'verification');
          // Add to data.vt structure if needed
          data.vt.uploadedUrls = data.vt.uploadedUrls || [];
          data.vt.uploadedUrls.push({ name: file.originalname, url: uploadedUrl });
        }
      }
    }

    const propertyId = await PropertyModel.create({
      sellerId,
      ...data,
      photos,
      documents,
      floorPlan,
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
    let photos = parseJsonField(existingData.photos, []);
    let documents = parseJsonField(existingData.documents, []);
    let floorPlan = existingData.floorPlan;

    if (body.keepPhotos) {
      const keep = parseJsonField(body.keepPhotos, []);
      photos = keep;
    }

    if (Array.isArray(files) && files.length > 0) {
      const photoFiles = files.filter((f) => f.fieldname === 'photos' || f.fieldname === 'photo');
      const docFiles = files.filter((f) => f.fieldname === 'documents' || f.fieldname.includes('doc'));
      const fpFiles = files.filter((f) => f.fieldname === 'floorPlan');

      if (photoFiles.length) {
        const uploadedPhotos = await uploadMulterFiles(photoFiles, 'properties');
        photos = [...photos, ...uploadedPhotos];
      }
      if (docFiles.length) {
        const uploadedDocs = await uploadMulterFiles(docFiles, 'documents');
        documents = [...documents, ...uploadedDocs];
      }
      if (fpFiles.length) {
        floorPlan = await uploadMulterFile(fpFiles[0], 'floorplans');
      }
    }

    await PropertyModel.update(id, sellerId, {
      ...data,
      photos,
      documents,
      floorPlan,
    });

    const property = await PropertyModel.findById(id);
    return formatProperty(property);
  },

  async remove(sellerId, id) {
    const property = await PropertyModel.findByIdAndSeller(id, sellerId);
    if (!property) {
      throw { status: 404, message: 'Property not found' };
    }
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
    const property = await PropertyModel.findPublicById(id);
    if (!property) {
      throw { status: 404, message: 'Property not found' };
    }
    return formatPropertyForBrowse(property);
  },
};

module.exports = PropertyService;
