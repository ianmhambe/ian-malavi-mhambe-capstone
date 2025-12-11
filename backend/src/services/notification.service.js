const prisma = require('../config/database');
const { calculatePagination } = require('../utils/apiResponse');

class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(userId, title, message, type = 'system', metadata = null) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        metadata,
      },
    });

    return notification;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications,
      pagination: calculatePagination(total, page, limit),
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: { isRead: true },
    });

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return true;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    return true;
  }

  /**
   * Delete all notifications for user
   */
  async clearAllNotifications(userId) {
    await prisma.notification.deleteMany({
      where: { userId },
    });

    return true;
  }
}

module.exports = new NotificationService();
