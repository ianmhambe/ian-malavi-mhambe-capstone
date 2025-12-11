const express = require('express');
const router = express.Router();

const appointmentController = require('../controllers/appointment.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  appointmentQuerySchema,
} = require('../validators/appointment.validator');

// All routes require authentication
router.use(authenticate);

// Common routes
router.get('/', validate(appointmentQuerySchema, 'query'), appointmentController.getMyAppointments);
router.get('/upcoming', appointmentController.getUpcomingAppointments);
router.get('/:id', appointmentController.getAppointmentById);

// Patient routes
router.post('/', authorize('PATIENT'), validate(createAppointmentSchema), appointmentController.createAppointment);

// Doctor/Patient can update status
router.patch('/:id/status', authorize('PATIENT', 'DOCTOR'), validate(updateAppointmentStatusSchema), appointmentController.updateAppointmentStatus);

// Admin routes
router.get('/admin/all', authorize('ADMIN'), validate(appointmentQuerySchema, 'query'), appointmentController.getAllAppointments);

module.exports = router;
