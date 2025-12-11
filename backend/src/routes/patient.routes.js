const express = require('express');
const router = express.Router();

const patientController = require('../controllers/patient.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { updatePatientSchema, patientQuerySchema } = require('../validators/patient.validator');

// All routes require authentication
router.use(authenticate);

// Patient routes
router.get('/profile', authorize('PATIENT'), patientController.getMyProfile);
router.put('/profile', authorize('PATIENT'), validate(updatePatientSchema), patientController.updateMyProfile);

// Admin routes
router.get('/', authorize('ADMIN'), validate(patientQuerySchema, 'query'), patientController.getAllPatients);
router.get('/:id', authorize('ADMIN'), patientController.getPatientById);
router.patch('/:id/toggle-status', authorize('ADMIN'), patientController.toggleStatus);
router.delete('/:id', authorize('ADMIN'), patientController.deletePatient);

module.exports = router;
