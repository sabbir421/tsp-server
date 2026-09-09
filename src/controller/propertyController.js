const PropertyService = require('../services/propertyService');
const { successResponse, errorResponse } = require('../utils/response');

const PropertyController = {
  async create(req, res) {
    try {
      const property = await PropertyService.create(req.user.id, req.body, req.files);
      return successResponse(res, property, 'Property submitted for review', 201);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getMine(req, res) {
    try {
      const properties = await PropertyService.getMine(req.user.id);
      return successResponse(res, properties, 'Properties fetched successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getOne(req, res) {
    try {
      const property = await PropertyService.getById(req.user.id, req.params.id);
      return successResponse(res, property, 'Property fetched successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async update(req, res) {
    try {
      const property = await PropertyService.update(req.user.id, req.params.id, req.body, req.files);
      return successResponse(res, property, 'Property updated successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async remove(req, res) {
    try {
      const result = await PropertyService.remove(req.user.id, req.params.id);
      return successResponse(res, result, result.message);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getStats(req, res) {
    try {
      const stats = await PropertyService.getStats(req.user.id);
      return successResponse(res, stats, 'Stats fetched successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getAvailable(req, res) {
    try {
      const properties = await PropertyService.getAvailable();
      return successResponse(res, properties, 'Available properties fetched successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },
};

module.exports = PropertyController;
