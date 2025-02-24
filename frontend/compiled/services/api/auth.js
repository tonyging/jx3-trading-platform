import api from './index';
export const authApi = {
    // 登入
    login: (credentials) => api.post('/auth/login', credentials),
    // 註冊
    register: (userData) => api.post('/auth/register', userData),
    // 取得當前用戶資料
    getCurrentUser: () => api.get('/auth/me'),
};
//# sourceMappingURL=auth.js.map