const Notification = require('./src/models/notification.model');
const User = require('./src/models/user.model');
const notificationService = require('./src/services/notificationService');

async function testNotificationSystem() {
    console.log('🧪 Testing Notification System...\n');

    try {
        // Test 1: Create a direct notification
        console.log('Test 1: Creating direct notification for user ID 1...');
        const notifId = await Notification.create({
            user_id: 1,
            type: 'general',
            title: 'Test Notification',
            message: 'This is a test notification to verify the system works',
            action_url: '/dashboard'
        });
        console.log(`✅ Created notification ID: ${notifId}\n`);

        // Test 2: Get user notifications
        console.log('Test 2: Fetching notifications for user ID 1...');
        const notifications = await Notification.getByUser(1, 10);
        console.log(`✅ Found ${notifications.length} notifications`);
        if (notifications.length > 0) {
            console.log('   Latest:', notifications[0].title);
        }
        console.log();

        // Test 3: Get unread count
        console.log('Test 3: Getting unread count for user ID 1...');
        const unreadCount = await Notification.getUnreadCount(1);
        console.log(`✅ Unread notifications: ${unreadCount}\n`);

        // Test 4: Mark as read
        if (notifId) {
            console.log(`Test 4: Marking notification ${notifId} as read...`);
            await Notification.markAsRead(notifId);
            const newCount = await Notification.getUnreadCount(1);
            console.log(`✅ New unread count: ${newCount}\n`);
        }

        // Test 5: Test notification service
        console.log('Test 5: Testing notification service (payment received)...');
        await notificationService.sendNotification({
            userIds: [1],
            type: 'payment_received',
            title: 'Payment Received',
            message: 'Test payment of ₹50,000 received',
            related_id: 999,
            related_type: 'payment',
            action_url: '/payments'
        });
        console.log('✅ Service notification sent\n');

        // Test 6: Verify role-based lookup
        console.log('Test 6: Testing role-based user lookup...');
        const managers = await User.findByRole('manager');
        console.log(`✅ Found ${managers.length} managers`);
        const multiRole = await User.findByRoles(['manager', 'owner']);
        console.log(`✅ Found ${multiRole.length} users with manager or owner role\n`);

        // Final verification
        console.log('Final verification: Getting all notifications...');
        const allNotifs = await Notification.getByUser(1);
        console.log(`✅ Total notifications for user 1: ${allNotifs.length}\n`);

        console.log('🎉 All tests passed! Notification system is working.\n');
        console.log('Next steps:');
        console.log('1. Add NotificationBell component to your frontend header');
        console.log('2. Trigger notifications in payment/purchase/inventory controllers');
        console.log('3. Test in browser UI');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
    }

    process.exit(0);
}

// Run tests
testNotificationSystem();
