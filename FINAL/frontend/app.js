const API_URL = 'http://localhost:5010/api';
let token = localStorage.getItem('token');
let selectedFiles = [];

/* ---------------- MESSAGE ---------------- */
function showMessage(message, type = 'success') {
    const msgEl = document.getElementById('message');
    if (!msgEl) return; // ✅ prevent crash
    msgEl.textContent = message;
    msgEl.className = `message ${type}`;
    setTimeout(() => msgEl.textContent = '', 3000);
}

/* ---------------- AUTH SCREENS ---------------- */
function showSignin() {
    document.getElementById('signin-form')?.classList.remove('hidden');
    document.getElementById('signup-form')?.classList.add('hidden');
    document.getElementById('forgot-form')?.classList.add('hidden');
}

function showSignup() {
    document.getElementById('signin-form')?.classList.add('hidden');
    document.getElementById('signup-form')?.classList.remove('hidden');
    document.getElementById('forgot-form')?.classList.add('hidden');
}

function toggleSignupPassword() {
    const passwordInput = document.getElementById('signup-password');
    if (passwordInput) {
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    }
}

function showForgotPassword() {
    document.getElementById('signin-form')?.classList.add('hidden');
    document.getElementById('signup-form')?.classList.add('hidden');
    document.getElementById('forgot-form')?.classList.remove('hidden');
}

/* ---------------- AUTH APIs ---------------- */
async function signUp() {
    const username = document.getElementById('signup-username')?.value;
    const email = document.getElementById('signup-email')?.value;
    const password = document.getElementById('signup-password')?.value;

    const passwordRegex = /^(?=.*[\d@$!%*#?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
        return showMessage('Password must be at least 8 characters long and contain at least one number or special character', 'error');
    }

    try {
        const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();
        res.ok ? (showMessage('Account created!'), showSignin())
            : showMessage(data.error || 'Signup failed', 'error');
    } catch {
        showMessage('Network error', 'error');
    }
}

async function signIn() {
    const username = document.getElementById('signin-username')?.value;
    const password = document.getElementById('signin-password')?.value;

    try {
        const res = await fetch(`${API_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (!res.ok) return showMessage(data.error, 'error');

        token = data.token;
        localStorage.setItem('token', token);
        localStorage.setItem('username', data.username || '');
        localStorage.setItem('email', data.email || '');

        showApp();
    } catch {
        showMessage('Network error', 'error');
    }
}

async function forgotPassword() {
    const email = document.getElementById('forgot-email')?.value;
    try {
        const res = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        showMessage(res.ok ? 'Reset link sent' : data.error, res.ok ? 'success' : 'error');
    } catch {
        showMessage('Network error', 'error');
    }
}

/* ---------------- APP ---------------- */
function showApp() {
    document.getElementById('auth-container')?.classList.add('hidden');
    document.getElementById('app-container')?.classList.remove('hidden');

    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');

    document.getElementById('profile-initial').textContent =
        username ? username.charAt(0).toUpperCase() : '?';
    document.getElementById('profile-username').textContent = username || '';
    document.getElementById('profile-email').textContent = email || '';

    loadRecentSearches();
    loadDocuments();
    loadUploadStatus();
    checkSystemStatus();
}

function toggleProfile() {
    document.getElementById('profile-dropdown')?.classList.toggle('hidden');
}

function logout() {
    localStorage.clear();
    token = null;
    location.reload();
}

async function eraseAllData() {
    if (!confirm('WARNING: Are you sure you want to permanently delete ALL your documents and data? This action cannot be undone.')) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/documents/all`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
            alert('All data has been erased.');
            loadDocuments();
            loadUploadStatus();
            loadRecentSearches();

            // Clear the chat and restore the welcome message
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer) {
                chatContainer.innerHTML = `
                    <div class="welcome-message">
                        <h2>Welcome to AI Knowledge Assistant</h2>
                        <p>Upload your documents and ask questions!</p>
                    </div>
                `;
            }
        } else {
            const data = await res.json();
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        alert('Network error during deletion.');
    }
}

/* ---------------- SEARCH ---------------- */
async function loadRecentSearches() {
    try {
        const res = await fetch(`${API_URL}/search/recent`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            console.error('Error loading recent searches:', res.status, res.statusText);
            if (res.status === 401) logout();
            return;
        }

        const searches = await res.json();
        const container = document.getElementById('recent-searches');
        if (!container) return;

        container.innerHTML = '';
        searches.forEach(s => {
            const div = document.createElement('div');
            div.className = 'recent-item';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1; cursor: pointer;" onclick="document.getElementById('query-input').value = '${s.query.replace(/'/g, "\\'")}'"">
                        <p>${s.query}</p>
                        <small>${new Date(s.timestamp).toLocaleString()}</small>
                    </div>
                    <button class="delete-search-btn" onclick="event.stopPropagation(); deleteSearch('${encodeURIComponent(s.query)}')" title="Delete">×</button>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Network error loading searches:', error);
    }
}

async function deleteSearch(encodedQuery) {
    try {
        const res = await fetch(`${API_URL}/search/recent/${encodedQuery}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            loadRecentSearches();
        }
    } catch (error) {
        console.error('Error deleting search:', error);
    }
}

/* ---------------- DOCUMENTS ---------------- */
async function loadDocuments() {
    try {
        const res = await fetch(`${API_URL}/documents/list`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) return;

        const documents = await res.json();
        const container = document.getElementById('my-documents-list');
        if (!container) return;

        container.innerHTML = '';
        if (documents.length === 0) {
            container.innerHTML = '<p style="color: #999; font-size: 13px;">No documents yet.</p>';
            return;
        }

        documents.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'recent-item';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <a href="${API_URL.replace('/api', '')}/uploads/${doc.filename}" target="_blank" style="text-decoration: none; color: #333; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        📄 ${doc.originalName}
                    </a>
                    <button type="button" class="delete-search-btn" data-doc-id="${doc._id}" title="Delete">×</button>
                </div>
                <small>${new Date(doc.uploadDate).toLocaleDateString()}</small>
            `;
            // Add event listener for delete button
            const deleteBtn = div.querySelector('.delete-search-btn');
            deleteBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                deleteDocument(this.getAttribute('data-doc-id'));
            });
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

async function deleteDocument(docId) {
    if (!confirm('Are you sure you want to delete this document?')) {
        return;
    }
    try {
        const res = await fetch(`${API_URL}/documents/${docId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            loadDocuments();
        } else {
            const data = await res.json();
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error deleting document:', error);
    }
}

/* ---------------- UPLOAD ---------------- */
async function loadUploadStatus() {
    try {
        const res = await fetch(`${API_URL}/documents/upload-status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        document.getElementById('upload-status').textContent = 'Unlimited uploads';
    } catch { }
}

function handleFileSelect() {
    const input = document.getElementById('file-input');
    selectedFiles = input ? Array.from(input.files) : [];
    displaySelectedFiles();

    const btn = document.getElementById('start-upload-btn');
    if (btn) {
        selectedFiles.length > 0 ? btn.classList.remove('hidden') : btn.classList.add('hidden');
    }
}

function displaySelectedFiles() {
    const container = document.getElementById('selected-files');
    if (!container) return;
    container.innerHTML = '';

    selectedFiles.forEach((file, i) => {
        const div = document.createElement('div');
        div.className = 'file-tag';
        div.innerHTML = `${file.name} <span onclick="removeFile(${i})">×</span>`;
        container.appendChild(div);
    });
}

function removeFile(i) {
    selectedFiles.splice(i, 1);
    displaySelectedFiles();
}

async function uploadFiles() {
    if (!selectedFiles.length) return true;

    console.log('Uploading', selectedFiles.length, 'files...');
    const formData = new FormData();
    selectedFiles.forEach(f => {
        console.log('Adding file:', f.name, f.type, f.size, 'bytes');
        formData.append('files', f);
    });

    const queryInput = document.getElementById('query-input');
    const query = queryInput ? queryInput.value.trim() : '';

    if (query) {
        console.log('Attaching query to upload:', query);
        formData.append('query', query);
    }

    try {
        const res = await fetch(`${API_URL}/documents/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        console.log('Upload response status:', res.status);
        const data = await res.json();
        console.log('Upload response data:', data);

        if (!res.ok) {
            addMessage('assistant', `Upload failed: ${data.error || 'Unknown error'}`);
            return false;
        }

        selectedFiles = [];
        displaySelectedFiles();
        loadUploadStatus();
        loadDocuments();

        const btn = document.getElementById('start-upload-btn');
        if (btn) btn.classList.add('hidden');

        addMessage('assistant', `${data.documents.length} file(s) uploaded successfully!`);

        if (data.searchResult) {
            console.log('Received immediate search result');
            addMessage('user', query);
            if (queryInput) queryInput.value = ''; // Clear input if used
            addMessage('assistant', data.searchResult.response);
        }

        return true;
    } catch (error) {
        console.error('Upload error:', error);
        addMessage('assistant', `Upload failed: ${error.message}`);
        return false;
    }
}

/* ---------------- CHAT ---------------- */
async function sendQuery() {
    const input = document.getElementById('query-input');
    const query = input?.value.trim();

    console.log('=== SEND QUERY ===');
    console.log('Query:', query);
    console.log('Token:', token ? 'Present' : 'MISSING!');
    console.log('API URL:', `${API_URL}/search/query`);

    if (!query && !selectedFiles.length) {
        console.log('No query or files');
        return;
    }

    if (selectedFiles.length > 0) {
        console.log('Uploading files first...');
        // uploadFiles will handle the query if files are present
        await uploadFiles();
        return;
    }

    if (!query) return;
    addMessage('user', query);
    input.value = '';

    try {
        console.log('Sending fetch request...');
        const res = await fetch(`${API_URL}/search/query`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        console.log('Response status:', res.status);
        console.log('Response ok:', res.ok);

        const data = await res.json();
        console.log('Response data:', data);

        if (res.ok) {
            addMessage('assistant', data.response);
            if (data.sources && data.sources.length > 0) {
                console.log('Sources:', data.sources);
            }
        } else {
            console.error('Error response:', data);
            addMessage('assistant', `Error: ${data.error || 'Unknown error'}`);
        }
        loadRecentSearches();
    } catch (error) {
        console.error('Fetch error:', error);
        addMessage('assistant', `Search failed: ${error.message}`);
    }
}

function addMessage(type, text) {
    const container = document.getElementById('chat-container');
    if (!container) return;

    container.querySelector('.welcome-message')?.remove();
    const div = document.createElement('div');
    div.className = `chat-message ${type}`;

    // Use marked for assistant, plain text for user (security)
    if (type === 'assistant') {
        div.innerHTML = marked.parse(text);
    } else {
        div.textContent = text;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function handleKeyPress(e) {
    if (e.key === 'Enter') sendQuery();
}

/* ---------------- STATUS ---------------- */
async function checkSystemStatus() {
    try {
        const res = await fetch(`${API_URL}/search/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;

        const status = await res.json();
        const el = document.getElementById('upload-status');
        if (!el) return;

        const old = el.textContent;
        let text = `Status: ${status.elasticsearch ? '🟢' : '🔴'} Elasticsearch 
                     ${status.openai ? '🟢' : '🔴'} AI`;
        el.innerHTML = `${text}<br>${old}`;
    } catch { }
}

/* ---------------- START ---------------- */
token ? showApp() : showSignin();
