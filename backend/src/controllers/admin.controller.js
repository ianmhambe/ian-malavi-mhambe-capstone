const adminService = require('../services/admin.service');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get dashboard metrics
 */
const getMetrics = asyncHandler(async (req, res) => {
  const metrics = await adminService.getMetrics();
  sendSuccess(res, 'Metrics retrieved successfully', metrics);
});

/**
 * Get all users
 */
const getUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getUsers(req.query);
  sendPaginated(res, 'Users retrieved successfully', result.users, result.pagination);
});

/**
 * Toggle user status
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await adminService.toggleUserStatus(req.params.id);
  sendSuccess(res, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, user);
});

/**
 * Delete user
 */
const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.params.id);
  sendSuccess(res, 'User deleted successfully');
});

/**
 * Get specialization statistics
 */
const getSpecializationStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getSpecializationStats();
  sendSuccess(res, 'Specialization stats retrieved successfully', stats);
});

module.exports = {
  getMetrics,
  getUsers,
  toggleUserStatus,
  deleteUser,
  getSpecializationStats,
};
