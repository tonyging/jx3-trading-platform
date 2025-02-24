// services/api/product.ts
import api from './index';
// 商品相關的 API
export const productApi = {
    // 獲取商品列表 - 公開 API
    getProducts: async (params) => {
        const response = await api.get('/api/products', {
            params,
        });
        return response.data;
    },
    // 創建商品 - 需要認證
    createProduct: async (data) => {
        const response = await api.post('/api/products', data);
        return response.data;
    },
    // 保留商品 - 需要認證
    reserveProduct: async (productId, amount) => {
        const response = await api.post(`/api/products/${productId}/reserve`, {
            amount,
        });
        return response.data;
    },
    // 更新商品 - 需要認證
    updateProduct: async (id, data) => {
        const response = await api.patch(`/api/products/${id}`, data);
        return response.data;
    },
    // 刪除商品 - 需要認證
    deleteProduct: async (id) => {
        const response = await api.delete(`/api/products/${id}`);
        return response.data;
    },
};
//# sourceMappingURL=product.js.map