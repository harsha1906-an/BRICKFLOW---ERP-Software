const { getAll, getOne, runQuery } = require('../config/db');

const Notification = {
    // Create notification
    create: async ({ user_id, type, title, message, related_id, related_type, action_url }) => {
        try {
            const result = await runQuery(
                `INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [user_id, type, title, message, related_id, related_type, action_url]
            );
            return result.id;
        } catch (error) {
            throw error;
        }
    },

    // Get user notifications
    getByUser: async (userId, limit = 50) => {
        try {
            const notifications = await getAll(
                `SELECT * FROM notifications
                 WHERE user_id = ?
                 ORDER BY created_at DESC
                 LIMIT ?`,
                [userId, limit]
            );
            return notifications;
        } catch (error) {
            throw error;
        }
    },

    // Get unread count
    getUnreadCount: async (userId) => {
        try {
            const result = await getOne(
                `SELECT COUNT(*) as count FROM notifications
                 WHERE user_id = ? AND is_read = 0`,
                [userId]
            );
            return result.count || 0;
        } catch (error) {
            throw error;
        }
    },

    // Mark as read
    markAsRead: async (notificationId) => {
        try {
            await runQuery(
                'UPDATE notifications SET is_read = 1 WHERE id = ?',
                [notificationId]
            );
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Mark all as read for user
    markAllAsRead: async (userId) => {
        try {
            await runQuery(
                'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
                [userId]
            );
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Delete notification
    delete: async (notificationId) => {
        try {
            await runQuery('DELETE FROM notifications WHERE id = ?', [notificationId]);
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Delete old read notifications (cleanup - keep last 30 days)
    deleteOldNotifications: async (days = 30) => {
        try {
            await runQuery(
                `DELETE FROM notifications 
                 WHERE is_read = 1 
                 AND created_at < datetime('now', '-${days} days')`
            );
            return true;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = Notification;
