import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { adminApi } from '@/services/api/admin';
// 初始化路由和用戶狀態管理
const router = useRouter();
const userStore = useUserStore();
// 儀表板資料
const stats = ref({
    totalUsers: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalTransactions: 0,
    completedTransactions: 0,
});
// 最近用戶列表
const recentUsers = ref([]);
// 最近商品列表
const recentProducts = ref([]);
// 最近交易列表
const recentTransactions = ref([]);
// 載入狀態
const loading = ref(true);
// 錯誤訊息
const errorMessage = ref('');
// 當前活動的標籤
const activeTab = ref('overview');
// 計算是否為管理員
const isAdmin = computed(() => {
    return userStore.currentUser?.role === 'admin';
});
// 初始化頁面資料
const initDashboard = async () => {
    if (!isAdmin.value) {
        router.push('/');
        return;
    }
    try {
        loading.value = true;
        errorMessage.value = '';
        // 載入儀表板統計數據
        const statsResponse = await adminApi.getStats();
        stats.value = statsResponse.data;
        // 載入最近用戶
        const usersResponse = await adminApi.getRecentUsers();
        recentUsers.value = usersResponse.data.users;
        // 載入最近商品
        const productsResponse = await adminApi.getRecentProducts();
        recentProducts.value = productsResponse.data.products;
        // 載入最近交易
        const transactionsResponse = await adminApi.getRecentTransactions();
        recentTransactions.value = transactionsResponse.data.transactions;
    }
    catch (error) {
        const apiError = error;
        errorMessage.value =
            apiError.response?.data?.message || apiError.message || '載入儀表板資料失敗';
        console.error('儀表板錯誤:', error);
    }
    finally {
        loading.value = false;
    }
};
// 更改用戶角色
const updateUserRole = async (userId, role, banDuration, banReason) => {
    try {
        await adminApi.updateUserRole(userId, { role, banDuration, banReason });
        // 重新載入用戶列表
        const usersResponse = await adminApi.getRecentUsers();
        recentUsers.value = usersResponse.data.users;
        showNotification('用戶角色更新成功', 'success');
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.response?.data?.message || apiError.message || '更新用戶角色失敗', 'error');
    }
};
// 刪除商品
const deleteProduct = async (productId) => {
    try {
        await adminApi.deleteProduct(productId);
        // 重新載入商品列表
        const productsResponse = await adminApi.getRecentProducts();
        recentProducts.value = productsResponse.data.products;
        showNotification('商品刪除成功', 'success');
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.response?.data?.message || apiError.message || '刪除商品失敗', 'error');
    }
};
// 通知組件狀態
const notification = ref({
    show: false,
    message: '',
    type: 'success',
});
// 顯示通知
const showNotification = (message, type = 'success') => {
    notification.value = {
        show: true,
        message,
        type,
    };
    // 3秒後自動關閉
    setTimeout(() => {
        notification.value.show = false;
    }, 3000);
};
// 切換標籤
const switchTab = (tab) => {
    activeTab.value = tab;
};
// 格式化時間
const formatDate = (dateInput) => {
    if (!dateInput)
        return '未設定';
    try {
        const date = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    catch (error) {
        console.error('日期格式化錯誤:', error);
        return '無效日期';
    }
};
// 格式化價格
const formatPrice = (price) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
    }).format(price);
};
// 在組件掛載時載入資料
onMounted(() => {
    initDashboard();
}); /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['active', 'role-badge', 'status-badge', 'dropdown-menu', 'stats-cards', 'admin-dashboard', 'dashboard-header', 'back-button', 'dashboard-tabs', 'tab-button', 'stats-cards', 'stat-card', 'stat-number', 'management-controls', 'search-input', 'filter-controls', 'filter-select', 'management-table', 'action-buttons',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("admin-dashboard") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("dashboard-header") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.router.push('/');
            } },
        ...{ class: ("back-button") },
    });
    if (__VLS_ctx.loading) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("loading-state") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("spinner") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    }
    else if (__VLS_ctx.errorMessage) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("error-message") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.errorMessage);
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.initDashboard) },
        });
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("dashboard-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("dashboard-tabs") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!((__VLS_ctx.loading))))
                        return;
                    if (!(!((__VLS_ctx.errorMessage))))
                        return;
                    __VLS_ctx.switchTab('overview');
                } },
            ...{ class: ((['tab-button', { active: __VLS_ctx.activeTab === 'overview' }])) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!((__VLS_ctx.loading))))
                        return;
                    if (!(!((__VLS_ctx.errorMessage))))
                        return;
                    __VLS_ctx.switchTab('users');
                } },
            ...{ class: ((['tab-button', { active: __VLS_ctx.activeTab === 'users' }])) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!((__VLS_ctx.loading))))
                        return;
                    if (!(!((__VLS_ctx.errorMessage))))
                        return;
                    __VLS_ctx.switchTab('products');
                } },
            ...{ class: ((['tab-button', { active: __VLS_ctx.activeTab === 'products' }])) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!((__VLS_ctx.loading))))
                        return;
                    if (!(!((__VLS_ctx.errorMessage))))
                        return;
                    __VLS_ctx.switchTab('transactions');
                } },
            ...{ class: ((['tab-button', { active: __VLS_ctx.activeTab === 'transactions' }])) },
        });
        if (__VLS_ctx.activeTab === 'overview') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("dashboard-panel") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("stats-cards") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("stat-card") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("stat-number") },
            });
            (__VLS_ctx.stats.totalUsers);
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("stat-card") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("stat-number") },
            });
            (__VLS_ctx.stats.totalProducts);
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("stat-card") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("stat-number") },
            });
            (__VLS_ctx.stats.activeProducts);
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("stat-card") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("stat-number") },
            });
            (__VLS_ctx.stats.totalTransactions);
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("stat-card") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("stat-number") },
            });
            (__VLS_ctx.stats.completedTransactions);
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("recent-activity") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("activity-section") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
            for (const [user] of __VLS_getVForSourceType((__VLS_ctx.recentUsers.slice(0, 5)))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                    key: ((user.id)),
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (user.name);
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (user.email);
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (user.createdAt ? __VLS_ctx.formatDate(user.createdAt.toString()) : '未設定');
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("activity-section") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
            for (const [product] of __VLS_getVForSourceType((__VLS_ctx.recentProducts.slice(0, 5)))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                    key: ((product._id)),
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (product._id.substring(0, 8));
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (typeof product.userId === 'object' ? product.userId.name : '未知');
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (product.amount);
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (__VLS_ctx.formatPrice(product.price));
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (__VLS_ctx.formatDate(product.createdAt));
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("activity-section") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
            for (const [transaction] of __VLS_getVForSourceType((__VLS_ctx.recentTransactions.slice(0, 5)))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                    key: ((transaction._id)),
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (transaction._id.substring(0, 8));
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (typeof transaction.buyer === 'object' ? transaction.buyer.name : '未知');
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (typeof transaction.seller === 'object' ? transaction.seller.name : '未知');
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (__VLS_ctx.formatPrice(transaction.price));
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (transaction.status);
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (__VLS_ctx.formatDate(transaction.createdAt));
            }
        }
        if (__VLS_ctx.activeTab === 'users') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("dashboard-panel") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("management-controls") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                type: ("text"),
                placeholder: ("搜尋用戶..."),
                ...{ class: ("search-input") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
                ...{ class: ("management-table") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
            for (const [user] of __VLS_getVForSourceType((__VLS_ctx.recentUsers))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                    key: ((user.id)),
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (user.id);
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (user.name);
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (user.email);
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ((['role-badge', `role-${user.role}`])) },
                });
                (user.role);
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (user.createdAt ? __VLS_ctx.formatDate(user.createdAt.toString()) : '未設定');
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (user.isPhoneVerified ? '已驗證' : '未驗證');
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ((['verify-badge', user.discordId ? 'verified' : 'unverified'])) },
                });
                (user.discordId ? '已綁定' : '未綁定');
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                    ...{ class: ("action-buttons") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("dropdown") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ class: ("dropdown-toggle") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("dropdown-menu") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.errorMessage))))
                                return;
                            if (!((__VLS_ctx.activeTab === 'users')))
                                return;
                            __VLS_ctx.updateUserRole(user.id, 'user');
                        } },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.errorMessage))))
                                return;
                            if (!((__VLS_ctx.activeTab === 'users')))
                                return;
                            __VLS_ctx.updateUserRole(user.id, 'admin');
                        } },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.errorMessage))))
                                return;
                            if (!((__VLS_ctx.activeTab === 'users')))
                                return;
                            __VLS_ctx.updateUserRole(user.id, 'banned', 7, '違反規定');
                        } },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.errorMessage))))
                                return;
                            if (!((__VLS_ctx.activeTab === 'users')))
                                return;
                            __VLS_ctx.updateUserRole(user.id, 'banned', 30, '嚴重違規');
                        } },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.errorMessage))))
                                return;
                            if (!((__VLS_ctx.activeTab === 'users')))
                                return;
                            __VLS_ctx.updateUserRole(user.id, 'banned', undefined, '永久停權');
                        } },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.errorMessage))))
                                return;
                            if (!((__VLS_ctx.activeTab === 'users')))
                                return;
                            __VLS_ctx.router.push(`/user-detail/${user.id}`);
                        } },
                    ...{ class: ("view-button") },
                });
            }
        }
        if (__VLS_ctx.activeTab === 'products') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("dashboard-panel") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("management-controls") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                type: ("text"),
                placeholder: ("搜尋商品..."),
                ...{ class: ("search-input") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("filter-controls") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                ...{ class: ("filter-select") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: ("all"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: ("active"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: ("reserved"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: ("sold"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: ("deleted"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
                ...{ class: ("management-table") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
            for (const [product] of __VLS_getVForSourceType((__VLS_ctx.recentProducts))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                    key: ((product._id)),
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (product._id.substring(0, 8));
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (typeof product.userId === 'object' ? product.userId.name : '未知');
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (product.amount);
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (__VLS_ctx.formatPrice(product.price));
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ((['status-badge', `status-${product.status}`])) },
                });
                (product.status);
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (__VLS_ctx.formatDate(product.createdAt));
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                    ...{ class: ("action-buttons") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.errorMessage))))
                                return;
                            if (!((__VLS_ctx.activeTab === 'products')))
                                return;
                            __VLS_ctx.router.push(`/product-detail/${product._id}`);
                        } },
                    ...{ class: ("view-button") },
                });
                if (product.status !== 'deleted') {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!(!((__VLS_ctx.loading))))
                                    return;
                                if (!(!((__VLS_ctx.errorMessage))))
                                    return;
                                if (!((__VLS_ctx.activeTab === 'products')))
                                    return;
                                if (!((product.status !== 'deleted')))
                                    return;
                                __VLS_ctx.deleteProduct(product._id);
                            } },
                        ...{ class: ("delete-button") },
                    });
                }
            }
        }
        if (__VLS_ctx.activeTab === 'transactions') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("dashboard-panel") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("management-controls") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                type: ("text"),
                placeholder: ("搜尋交易..."),
                ...{ class: ("search-input") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("filter-controls") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                ...{ class: ("filter-select") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: ("all"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: ("reserved"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: ("pending_payment"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: ("payment_confirmed"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: ("completed"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: ("cancelled"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
                ...{ class: ("management-table") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
            for (const [transaction] of __VLS_getVForSourceType((__VLS_ctx.recentTransactions))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                    key: ((transaction._id)),
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (transaction._id.substring(0, 8));
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (typeof transaction.buyer === 'object' ? transaction.buyer.name : '未知');
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (typeof transaction.seller === 'object' ? transaction.seller.name : '未知');
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (transaction.amount);
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (__VLS_ctx.formatPrice(transaction.price));
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ((['status-badge', `status-${transaction.status}`])) },
                });
                (transaction.status);
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                (__VLS_ctx.formatDate(transaction.createdAt));
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                    ...{ class: ("action-buttons") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!((__VLS_ctx.loading))))
                                return;
                            if (!(!((__VLS_ctx.errorMessage))))
                                return;
                            if (!((__VLS_ctx.activeTab === 'transactions')))
                                return;
                            __VLS_ctx.router.push(`/transactions/${transaction._id}`);
                        } },
                    ...{ class: ("view-button") },
                });
            }
        }
    }
    if (__VLS_ctx.notification.show) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ((['notification', `notification-${__VLS_ctx.notification.type}`])) },
        });
        (__VLS_ctx.notification.message);
    }
    ['admin-dashboard', 'dashboard-header', 'back-button', 'loading-state', 'spinner', 'error-message', 'dashboard-content', 'dashboard-tabs', 'active', 'tab-button', 'active', 'tab-button', 'active', 'tab-button', 'active', 'tab-button', 'dashboard-panel', 'stats-cards', 'stat-card', 'stat-number', 'stat-card', 'stat-number', 'stat-card', 'stat-number', 'stat-card', 'stat-number', 'stat-card', 'stat-number', 'recent-activity', 'activity-section', 'activity-section', 'activity-section', 'dashboard-panel', 'management-controls', 'search-input', 'management-table', 'role-badge', 'verify-badge', 'action-buttons', 'dropdown', 'dropdown-toggle', 'dropdown-menu', 'view-button', 'dashboard-panel', 'management-controls', 'search-input', 'filter-controls', 'filter-select', 'management-table', 'status-badge', 'action-buttons', 'view-button', 'delete-button', 'dashboard-panel', 'management-controls', 'search-input', 'filter-controls', 'filter-select', 'management-table', 'status-badge', 'action-buttons', 'view-button', 'notification',];
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
            router: router,
            stats: stats,
            recentUsers: recentUsers,
            recentProducts: recentProducts,
            recentTransactions: recentTransactions,
            loading: loading,
            errorMessage: errorMessage,
            activeTab: activeTab,
            initDashboard: initDashboard,
            updateUserRole: updateUserRole,
            deleteProduct: deleteProduct,
            notification: notification,
            switchTab: switchTab,
            formatDate: formatDate,
            formatPrice: formatPrice,
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
//# sourceMappingURL=AdminDashboard.vue.js.map