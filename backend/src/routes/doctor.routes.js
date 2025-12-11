const express = require('express');
const router = express.Router();

const doctorController = require('../controllers/doctor.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  updateDoctorSchema,
  availabilitySchema,
  bulkAvailabilitySchema,
  doctorQuerySchema,
  doctorSlotsQuerySchema,
} = require('../validators/doctor.validator');

// Public routes
router.get('/specializations', doctorController.getSpecializations);
router.get('/', validate(doctorQuerySchema, 'query'), doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/availability', doctorController.getAvailability);
router.get('/:id/slots', validate(doctorSlotsQuerySchema, 'query'), doctorController.getAvailableSlots);

// Protected routes
router.use(authenticate);

// Doctor routes
router.get('/me/profile', authorize('DOCTOR'), doctorController.getMyProfile);
router.put('/me/profile', authorize('DOCTOR'), validate(updateDoctorSchema), doctorController.updateMyProfile);
router.get('/me/availability', authorize('DOCTOR'), doctorController.getMyAvailability);
router.post('/me/availability', authorize('DOCTOR'), validate(availabilitySchema), doctorController.setAvailability);
router.post('/me/availability/bulk', authorize('DOCTOR'), validate(bulkAvailabilitySchema), doctorController.setBulkAvailability);

// Admin routes
router.patch('/:id/toggle-status', authorize('ADMIN'), doctorController.toggleStatus);
router.delete('/:id', authorize('ADMIN'), doctorController.deleteDoctor);

module.exports = router;
