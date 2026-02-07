import fetch from 'node-fetch'; // Built-in in Node 18+ but let's assume it works or use global fetch
import fs from 'fs';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:5010/api';

async function test() {
    try {
        console.log('1. Signing in...');
        let res = await fetch(`${BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'tester123', password: 'password123' })
        });

        if (res.status !== 200) {
            console.log('Sign in failed, trying signup...');
            res = await fetch(`${BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'tester123', email: 'tester123@example.com', password: 'password123' })
            });
        }

        const authData = await res.json();
        const token = authData.token;
        if (!token) throw new Error('No token received');
        console.log('Token received.');

        console.log('2. Creating test file...');
        fs.writeFileSync('test_doc.txt', 'The capital of Italy is Rome. It is known for the Colosseum.');

        console.log('3. Uploading file with query...');
        const form = new FormData();
        form.append('files', fs.createReadStream('test_doc.txt'));
        form.append('query', 'What is the capital of Italy?');

        const uploadRes = await fetch(`${BASE_URL}/documents/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            },
            body: form
        });

        const data = await uploadRes.json();
        console.log('Upload Status:', uploadRes.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.searchResult && data.searchResult.response.includes('Rome')) {
            console.log('✅ SUCCESS: AI correctly answered the question from the uploaded file.');
        } else {
            console.log('❌ FAILURE: AI did not answer correctly or searchResult is missing.');
        }

    } catch (error) {
        console.error('Test Error:', error);
    }
}

test();
