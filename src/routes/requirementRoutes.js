const express = require('express');
const RequirementController = require('../controller/requirementController');
const { authenticate } = require('../middleware/authMiddleware');
const { buyerOnly } = require('../middleware/buyerMiddleware');

const router = express.Router();

router.use(authenticate, buyerOnly);

router.get('/mine', RequirementController.getMine);
router.get('/:id', RequirementController.getOne);
router.post('/', RequirementController.create);
router.put('/:id', RequirementController.update);
router.delete('/:id', RequirementController.remove);

module.exports = router;
