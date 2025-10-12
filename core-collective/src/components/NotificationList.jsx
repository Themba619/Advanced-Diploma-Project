import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTimes } from 'react-icons/fa';
import NotificationModal from './NotificationModal';
import './NotificationList.css';

const NotificationList = ({ userEmail, onNotificationUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (userEmail) {
      fetchNotifications();
    }
  }, [userEmail]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/notifications/user/${encodeURIComponent(userEmail)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Notify parent component about unread count
      if (onNotificationUpdate) {
        onNotificationUpdate(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <FaExclamationTriangle className="notification-item-icon warning" />;
      case 'info':
        return <FaInfoCircle className="notification-item-icon info" />;
      case 'success':
        return <FaCheckCircle className="notification-item-icon success" />;
      default:
        return <FaInfoCircle className="notification-item-icon info" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/notifications/read/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userEmail }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true, read_at: new Date().toISOString() }
              : notification
          )
        );

        // Update selected notification if it's the same one
        if (selectedNotification && selectedNotification.id === notificationId) {
          setSelectedNotification(prev => ({
            ...prev,
            is_read: true,
            read_at: new Date().toISOString()
          }));
        }

        // Update unread count in parent
        const unreadCount = notifications.filter(n => !n.is_read && n.id !== notificationId).length;
        if (onNotificationUpdate) {
          onNotificationUpdate(unreadCount);
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userEmail }),
      });

      if (response.ok) {
        // Update all notifications to read
        setNotifications(prev => 
          prev.map(notification => ({
            ...notification,
            is_read: true,
            read_at: new Date().toISOString()
          }))
        );

        // Update unread count in parent
        if (onNotificationUpdate) {
          onNotificationUpdate(0);
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  if (loading) {
    return (
      <div className="notification-list-container">
        <div className="notification-loading">
          <div className="loading-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notification-list-container">
        <div className="notification-error">
          <p>{error}</p>
          <button onClick={fetchNotifications} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const hasUnreadNotifications = notifications.some(n => !n.is_read);

  return (
    <div className="notification-list-container">
      <div className="notification-list-header">
        <h3>Notifications</h3>
        {hasUnreadNotifications && (
          <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="no-notifications">
          <FaCheckCircle className="no-notifications-icon" />
          <p>No notifications yet</p>
          <span>Stay tuned for announcements and updates!</span>
          <div className="upcoming-features">
            <h4>🎁 What's Coming Soon:</h4>
            <ul>
              <li>New features and improvements</li>
              <li>Community updates</li>
              <li>Important announcements</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.is_read ? 'unread' : ''} ${notification.type === 'warning' ? 'warning' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-item-content">
                <div className="notification-item-header">
                  {getNotificationIcon(notification.type)}
                  <div className="notification-item-title">
                    {notification.title}
                    {!notification.is_read && <span className="unread-dot"></span>}
                  </div>
                </div>
                <p className="notification-item-message">
                  {notification.message.length > 100 
                    ? `${notification.message.substring(0, 100)}...` 
                    : notification.message}
                </p>
                <div className="notification-item-meta">
                  <span className="notification-item-date">
                    {formatDate(notification.created_at)}
                  </span>
                  {notification.post_title && (
                    <span className="notification-item-post">
                      "{notification.post_title}"
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NotificationModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={closeModal}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
};

export default NotificationList;