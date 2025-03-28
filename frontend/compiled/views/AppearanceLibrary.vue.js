import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { appearanceApi } from '@/services/api/appearance';
import CreateAppearanceModal from '@/components/CreateAppearanceModal.vue';
import AppearancePagination from '@/components/AppearancePagination.vue';
import { useUserStore } from '@/stores/user';
import { uploadImageToFirebase } from '@/firebase/storage';
// 獲取路由和用戶信息
const route = useRoute();
const userStore = useUserStore();
// 判斷是否為管理員
const isAdmin = computed(() => userStore.currentUser?.role === 'admin');
// 定義目前的活躍頁籤
const activeTab = ref('official');
// 定義資料狀態
const appearances = ref([]);
const pendingSubmissions = ref([]);
const isLoading = ref(false);
const error = ref(null);
// 分頁相關狀態
const pagination = ref({
    current: 1,
    total: 1,
    totalRecords: 0,
});
// 搜尋相關狀態
const searchQuery = ref('');
// 控制提交外觀的模態窗
const isCreateModalOpen = ref(false);
// 拒絕外觀的相關狀態
const rejectModalOpen = ref(false);
const currentSubmissionId = ref('');
const rejectReason = ref('');
// 上傳圖片相關狀態
const isUploadModalOpen = ref(false);
const selectedAppearanceId = ref('');
const uploadError = ref(null);
const isUploading = ref(false);
// 載入資料的方法
const loadData = async () => {
    isLoading.value = true;
    error.value = null;
    try {
        switch (activeTab.value) {
            case 'official':
                const officialResponse = await appearanceApi.getAllAppearances({
                    page: pagination.value.current,
                    query: searchQuery.value,
                });
                appearances.value = officialResponse.data.appearances;
                pagination.value = officialResponse.data.pagination;
                break;
            case 'pending':
                const pendingResponse = await appearanceApi.getPendingSubmissions({
                    page: pagination.value.current,
                });
                pendingSubmissions.value = pendingResponse.data.submissions;
                pagination.value = pendingResponse.data.pagination;
                console.log('Pending submissions:', pendingSubmissions.value); // 添加日志
                break;
        }
    }
    catch (err) {
        console.error('載入資料時發生錯誤', err);
        error.value = '無法載入資料，請稍後再試';
    }
    finally {
        isLoading.value = false;
    }
};
// 分頁變更事件
const handlePageChange = (page) => {
    pagination.value.current = page;
    loadData();
};
// 搜尋事件
const handleSearch = () => {
    pagination.value.current = 1;
    loadData();
};
// 切換頁籤事件
const handleTabChange = (tab) => {
    activeTab.value = tab;
    pagination.value.current = 1;
    loadData();
};
// 提交新外觀 - 已修正為與 CreateAppearanceModal 匹配的參數
const handleSubmitAppearance = async () => {
    try {
        // 關閉模態窗口
        isCreateModalOpen.value = false;
        // 確保頁籤是「提交外觀數據」
        activeTab.value = 'pending';
        // 重新加載數據（使用 setTimeout 確保頁籤變更後再加載）
        setTimeout(() => {
            loadData();
        }, 100);
    }
    catch (error) {
        console.error('提交外觀失敗', error);
    }
};
// 檢查提交者是否為當前用戶
const isCurrentUser = (submission) => {
    if (!userStore.currentUser || !userStore.currentUser.id)
        return false;
    // 檢查 submittedBy 是否為物件或字串
    if (typeof submission.submittedBy === 'object' && submission.submittedBy !== null) {
        return submission.submittedBy._id === userStore.currentUser.id;
    }
    else if (typeof submission.submittedBy === 'string') {
        return submission.submittedBy === userStore.currentUser.id;
    }
    return false;
};
// 處理刪除提交的外觀
const handleDeleteSubmission = async (submissionId) => {
    try {
        await appearanceApi.deleteSubmission(submissionId);
        loadData();
    }
    catch (error) {
        console.error('刪除提交失敗', error);
    }
};
// 打開拒絕模態窗
const openRejectModal = (submissionId) => {
    currentSubmissionId.value = submissionId;
    rejectReason.value = '';
    rejectModalOpen.value = true;
};
// 關閉拒絕模態窗
const closeRejectModal = () => {
    rejectModalOpen.value = false;
    currentSubmissionId.value = '';
};
// 提交拒絕
const submitReject = async () => {
    if (!rejectReason.value.trim()) {
        alert('請提供拒絕理由');
        return;
    }
    try {
        await appearanceApi.reviewSubmission(currentSubmissionId.value, 'reject', rejectReason.value);
        closeRejectModal();
        loadData();
    }
    catch (error) {
        console.error('拒絕外觀失敗', error);
    }
};
// 審核外觀的方法
const handleReviewAppearance = async (submissionId, action) => {
    try {
        if (action === 'reject') {
            openRejectModal(submissionId);
            return;
        }
        await appearanceApi.reviewSubmission(submissionId, action);
        loadData();
    }
    catch (error) {
        console.error('審核外觀失敗', error);
    }
};
// 獲取適當的圖片URL (用於顯示外觀的圖片，如果有的話)
const getAppearanceImageUrl = (item) => {
    if (item.imageUrl) {
        if (item.imageUrl.includes('firebasestorage.googleapis.com')) {
            return item.imageUrl;
        }
        return item.imageUrl.startsWith('/uploads')
            ? item.imageUrl
            : `/uploads${item.imageUrl.startsWith('/') ? item.imageUrl : '/' + item.imageUrl}`;
    }
    return undefined;
};
// 打開上傳圖片模態窗
const openUploadModal = (appearanceId) => {
    selectedAppearanceId.value = appearanceId;
    isUploadModalOpen.value = true;
    uploadError.value = null;
};
// 關閉上傳圖片模態窗
const closeUploadModal = () => {
    isUploadModalOpen.value = false;
    selectedAppearanceId.value = '';
    uploadError.value = null;
};
// 處理圖片上傳
const handleImageUpload = async (event) => {
    const target = event.target;
    if (!target.files || target.files.length === 0) {
        return;
    }
    const file = target.files[0];
    // 驗證文件類型
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
        uploadError.value = '不支持的文件類型，只允許JPG、PNG、GIF或WebP';
        return;
    }
    // 驗證文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
        uploadError.value = '文件太大，最大允許5MB';
        return;
    }
    isUploading.value = true;
    uploadError.value = null;
    try {
        // 這裡可以直接使用 Firebase 上傳
        const imagePath = `appearances/${selectedAppearanceId.value}/${Date.now()}_${file.name}`;
        const imageUrl = await uploadImageToFirebase(file, imagePath);
        // 更新後端資料庫中的 URL
        await appearanceApi.updateAppearanceImage(selectedAppearanceId.value, imageUrl);
        closeUploadModal();
        // 重新加載數據以反映圖片更新
        loadData();
    }
    catch (error) {
        console.error('上傳圖片失敗', error);
        uploadError.value = '上傳圖片失敗，請稍後再試';
    }
    finally {
        isUploading.value = false;
    }
};
// 確保 nicknames 始終是數組
const ensureNicknames = (item) => {
    if (!item.nicknames)
        return [];
    if (Array.isArray(item.nicknames))
        return item.nicknames;
    return [];
};
// 監聽路由參數變化
watch(() => route.query.tab, (newTab) => {
    if (newTab === 'pending') {
        activeTab.value = 'pending';
    }
    else if (newTab === 'official') {
        activeTab.value = 'official';
    }
});
// 生命週期鉤子
onMounted(() => {
    // 檢查 URL 參數中是否有指定頁籤
    if (route.query.tab === 'pending') {
        activeTab.value = 'pending';
    }
    else if (route.query.tab === 'official') {
        activeTab.value = 'official';
    }
    loadData();
}); /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['update-image-btn', 'appearance-image-container', 'appearance-info', 'approve-btn', 'reject-btn', 'delete-btn', 'appearance-image-container', 'add-icon', 'add-text', 'add-icon', 'loading-spinner', 'modal-actions', 'cancel-btn', 'appearance-card', 'appearance-card', 'appearance-content', 'appearance-tabs', 'appearance-tabs', 'appearances-flex', 'appearance-card', 'search-container', 'appearance-card',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("appearance-library-container") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
        ...{ class: ("appearance-tabs") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleTabChange('official');
            } },
        ...{ class: (({ active: __VLS_ctx.activeTab === 'official' })) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleTabChange('pending');
            } },
        ...{ class: (({ active: __VLS_ctx.activeTab === 'pending' })) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: ("appearance-content") },
    });
    if (__VLS_ctx.activeTab === 'official') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("search-container") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            ...{ onKeyup: (__VLS_ctx.handleSearch) },
            type: ("text"),
            value: ((__VLS_ctx.searchQuery)),
            placeholder: ("搜尋外觀名稱或暱稱"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleSearch) },
            ...{ class: ("search-btn") },
        });
    }
    if (__VLS_ctx.isLoading) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("loading-container") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("loading-spinner") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    }
    else if (__VLS_ctx.error) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("error-container") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.error);
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.loadData) },
        });
    }
    else {
        if (__VLS_ctx.activeTab === 'official') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: ("official-appearances") },
            });
            if (__VLS_ctx.appearances.length === 0) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("empty-state") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            }
            else {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("appearances-flex") },
                });
                for (const [appearance] of __VLS_getVForSourceType((__VLS_ctx.appearances))) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        key: ((appearance._id)),
                        ...{ class: ("appearance-card") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("appearance-image-container") },
                    });
                    if (__VLS_ctx.getAppearanceImageUrl(appearance)) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                            src: ((__VLS_ctx.getAppearanceImageUrl(appearance))),
                            alt: ("外觀圖片"),
                            ...{ class: ("appearance-image") },
                        });
                    }
                    else {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: ("no-image") },
                        });
                        if (__VLS_ctx.isAdmin) {
                            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                                ...{ onClick: (...[$event]) => {
                                        if (!(!((__VLS_ctx.isLoading))))
                                            return;
                                        if (!(!((__VLS_ctx.error))))
                                            return;
                                        if (!((__VLS_ctx.activeTab === 'official')))
                                            return;
                                        if (!(!((__VLS_ctx.appearances.length === 0))))
                                            return;
                                        if (!(!((__VLS_ctx.getAppearanceImageUrl(appearance)))))
                                            return;
                                        if (!((__VLS_ctx.isAdmin)))
                                            return;
                                        __VLS_ctx.openUploadModal(appearance._id);
                                    } },
                                ...{ class: ("upload-btn") },
                            });
                        }
                        else {
                            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                        }
                    }
                    if (__VLS_ctx.isAdmin && __VLS_ctx.getAppearanceImageUrl(appearance)) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!(!((__VLS_ctx.isLoading))))
                                        return;
                                    if (!(!((__VLS_ctx.error))))
                                        return;
                                    if (!((__VLS_ctx.activeTab === 'official')))
                                        return;
                                    if (!(!((__VLS_ctx.appearances.length === 0))))
                                        return;
                                    if (!((__VLS_ctx.isAdmin && __VLS_ctx.getAppearanceImageUrl(appearance))))
                                        return;
                                    __VLS_ctx.openUploadModal(appearance._id);
                                } },
                            ...{ class: ("update-image-btn") },
                        });
                    }
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("appearance-info") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                        ...{ class: ("appearance-name") },
                    });
                    (appearance.officialName);
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("appearance-category") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                        ...{ class: ("field-label") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: ("category-tag") },
                    });
                    (appearance.category);
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("appearance-nicknames") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                        ...{ class: ("field-label") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("nickname-wrapper") },
                    });
                    for (const [nickname, index] of __VLS_getVForSourceType((__VLS_ctx.ensureNicknames(appearance)))) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            key: ((index)),
                            ...{ class: ("nickname-tag") },
                        });
                        (nickname);
                    }
                    if (!__VLS_ctx.ensureNicknames(appearance).length) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: ("no-nickname") },
                        });
                    }
                }
            }
        }
        if (__VLS_ctx.activeTab === 'pending') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: ("pending-appearances") },
            });
            if (__VLS_ctx.pendingSubmissions.length === 0 && !__VLS_ctx.isLoading) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("empty-state") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.isLoading))))
                                return;
                            if (!(!((__VLS_ctx.error))))
                                return;
                            if (!((__VLS_ctx.activeTab === 'pending')))
                                return;
                            if (!((__VLS_ctx.pendingSubmissions.length === 0 && !__VLS_ctx.isLoading)))
                                return;
                            __VLS_ctx.isCreateModalOpen = true;
                        } },
                    ...{ class: ("appearance-card add-card") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("add-icon") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: ("add-text") },
                });
            }
            else {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("appearances-flex") },
                });
                for (const [submission] of __VLS_getVForSourceType((__VLS_ctx.pendingSubmissions))) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        key: ((submission._id)),
                        ...{ class: ("appearance-card submission-card pending-card") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("appearance-info") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                        ...{ class: ("appearance-name") },
                    });
                    (submission.officialName);
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("appearance-category") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                        ...{ class: ("field-label") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: ("category-tag") },
                    });
                    (submission.category);
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("appearance-nicknames") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                        ...{ class: ("field-label") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("nickname-wrapper") },
                    });
                    for (const [nickname, index] of __VLS_getVForSourceType((__VLS_ctx.ensureNicknames(submission)))) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            key: ((index)),
                            ...{ class: ("nickname-tag") },
                        });
                        (nickname);
                    }
                    if (!__VLS_ctx.ensureNicknames(submission).length) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: ("no-nickname") },
                        });
                    }
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("submission-actions") },
                    });
                    if (__VLS_ctx.isCurrentUser(submission)) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!(!((__VLS_ctx.isLoading))))
                                        return;
                                    if (!(!((__VLS_ctx.error))))
                                        return;
                                    if (!((__VLS_ctx.activeTab === 'pending')))
                                        return;
                                    if (!(!((__VLS_ctx.pendingSubmissions.length === 0 && !__VLS_ctx.isLoading))))
                                        return;
                                    if (!((__VLS_ctx.isCurrentUser(submission))))
                                        return;
                                    __VLS_ctx.handleDeleteSubmission(submission._id);
                                } },
                            ...{ class: ("delete-btn") },
                        });
                    }
                    else {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!(!((__VLS_ctx.isLoading))))
                                        return;
                                    if (!(!((__VLS_ctx.error))))
                                        return;
                                    if (!((__VLS_ctx.activeTab === 'pending')))
                                        return;
                                    if (!(!((__VLS_ctx.pendingSubmissions.length === 0 && !__VLS_ctx.isLoading))))
                                        return;
                                    if (!(!((__VLS_ctx.isCurrentUser(submission)))))
                                        return;
                                    __VLS_ctx.handleReviewAppearance(submission._id, 'approve');
                                } },
                            ...{ class: ("approve-btn") },
                        });
                        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                            ...{ onClick: (...[$event]) => {
                                    if (!(!((__VLS_ctx.isLoading))))
                                        return;
                                    if (!(!((__VLS_ctx.error))))
                                        return;
                                    if (!((__VLS_ctx.activeTab === 'pending')))
                                        return;
                                    if (!(!((__VLS_ctx.pendingSubmissions.length === 0 && !__VLS_ctx.isLoading))))
                                        return;
                                    if (!(!((__VLS_ctx.isCurrentUser(submission)))))
                                        return;
                                    __VLS_ctx.handleReviewAppearance(submission._id, 'reject');
                                } },
                            ...{ class: ("reject-btn") },
                        });
                    }
                }
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.isLoading))))
                                return;
                            if (!(!((__VLS_ctx.error))))
                                return;
                            if (!((__VLS_ctx.activeTab === 'pending')))
                                return;
                            if (!(!((__VLS_ctx.pendingSubmissions.length === 0 && !__VLS_ctx.isLoading))))
                                return;
                            __VLS_ctx.isCreateModalOpen = true;
                        } },
                    ...{ class: ("appearance-card add-card") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("add-icon") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: ("add-text") },
                });
            }
        }
    }
    if (__VLS_ctx.pagination.total > 1) {
        // @ts-ignore
        /** @type { [typeof AppearancePagination, ] } */ ;
        // @ts-ignore
        const __VLS_0 = __VLS_asFunctionalComponent(AppearancePagination, new AppearancePagination({
            ...{ 'onPageChange': {} },
            currentPage: ((__VLS_ctx.pagination.current)),
            totalPages: ((__VLS_ctx.pagination.total)),
        }));
        const __VLS_1 = __VLS_0({
            ...{ 'onPageChange': {} },
            currentPage: ((__VLS_ctx.pagination.current)),
            totalPages: ((__VLS_ctx.pagination.total)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_0));
        let __VLS_5;
        const __VLS_6 = {
            onPageChange: (__VLS_ctx.handlePageChange)
        };
        let __VLS_2;
        let __VLS_3;
        var __VLS_4;
    }
    // @ts-ignore
    /** @type { [typeof CreateAppearanceModal, ] } */ ;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent(CreateAppearanceModal, new CreateAppearanceModal({
        ...{ 'onClose': {} },
        ...{ 'onSubmit': {} },
        isOpen: ((__VLS_ctx.isCreateModalOpen)),
    }));
    const __VLS_8 = __VLS_7({
        ...{ 'onClose': {} },
        ...{ 'onSubmit': {} },
        isOpen: ((__VLS_ctx.isCreateModalOpen)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    let __VLS_12;
    const __VLS_13 = {
        onClose: (...[$event]) => {
            __VLS_ctx.isCreateModalOpen = false;
        }
    };
    const __VLS_14 = {
        onSubmit: (__VLS_ctx.handleSubmitAppearance)
    };
    let __VLS_9;
    let __VLS_10;
    var __VLS_11;
    if (__VLS_ctx.rejectModalOpen) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("modal-overlay") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("reject-modal") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
            value: ((__VLS_ctx.rejectReason)),
            placeholder: ("請輸入拒絕理由"),
            rows: ("4"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("modal-actions") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.closeRejectModal) },
            ...{ class: ("cancel-btn") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.submitReject) },
            ...{ class: ("submit-btn") },
        });
    }
    if (__VLS_ctx.isUploadModalOpen) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("modal-overlay") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("upload-modal") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("upload-form") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            ...{ onChange: (__VLS_ctx.handleImageUpload) },
            type: ("file"),
            accept: ("image/jpeg,image/png,image/gif,image/webp"),
            disabled: ((__VLS_ctx.isUploading)),
        });
        if (__VLS_ctx.uploadError) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("upload-error") },
            });
            (__VLS_ctx.uploadError);
        }
        if (__VLS_ctx.isUploading) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("upload-loading") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("loading-spinner") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("modal-actions") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.closeUploadModal) },
            ...{ class: ("cancel-btn") },
            disabled: ((__VLS_ctx.isUploading)),
        });
    }
    ['appearance-library-container', 'appearance-tabs', 'active', 'active', 'appearance-content', 'search-container', 'search-btn', 'loading-container', 'loading-spinner', 'error-container', 'official-appearances', 'empty-state', 'appearances-flex', 'appearance-card', 'appearance-image-container', 'appearance-image', 'no-image', 'upload-btn', 'update-image-btn', 'appearance-info', 'appearance-name', 'appearance-category', 'field-label', 'category-tag', 'appearance-nicknames', 'field-label', 'nickname-wrapper', 'nickname-tag', 'no-nickname', 'pending-appearances', 'empty-state', 'appearance-card', 'add-card', 'add-icon', 'add-text', 'appearances-flex', 'appearance-card', 'submission-card', 'pending-card', 'appearance-info', 'appearance-name', 'appearance-category', 'field-label', 'category-tag', 'appearance-nicknames', 'field-label', 'nickname-wrapper', 'nickname-tag', 'no-nickname', 'submission-actions', 'delete-btn', 'approve-btn', 'reject-btn', 'appearance-card', 'add-card', 'add-icon', 'add-text', 'modal-overlay', 'reject-modal', 'modal-actions', 'cancel-btn', 'submit-btn', 'modal-overlay', 'upload-modal', 'upload-form', 'upload-error', 'upload-loading', 'loading-spinner', 'modal-actions', 'cancel-btn',];
    var __VLS_slots;
    var $slots;
    let __VLS_inheritedAttrs;
    var $attrs;
    const __VLS_refs = {};
    var $refs;
    var $el;
    return {
        attrs: {},
        slots: __VLS_slots,
        refs: $refs,
        rootEl: $el,
    };
}
;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            CreateAppearanceModal: CreateAppearanceModal,
            AppearancePagination: AppearancePagination,
            isAdmin: isAdmin,
            activeTab: activeTab,
            appearances: appearances,
            pendingSubmissions: pendingSubmissions,
            isLoading: isLoading,
            error: error,
            pagination: pagination,
            searchQuery: searchQuery,
            isCreateModalOpen: isCreateModalOpen,
            rejectModalOpen: rejectModalOpen,
            rejectReason: rejectReason,
            isUploadModalOpen: isUploadModalOpen,
            uploadError: uploadError,
            isUploading: isUploading,
            loadData: loadData,
            handlePageChange: handlePageChange,
            handleSearch: handleSearch,
            handleTabChange: handleTabChange,
            handleSubmitAppearance: handleSubmitAppearance,
            isCurrentUser: isCurrentUser,
            handleDeleteSubmission: handleDeleteSubmission,
            closeRejectModal: closeRejectModal,
            submitReject: submitReject,
            handleReviewAppearance: handleReviewAppearance,
            getAppearanceImageUrl: getAppearanceImageUrl,
            openUploadModal: openUploadModal,
            closeUploadModal: closeUploadModal,
            handleImageUpload: handleImageUpload,
            ensureNicknames: ensureNicknames,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=AppearanceLibrary.vue.js.map