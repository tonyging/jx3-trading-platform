import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import CreateProductModal from '@/components/CreateProductModal.vue';
import EditProductModal from '@/components/EditProductModal.vue';
import PurchaseConfirmModal from '@/components/PurchaseConfirmModal.vue';
import { productApi } from '@/services/api/product';
const showPurchaseModal = ref(false);
const selectedProduct = ref(null);
const isAdmin = computed(() => {
    console.log('Current user:', userStore.currentUser);
    console.log('Current user role:', userStore.currentUser?.role);
    return userStore.currentUser?.role === 'admin';
});
// 計算表格的總列數
const totalColumns = computed(() => {
    // 基礎列數（賣家、數量、價格、幣值、操作）
    let baseColumns = 5;
    // 如果是管理員，加上狀態列
    if (isAdmin.value) {
        baseColumns += 1;
    }
    return baseColumns;
});
// 添加处理购买点击的方法
const handleBuyProduct = (product) => {
    selectedProduct.value = product;
    showPurchaseModal.value = true;
};
// 初始化路由和用戶狀態管理
const router = useRouter();
const userStore = useUserStore();
// 使用 storeToRefs 解構 currentUser
const { currentUser } = storeToRefs(userStore);
// 商品相關的響應式狀態
const products = ref([]);
const loading = ref(true);
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
    type: 'success', // 'success' 或 'error'
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
                if (currentUser.value?.id) {
                    requestParams.userId = currentUser.value.id;
                    requestParams.buyerId = currentUser.value.id;
                }
                break;
            case 'my':
                if (!currentUser.value?.id) {
                    await userStore.fetchCurrentUser();
                }
                if (currentUser.value?.id) {
                    requestParams.userId = currentUser.value?.id;
                    requestParams.status = 'active';
                }
                else {
                    console.warn('無法獲取用戶 ID');
                    showNotification('無法取得用戶資訊', 'error');
                    products.value = [];
                    loading.value = false;
                    return;
                }
                break;
            case 'admin':
                // 管理員頁籤顯示除了 deleted 以外的所有商品
                requestParams.status = ['active', 'reserved', 'sold'];
                break;
            default:
                requestParams.status = 'active';
        }
        const response = await productApi.getProducts(requestParams);
        console.log('Loaded products:', response.data.products.map((p) => ({
            id: p._id,
            status: p.status,
            seller: p.userId?.name,
        })));
        products.value = response.data.products;
    }
    catch (error) {
        showNotification('載入商品列表失敗', 'error');
        console.error('載入商品列表失敗:', error);
        products.value = [];
    }
    finally {
        loading.value = false;
    }
};
// 切換頁籤的方法
const switchTab = async (tab) => {
    if (tab === 'admin' && userStore.currentUser?.role !== 'admin') {
        showNotification('您沒有權限訪問此頁籤', 'error');
        return;
    }
    currentTab.value = tab;
    if (tab === 'my' && !currentUser.value?.data?.id) {
        try {
            await userStore.fetchCurrentUser();
        }
        catch (error) {
            console.error('Failed to load user info:', error);
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
const isUserMenuOpen = ref(false);
// 添加關閉選單的方法
const closeUserMenu = () => {
    isUserMenuOpen.value = false;
};
// 切換用戶菜單顯示狀態
const toggleUserMenu = () => {
    isUserMenuOpen.value = !isUserMenuOpen.value;
};
// 處理用戶登出
const handleLogout = () => {
    userStore.logout();
    router.push('/login');
};
// 格式化價格顯示
const formatPrice = (price) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
    }).format(price);
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
const getUserName = (userId) => {
    if (typeof userId === 'object' && userId !== null) {
        return userId.name || '未知賣家';
    }
    return '未知賣家';
};
// 在組件掛載時載入商品列表
onMounted(async () => {
    if (!userStore.isAuthenticated) {
        router.push('/login');
        return;
    }
    const shouldReload = localStorage.getItem('shouldReload');
    if (shouldReload) {
        localStorage.removeItem('shouldReload');
        window.location.reload();
        return;
    }
    const defaultTab = localStorage.getItem('defaultTab');
    if (defaultTab === 'trading') {
        await switchTab('trading');
        localStorage.removeItem('defaultTab');
    }
    // 等待用戶資訊載入完成
    if (!userStore.currentUser?.data?.id) {
        // 可以添加一個簡單的重試機制
        let retries = 3;
        while (retries > 0 && !userStore.currentUser?._id) {
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
    isCreateModalOpen.value = true;
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
        showNotification(error.message || '建立商品失敗，請稍後再試', 'error');
        console.error('建立商品失敗:', error);
    }
};
// 刪除商品的方法
const handleDeleteProduct = async (productId) => {
    try {
        await productApi.deleteProduct(productId);
        showNotification('商品已成功刪除');
        await loadProducts(); // 重新載入商品列表
    }
    catch (error) {
        showNotification(error.message || '刪除商品失敗，請稍後再試', 'error');
        console.error('刪除商品失敗:', error);
    }
};
// 編輯商品相關狀態和方法
const isEditModalOpen = ref(false);
const currentEditProduct = ref(null);
// 打開編輯商品彈窗
const handleEditProduct = (product) => {
    currentEditProduct.value = product;
    isEditModalOpen.value = true;
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
        showNotification(error.message || '更新商品失敗，請稍後再試', 'error');
        console.error('更新商品失敗:', error);
    }
};
// 確認購買商品頁面
const handleConfirmPurchase = async (purchaseData) => {
    if (selectedProduct.value) {
        try {
            const response = await productApi.reserveProduct(selectedProduct.value._id, purchaseData.amount);
            // 添加回應資料的檢查和日誌
            console.log('Purchase response:', response);
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
            // 提供更詳細的錯誤訊息
            const errorMessage = error.message || '購買失敗，請稍後再試';
            showNotification(errorMessage, 'error');
            console.error('購買失敗詳情:', error);
            console.error('選擇的商品:', selectedProduct.value);
            console.error('購買資料:', purchaseData);
        }
    }
};
const handleViewTransaction = (product) => {
    if (product.transactionId) {
        const transactionId = typeof product.transactionId === 'object' ? product.transactionId._id : product.transactionId;
        console.log('Resolved Transaction ID:', transactionId);
        router.push(`/transactions/${transactionId}`);
    }
    else {
        console.error('找不到交易ID:', product);
        showNotification('找不到相關交易資訊', 'error');
    }
};
const statusMap = {
    active: '可購買',
    reserved: '交易中',
    sold: '已售出',
    deleted: '已下架',
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
};
// 轉換角色為中文顯示
const getRoleDisplay = (role) => {
    console.log('Getting role display for:', role);
    const roleMap = {
        admin: '管理員',
        user: '一般會員',
        banned: '停權會員',
    };
    const display = roleMap[role] || '未知角色';
    console.log('Role display result:', display);
    return display;
};
const handleMemberInfo = () => {
    router.push('/member-info');
    closeUserMenu();
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['delete-button', 'site-header', 'content-wrapper', 'main-content', 'trade-content', 'trade-table', 'sort-header', 'view-button',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeUserMenu) },
        ...{ class: ("platform-base") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("site-header") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: () => { } },
        ...{ class: ("user-menu-container") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.toggleUserMenu) },
        ...{ class: ("user-avatar") },
    });
    (__VLS_ctx.userStore.currentUser?.name?.charAt(0) || '用');
    if (__VLS_ctx.isUserMenuOpen) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("user-dropdown-menu") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("user-info") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: ("user-name") },
        });
        (__VLS_ctx.userStore.currentUser?.name || '用戶');
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("role-tag") },
        });
        (__VLS_ctx.getRoleDisplay(__VLS_ctx.userStore.currentUser?.role));
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: ("user-email") },
        });
        (__VLS_ctx.userStore.currentUser?.email);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("user-actions") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleMemberInfo) },
            ...{ class: ("menu-button profile-button") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleLogout) },
            ...{ class: ("menu-button logout-button") },
        });
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("content-wrapper") },
    });
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.handleSort('amount');
            } },
        ...{ class: ("sort-header") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span)({
        ...{ class: ((__VLS_ctx.getSortIconClass('amount'))) },
    });
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
            colspan: ("5"),
            ...{ class: ("status-message") },
        });
    }
    else {
        for (const [product] of __VLS_getVForSourceType((__VLS_ctx.products))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                key: ((product.id)),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (product.userId?.name || '未知賣家');
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (product.amount);
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (__VLS_ctx.formatPrice(product.price));
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (__VLS_ctx.calculateValue(product.price, product.amount));
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
                                if (!(!((__VLS_ctx.currentTab === 'trading'))))
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
                            if (!(!((__VLS_ctx.currentTab === 'trading'))))
                                return;
                            if (!((__VLS_ctx.currentTab === 'admin')))
                                return;
                            __VLS_ctx.handleDeleteProduct(product._id);
                        } },
                    ...{ class: ("delete-button") },
                });
            }
            else {
                if (product.userId?._id === __VLS_ctx.userStore.currentUser?.id) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("product-actions") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(!((__VLS_ctx.loading))))
                                    return;
                                if (!(!((__VLS_ctx.products.length === 0))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'trading'))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'admin'))))
                                    return;
                                if (!((product.userId?._id === __VLS_ctx.userStore.currentUser?.id)))
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
                                if (!(!((__VLS_ctx.currentTab === 'trading'))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'admin'))))
                                    return;
                                if (!((product.userId?._id === __VLS_ctx.userStore.currentUser?.id)))
                                    return;
                                __VLS_ctx.handleDeleteProduct(product._id);
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
                                if (!(!((__VLS_ctx.currentTab === 'trading'))))
                                    return;
                                if (!(!((__VLS_ctx.currentTab === 'admin'))))
                                    return;
                                if (!(!((product.userId?._id === __VLS_ctx.userStore.currentUser?.id))))
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
    if (__VLS_ctx.notification.show) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ((['notification', `notification-${__VLS_ctx.notification.type}`])) },
        });
        (__VLS_ctx.notification.message);
    }
    ['platform-base', 'site-header', 'user-menu-container', 'user-avatar', 'user-dropdown-menu', 'user-info', 'user-name', 'role-tag', 'user-email', 'user-actions', 'menu-button', 'profile-button', 'menu-button', 'logout-button', 'content-wrapper', 'main-content', 'trade-content', 'table-header', 'tabs', 'active', 'tab', 'active', 'tab', 'active', 'tab', 'active', 'tab', 'create-button', 'trade-table', 'sort-header', 'sort-header', 'sort-header', 'status-message', 'status-message', 'status-tag', 'view-button', 'admin-actions', 'view-button', 'delete-button', 'product-actions', 'edit-button', 'delete-button', 'buy-button', 'notification',];
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
            showPurchaseModal: showPurchaseModal,
            selectedProduct: selectedProduct,
            isAdmin: isAdmin,
            totalColumns: totalColumns,
            handleBuyProduct: handleBuyProduct,
            userStore: userStore,
            products: products,
            loading: loading,
            currentTab: currentTab,
            notification: notification,
            switchTab: switchTab,
            isUserMenuOpen: isUserMenuOpen,
            closeUserMenu: closeUserMenu,
            toggleUserMenu: toggleUserMenu,
            handleLogout: handleLogout,
            formatPrice: formatPrice,
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
            getRoleDisplay: getRoleDisplay,
            handleMemberInfo: handleMemberInfo,
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