import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import assert from 'assert';

const BASE_URL = 'http://localhost:5010/api';
const TEST_USER = {
    username: 'erasertest',
    email: 'eraser@test.com',
    password: 'password123!'
};

async function run() {
    try {
        console.log('--- Starting Erase Verification ---');

        // 1. Signup/Signin
        let token;
        try {
            await axios.post(`${BASE_URL}/auth/signup`, TEST_USER);
            console.log('Signed up');
        } catch (e) {
            console.log('User likely exists, proceeding to signin...');
        }

        const signinRes = await axios.post(`${BASE_URL}/auth/signin`, { username: TEST_USER.username, password: TEST_USER.password });
        console.log('Signin response:', signinRes.data);
        token = signinRes.data.token;
        console.log('Signed in, token:', token ? 'YES' : 'NO');

        if (!token) {
            throw new Error('Could not get token');
        }

        // 2. Upload a file
        const form = new FormData();
        form.append('files', fs.createReadStream('test_doc.txt'));

        console.log('Uploading file...');
        const uploadRes = await axios.post(`${BASE_URL}/documents/upload`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });
        console.log('File uploaded');

        // 3. Check status
        let statusRes = await axios.get(`${BASE_URL}/documents/upload-status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Status before erase:', statusRes.data);
        if (statusRes.data.uploadCount === 0) throw new Error('Upload count should be > 0 after upload');

        // 4. Erase all data
        console.log('Erasing all data...');
        await axios.delete(`${BASE_URL}/documents/all`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Data erased');

        // 5. Check status again
        statusRes = await axios.get(`${BASE_URL}/documents/upload-status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Status after erase:', statusRes.data);

        // 6. Verify
        if (statusRes.data.uploadCount !== 0) {
            console.error(`FAIL: Upload count is ${statusRes.data.uploadCount}, expected 0!`);
            process.exit(1);
        }

        const listRes = await axios.get(`${BASE_URL}/documents/list`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (listRes.data.length !== 0) {
            console.error('FAIL: Document list is not empty!', listRes.data);
            process.exit(1);
        }

        console.log('SUCCESS: Site total data (upload count and documents) cleared properly.');

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

run();
