// HomeView.vue
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import CreateProductModal from '@/components/CreateProductModal.vue';
import EditProductModal from '@/components/EditProductModal.vue';
import PurchaseConfirmModal from '@/components/PurchaseConfirmModal.vue';
import { productApi } from '@/services/api/product';
import { ratingApi } from '@/services/api/rating';
// 定義 products
const products = ref([]);
const loading = ref(true);
const showPurchaseModal = ref(false);
const selectedProduct = ref(null);
const showAccountVerificationModal = ref(false);
const verificationMessage = ref('');
const ratedTransactions = ref(new Set());
const ratingScore = ref(5);
const ratingComment = ref('');
const showPreviousRatingModal = ref(false);
const previousRating = ref(null);
// 定義狀態映射
const statusMap = {
    active: '可購買',
    reserved: '交易中',
    sold: '已售出',
    deleted: '已下架',
};
const isAdmin = computed(() => {
    return userStore.currentUser?.role === 'admin';
});
// 計算表格的總列數
const totalColumns = computed(() => {
    // 基礎列數（賣家、數量、價格、幣值、操作）
    let baseColumns = currentTab.value === 'completed' ? 4 : 8;
    // 如果是管理員，加上狀態列
    if (isAdmin.value) {
        baseColumns += 1;
    }
    return baseColumns;
});
// 檢查用戶是否已評價交易
const checkRatingStatus = async (transactionId) => {
    try {
        const response = await ratingApi.checkRatingExists(transactionId, userStore.currentUser?.id || '');
        return response.exists;
    }
    catch (error) {
        console.error('檢查評價狀態失敗:', error);
        return false;
    }
};
// 處理購買點擊
const handleBuyProduct = (product) => {
    checkAccountVerification(() => {
        selectedProduct.value = product;
        showPurchaseModal.value = true;
    });
};
// 初始化路由和用戶狀態管理
const router = useRouter();
const userStore = useUserStore();
// 使用 storeToRefs 解構 currentUser
const {} = storeToRefs(userStore);
//頁籤狀態
const currentTab = ref('all');
const sortFieldMap = {
    amount: 'amount',
    price: 'price',
    value: 'ratio',
};
const currentSort = ref({
    field: 'price',
    direction: 'desc',
});
const notification = ref({
    show: false,
    message: '',
    type: 'success',
});
// 載入商品列表
const loadProducts = async () => {
    try {
        loading.value = true;
        const requestParams = {
            sortBy: sortFieldMap[currentSort.value.field],
            order: currentSort.value.direction,
            tab: currentTab.value,
        };
        // 根據不同頁籤設定 status
        switch (currentTab.value) {
            case 'trading':
                requestParams.status = 'reserved';
                if (userStore.currentUser?.id) {
                    requestParams.userId = userStore.currentUser.id;
                    requestParams.buyerId = userStore.currentUser.id;
                }
                break;
            case 'completed':
                requestParams.status = 'sold';
                if (userStore.currentUser?.id) {
                    requestParams.tab = 'completed';
                    requestParams.userId = userStore.currentUser.id;
                }
                break;
            case 'my':
                if (!userStore.currentUser?.id) {
                    await userStore.fetchCurrentUser();
                }
                if (userStore.currentUser?.id) {
                    requestParams.userId = userStore.currentUser.id;
                    requestParams.status = 'active';
                }
                else {
                    showNotification('無法取得用戶資訊', 'error');
                    products.value = [];
                    loading.value = false;
                    return;
                }
                break;
            case 'admin':
                requestParams.status = ['active', 'reserved', 'sold'];
                break;
            default:
                requestParams.status = 'active';
        }
        const response = await productApi.getProducts(requestParams);
        products.value = response.data.products;
        // 在載入商品後，重新檢查評價狀態
        if (currentTab.value === 'completed') {
            ratedTransactions.value.clear(); // 清空之前的已評價交易
            for (const product of products.value) {
                if (product.transactionId) {
                    const transactionId = typeof product.transactionId === 'object'
                        ? product.transactionId._id
                        : product.transactionId;
                    const hasRated = await checkRatingStatus(transactionId);
                    if (hasRated) {
                        ratedTransactions.value.add(transactionId);
                    }
                }
            }
        }
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.response?.data?.message || apiError.message || '載入商品列表失敗', 'error');
        products.value = [];
    }
    finally {
        loading.value = false;
    }
};
// 添加評價功能
const showRatingModal = ref(false);
const transactionToRate = ref(null);
const productToRate = ref(null);
const targetUserId = ref(null);
// 打開評價對話框
const handleRate = async (product) => {
    if (!product.transactionId) {
        showNotification('找不到相關交易資訊', 'error');
        return;
    }
    const transactionId = typeof product.transactionId === 'object' ? product.transactionId._id : product.transactionId;
    try {
        // 檢查是否已評價
        const ratingResponse = await ratingApi.checkRatingExists(transactionId, userStore.currentUser?.id || '');
        if (ratingResponse.exists) {
            // 如果已評價，獲取之前的評價詳情
            const previousRatingResponse = await ratingApi.getTransactionRating(transactionId);
            previousRating.value = previousRatingResponse.data.rating;
            showPreviousRatingModal.value = true;
            return;
        }
        // 儲存交易ID和產品資訊
        transactionToRate.value = transactionId;
        productToRate.value = product;
        // 獲取評價對象的ID
        if (typeof product.userId === 'object') {
            targetUserId.value = product.userId._id;
        }
        else {
            targetUserId.value = product.userId;
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
const submitRating = async (rating) => {
    try {
        if (!transactionToRate.value || !targetUserId.value) {
            showNotification('評價資訊不完整', 'error');
            return;
        }
        await ratingApi.createRating({
            toUserId: targetUserId.value,
            score: rating.score,
            comment: rating.comment,
            transactionId: transactionToRate.value,
        });
        // 更新已評價的交易列表
        ratedTransactions.value.add(transactionToRate.value);
        showRatingModal.value = false;
        showNotification('評價成功', 'success');
        // 重新載入交易列表
        await loadProducts();
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.response?.data?.message || apiError.message || '評價失敗', 'error');
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
// 切換頁籤的方法
const switchTab = async (tab) => {
    if (tab === 'admin' && userStore.currentUser?.role !== 'admin') {
        showNotification('您沒有權限訪問此頁籤', 'error');
        return;
    }
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
    await loadProducts();
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
// 計算幣值（每萬遊戲幣的價格）
const calculateValue = (amount, price) => {
    return (price / amount).toFixed(2);
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
    await loadProducts();
};
// 獲取排序圖標的類別
const getSortIconClass = (field) => {
    if (currentSort.value.field !== field)
        return 'sort-icon';
    return currentSort.value.direction === 'asc' ? 'sort-icon ascending' : 'sort-icon descending';
};
// 在組件掛載時載入商品列表
onMounted(async () => {
    if (!userStore.isAuthenticated) {
        router.push('/login');
        return;
    }
    const defaultTab = localStorage.getItem('defaultTab');
    if (defaultTab === 'trading') {
        await switchTab('trading');
        localStorage.removeItem('defaultTab');
    }
    if (currentTab.value === 'completed') {
        for (const product of products.value) {
            if (product.transactionId) {
                const transactionId = typeof product.transactionId === 'object'
                    ? product.transactionId._id
                    : product.transactionId;
                const hasRated = await checkRatingStatus(transactionId);
                if (hasRated) {
                    ratedTransactions.value.add(transactionId);
                }
            }
        }
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
    await loadProducts();
});
// 控制 Modal 的顯示狀態
const isCreateModalOpen = ref(false);
// 處理建立商品的點擊事件
const handleCreateProduct = () => {
    checkAccountVerification(() => {
        isCreateModalOpen.value = true;
    });
};
// 處理表單提交
const handleSubmitProduct = async (data) => {
    try {
        await productApi.createProduct(data);
        isCreateModalOpen.value = false;
        showNotification('商品建立成功');
        await loadProducts(); // 重新載入商品列表
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.message || '建立商品失敗，請稍後再試', 'error');
    }
};
// 刪除商品的方法
const handleDeleteProduct = async (product) => {
    checkAccountVerification(async () => {
        try {
            await productApi.deleteProduct(product._id);
            showNotification('商品已成功刪除');
            await loadProducts();
        }
        catch (error) {
            const apiError = error;
            showNotification(apiError.message || '刪除商品失敗，請稍後再試', 'error');
        }
    });
};
// 編輯商品相關狀態和方法
const isEditModalOpen = ref(false);
const currentEditProduct = ref(null);
// 打開編輯商品彈窗
const handleEditProduct = (product) => {
    checkAccountVerification(() => {
        currentEditProduct.value = product;
        isEditModalOpen.value = true;
    });
};
// 提交編輯商品
const handleSubmitEditProduct = async (data) => {
    if (!currentEditProduct.value)
        return;
    try {
        await productApi.updateProduct(currentEditProduct.value._id, data);
        isEditModalOpen.value = false;
        showNotification('商品更新成功');
        await loadProducts(); // 重新載入商品列表
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.message || '更新商品失敗，請稍後再試', 'error');
    }
};
// 確認購買商品頁面
const handleConfirmPurchase = async (purchaseData) => {
    if (selectedProduct.value) {
        try {
            const response = await productApi.reserveProduct(selectedProduct.value._id, purchaseData.amount, purchaseData.paymentMethod);
            // 確保我們有收到交易資料
            if (!response.data?.transaction?._id) {
                throw new Error('未收到有效的交易資訊');
            }
            // 關閉購買模態框
            showPurchaseModal.value = false;
            // 使用正確的交易 ID 進行跳轉
            router.push(`/transactions/${response.data.transaction._id}`);
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
const handleViewTransaction = (product) => {
    if (product.transactionId) {
        let transactionId;
        if (typeof product.transactionId === 'object') {
            // 優先使用 id，如果沒有再用 _id
            transactionId = product.transactionId._id;
        }
        else {
            transactionId = product.transactionId;
        }
        if (!transactionId) {
            showNotification('交易資訊異常', 'error');
            return;
        }
        router.push(`/transactions/${transactionId}`);
    }
    else {
        showNotification('找不到相關交易資訊', 'error');
    }
};
const getStatusDisplay = (status) => {
    return statusMap[status] || `未知狀態(${status})`;
};
// 添加狀態標籤的樣式
const getStatusClass = (status) => {
    const classMap = {
        active: 'status-active',
        reserved: 'status-reserved',
        sold: 'status-sold',
        deleted: 'status-deleted',
    };
    return classMap[status] || 'status-unknown';
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['cancel-button', 'verify-button', 'active', 'star-btn', 'active', 'main-content', 'trade-content', 'table-header', 'tabs', 'create-button', 'trade-table', 'view-button', 'buy-button', 'edit-button', 'delete-button', 'rate-button', 'transaction-actions',];
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
    if (__VLS_ctx.userStore.currentUser?.role === 'admin') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.userStore.currentUser?.role === 'admin')))
                        return;
                    __VLS_ctx.switchTab('admin');
                } },
            ...{ class: ((['tab', { active: __VLS_ctx.currentTab === 'admin' }])) },
        });
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleCreateProduct) },
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
    if (__VLS_ctx.currentTab !== 'completed') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.currentTab !== 'completed')))
                        return;
                    __VLS_ctx.handleSort('amount');
                } },
            ...{ class: ("sort-header") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span)({
            ...{ class: ((__VLS_ctx.getSortIconClass('amount'))) },
        });
    }
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleSort('value');
            } },
        ...{ class: ("sort-header") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span)({
        ...{ class: ((__VLS_ctx.getSortIconClass('value'))) },
    });
    if (__VLS_ctx.currentTab !== 'completed') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
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
    else if (__VLS_ctx.products.length === 0) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            colspan: ((__VLS_ctx.totalColumns)),
            ...{ class: ("status-message") },
        });
    }
    else {
        for (const [product] of __VLS_getVForSourceType((__VLS_ctx.products))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                key: ((product._id)),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (typeof product.userId === 'object' ? product.userId.name : '未知賣家');
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (product.characterNickname || '未設定');
            if (__VLS_ctx.currentTab !== 'completed') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (product.amount);
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (__VLS_ctx.formatPrice(product.price));
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (__VLS_ctx.calculateValue(product.price, product.amount));
            if (__VLS_ctx.currentTab !== 'completed') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (product.currency || '台幣');
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (__VLS_ctx.formatPaymentMethods(product.paymentMethods));
            }
            if (__VLS_ctx.isAdmin) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ((['status-tag', __VLS_ctx.getStatusClass(product.status)])) },
                    title: ((product.status)),
                });
                (__VLS_ctx.getStatusDisplay(product.status));
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            if (__VLS_ctx.currentTab === 'trading') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.products.length === 0))))
                                return;
                            if (!((__VLS_ctx.currentTab === 'trading')))
                                return;
                            __VLS_ctx.handleViewTransaction(product);
                        } },
                    ...{ class: ("view-button") },
                    disabled: ((!product.transactionId)),
                });
                (product.transactionId ? '查看交易' : '交易資訊異常');
            }
            if (__VLS_ctx.currentTab === 'completed') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("transaction-actions") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.products.length === 0))))
                                return;
                            if (!((__VLS_ctx.currentTab === 'completed')))
                                return;
                            __VLS_ctx.handleViewTransaction(product);
                        } },
                    ...{ class: ("view-button") },
                    disabled: ((!product.transactionId)),
                });
                if (typeof product.buyerId === 'object' &&
                    product.buyerId._id === __VLS_ctx.userStore.currentUser?.id &&
                    product.transactionId) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(!((__VLS_ctx.loading))))
                                    return;
                                if (!(!((__VLS_ctx.products.length === 0))))
                                    return;
                                if (!((__VLS_ctx.currentTab === 'completed')))
                                    return;
                                if (!((typeof product.buyerId === 'object' &&
                                    product.buyerId._id === __VLS_ctx.userStore.currentUser?.id &&
                                    product.transactionId)))
                                    return;
                                __VLS_ctx.handleRate(product);
                            } },
                        ...{ class: ("rate-button") },
                    });
                    (__VLS_ctx.ratedTransactions.has(typeof product.transactionId === 'object'
                        ? product.transactionId._id
                        : product.transactionId)
                        ? '已評價'
                        : '評價賣家');
                }
            }
            else if (__VLS_ctx.currentTab === 'admin') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("admin-actions") },
                });
                if (product.transactionId) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(!((__VLS_ctx.loading))))
                                    return;
                                if (!(!((__VLS_ctx.products.length === 0))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'completed'))))
                                    return;
                                if (!((__VLS_ctx.currentTab === 'admin')))
                                    return;
                                if (!((product.transactionId)))
                                    return;
                                __VLS_ctx.handleViewTransaction(product);
                            } },
                        ...{ class: ("view-button") },
                    });
                }
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.products.length === 0))))
                                return;
                            if (!(!((__VLS_ctx.currentTab === 'completed'))))
                                return;
                            if (!((__VLS_ctx.currentTab === 'admin')))
                                return;
                            __VLS_ctx.handleDeleteProduct(product);
                        } },
                    ...{ class: ("delete-button") },
                });
            }
            else {
                if (typeof product.userId === 'object' &&
                    product.userId._id === __VLS_ctx.userStore.currentUser?.id) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("product-actions") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(!((__VLS_ctx.loading))))
                                    return;
                                if (!(!((__VLS_ctx.products.length === 0))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'completed'))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'admin'))))
                                    return;
                                if (!((typeof product.userId === 'object' &&
                                    product.userId._id === __VLS_ctx.userStore.currentUser?.id)))
                                    return;
                                __VLS_ctx.handleEditProduct(product);
                            } },
                        ...{ class: ("edit-button") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(!((__VLS_ctx.loading))))
                                    return;
                                if (!(!((__VLS_ctx.products.length === 0))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'completed'))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'admin'))))
                                    return;
                                if (!((typeof product.userId === 'object' &&
                                    product.userId._id === __VLS_ctx.userStore.currentUser?.id)))
                                    return;
                                __VLS_ctx.handleDeleteProduct(product);
                            } },
                        ...{ class: ("delete-button") },
                    });
                }
                else {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(!((__VLS_ctx.loading))))
                                    return;
                                if (!(!((__VLS_ctx.products.length === 0))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'completed'))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'admin'))))
                                    return;
                                if (!(!((typeof product.userId === 'object' &&
                                    product.userId._id === __VLS_ctx.userStore.currentUser?.id))))
                                    return;
                                __VLS_ctx.handleBuyProduct(product);
                            } },
                        ...{ class: ("buy-button") },
                    });
                }
            }
        }
    }
    // @ts-ignore
    /** @type { [typeof CreateProductModal, ] } */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(CreateProductModal, new CreateProductModal({
        ...{ 'onSubmit': {} },
        isOpen: ((__VLS_ctx.isCreateModalOpen)),
    }));
    const __VLS_1 = __VLS_0({
        ...{ 'onSubmit': {} },
        isOpen: ((__VLS_ctx.isCreateModalOpen)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    let __VLS_5;
    const __VLS_6 = {
        onSubmit: (__VLS_ctx.handleSubmitProduct)
    };
    let __VLS_2;
    let __VLS_3;
    var __VLS_4;
    if (__VLS_ctx.currentEditProduct) {
        // @ts-ignore
        /** @type { [typeof EditProductModal, ] } */ ;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent(EditProductModal, new EditProductModal({
            ...{ 'onSubmit': {} },
            isOpen: ((__VLS_ctx.isEditModalOpen)),
            product: ((__VLS_ctx.currentEditProduct)),
        }));
        const __VLS_8 = __VLS_7({
            ...{ 'onSubmit': {} },
            isOpen: ((__VLS_ctx.isEditModalOpen)),
            product: ((__VLS_ctx.currentEditProduct)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        let __VLS_12;
        const __VLS_13 = {
            onSubmit: (__VLS_ctx.handleSubmitEditProduct)
        };
        let __VLS_9;
        let __VLS_10;
        var __VLS_11;
    }
    if (__VLS_ctx.showPurchaseModal && __VLS_ctx.selectedProduct) {
        // @ts-ignore
        /** @type { [typeof PurchaseConfirmModal, ] } */ ;
        // @ts-ignore
        const __VLS_14 = __VLS_asFunctionalComponent(PurchaseConfirmModal, new PurchaseConfirmModal({
            ...{ 'onConfirm': {} },
            ...{ 'onCancel': {} },
            product: ((__VLS_ctx.selectedProduct)),
        }));
        const __VLS_15 = __VLS_14({
            ...{ 'onConfirm': {} },
            ...{ 'onCancel': {} },
            product: ((__VLS_ctx.selectedProduct)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_14));
        let __VLS_19;
        const __VLS_20 = {
            onConfirm: (__VLS_ctx.handleConfirmPurchase)
        };
        const __VLS_21 = {
            onCancel: (...[$event]) => {
                if (!((__VLS_ctx.showPurchaseModal && __VLS_ctx.selectedProduct)))
                    return;
                __VLS_ctx.showPurchaseModal = false;
            }
        };
        let __VLS_16;
        let __VLS_17;
        var __VLS_18;
    }
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
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.showRatingModal)))
                        return;
                    __VLS_ctx.submitRating({ score: __VLS_ctx.ratingScore, comment: __VLS_ctx.ratingComment });
                } },
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
    ['main-content', 'trade-content', 'table-header', 'tabs', 'active', 'tab', 'active', 'tab', 'active', 'tab', 'active', 'tab', 'active', 'tab', 'create-button', 'trade-table', 'sort-header', 'sort-header', 'sort-header', 'status-message', 'status-message', 'status-tag', 'view-button', 'transaction-actions', 'view-button', 'rate-button', 'admin-actions', 'view-button', 'delete-button', 'product-actions', 'edit-button', 'delete-button', 'buy-button', 'verification-modal-overlay', 'verification-modal', 'verification-modal-content', 'verification-modal-actions', 'cancel-button', 'verify-button', 'rating-modal-overlay', 'rating-modal', 'rating-stars', 'stars-label', 'stars-container', 'active', 'star-btn', 'stars-value', 'rating-comment', 'rating-actions', 'cancel-btn', 'submit-btn', 'previous-rating-modal-overlay', 'previous-rating-modal', 'previous-rating-stars', 'stars-label', 'stars-container', 'active', 'star-btn', 'stars-value', 'previous-rating-comment', 'rating-date', 'previous-rating-actions', 'notification',];
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
            CreateProductModal: CreateProductModal,
            EditProductModal: EditProductModal,
            PurchaseConfirmModal: PurchaseConfirmModal,
            products: products,
            loading: loading,
            showPurchaseModal: showPurchaseModal,
            selectedProduct: selectedProduct,
            showAccountVerificationModal: showAccountVerificationModal,
            verificationMessage: verificationMessage,
            ratedTransactions: ratedTransactions,
            ratingScore: ratingScore,
            ratingComment: ratingComment,
            showPreviousRatingModal: showPreviousRatingModal,
            previousRating: previousRating,
            isAdmin: isAdmin,
            totalColumns: totalColumns,
            handleBuyProduct: handleBuyProduct,
            router: router,
            userStore: userStore,
            currentTab: currentTab,
            notification: notification,
            showRatingModal: showRatingModal,
            handleRate: handleRate,
            submitRating: submitRating,
            switchTab: switchTab,
            formatPrice: formatPrice,
            formatPaymentMethods: formatPaymentMethods,
            calculateValue: calculateValue,
            handleSort: handleSort,
            getSortIconClass: getSortIconClass,
            isCreateModalOpen: isCreateModalOpen,
            handleCreateProduct: handleCreateProduct,
            handleSubmitProduct: handleSubmitProduct,
            handleDeleteProduct: handleDeleteProduct,
            isEditModalOpen: isEditModalOpen,
            currentEditProduct: currentEditProduct,
            handleEditProduct: handleEditProduct,
            handleSubmitEditProduct: handleSubmitEditProduct,
            handleConfirmPurchase: handleConfirmPurchase,
            handleViewTransaction: handleViewTransaction,
            getStatusDisplay: getStatusDisplay,
            getStatusClass: getStatusClass,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=HomeView.vue.js.map