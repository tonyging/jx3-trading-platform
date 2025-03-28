// AppearanceTradeView.vue
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { appearanceTradeApi } from '@/services/api/appearanceTrade';
import CreateAppearanceTradeModal from '@/components/CreateAppearanceTradeModal.vue';
import EditAppearanceTradeModal from '@/components/EditAppearanceTradeModal.vue';
import ReserveTradeModal from '@/components/ReserveTradeModal.vue';
// 定義 trades
const trades = ref([]);
const loading = ref(true);
const selectedTrade = ref(null);
const showAccountVerificationModal = ref(false);
const verificationMessage = ref('');
const ratedTransactions = ref(new Set());
const ratingScore = ref(5);
const ratingComment = ref('');
const showPreviousRatingModal = ref(false);
const previousRating = ref(null);
// 定義狀態映射
const statusMap = {
    pending: '待交易',
    trading: '交易中',
    pending_confirmation: '待確認',
    completed: '已完成',
    cancelled: '已取消',
    deleted: '已下架',
};
const isAdmin = computed(() => {
    return userStore.currentUser?.role === 'admin';
});
// 計算表格的總列數
const totalColumns = computed(() => {
    // 基礎列數（賣家、外觀名稱、類型、幣別、價格、交易方式、操作）
    let baseColumns = 7;
    // 如果是管理員，加上狀態列
    if (isAdmin.value) {
        baseColumns += 1;
    }
    return baseColumns;
});
// 初始化路由和用戶狀態管理
const router = useRouter();
const userStore = useUserStore();
//頁籤狀態
const currentTab = ref('all');
const sortFieldMap = {
    price: 'price',
    createdAt: 'createdAt',
};
const currentSort = ref({
    field: 'createdAt',
    direction: 'desc',
});
const notification = ref({
    show: false,
    message: '',
    type: 'success',
});
// 載入外觀交易列表
const loadTrades = async () => {
    try {
        loading.value = true;
        const requestParams = {
            sortBy: sortFieldMap[currentSort.value.field],
            order: currentSort.value.direction,
        };
        // 根據不同頁籤設定 status
        switch (currentTab.value) {
            case 'trading':
                requestParams.status = 'trading';
                if (userStore.currentUser?.id) {
                    requestParams.sellerId = userStore.currentUser.id;
                    requestParams.buyerId = userStore.currentUser.id;
                }
                break;
            case 'my':
                if (!userStore.currentUser?.id) {
                    await userStore.fetchCurrentUser();
                }
                if (userStore.currentUser?.id) {
                    requestParams.sellerId = userStore.currentUser.id;
                    requestParams.status = 'pending';
                }
                else {
                    showNotification('無法取得用戶資訊', 'error');
                    trades.value = [];
                    loading.value = false;
                    return;
                }
                break;
            default:
                requestParams.status = 'pending'; // 全部頁籤只顯示待交易
        }
        const response = await appearanceTradeApi.getAppearanceTrades(requestParams);
        trades.value = response.data.trades;
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.response?.data?.message || apiError.message || '載入外觀交易列表失敗', 'error');
        trades.value = [];
    }
    finally {
        loading.value = false;
    }
};
// 帳號驗證機制
const checkAccountVerification = async (action) => {
    await userStore.fetchCurrentUser();
    const currentUser = userStore.currentUser;
    if (!currentUser?.isPhoneVerified && !currentUser?.discordId) {
        verificationMessage.value = '您需要先驗證手機號碼和綁定 Discord 帳號';
        showAccountVerificationModal.value = true;
        return;
    }
    if (!currentUser?.isPhoneVerified) {
        verificationMessage.value = '您需要先驗證手機號碼';
        showAccountVerificationModal.value = true;
        return;
    }
    if (!currentUser?.discordId) {
        verificationMessage.value = '您需要先綁定 Discord 帳號';
        showAccountVerificationModal.value = true;
        return;
    }
    action();
};
// 處理交易
const handleReserveTrade = (trade) => {
    checkAccountVerification(() => {
        selectedTrade.value = trade;
        showReserveModal.value = true;
    });
};
// 切換頁籤的方法
const switchTab = async (tab) => {
    currentTab.value = tab;
    if (tab === 'my' && !userStore.currentUser?.id) {
        try {
            await userStore.fetchCurrentUser();
        }
        catch (error) {
            const apiError = error;
            showNotification(apiError.message || '載入用戶資訊失敗', 'error');
        }
    }
    await loadTrades();
};
// 顯示通知的方法
const showNotification = (message, type = 'success') => {
    notification.value = {
        show: true,
        message,
        type,
    };
    // 3秒後自動關閉通知
    setTimeout(() => {
        notification.value.show = false;
    }, 3000);
};
// 格式化價格顯示
const formatPrice = (price) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
    }).format(price);
};
// 格式化交易方式顯示
const formatPaymentMethods = (methods) => {
    if (!methods || methods.length === 0)
        return '未設定';
    return methods.join(', ');
};
// 處理排序
const handleSort = async (field) => {
    if (currentSort.value.field === field) {
        currentSort.value.direction = currentSort.value.direction === 'asc' ? 'desc' : 'asc';
    }
    else {
        currentSort.value.field = field;
        currentSort.value.direction = 'desc';
    }
    await loadTrades();
};
// 獲取排序圖標的類別
const getSortIconClass = (field) => {
    if (currentSort.value.field !== field)
        return 'sort-icon';
    return currentSort.value.direction === 'asc' ? 'sort-icon ascending' : 'sort-icon descending';
};
// 在組件掛載時載入交易列表
onMounted(async () => {
    if (!userStore.isAuthenticated) {
        router.push('/login');
        return;
    }
    // 等待用戶資訊載入完成
    if (!userStore.currentUser?.id) {
        // 可以添加一個簡單的重試機制
        let retries = 3;
        while (retries > 0 && !userStore.currentUser?.id) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            retries--;
        }
    }
    await loadTrades();
});
// 控制創建交易 Modal 的顯示狀態
const isCreateModalOpen = ref(false);
const showReserveModal = ref(false);
// 處理創建外觀交易的事件
const handleCreateTrade = () => {
    checkAccountVerification(() => {
        isCreateModalOpen.value = true;
    });
};
// 處理表單提交
const handleSubmitTrade = async (data) => {
    try {
        await appearanceTradeApi.createAppearanceTrade(data);
        isCreateModalOpen.value = false;
        showNotification('外觀交易建立成功');
        await loadTrades(); // 重新載入交易列表
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.message || '建立外觀交易失敗，請稍後再試', 'error');
    }
};
// 刪除交易的方法
const handleDeleteTrade = async (trade) => {
    checkAccountVerification(async () => {
        try {
            await appearanceTradeApi.deleteTrade(trade._id);
            showNotification('外觀交易已成功刪除');
            await loadTrades();
        }
        catch (error) {
            const apiError = error;
            showNotification(apiError.message || '刪除外觀交易失敗，請稍後再試', 'error');
        }
    });
};
// 編輯交易相關狀態和方法
const isEditModalOpen = ref(false);
const currentEditTrade = ref(null);
// 打開編輯交易彈窗
const handleEditTrade = (trade) => {
    checkAccountVerification(() => {
        currentEditTrade.value = trade;
        isEditModalOpen.value = true;
    });
};
// 提交編輯交易
const handleSubmitEditTrade = async (data) => {
    if (!currentEditTrade.value)
        return;
    try {
        await appearanceTradeApi.updateTrade(currentEditTrade.value._id, data);
        isEditModalOpen.value = false;
        showNotification('外觀交易更新成功');
        await loadTrades(); // 重新載入交易列表
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.message || '更新外觀交易失敗，請稍後再試', 'error');
    }
};
// 確認預定外觀交易
const handleConfirmReservation = async (paymentMethod) => {
    if (selectedTrade.value) {
        try {
            const response = await appearanceTradeApi.reserveAppearanceTrade(selectedTrade.value._id, paymentMethod);
            // 關閉預訂模態框
            showReserveModal.value = false;
            // 跳轉到交易詳情頁面
            router.push(`/appearance-trades/${selectedTrade.value._id}`);
            // 顯示成功訊息
            showNotification('購買成功！正在前往交易詳情頁面...', 'success');
        }
        catch (error) {
            const apiError = error;
            // 提供更詳細的錯誤訊息
            const errorMessage = apiError.message || '購買失敗，請稍後再試';
            showNotification(errorMessage, 'error');
        }
    }
};
// 獲取外觀名稱
const getAppearanceName = (trade) => {
    if (typeof trade.appearanceId === 'object') {
        return trade.appearanceId.officialName || '未知外觀';
    }
    return '未知外觀';
};
// 獲取外觀類型
const getAppearanceCategory = (trade) => {
    if (typeof trade.appearanceId === 'object' && trade.appearanceId.category) {
        return trade.appearanceId.category;
    }
    return '未知類型';
};
// 查看交易詳情
const handleViewTrade = (trade) => {
    router.push(`/appearance-trades/${trade._id}`);
};
// 獲取狀態顯示
const getStatusDisplay = (status) => {
    return statusMap[status] || `未知狀態(${status})`;
};
// 添加狀態標籤的樣式
const getStatusClass = (status) => {
    const classMap = {
        pending: 'status-pending',
        trading: 'status-trading',
        pending_confirmation: 'status-pending-confirmation',
        completed: 'status-completed',
        cancelled: 'status-cancelled',
        deleted: 'status-deleted',
    };
    return classMap[status] || 'status-unknown';
};
// 獲取貨幣顯示
const getCurrencyDisplay = (currency) => {
    const currencyMap = {
        台幣: '台幣',
        人民幣: '人民幣',
        港幣: '港幣',
        遊戲幣: '遊戲幣',
    };
    return currencyMap[currency] || currency;
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['cancel-button', 'verify-button', 'main-content', 'trade-content', 'table-header', 'tabs', 'create-button', 'trade-table', 'view-button', 'buy-button', 'edit-button', 'delete-button',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: ("main-content trade-content") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("table-header") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("tabs") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.switchTab('all');
            } },
        ...{ class: ((['tab', { active: __VLS_ctx.currentTab === 'all' }])) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.switchTab('my');
            } },
        ...{ class: ((['tab', { active: __VLS_ctx.currentTab === 'my' }])) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.switchTab('trading');
            } },
        ...{ class: ((['tab', { active: __VLS_ctx.currentTab === 'trading' }])) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleCreateTrade) },
        ...{ class: ("create-button") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("trade-table") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleSort('price');
            } },
        ...{ class: ("sort-header") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span)({
        ...{ class: ((__VLS_ctx.getSortIconClass('price'))) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    if (__VLS_ctx.isAdmin) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
    if (__VLS_ctx.loading) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            colspan: ((__VLS_ctx.totalColumns)),
            ...{ class: ("status-message") },
        });
    }
    else if (__VLS_ctx.trades.length === 0) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            colspan: ((__VLS_ctx.totalColumns)),
            ...{ class: ("status-message") },
        });
    }
    else {
        for (const [trade] of __VLS_getVForSourceType((__VLS_ctx.trades))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                key: ((trade._id)),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (__VLS_ctx.getAppearanceName(trade));
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (__VLS_ctx.getAppearanceCategory(trade));
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (__VLS_ctx.getCurrencyDisplay(trade.currency));
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (__VLS_ctx.formatPrice(trade.price));
            if (__VLS_ctx.currentTab !== 'trading') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (__VLS_ctx.formatPaymentMethods(trade.paymentMethods));
            }
            else {
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (trade.selectedPaymentMethod);
            }
            if (__VLS_ctx.isAdmin) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ((['status-tag', __VLS_ctx.getStatusClass(trade.status)])) },
                    title: ((trade.status)),
                });
                (__VLS_ctx.getStatusDisplay(trade.status));
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            if (__VLS_ctx.currentTab === 'trading') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.trades.length === 0))))
                                return;
                            if (!((__VLS_ctx.currentTab === 'trading')))
                                return;
                            __VLS_ctx.handleViewTrade(trade);
                        } },
                    ...{ class: ("view-button") },
                });
            }
            else {
                if (typeof trade.sellerId === 'object' &&
                    trade.sellerId._id === __VLS_ctx.userStore.currentUser?.id) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("product-actions") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(!((__VLS_ctx.loading))))
                                    return;
                                if (!(!((__VLS_ctx.trades.length === 0))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'trading'))))
                                    return;
                                if (!((typeof trade.sellerId === 'object' &&
                                    trade.sellerId._id === __VLS_ctx.userStore.currentUser?.id)))
                                    return;
                                __VLS_ctx.handleEditTrade(trade);
                            } },
                        ...{ class: ("edit-button") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(!((__VLS_ctx.loading))))
                                    return;
                                if (!(!((__VLS_ctx.trades.length === 0))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'trading'))))
                                    return;
                                if (!((typeof trade.sellerId === 'object' &&
                                    trade.sellerId._id === __VLS_ctx.userStore.currentUser?.id)))
                                    return;
                                __VLS_ctx.handleDeleteTrade(trade);
                            } },
                        ...{ class: ("delete-button") },
                    });
                }
                else {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(!((__VLS_ctx.loading))))
                                    return;
                                if (!(!((__VLS_ctx.trades.length === 0))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'trading'))))
                                    return;
                                if (!(!((typeof trade.sellerId === 'object' &&
                                    trade.sellerId._id === __VLS_ctx.userStore.currentUser?.id))))
                                    return;
                                __VLS_ctx.handleReserveTrade(trade);
                            } },
                        ...{ class: ("buy-button") },
                    });
                }
            }
        }
    }
    // @ts-ignore
    /** @type { [typeof CreateAppearanceTradeModal, ] } */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(CreateAppearanceTradeModal, new CreateAppearanceTradeModal({
        ...{ 'onSubmit': {} },
        isOpen: ((__VLS_ctx.isCreateModalOpen)),
    }));
    const __VLS_1 = __VLS_0({
        ...{ 'onSubmit': {} },
        isOpen: ((__VLS_ctx.isCreateModalOpen)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    let __VLS_5;
    const __VLS_6 = {
        onSubmit: (__VLS_ctx.handleSubmitTrade)
    };
    let __VLS_2;
    let __VLS_3;
    var __VLS_4;
    // @ts-ignore
    /** @type { [typeof EditAppearanceTradeModal, ] } */ ;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent(EditAppearanceTradeModal, new EditAppearanceTradeModal({
        ...{ 'onSubmit': {} },
        isOpen: ((__VLS_ctx.isEditModalOpen)),
        trade: ((__VLS_ctx.currentEditTrade)),
    }));
    const __VLS_8 = __VLS_7({
        ...{ 'onSubmit': {} },
        isOpen: ((__VLS_ctx.isEditModalOpen)),
        trade: ((__VLS_ctx.currentEditTrade)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    let __VLS_12;
    const __VLS_13 = {
        onSubmit: (__VLS_ctx.handleSubmitEditTrade)
    };
    let __VLS_9;
    let __VLS_10;
    var __VLS_11;
    // @ts-ignore
    /** @type { [typeof ReserveTradeModal, ] } */ ;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent(ReserveTradeModal, new ReserveTradeModal({
        ...{ 'onConfirm': {} },
        isOpen: ((__VLS_ctx.showReserveModal)),
        trade: ((__VLS_ctx.selectedTrade)),
    }));
    const __VLS_15 = __VLS_14({
        ...{ 'onConfirm': {} },
        isOpen: ((__VLS_ctx.showReserveModal)),
        trade: ((__VLS_ctx.selectedTrade)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_14));
    let __VLS_19;
    const __VLS_20 = {
        onConfirm: (__VLS_ctx.handleConfirmReservation)
    };
    let __VLS_16;
    let __VLS_17;
    var __VLS_18;
    if (__VLS_ctx.showAccountVerificationModal) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("verification-modal-overlay") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("verification-modal") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("verification-modal-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.verificationMessage);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("verification-modal-actions") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.showAccountVerificationModal)))
                        return;
                    __VLS_ctx.showAccountVerificationModal = false;
                } },
            ...{ class: ("cancel-button") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (() => {
                    __VLS_ctx.showAccountVerificationModal = false;
                    __VLS_ctx.router.push('/member-info?tab=security');
                }) },
            ...{ class: ("verify-button") },
        });
    }
    if (__VLS_ctx.notification.show) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ((['notification', `notification-${__VLS_ctx.notification.type}`])) },
        });
        (__VLS_ctx.notification.message);
    }
    ['main-content', 'trade-content', 'table-header', 'tabs', 'active', 'tab', 'active', 'tab', 'active', 'tab', 'create-button', 'trade-table', 'sort-header', 'status-message', 'status-message', 'status-tag', 'view-button', 'product-actions', 'edit-button', 'delete-button', 'buy-button', 'verification-modal-overlay', 'verification-modal', 'verification-modal-content', 'verification-modal-actions', 'cancel-button', 'verify-button', 'notification',];
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
            CreateAppearanceTradeModal: CreateAppearanceTradeModal,
            EditAppearanceTradeModal: EditAppearanceTradeModal,
            ReserveTradeModal: ReserveTradeModal,
            trades: trades,
            loading: loading,
            selectedTrade: selectedTrade,
            showAccountVerificationModal: showAccountVerificationModal,
            verificationMessage: verificationMessage,
            isAdmin: isAdmin,
            totalColumns: totalColumns,
            router: router,
            userStore: userStore,
            currentTab: currentTab,
            notification: notification,
            handleReserveTrade: handleReserveTrade,
            switchTab: switchTab,
            formatPrice: formatPrice,
            formatPaymentMethods: formatPaymentMethods,
            handleSort: handleSort,
            getSortIconClass: getSortIconClass,
            isCreateModalOpen: isCreateModalOpen,
            showReserveModal: showReserveModal,
            handleCreateTrade: handleCreateTrade,
            handleSubmitTrade: handleSubmitTrade,
            handleDeleteTrade: handleDeleteTrade,
            isEditModalOpen: isEditModalOpen,
            currentEditTrade: currentEditTrade,
            handleEditTrade: handleEditTrade,
            handleSubmitEditTrade: handleSubmitEditTrade,
            handleConfirmReservation: handleConfirmReservation,
            getAppearanceName: getAppearanceName,
            getAppearanceCategory: getAppearanceCategory,
            handleViewTrade: handleViewTrade,
            getStatusDisplay: getStatusDisplay,
            getStatusClass: getStatusClass,
            getCurrencyDisplay: getCurrencyDisplay,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=AppearanceTradeView.vue.js.map