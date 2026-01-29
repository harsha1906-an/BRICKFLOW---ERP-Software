const axios = require('axios');

const testLogin = async () => {
    try {
        console.log('Testing login with admin/admin123...');

        const response = await axios.post('http://localhost:5001/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });

        console.log('✅ Login successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        if (response.data.token) {
            console.log('\n✅ JWT Token received');
            console.log('User:', response.data.user);
        }
    } catch (error) {
        console.error('❌ Login failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

testLogin();
