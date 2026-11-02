const PropertyService = require('../services/propertyService');
const { uploadMulterFile } = require('../utils/s3Service');
const { successResponse, errorResponse } = require('../utils/response');

const PropertyController = {
  async uploadFiles(req, res) {
    try {
      const files = req.files || [];
      if (!files.length) {
        return errorResponse(res, 'No files provided for upload', 400);
      }

      const uploaded = await Promise.all(
        files.map(async (file) => {
          const folder = file.fieldname === 'documents' || file.fieldname.includes('doc')
            ? 'documents'
            : file.fieldname.includes('video')
            ? 'videos'
            : 'properties';
          const url = await uploadMulterFile(file, folder);
          return {
            fieldname: file.fieldname,
            originalname: file.originalname,
            url,
            size: file.size,
            mimetype: file.mimetype,
          };
        })
      );

      return successResponse(res, uploaded, 'Files uploaded successfully to S3', 201);
    } catch (error) {
      console.error('Error in propertyController.uploadFiles:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async create(req, res) {
    try {
      const property = await PropertyService.create(req.user.id, req.body, req.files);
      return successResponse(res, property, 'Property submitted for review', 201);
    } catch (error) {
      console.error('Error in propertyController.create:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getMine(req, res) {
    try {
      const properties = await PropertyService.getMine(req.user.id);
      return successResponse(res, properties, 'Properties fetched successfully');
    } catch (error) {
      console.error('Error in propertyController.getMine:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getOne(req, res) {
    try {
      const property = await PropertyService.getById(req.user.id, req.params.id);
      return successResponse(res, property, 'Property fetched successfully');
    } catch (error) {
      console.error('Error in propertyController.getOne:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async update(req, res) {
    try {
      const property = await PropertyService.update(req.user.id, req.params.id, req.body, req.files);
      return successResponse(res, property, 'Property updated successfully');
    } catch (error) {
      console.error('Error in propertyController.update:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async remove(req, res) {
    try {
      const result = await PropertyService.remove(req.user.id, req.params.id);
      return successResponse(res, result, result.message);
    } catch (error) {
      console.error('Error in propertyController.remove:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getStats(req, res) {
    try {
      const stats = await PropertyService.getStats(req.user.id);
      return successResponse(res, stats, 'Stats fetched successfully');
    } catch (error) {
      console.error('Error in propertyController.getStats:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getAvailable(req, res) {
    try {
      const properties = await PropertyService.getAvailable();
      return successResponse(res, properties, 'Available properties fetched successfully');
    } catch (error) {
      console.error('Error in propertyController.getAvailable:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getPublicById(req, res) {
    try {
      const property = await PropertyService.getPublicById(req.params.id);
      return successResponse(res, property, 'Property fetched successfully');
    } catch (error) {
      console.error('Error in propertyController.getPublicById:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },
};

module.exports = PropertyController;
