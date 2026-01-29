require('dotenv').config();
const { sendEmail } = require('../src/services/emailService');

console.log('Testing Email Service...');
(async () => {
    try {
        const info = await sendEmail('test@example.com', 'Test Subject', 'Test Body', '<p>Test HTML</p>');
        console.log('Email Result:', info ? 'Sent (Mock or Real)' : 'Failed');
    } catch (e) {
        console.error('Email Error:', e);
    }
})();
