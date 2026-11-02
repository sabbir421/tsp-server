const express = require('express');
const RequirementController = require('../controller/requirementController');
const { authenticate } = require('../middleware/authMiddleware');
const { buyerOnly } = require('../middleware/buyerMiddleware');
const { verifyToken } = require('../utils/jwt');

const router = express.Router();

const optionalBuyerAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch {}
  }
  next();
};

router.get('/public', RequirementController.getPublic);
router.post('/public', optionalBuyerAuth, RequirementController.create);
router.post('/', optionalBuyerAuth, RequirementController.create);

router.use(authenticate, buyerOnly);

router.get('/mine', RequirementController.getMine);
router.get('/:id', RequirementController.getOne);
router.put('/:id', RequirementController.update);
router.delete('/:id', RequirementController.remove);

module.exports = router;
