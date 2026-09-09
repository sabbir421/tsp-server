const express = require('express');
const PropertyController = require('../controller/propertyController');
const { authenticate } = require('../middleware/authMiddleware');
const { sellerOnly } = require('../middleware/sellerMiddleware');
const { uploadPropertyPhotos } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/available', authenticate, PropertyController.getAvailable);

router.use(authenticate, sellerOnly);

router.get('/mine/stats', PropertyController.getStats);
router.get('/mine', PropertyController.getMine);
router.get('/:id', PropertyController.getOne);
router.post('/', uploadPropertyPhotos.array('photos', 10), PropertyController.create);
router.put('/:id', uploadPropertyPhotos.array('photos', 10), PropertyController.update);
router.delete('/:id', PropertyController.remove);

module.exports = router;
