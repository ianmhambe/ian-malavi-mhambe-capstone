const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticate, authorize('ADMIN'));

router.get('/metrics', adminController.getMetrics);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.get('/specializations/stats', adminController.getSpecializationStats);

module.exports = router;
