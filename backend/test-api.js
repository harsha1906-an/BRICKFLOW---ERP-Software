const axios = require('axios');

// Test health endpoint
axios.get('http://localhost:5001/api/health')
    .then(response => {
        console.log('Health Check:', JSON.stringify(response.data, null, 2));
    })
    .catch(error => {
        console.error('Health check failed:', error.message);
    });

// Test login endpoint
axios.post('http://localhost:5001/api/auth/login', {
    username: 'admin',
    password: 'admin123'
})
    .then(response => {
        console.log('\nLogin Test:', JSON.stringify(response.data, null, 2));
    })
    .catch(error => {
        console.error('Login failed:', error.response?.data || error.message);
    });
