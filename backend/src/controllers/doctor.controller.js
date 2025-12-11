const doctorService = require('../services/doctor.service');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all doctors
 */
const getAllDoctors = asyncHandler(async (req, res) => {
  const result = await doctorService.getAllDoctors(req.query);
  sendPaginated(res, 'Doctors retrieved successfully', result.doctors, result.pagination);
});

/**
 * Get doctor by ID
 */
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await doctorService.getDoctorById(req.params.id);
  sendSuccess(res, 'Doctor retrieved successfully', doctor);
});

/**
 * Get current doctor profile
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const doctor = await doctorService.getDoctorProfile(req.user.id);
  sendSuccess(res, 'Profile retrieved successfully', doctor);
});

/**
 * Update current doctor profile
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const doctor = await doctorService.updateDoctorProfile(req.user.id, req.body);
  sendSuccess(res, 'Profile updated successfully', doctor);
});

/**
 * Get doctor availability
 */
const getAvailability = asyncHandler(async (req, res) => {
  const availability = await doctorService.getDoctorAvailability(req.params.id);
  sendSuccess(res, 'Availability retrieved successfully', availability);
});

/**
 * Set doctor availability (single day)
 */
const setAvailability = asyncHandler(async (req, res) => {
  const availability = await doctorService.setDoctorAvailability(req.user.id, req.body);
  sendSuccess(res, 'Availability set successfully', availability);
});

/**
 * Set doctor availability (bulk)
 */
const setBulkAvailability = asyncHandler(async (req, res) => {
  const { availability } = req.body;
  const result = await doctorService.setBulkAvailability(req.user.id, availability);
  sendSuccess(res, 'Availability set successfully', result);
});

/**
 * Get my availability
 */
const getMyAvailability = asyncHandler(async (req, res) => {
  const availability = await doctorService.getDoctorAvailability(req.user.id);
  sendSuccess(res, 'Availability retrieved successfully', availability);
});

/**
 * Get available slots for a specific date
 */
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const slots = await doctorService.getAvailableSlots(req.params.id, date);
  sendSuccess(res, 'Available slots retrieved successfully', slots);
});

/**
 * Get list of specializations
 */
const getSpecializations = asyncHandler(async (req, res) => {
  const specializations = await doctorService.getSpecializations();
  sendSuccess(res, 'Specializations retrieved successfully', specializations);
});

/**
 * Toggle doctor status (admin)
 */
const toggleStatus = asyncHandler(async (req, res) => {
  const doctor = await doctorService.toggleDoctorStatus(req.params.id);
  sendSuccess(res, `Doctor ${doctor.isActive ? 'activated' : 'deactivated'} successfully`, doctor);
});

/**
 * Delete doctor (admin)
 */
const deleteDoctor = asyncHandler(async (req, res) => {
  await doctorService.deleteDoctor(req.params.id);
  sendSuccess(res, 'Doctor deleted successfully');
});

module.exports = {
  getAllDoctors,
  getDoctorById,
  getMyProfile,
  updateMyProfile,
  getAvailability,
  setAvailability,
  setBulkAvailability,
  getMyAvailability,
  getAvailableSlots,
  getSpecializations,
  toggleStatus,
  deleteDoctor,
};
