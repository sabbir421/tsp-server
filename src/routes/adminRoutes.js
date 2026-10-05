const express = require('express');
const AdminController = require('../controller/adminController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Public Admin Auth
router.post('/login', AdminController.login);

// Protected Admin Routes (Accepts bearer token or admin token)
router.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
});

router.get('/stats', AdminController.getDashboardStats);
router.get('/users', AdminController.getUsers);
router.patch('/users/:role/:id/status', AdminController.updateUserStatus);
router.delete('/users/:role/:id', AdminController.deleteUser);

router.get('/properties', AdminController.getProperties);
router.patch('/properties/:id/status', AdminController.updatePropertyStatus);
router.delete('/properties/:id', AdminController.deleteProperty);

router.get('/requirements', AdminController.getRequirements);
router.delete('/requirements/:id', AdminController.deleteRequirement);

router.get('/matches', AdminController.getMatches);
router.get('/otp-logs', AdminController.getOtpLogs);

router.get('/admins', AdminController.getAdmins);
router.post('/admins', AdminController.createAdmin);
router.delete('/admins/:id', AdminController.deleteAdmin);

module.exports = router;
