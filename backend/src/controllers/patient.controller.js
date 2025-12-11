const patientService = require('../services/patient.service');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all patients
 */
const getAllPatients = asyncHandler(async (req, res) => {
  const result = await patientService.getAllPatients(req.query);
  sendPaginated(res, 'Patients retrieved successfully', result.patients, result.pagination);
});

/**
 * Get patient by ID
 */
const getPatientById = asyncHandler(async (req, res) => {
  const patient = await patientService.getPatientById(req.params.id);
  sendSuccess(res, 'Patient retrieved successfully', patient);
});

/**
 * Get current patient profile
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const patient = await patientService.getPatientProfile(req.user.id);
  sendSuccess(res, 'Profile retrieved successfully', patient);
});

/**
 * Update current patient profile
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const patient = await patientService.updatePatientProfile(req.user.id, req.body);
  sendSuccess(res, 'Profile updated successfully', patient);
});

/**
 * Toggle patient status (admin)
 */
const toggleStatus = asyncHandler(async (req, res) => {
  const patient = await patientService.togglePatientStatus(req.params.id);
  sendSuccess(res, `Patient ${patient.isActive ? 'activated' : 'deactivated'} successfully`, patient);
});

/**
 * Delete patient (admin)
 */
const deletePatient = asyncHandler(async (req, res) => {
  await patientService.deletePatient(req.params.id);
  sendSuccess(res, 'Patient deleted successfully');
});

module.exports = {
  getAllPatients,
  getPatientById,
  getMyProfile,
  updateMyProfile,
  toggleStatus,
  deletePatient,
};
