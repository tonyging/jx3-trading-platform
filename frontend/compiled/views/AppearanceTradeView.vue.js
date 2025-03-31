// AppearanceTradeView.vue
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { appearanceTradeApi } from '@/services/api/appearanceTrade';
import { ratingApi } from '@/services/api/rating';
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
    let baseColumns = currentTab.value === 'completed' ? 4 : 7;
    if (currentTab.value === 'all') {
        baseColumns += 1;
    }
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
// 檢查用戶是否已評價交易
const checkRatingStatus = async (tradeId) => {
    try {
        const response = await ratingApi.checkRatingExists(tradeId, userStore.currentUser?.id || '');
        return response.exists;
    }
    catch (error) {
        console.error('檢查評價狀態失敗:', error);
        return false;
    }
};
// 獲取賣家名稱
const getSellerName = (trade) => {
    if (typeof trade.sellerId === 'object' && trade.sellerId) {
        return trade.sellerId.name || '未知賣家';
    }
    return '未知賣家';
};
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
            case 'completed':
                requestParams.status = 'completed';
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
        // 在已完成頁籤中，檢查評價狀態
        if (currentTab.value === 'completed') {
            ratedTransactions.value.clear(); // 清空之前的已評價交易
            for (const trade of trades.value) {
                if (trade._id) {
                    const hasRated = await checkRatingStatus(trade._id);
                    if (hasRated) {
                        ratedTransactions.value.add(trade._id);
                    }
                }
            }
        }
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
    if ((tab === 'my' || tab === 'completed') && !userStore.currentUser?.id) {
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
            await appearanceTradeApi.reserveAppearanceTrade(selectedTrade.value._id, paymentMethod);
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
};
// 添加評價功能
const showRatingModal = ref(false);
const tradeToRate = ref(null);
const targetUserId = ref(null);
// 處理評價
const handleRate = async (trade) => {
    if (!trade._id) {
        showNotification('找不到相關交易資訊', 'error');
        return;
    }
    try {
        // 檢查是否已評價
        const ratingResponse = await ratingApi.checkRatingExists(trade._id, userStore.currentUser?.id || '');
        if (ratingResponse.exists) {
            // 如果已評價，獲取之前的評價詳情
            const previousRatingResponse = await ratingApi.getTransactionRating(trade._id);
            previousRating.value = previousRatingResponse.data.rating;
            showPreviousRatingModal.value = true;
            return;
        }
        // 儲存交易ID
        tradeToRate.value = trade._id;
        // 獲取評價對象的ID (賣家)
        if (typeof trade.sellerId === 'object') {
            targetUserId.value = trade.sellerId._id;
        }
        else {
            targetUserId.value = trade.sellerId;
        }
        // 顯示評價對話框
        showRatingModal.value = true;
    }
    catch (error) {
        console.error('檢查評價狀態失敗:', error);
        showNotification('檢查評價狀態失敗', 'error');
    }
};
// 提交評價
const submitRating = async () => {
    try {
        if (!tradeToRate.value || !targetUserId.value) {
            showNotification('評價資訊不完整', 'error');
            return;
        }
        await ratingApi.createRating({
            toUserId: targetUserId.value,
            score: ratingScore.value,
            comment: ratingComment.value,
            transactionId: tradeToRate.value,
        });
        // 更新已評價的交易列表
        ratedTransactions.value.add(tradeToRate.value);
        showRatingModal.value = false;
        showNotification('評價成功', 'success');
        // 重新載入交易列表
        await loadTrades();
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.response?.data?.message || apiError.message || '評價失敗', 'error');
    }
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['cancel-button', 'verify-button', 'active', 'stars-label', 'stars-container', 'star-btn', 'active', 'stars-value', 'main-content', 'trade-content', 'table-header', 'tabs', 'create-button', 'trade-table', 'view-button', 'buy-button', 'edit-button', 'delete-button', 'rate-button', 'transaction-actions',];
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
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.switchTab('completed');
            } },
        ...{ class: ((['tab', { active: __VLS_ctx.currentTab === 'completed' }])) },
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
    if (__VLS_ctx.currentTab === 'all') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    }
    if (__VLS_ctx.currentTab !== 'completed') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.currentTab !== 'completed')))
                        return;
                    __VLS_ctx.handleSort('price');
                } },
            ...{ class: ("sort-header") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span)({
            ...{ class: ((__VLS_ctx.getSortIconClass('price'))) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(!((__VLS_ctx.currentTab !== 'completed'))))
                        return;
                    __VLS_ctx.handleSort('price');
                } },
            ...{ class: ("sort-header") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span)({
            ...{ class: ((__VLS_ctx.getSortIconClass('price'))) },
        });
    }
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
            if (__VLS_ctx.currentTab === 'all') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (__VLS_ctx.getSellerName(trade));
            }
            if (__VLS_ctx.currentTab !== 'completed') {
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
            }
            else {
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (__VLS_ctx.formatPrice(trade.price));
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
            else if (__VLS_ctx.currentTab === 'completed') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("transaction-actions") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.trades.length === 0))))
                                return;
                            if (!(!((__VLS_ctx.currentTab === 'trading'))))
                                return;
                            if (!((__VLS_ctx.currentTab === 'completed')))
                                return;
                            __VLS_ctx.handleViewTrade(trade);
                        } },
                    ...{ class: ("view-button") },
                });
                if (typeof trade.buyerId === 'object' &&
                    trade.buyerId._id === __VLS_ctx.userStore.currentUser?.id) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(!((__VLS_ctx.loading))))
                                    return;
                                if (!(!((__VLS_ctx.trades.length === 0))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'trading'))))
                                    return;
                                if (!((__VLS_ctx.currentTab === 'completed')))
                                    return;
                                if (!((typeof trade.buyerId === 'object' &&
                                    trade.buyerId._id === __VLS_ctx.userStore.currentUser?.id)))
                                    return;
                                __VLS_ctx.handleRate(trade);
                            } },
                        ...{ class: ("rate-button") },
                    });
                    (__VLS_ctx.ratedTransactions.has(trade._id) ? '已評價' : '評價賣家');
                }
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
                                if (!(!((__VLS_ctx.currentTab === 'completed'))))
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
                                if (!(!((__VLS_ctx.currentTab === 'completed'))))
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
                                if (!(!((__VLS_ctx.currentTab === 'completed'))))
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
    if (__VLS_ctx.showRatingModal) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("rating-modal-overlay") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("rating-modal") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("rating-stars") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("stars-label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("stars-container") },
        });
        for (const [i] of __VLS_getVForSourceType((5))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.showRatingModal)))
                            return;
                        __VLS_ctx.ratingScore = i;
                    } },
                key: ((i)),
                type: ("button"),
                ...{ class: ((['star-btn', { active: i <= __VLS_ctx.ratingScore }])) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("stars-value") },
        });
        (__VLS_ctx.ratingScore);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("rating-comment") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: ("rating-comment"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
            id: ("rating-comment"),
            value: ((__VLS_ctx.ratingComment)),
            placeholder: ("請輸入您的評價內容..."),
            rows: ("4"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("rating-actions") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.showRatingModal)))
                        return;
                    __VLS_ctx.showRatingModal = false;
                } },
            ...{ class: ("cancel-btn") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.submitRating) },
            ...{ class: ("submit-btn") },
        });
    }
    if (__VLS_ctx.showPreviousRatingModal) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("previous-rating-modal-overlay") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("previous-rating-modal") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("previous-rating-stars") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("stars-label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("stars-container") },
        });
        for (const [i] of __VLS_getVForSourceType((5))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                key: ((i)),
                type: ("button"),
                ...{ class: ((['star-btn', { active: i <= (__VLS_ctx.previousRating?.score || 0) }])) },
                disabled: (true),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("stars-value") },
        });
        (__VLS_ctx.previousRating?.score || 0);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("previous-rating-comment") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.previousRating?.comment || '無評價內容');
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("rating-date") },
        });
        (__VLS_ctx.previousRating?.createdAt
            ? new Date(__VLS_ctx.previousRating.createdAt).toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            })
            : '未知');
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("previous-rating-actions") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.showPreviousRatingModal)))
                        return;
                    __VLS_ctx.showPreviousRatingModal = false;
                } },
        });
    }
    if (__VLS_ctx.notification.show) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ((['notification', `notification-${__VLS_ctx.notification.type}`])) },
        });
        (__VLS_ctx.notification.message);
    }
    ['main-content', 'trade-content', 'table-header', 'tabs', 'active', 'tab', 'active', 'tab', 'active', 'tab', 'active', 'tab', 'create-button', 'trade-table', 'sort-header', 'sort-header', 'status-message', 'status-message', 'status-tag', 'view-button', 'transaction-actions', 'view-button', 'rate-button', 'product-actions', 'edit-button', 'delete-button', 'buy-button', 'verification-modal-overlay', 'verification-modal', 'verification-modal-content', 'verification-modal-actions', 'cancel-button', 'verify-button', 'rating-modal-overlay', 'rating-modal', 'rating-stars', 'stars-label', 'stars-container', 'active', 'star-btn', 'stars-value', 'rating-comment', 'rating-actions', 'cancel-btn', 'submit-btn', 'previous-rating-modal-overlay', 'previous-rating-modal', 'previous-rating-stars', 'stars-label', 'stars-container', 'active', 'star-btn', 'stars-value', 'previous-rating-comment', 'rating-date', 'previous-rating-actions', 'notification',];
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
            ratedTransactions: ratedTransactions,
            ratingScore: ratingScore,
            ratingComment: ratingComment,
            showPreviousRatingModal: showPreviousRatingModal,
            previousRating: previousRating,
            isAdmin: isAdmin,
            totalColumns: totalColumns,
            router: router,
            userStore: userStore,
            currentTab: currentTab,
            notification: notification,
            getSellerName: getSellerName,
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
            showRatingModal: showRatingModal,
            handleRate: handleRate,
            submitRating: submitRating,
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