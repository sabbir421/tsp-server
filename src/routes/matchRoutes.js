const express = require('express');
const MatchController = require('../controller/matchController');
const { authenticate } = require('../middleware/authMiddleware');
const { sellerOnly } = require('../middleware/sellerMiddleware');
const { buyerOnly } = require('../middleware/buyerMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/requirements', sellerOnly, MatchController.getActiveRequirements);
router.get('/requirements/:id', sellerOnly, MatchController.getActiveRequirement);
router.post('/', sellerOnly, MatchController.create);
router.get('/seller/mine', sellerOnly, MatchController.getSellerMatches);
router.get('/seller/site-visits', sellerOnly, MatchController.getSellerSiteVisits);
router.patch('/seller/:id/complete-visit', sellerOnly, MatchController.completeSiteVisit);

router.get('/buyer/mine', buyerOnly, MatchController.getBuyerMatches);
router.get('/buyer/stats', buyerOnly, MatchController.getBuyerStats);
router.get('/buyer/site-visits', buyerOnly, MatchController.getBuyerSiteVisits);
router.patch('/buyer/:id/accept', buyerOnly, MatchController.acceptBuyerMatch);
router.patch('/buyer/:id/complete-visit', buyerOnly, MatchController.completeSiteVisit);

module.exports = router;
