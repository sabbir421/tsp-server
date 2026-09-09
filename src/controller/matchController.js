const MatchService = require('../services/matchService');
const { successResponse, errorResponse } = require('../utils/response');

const MatchController = {
  async getActiveRequirements(req, res) {
    try {
      const requirements = await MatchService.getActiveRequirements(req.user.id);
      return successResponse(res, requirements, 'Requirements fetched successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getActiveRequirement(req, res) {
    try {
      const requirement = await MatchService.getActiveRequirement(req.params.id, req.user.id);
      return successResponse(res, requirement, 'Requirement fetched successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async create(req, res) {
    try {
      const match = await MatchService.createMatch(req.user.id, req.body);
      return successResponse(res, match, 'Match sent to buyer successfully', 201);
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getSellerMatches(req, res) {
    try {
      const matches = await MatchService.getSellerMatches(req.user.id);
      return successResponse(res, matches, 'Matches fetched successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getBuyerMatches(req, res) {
    try {
      const matches = await MatchService.getBuyerMatches(req.user.id);
      return successResponse(res, matches, 'Matched properties fetched successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getBuyerStats(req, res) {
    try {
      const stats = await MatchService.getBuyerStats(req.user.id);
      return successResponse(res, stats, 'Match stats fetched successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async acceptBuyerMatch(req, res) {
    try {
      const match = await MatchService.acceptBuyerMatch(req.params.id, req.user.id);
      return successResponse(res, match, 'Match accepted successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getSellerSiteVisits(req, res) {
    try {
      const siteVisits = await MatchService.getSellerSiteVisits(req.user.id);
      return successResponse(res, siteVisits, 'Site visits fetched successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async getBuyerSiteVisits(req, res) {
    try {
      const siteVisits = await MatchService.getBuyerSiteVisits(req.user.id);
      return successResponse(res, siteVisits, 'Site visits fetched successfully');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },

  async completeSiteVisit(req, res) {
    try {
      const visit = await MatchService.completeSiteVisit(req.params.id, req.user.id, req.user.role);
      return successResponse(res, visit, 'Site visit marked as completed');
    } catch (error) {
      return errorResponse(res, error.message, error.status || 500);
    }
  },
};

module.exports = MatchController;
