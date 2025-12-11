const notificationService = require('../services/notification.service');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get user notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const result = await notificationService.getUserNotifications(req.user.id, page, limit);
  sendPaginated(res, 'Notifications retrieved successfully', result.notifications, result.pagination);
});

/**
 * Get unread notification count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  sendSuccess(res, 'Unread count retrieved successfully', { count });
});

/**
 * Mark notification as read
 */
const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.params.id, req.user.id);
  sendSuccess(res, 'Notification marked as read');
});

/**
 * Mark all notifications as read
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  sendSuccess(res, 'All notifications marked as read');
});

/**
 * Delete notification
 */
const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user.id);
  sendSuccess(res, 'Notification deleted successfully');
});

/**
 * Clear all notifications
 */
const clearAllNotifications = asyncHandler(async (req, res) => {
  await notificationService.clearAllNotifications(req.user.id);
  sendSuccess(res, 'All notifications cleared');
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
