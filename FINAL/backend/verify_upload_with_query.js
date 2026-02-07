import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch'; // Assuming node-fetch is available or using built-in fetch in Node 18+

// Create a dummy file
const fileName = 'test_decoder.txt';
// Create a file with "truth table of 2 to 4 line decoder" deep in the content
const padding = 'Some irrelevant text about electronics.\n'.repeat(500); // 500 lines of noise
const keyContent = `
2 to 4 Line Decoder:
A decoder is a combinational circuit...
The truth table for 2 to 4 line decoder is:
A B | Y0 Y1 Y2 Y3
0 0 | 1  0  0  0
0 1 | 0  1  0  0
1 0 | 0  0  1  0
1 1 | 0  0  0  1
End of truth table.
`;
fs.writeFileSync(fileName, padding + keyContent + padding);

const form = new FormData();
form.append('files', fs.createReadStream(fileName));
form.append('query', 'truth table of 2 to 4 line decoder');

const PORT = 5010;

console.log(`Testing Upload + Query on port ${PORT}...`);

async function runTest() {
    try {
        // Need to import register/login first to get token? 
        // Or assume auth is disabled/mocked? auth IS enabled in routes.
        // Let's try to signup/login first purely via fetch.

        // 1. Signup/Login
        const authRes = await fetch(`http://localhost:${PORT}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'tester123', email: 'test@example.com', password: 'password123' })
        });

        let token;
        if (authRes.status === 400) {
            // User exists, login
            const loginRes = await fetch(`http://localhost:${PORT}/api/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'tester123', password: 'password123' })
            });
            const loginData = await loginRes.json();
            token = loginData.token;
        } else {
            const signupData = await authRes.json();
            token = signupData.token;
        }

        console.log('Got token:', token ? 'Yes' : 'No');

        // 2. Upload with Query
        const uploadRes = await fetch(`http://localhost:${PORT}/api/documents/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            },
            body: form
        });

        const data = await uploadRes.json();
        console.log('Status:', uploadRes.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.searchResult && data.searchResult.response) {
            console.log('✅ PASS: Search result received in upload response!');
        } else {
            console.log('❌ FAIL: No search result in response.');
        }

    } catch (e) {
        console.error('Test failed:', e);
    }
}

runTest();
