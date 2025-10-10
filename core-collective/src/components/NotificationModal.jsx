import React, { useState } from 'react';
import { FaTimes, FaExclamationTriangle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import './NotificationModal.css';

const NotificationModal = ({ notification, isOpen, onClose, onMarkAsRead }) => {
  if (!isOpen || !notification) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <FaExclamationTriangle className="notification-icon warning" />;
      case 'info':
        return <FaInfoCircle className="notification-icon info" />;
      case 'success':
        return <FaCheckCircle className="notification-icon success" />;
      default:
        return <FaInfoCircle className="notification-icon info" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMarkAsRead = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-modal-header">
          <div className="notification-header-content">
            {getNotificationIcon(notification.type)}
            <h2 className="notification-title">{notification.title}</h2>
          </div>
          <button className="notification-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="notification-modal-body">
          <div className="notification-meta">
            <span className="notification-date">{formatDate(notification.created_at)}</span>
            {!notification.is_read && (
              <span className="notification-unread-badge">New</span>
            )}
          </div>

          <div className="notification-content">
            <p className="notification-message">{notification.message}</p>
            
            {notification.post_title && (
              <div className="notification-details">
                <h4>Related Post:</h4>
                <p className="related-post">"{notification.post_title}"</p>
              </div>
            )}

            {notification.reason && (
              <div className="notification-details">
                <h4>Reason:</h4>
                <p className="notification-reason">{notification.reason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="notification-modal-footer">
          {!notification.is_read && (
            <button 
              className="notification-btn primary"
              onClick={handleMarkAsRead}
            >
              Mark as Read
            </button>
          )}
          <button 
            className="notification-btn secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;