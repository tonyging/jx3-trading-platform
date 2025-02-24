import api from './index';
// 交易相關 API
export const transactionApi = {
    // 獲取交易詳情
    getTransactionDetails: async (transactionId) => {
        const response = await api.get(`/api/transactions/${transactionId}`);
        return response.data;
    },
    // 發送訊息
    sendMessage: async (transactionId, message) => {
        const response = await api.post(`/api/transactions/${transactionId}/messages`, { content: message });
        return response.data;
    },
    // 上傳匯款證明
    uploadPaymentProof: async (transactionId, file) => {
        const formData = new FormData();
        formData.append('paymentProof', file);
        const response = await api.post(`/api/transactions/${transactionId}/payment-proof`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    // 獲取用戶的交易列表
    getUserTransactions: async (params) => {
        const response = await api.get('/api/transactions', { params });
        return response.data;
    },
    completeTransaction: async (transactionId) => {
        const response = await api.post(`/api/transactions/${transactionId}/complete`);
        return response.data;
    },
};
//# sourceMappingURL=transaction.js.map