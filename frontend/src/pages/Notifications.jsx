import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { Bell, BellOff, Trash2, CheckCheck, Calendar, Clock, User } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useNotificationStore } from '../store/notificationStore';
import Button from '../components/Button';
import Spinner from '../components/Spinner';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'APPOINTMENT_REQUESTED':
    case 'APPOINTMENT_ACCEPTED':
    case 'APPOINTMENT_REJECTED':
    case 'APPOINTMENT_CANCELLED':
    case 'APPOINTMENT_COMPLETED':
      return Calendar;
    case 'APPOINTMENT_REMINDER':
      return Clock;
    default:
      return Bell;
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case 'APPOINTMENT_ACCEPTED':
    case 'APPOINTMENT_COMPLETED':
      return 'text-green-500 bg-green-100';
    case 'APPOINTMENT_REJECTED':
    case 'APPOINTMENT_CANCELLED':
      return 'text-red-500 bg-red-100';
    case 'APPOINTMENT_REMINDER':
      return 'text-yellow-500 bg-yellow-100';
    default:
      return 'text-blue-500 bg-blue-100';
  }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { decrementCount, setCount } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      decrementCount();
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      const notification = notifications.find((n) => n.id === notificationId);
      if (notification && !notification.isRead) {
        decrementCount();
      }
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-12">
          <BellOff className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-600">You&apos;re all caught up! Check back later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(notification.type);

            return (
              <div
                key={notification.id}
                className={`card flex items-start gap-4 ${
                  !notification.isRead ? 'bg-blue-50 border-l-4 border-l-primary-500' : ''
                }`}
              >
                <div className={`p-3 rounded-full ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">{notification.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                  <p className="text-gray-400 text-xs mt-2">
                    {format(parseISO(notification.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
