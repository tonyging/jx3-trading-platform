// services/api/admin.ts
import api from './index';
// 管理員相關 API
export const adminApi = {
    // 獲取儀表板統計數據
    getStats: async () => {
        const response = await api.get('/api/admin/stats');
        return response.data;
    },
    // 獲取最近用戶列表
    getRecentUsers: async (params) => {
        const response = await api.get('/api/admin/users', { params });
        return response.data;
    },
    // 獲取用戶詳情
    getUserDetail: async (userId) => {
        const response = await api.get(`/api/admin/users/${userId}`);
        return response.data;
    },
    // 獲取最近商品列表
    getRecentProducts: async (params) => {
        const response = await api.get('/api/admin/products', { params });
        return response.data;
    },
    // 獲取最近交易列表
    getRecentTransactions: async (params) => {
        const response = await api.get('/api/admin/transactions', { params });
        return response.data;
    },
    // 更新用戶角色
    updateUserRole: async (userId, data) => {
        const response = await api.patch(`/api/users/role/${userId}`, data);
        return response.data;
    },
    // 刪除商品 (管理員可以刪除任何商品)
    deleteProduct: async (productId) => {
        const response = await api.delete(`/api/products/${productId}`);
        return response.data;
    },
    // 搜尋用戶
    searchUsers: async (query, page = 1, limit = 10) => {
        const response = await api.get('/api/admin/users/search', {
            params: { query, page, limit },
        });
        return response.data;
    },
    // 搜尋商品
    searchProducts: async (query, page = 1, limit = 10) => {
        const response = await api.get('/api/admin/products/search', {
            params: { query, page, limit },
        });
        return response.data;
    },
    // 搜尋交易
    searchTransactions: async (query, page = 1, limit = 10) => {
        const response = await api.get('/api/admin/transactions/search', {
            params: { query, page, limit },
        });
        return response.data;
    },
    // 獲取系統日誌
    getSystemLogs: async (page = 1, limit = 20) => {
        const response = await api.get('/api/admin/logs', { params: { page, limit } });
        return response.data;
    },
};
//# sourceMappingURL=admin.js.map