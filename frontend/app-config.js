(function () {
    // 自动检测API地址：生产环境使用当前域名，开发环境使用localhost
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const API_BASE_URL = isProduction 
        ? `${window.location.origin}/api`  // 生产环境：使用当前域名
        : 'http://localhost:3000/api';      // 开发环境：使用localhost

    function getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
    }

    function getStoredUser() {
        const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
    }

    function persistSession(user, token, rememberMe = true) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('authToken', token);
        storage.setItem('currentUser', JSON.stringify(user));

        if (rememberMe) {
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('currentUser');
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
        }
    }

    function clearSession() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
    }

    async function fetchWithAuth(endpoint, options = {}) {
        const token = getAuthToken();
        if (!token) {
            throw new Error('NOT_AUTHENTICATED');
        }

        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
        const headers = Object.assign({}, options.headers || {});
        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
        if (!headers['Content-Type'] && !isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        headers.Authorization = `Bearer ${token}`;

        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            clearSession();
            throw new Error('UNAUTHORIZED');
        }
        return response;
    }

    window.API_BASE_URL = API_BASE_URL;
    window.getAuthToken = getAuthToken;
    window.getStoredUser = getStoredUser;
    window.persistSession = persistSession;
    window.clearSession = clearSession;
    window.fetchWithAuth = fetchWithAuth;
})();
