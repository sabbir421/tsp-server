const RequirementService = require('../services/requirementService');
const { successResponse, errorResponse } = require('../utils/response');

const RequirementController = {
  async create(req, res) {
    try {
      const requirement = await RequirementService.create(req.user.id, req.body);
      return successResponse(res, requirement, 'Requirement created successfully', 201);
    } catch (error) {
      console.error('Error in requirementController.create:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getMine(req, res) {
    try {
      const requirements = await RequirementService.getMine(req.user.id);
      return successResponse(res, requirements, 'Requirements fetched successfully');
    } catch (error) {
      console.error('Error in requirementController.getMine:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getOne(req, res) {
    try {
      const requirement = await RequirementService.getById(req.user.id, req.params.id);
      return successResponse(res, requirement, 'Requirement fetched successfully');
    } catch (error) {
      console.error('Error in requirementController.getOne:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async update(req, res) {
    try {
      const requirement = await RequirementService.update(req.user.id, req.params.id, req.body);
      return successResponse(res, requirement, 'Requirement updated successfully');
    } catch (error) {
      console.error('Error in requirementController.update:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async remove(req, res) {
    try {
      const result = await RequirementService.remove(req.user.id, req.params.id);
      return successResponse(res, result, result.message);
    } catch (error) {
      console.error('Error in requirementController.remove:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getPublic(req, res) {
    try {
      const requirements = await RequirementService.getPublic();
      return successResponse(res, requirements, 'Requirements fetched successfully');
    } catch (error) {
      console.error('Error in requirementController.getPublic:', error);
      return errorResponse(res, error.message, error.status || 500);
    }
  },
};

module.exports = RequirementController;
