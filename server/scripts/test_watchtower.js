import axios from 'axios';

async function testWatchtower() {
    try {
        console.log("Testing Watchtower Endpoint...");
        // Note: This test might fail if adminAuth requires a valid session cookie. 
        // For a quick check, we'd need to mock the session or login first.
        // However, seeing a 401 Unauthorized is better than a 404 Not Found.
        // A 404 means the route doesn't exist. A 401 means it exists but is protected.

        const response = await axios.get('http://localhost:5000/api/admin/watchtower/live', {
            validateStatus: function (status) {
                return status < 500; // Resolve even if 401/404
            }
        });

        console.log(`Status Code: ${response.status}`);

        if (response.status === 404) {
            console.error("❌ FAILED: Endpoint still returning 404.");
        } else if (response.status === 401) {
            console.log("✅ SUCCESS: Endpoint found (returned 401 Unauthorized, which is expected without login).");
        } else if (response.status === 200) {
            console.log("✅ SUCCESS: Endpoint returned 200 OK.");
            console.log("Data:", response.data);
        } else {
            console.log(`⚠️ Unexpected status: ${response.status}`);
        }

    } catch (error) {
        console.error("Test Error:", error.message);
    }
}

testWatchtower();
