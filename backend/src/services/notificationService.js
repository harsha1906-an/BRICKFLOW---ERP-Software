const Notification = require('../models/notification.model');
const User = require('../models/user.model');

const notificationService = {
    // Trigger notification on purchase creation/approval
    notifyPurchaseApproval: async (purchaseId, amount, requestedByUserId) => {
        try {
            // Determine approver based on amount
            let targetRole;
            if (amount > 100000) {
                targetRole = 'owner';
            } else if (amount > 50000) {
                targetRole = 'manager';
            } else {
                targetRole = 'supervisor';
            }

            // Get users with target role
            const approvers = await User.findByRole(targetRole);

            // Create notifications for each approver
            for (const approver of approvers) {
                if (approver.id !== requestedByUserId) {
                    await Notification.create({
                        user_id: approver.id,
                        type: 'purchase_approval',
                        title: 'Purchase Approval Required',
                        message: `Purchase #${purchaseId} requires your approval (₹${amount.toLocaleString()})`,
                        related_id: purchaseId,
                        related_type: 'purchase',
                        action_url: `/approvals?purchase=${purchaseId}`
                    });
                }
            }
        } catch (error) {
            console.error('Error sending purchase approval notification:', error);
        }
    },

    // Trigger on inventory restock
    notifyInventoryRestock: async (materialName, quantity, projectId) => {
        try {
            // Notify all managers and  owners
            const users = await User.findByRoles(['manager', 'owner']);

            for (const user of users) {
                await Notification.create({
                    user_id: user.id,
                    type: 'inventory_restock',
                    title: 'Inventory Restocked',
                    message: `${materialName} restocked: +${quantity} units`,
                    related_id: projectId,
                    related_type: 'inventory',
                    action_url: `/inventory`
                });
            }
        } catch (error) {
            console.error('Error sending inventory restock notification:', error);
        }
    },

    // Trigger on payment received
    notifyPaymentReceived: async (paymentId, bookingId, amount, customerName) => {
        try {
            // Notify owner and accounts team
            const users = await User.findByRoles(['owner', 'accounts']);

            for (const user of users) {
                await Notification.create({
                    user_id: user.id,
                    type: 'payment_received',
                    title: 'Payment Received',
                    message: `₹${amount.toLocaleString()} received from ${customerName} for Booking #${bookingId}`,
                    related_id: paymentId,
                    related_type: 'payment',
                    action_url: `/payments`
                });
            }
        } catch (error) {
            console.error('Error sending payment received notification:', error);
        }
    },

    // Trigger on new booking
    notifyBookingCreated: async (bookingId, customerName, unitName, amount) => {
        try {
            // Notify sales managers and owners
            const users = await User.findByRoles(['manager', 'owner']);

            for (const user of users) {
                await Notification.create({
                    user_id: user.id,
                    type: 'booking_created',
                    title: 'New Booking Created',
                    message: `${customerName} booked ${unitName} for ₹${amount.toLocaleString()}`,
                    related_id: bookingId,
                    related_type: 'booking',
                    action_url: `/bookings/${bookingId}`
                });
            }
        } catch (error) {
            console.error('Error sending booking notification:', error);
        }
    },

    // Low stock alert
    notifyLowStock: async (materialName, currentStock, reorderLevel) => {
        try {
            // Notify inventory managers
            const users = await User.findByRoles(['manager', 'owner']);

            for (const user of users) {
                await Notification.create({
                    user_id: user.id,
                    type: 'low_stock_alert',
                    title: 'Low Stock Alert',
                    message: `${materialName} is running low (${currentStock} units, reorder at ${reorderLevel})`,
                    related_type: 'inventory',
                    action_url: `/inventory`
                });
            }
        } catch (error) {
            console.error('Error sending low stock notification:', error);
        }
    },

    // Generic notification sender
    sendNotification: async ({ userIds, type, title, message, related_id, related_type, action_url }) => {
        try {
            for (const userId of userIds) {
                await Notification.create({
                    user_id: userId,
                    type: type || 'general',
                    title,
                    message,
                    related_id,
                    related_type,
                    action_url
                });
            }
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
};

module.exports = notificationService;
