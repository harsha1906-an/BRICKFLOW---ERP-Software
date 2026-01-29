import { useState, useEffect } from 'react';
import api from '../services/api';
import './NotificationBell.css';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPanel, setShowPanel] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch notifications on mount and every 30 seconds
    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        const interval = setInterval(() => {
            fetchNotifications();
            fetchUnreadCount();
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications?limit=20');
            if (response.data.success) {
                setNotifications(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            if (response.data.success) {
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const handleNotificationClick = async (notif) => {
        try {
            // Mark as read
            if (!notif.is_read) {
                await api.put(`/notifications/${notif.id}/read`);
                fetchNotifications();
                fetchUnreadCount();
            }

            // Navigate to action URL if exists
            if (notif.action_url) {
                window.location.href = notif.action_url;
            }

            setShowPanel(false);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            setLoading(true);
            await api.put('/notifications/read-all');
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'purchase_approval': return '🛒';
            case 'expense_approval': return '💰';
            case 'payment_received': return '💵';
            case 'inventory_restock': return '📦';
            case 'booking_created': return '🏠';
            case 'low_stock_alert': return '⚠️';
            default: return '📢';
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="notification-bell-container">
            <button
                className="notification-bell-btn"
                onClick={() => setShowPanel(!showPanel)}
            >
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {showPanel && (
                <>
                    <div className="notification-overlay" onClick={() => setShowPanel(false)} />
                    <div className="notification-panel">
                        <div className="notification-header">
                            <h3>Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    className="mark-all-read-btn"
                                    onClick={markAllAsRead}
                                    disabled={loading}
                                >
                                    {loading ? 'Marking...' : 'Mark all read'}
                                </button>
                            )}
                        </div>

                        <div className="notification-list">
                            {notifications.length === 0 ? (
                                <div className="no-notifications">
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                                        onClick={() => handleNotificationClick(notif)}
                                    >
                                        <div className="notification-icon">{getIcon(notif.type)}</div>
                                        <div className="notification-content">
                                            <h4>{notif.title}</h4>
                                            <p>{notif.message}</p>
                                            <span className="notification-time">
                                                {formatTimeAgo(notif.created_at)}
                                            </span>
                                        </div>
                                        {!notif.is_read && <div className="unread-dot"></div>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
