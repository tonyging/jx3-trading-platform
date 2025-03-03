// src/services/api/index.ts
import axios from 'axios';
import { useAppStore } from '@/stores/appState';
function getAppStore() {
    return useAppStore();
}
const api = axios.create({
    baseURL: (() => {
        console.log('Environment:', import.meta.env.MODE);
        console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
        return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    })(),
    timeout: 60000, // 增加到 60 秒以處理 Render 的冷啟動
});
// 請求攔截器：重建 headers 對象並添加認證 token
api.interceptors.request.use((config) => {
    // 保留原始的 headers 對象，但設置我們需要的屬性
    if (config.headers) {
        config.headers['Content-Type'] = 'application/json';
        config.headers['Accept'] = 'application/json';
        // 從 localStorage 獲取 token
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    }
    // 長時間請求才顯示加載指示器
    if (config.timeout && config.timeout > 5000) {
        const appStore = getAppStore();
        // 設置一個延遲，如果請求時間超過 2 秒才顯示加載指示器
        config._loadingTimeout = setTimeout(() => {
            appStore.setBackendWaking(true);
        }, 2000);
    }
    console.log('發送請求:', {
        url: config.url,
        method: config.method,
        data: config.data,
        headers: config.headers,
    });
    return config;
}, (error) => {
    console.error('請求錯誤:', error);
    return Promise.reject(error);
});
// 響應攔截器：處理各種響應情況
api.interceptors.response.use((response) => {
    console.log('收到響應:', {
        status: response.status,
        data: response.data,
    });
    // 清除可能的加載超時
    if (response.config._loadingTimeout) {
        clearTimeout(response.config._loadingTimeout);
    }
    // 如果正在顯示加載指示器，隱藏它
    const appStore = getAppStore();
    if (appStore.isBackendWaking) {
        appStore.setBackendWaking(false);
        appStore.resetConnectionAttempts();
    }
    return response;
}, (error) => {
    const errorMessage = error.response?.data?.message || '未知錯誤';
    console.error('響應錯誤:', {
        error: error,
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
    });
    // 清除可能的加載超時
    if (error.config && error.config._loadingTimeout) {
        clearTimeout(error.config._loadingTimeout);
    }
    const appStore = getAppStore();
    // 處理超時錯誤，嘗試重新連接
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.log('請求超時，可能是後端正在啟動');
        appStore.incrementConnectionAttempts();
        // 如果嘗試次數少於 5 次，保持加載指示器
        if (appStore.connectionAttempts < 5) {
            appStore.setBackendWaking(true);
        }
        else {
            // 超過嘗試次數，隱藏加載指示器
            appStore.setBackendWaking(false);
            return Promise.reject('伺服器連接超時，請稍後再試');
        }
    }
    else {
        // 非超時錯誤，隱藏加載指示器
        if (appStore.isBackendWaking) {
            appStore.setBackendWaking(false);
        }
    }
    // 處理各種錯誤狀態
    if (error.response) {
        switch (error.response.status) {
            case 401:
                // 處理未授權錯誤
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
            default:
                // 處理其他錯誤
                break;
        }
    }
    return Promise.reject(errorMessage);
});
export default api;
//# sourceMappingURL=index.js.map