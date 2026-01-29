// Simple test to verify backend login API works
const testBackendLogin = async () => {
    try {
        const response = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });

        const data = await response.json();
        console.log('Backend Response:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('✅ Backend login API is working!');
            console.log('Token:', data.data.token);
            console.log('User:', data.data.user);
        } else {
            console.log('❌ Login failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

// Run the test
testBackendLogin();
