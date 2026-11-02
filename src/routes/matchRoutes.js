const express = require('express');
const MatchController = require('../controller/matchController');
const { authenticate } = require('../middleware/authMiddleware');
const { sellerOnly } = require('../middleware/sellerMiddleware');
const { buyerOnly } = require('../middleware/buyerMiddleware');

const router = express.Router();

router.use(authenticate);

// Seller endpoints
router.get('/requirements', sellerOnly, MatchController.getActiveRequirements);
router.get('/requirements/:id', sellerOnly, MatchController.getActiveRequirement);
router.post('/', sellerOnly, MatchController.create);
router.get('/seller/mine', sellerOnly, MatchController.getSellerMatches);
router.get('/seller/site-visits', sellerOnly, MatchController.getSellerSiteVisits);
router.patch('/seller/:id/confirm-visit', sellerOnly, MatchController.confirmSiteVisit);
router.patch('/seller/:id/propose-time', sellerOnly, MatchController.proposeNewTime);
router.patch('/seller/:id/complete-visit', sellerOnly, MatchController.completeSiteVisit);

// Buyer endpoints
router.get('/buyer/mine', buyerOnly, MatchController.getBuyerMatches);
router.get('/buyer/stats', buyerOnly, MatchController.getBuyerStats);
router.get('/buyer/site-visits', buyerOnly, MatchController.getBuyerSiteVisits);
router.post('/buyer/:id/viewing-request', buyerOnly, MatchController.requestViewing);
router.patch('/buyer/:id/accept', buyerOnly, MatchController.acceptBuyerMatch);
router.patch('/buyer/:id/complete-visit', buyerOnly, MatchController.completeSiteVisit);

module.exports = router;
