import { ref, onMounted } from 'vue';
import { appearanceApi } from '@/services/api/appearance';
import CreateAppearanceModal from '@/components/CreateAppearanceModal.vue';
import AppearancePagination from '@/components/AppearancePagination.vue';
import { useUserStore } from '@/stores/user';
// 獲取用戶信息
const userStore = useUserStore();
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
// 提交新外觀
const handleSubmitAppearance = async (data) => {
    try {
        await appearanceApi.submitAppearance(data);
        isCreateModalOpen.value = false;
        // 重新載入待審核頁籤
        activeTab.value = 'pending';
        loadData();
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
// 判斷提交者名稱
// const getSubmitterName = (submission: AppearanceSubmission): string => {
//   if (typeof submission.submittedBy === 'object' && submission.submittedBy !== null) {
//     return submission.submittedBy.name || '未知用戶'
//   }
//   return '未知用戶'
// }
// 獲取適當的圖片URL
const getAppearanceImage = (appearance) => {
    if (!appearance.images)
        return undefined;
    return (appearance.images.adultMale ||
        appearance.images.adultFemale ||
        appearance.images.childMale ||
        appearance.images.childFemale ||
        undefined);
};
// 生命週期鉤子
onMounted(() => {
    loadData();
}); /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['approve-btn', 'reject-btn', 'delete-btn', 'add-icon', 'appearance-card', 'appearance-card', 'appearance-content', 'appearance-tabs', 'appearance-tabs', 'appearances-flex', 'appearance-card', 'search-container', 'appearance-card', 'appearance-image-container',];
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
                    if (__VLS_ctx.getAppearanceImage(appearance)) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                            src: ((__VLS_ctx.getAppearanceImage(appearance))),
                            alt: ("外觀圖片"),
                            ...{ class: ("appearance-image") },
                        });
                    }
                    else {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: ("no-image") },
                        });
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    }
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("appearance-info") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                        ...{ class: ("appearance-name") },
                    });
                    (appearance.officialName);
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("appearance-nicknames") },
                    });
                    for (const [nickname, index] of __VLS_getVForSourceType((appearance.nicknames))) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            key: ((index)),
                            ...{ class: ("nickname-tag") },
                        });
                        (nickname);
                    }
                    if (!appearance.nicknames || appearance.nicknames.length === 0) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: ("no-nickname") },
                        });
                    }
                }
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.isLoading))))
                                return;
                            if (!(!((__VLS_ctx.error))))
                                return;
                            if (!((__VLS_ctx.activeTab === 'official')))
                                return;
                            if (!(!((__VLS_ctx.appearances.length === 0))))
                                return;
                            __VLS_ctx.isCreateModalOpen = true;
                        } },
                    ...{ class: ("appearance-card add-card") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("add-icon") },
                });
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
            }
            else {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("appearances-flex") },
                });
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
                for (const [submission] of __VLS_getVForSourceType((__VLS_ctx.pendingSubmissions))) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        key: ((submission._id)),
                        ...{ class: ("appearance-card submission-card") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("appearance-image-container") },
                    });
                    if (__VLS_ctx.getAppearanceImage(submission)) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                            src: ((__VLS_ctx.getAppearanceImage(submission))),
                            alt: ("外觀圖片"),
                            ...{ class: ("appearance-image") },
                        });
                    }
                    else {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: ("no-image") },
                        });
                        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                    }
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("appearance-info") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                        ...{ class: ("appearance-name") },
                    });
                    (submission.officialName);
                    if (submission.nicknames && submission.nicknames.length > 0) {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: ("appearance-nicknames") },
                        });
                        for (const [nickname, index] of __VLS_getVForSourceType((submission.nicknames))) {
                            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                                key: ((index)),
                                ...{ class: ("nickname-tag") },
                            });
                            (nickname);
                        }
                    }
                    else {
                        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                            ...{ class: ("no-nicknames") },
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
    ['appearance-library-container', 'appearance-tabs', 'active', 'active', 'appearance-content', 'search-container', 'search-btn', 'loading-container', 'loading-spinner', 'error-container', 'official-appearances', 'empty-state', 'appearances-flex', 'appearance-card', 'appearance-image-container', 'appearance-image', 'no-image', 'appearance-info', 'appearance-name', 'appearance-nicknames', 'nickname-tag', 'no-nickname', 'appearance-card', 'add-card', 'add-icon', 'pending-appearances', 'empty-state', 'appearance-card', 'add-card', 'add-icon', 'appearances-flex', 'appearance-card', 'add-card', 'add-icon', 'appearance-card', 'submission-card', 'appearance-image-container', 'appearance-image', 'no-image', 'appearance-info', 'appearance-name', 'appearance-nicknames', 'nickname-tag', 'no-nicknames', 'submission-actions', 'delete-btn', 'approve-btn', 'reject-btn', 'modal-overlay', 'reject-modal', 'modal-actions', 'cancel-btn', 'submit-btn',];
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
            getAppearanceImage: getAppearanceImage,
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