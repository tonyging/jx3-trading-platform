// api/appearance.ts
import api from './index';
export const appearanceApi = {
    // 提交新外觀
    submitAppearance: async (data) => {
        const response = await api.post('/api/appearances/submit', data);
        return response.data;
    },
    // 獲取所有已審核外觀
    getAllAppearances: async (params) => {
        const response = await api.get('/api/appearances/public', { params });
        return response.data;
    },
    // 獲取待審核的外觀提交
    getPendingSubmissions: async (params) => {
        const response = await api.get('/api/appearances/pending', {
            params,
        });
        return response.data;
    },
    // 審核外觀提交
    reviewSubmission: async (submissionId, action, reason) => {
        const response = await api.post(`/api/appearances/review/${submissionId}`, {
            action,
            reason,
        });
        return response.data;
    },
    // 獲取我的提交
    getUserSubmissions: async (params) => {
        const response = await api.get('/api/appearances/my-submissions', { params });
        return response.data;
    },
    // 獲取外觀統計
    getAppearanceStats: async () => {
        const response = await api.get('/api/appearances/stats');
        return response.data;
    },
    // 刪除提交的外觀
    deleteSubmission: async (submissionId) => {
        const response = await api.delete(`/api/appearances/submission/${submissionId}`);
        return response.data;
    },
    // 上傳外觀圖片 (管理員專用)
    uploadAppearanceImage: async (appearanceId, imageFile) => {
        console.log('Uploading file:', imageFile);
        const formData = new FormData();
        formData.append('image', imageFile);
        for (const pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }
        const response = await api.post(`/api/appearances/${appearanceId}/upload-image`, formData);
        return response.data;
    },
};
//# sourceMappingURL=appearance.js.map