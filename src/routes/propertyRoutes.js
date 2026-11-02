const express = require('express');
const PropertyController = require('../controller/propertyController');
const { authenticate } = require('../middleware/authMiddleware');
const { sellerOnly } = require('../middleware/sellerMiddleware');
const { uploadPropertyFiles } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/public', PropertyController.getAvailable);
router.get('/public/:id', PropertyController.getPublicById);
router.get('/available', authenticate, PropertyController.getAvailable);

router.use(authenticate, sellerOnly);

router.post('/upload', uploadPropertyFiles.any(), PropertyController.uploadFiles);
router.get('/mine/stats', PropertyController.getStats);
router.get('/mine', PropertyController.getMine);
router.get('/:id', PropertyController.getOne);
router.post('/', uploadPropertyFiles.any(), PropertyController.create);
router.put('/:id', uploadPropertyFiles.any(), PropertyController.update);
router.delete('/:id', PropertyController.remove);

module.exports = router;
