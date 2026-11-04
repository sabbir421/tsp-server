const express = require('express');
const AdminController = require('../controller/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const router = express.Router();

// Public Admin Auth
router.post('/login', AdminController.login);

// Protected Admin Routes
router.use(authenticate, adminOnly);

router.get('/stats', AdminController.getDashboardStats);
router.get('/users', AdminController.getUsers);
router.patch('/users/:role/:id/status', AdminController.updateUserStatus);
router.patch('/users/:role/:id/badge', AdminController.updateUserBadge);
router.delete('/users/:role/:id', AdminController.deleteUser);

router.get('/reports', AdminController.getReports);
router.patch('/reports/:id/status', AdminController.updateReportStatus);

router.get('/posts', AdminController.getPosts);
router.post('/posts', AdminController.createPost);
router.put('/posts/:id', AdminController.updatePost);
router.delete('/posts/:id', AdminController.deletePost);

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
