// src/services/api/index.ts
import axios from 'axios';
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 5000,
});
// 請求攔截器：記錄請求詳情並添加認證 token
api.interceptors.request.use((config) => {
    console.log('發送請求:', {
        url: config.url,
        method: config.method,
        data: config.data,
        headers: config.headers,
    });
    // 從 localStorage 獲取 token
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    console.error('請求錯誤:', error);
    return Promise.reject(error);
});
// 響應攔截器：完整保留響應結構
api.interceptors.response.use((response) => {
    console.log('收到響應:', {
        status: response.status,
        data: response.data,
    });
    return response;
}, (error) => {
    const errorMessage = error.response?.data?.message || '未知錯誤';
    console.error('響應錯誤:', {
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
    });
    switch (error.response?.status) {
        case 401:
            localStorage.removeItem('token');
            window.location.href = '/login';
            break;
        case 403:
            console.error('沒有權限');
            break;
        case 404:
            console.error('資源不存在');
            break;
        case 500:
            console.error('伺服器內部錯誤');
            break;
    }
    return Promise.reject(errorMessage);
});
// 第二個響應攔截器：額外的 401 處理
api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
export default api;
//# sourceMappingURL=index.js.map