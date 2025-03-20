// services/api/rating.ts
import api from './index';
// 評價API服務
export const ratingApi = {
    // 創建評價
    createRating: async (data) => {
        const response = await api.post('/api/ratings', data);
        return response.data;
    },
    // 獲取用戶的評價列表
    getUserRatings: async (userId, params) => {
        const response = await api.get(`/api/ratings/user/${userId}`, { params });
        return response.data;
    },
    // 檢查是否已評價
    checkRatingExists: async (transactionId, fromUserId) => {
        const response = await api.get(`/api/ratings/check?transactionId=${transactionId}&fromUserId=${fromUserId}`);
        return response.data;
    },
    // 刪除評價
    deleteRating: async (ratingId) => {
        const response = await api.delete(`/api/ratings/${ratingId}`);
        return response.data;
    },
};
export default ratingApi;
//# sourceMappingURL=rating.js.map