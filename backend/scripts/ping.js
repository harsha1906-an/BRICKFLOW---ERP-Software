const axios = require('axios');

async function ping() {
    try {
        console.log('Pinging health endpoint...');
        await axios.get('http://localhost:5001/api/health');
        console.log('✅ Server is UP');
        process.exit(0);
    } catch (error) {
        console.error('❌ Server is DOWN or Unreachable:', error.message);
        process.exit(1);
    }
}

// Retry logic could be added, but simple ping first
ping();
