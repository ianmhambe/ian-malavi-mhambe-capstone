const appointmentService = require('../services/appointment.service');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Create a new appointment
 */
const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.createAppointment(req.user.id, req.body);
  sendSuccess(res, 'Appointment created successfully', appointment, 201);
});

/**
 * Get appointments for current user
 */
const getMyAppointments = asyncHandler(async (req, res) => {
  const result = await appointmentService.getAppointments(req.user.id, req.user.role, req.query);
  sendPaginated(res, 'Appointments retrieved successfully', result.appointments, result.pagination);
});

/**
 * Get appointment by ID
 */
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.getAppointmentById(
    req.params.id,
    req.user.id,
    req.user.role
  );
  sendSuccess(res, 'Appointment retrieved successfully', appointment);
});

/**
 * Update appointment status
 */
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.updateAppointmentStatus(
    req.params.id,
    req.user.id,
    req.user.role,
    req.body
  );
  sendSuccess(res, 'Appointment status updated successfully', appointment);
});

/**
 * Get upcoming appointments
 */
const getUpcomingAppointments = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const appointments = await appointmentService.getUpcomingAppointments(
    req.user.id,
    req.user.role,
    limit
  );
  sendSuccess(res, 'Upcoming appointments retrieved successfully', appointments);
});

/**
 * Get all appointments (admin)
 */
const getAllAppointments = asyncHandler(async (req, res) => {
  const result = await appointmentService.getAllAppointments(req.query);
  sendPaginated(res, 'Appointments retrieved successfully', result.appointments, result.pagination);
});

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getUpcomingAppointments,
  getAllAppointments,
};
