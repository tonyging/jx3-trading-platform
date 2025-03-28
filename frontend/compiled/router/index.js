// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: () => import('@/views/HomeView.vue'),
            meta: {
                requiresAuth: true,
                title: '遊戲幣交易 - 劍三交易平台',
            },
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/LoginView.vue'),
            meta: { requiresAuth: false },
            beforeEnter: (to, from, next) => {
                const userStore = useUserStore();
                if (userStore.isAuthenticated) {
                    next('/');
                }
                else {
                    next();
                }
            },
        },
        {
            path: '/forgot-password',
            name: 'forgot-password',
            component: () => import('@/views/ForgotPasswordView.vue'),
            meta: {
                requiresAuth: false,
                title: '重設密碼 - 劍三交易平台',
            },
            beforeEnter: (to, from, next) => {
                const userStore = useUserStore();
                if (userStore.isAuthenticated) {
                    next('/');
                }
                else {
                    next();
                }
            },
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('@/views/RegisterView.vue'),
            meta: { requiresAuth: false },
        },
        {
            path: '/transactions/:id',
            name: 'transaction-detail',
            component: () => import('@/views/TransactionDetailView.vue'),
            meta: { requiresAuth: true },
        },
        // 會員資訊
        {
            path: '/member-info',
            name: 'member-info',
            component: () => import('@/views/MemberProfile.vue'),
            meta: {
                requiresAuth: true,
                title: '會員資訊 - 劍三交易平台',
            },
        },
        {
            path: '/auth/google/callback',
            name: 'google-callback',
            component: () => import('@/views/GoogleCallback.vue'),
            meta: { requiresAuth: false },
        },
        {
            path: '/auth/google/error',
            name: 'google-error',
            component: () => import('@/views/GoogleError.vue'),
            meta: { requiresAuth: false },
        },
        {
            path: '/auth/google/success',
            name: 'GoogleLoginSuccess',
            component: () => import('@/views/GoogleLoginSuccessView.vue'),
            meta: { requiresGuest: true },
        },
        {
            path: '/account-links',
            component: () => import('@/views/AccountLinkResult.vue'),
            meta: {
                requiresAuth: true,
                title: 'Discord綁定 - 劍三交易平台',
            },
        },
        {
            path: '/privacy-policy',
            name: 'privacy-policy',
            component: () => import('@/views/PrivacyPolicyView.vue'),
            meta: {
                requiresAuth: true,
                title: '隱私政策 - 劍三交易平台',
            },
        },
        // 新增管理員儀表板路由
        {
            path: '/admin-dashboard',
            name: 'admin-dashboard',
            component: () => import('@/views/AdminDashboard.vue'),
            meta: {
                requiresAuth: true,
                requiresAdmin: true,
                title: '管理員儀表板 - 劍三交易平台',
            },
        },
        {
            path: '/appearance/library',
            name: 'appearance-library',
            component: () => import('@/views/AppearanceLibrary.vue'),
            meta: {
                requiresAuth: true,
                title: '外觀資料庫 - 劍三交易平台',
            },
        },
        {
            path: '/appearance/trade',
            name: 'appearance-trade',
            component: () => import('@/views/AppearanceTradeView.vue'),
            meta: {
                requiresAuth: true,
                title: '外觀交易 - 劍三交易平台',
            },
        },
        {
            path: '/appearance-trades/:id',
            name: 'appearance-trade-detail',
            component: () => import('@/views/AppearanceTradeDetailView.vue'),
            meta: {
                requiresAuth: true,
                title: '外觀交易詳情 - 劍三交易平台',
            },
        },
        {
            path: '/account/trade',
            name: '/account/trade',
            component: () => import('@/views/AccountTradeUnderConstruction.vue'),
            meta: {
                requiresAuth: true,
                title: '帳號交易 - 劍三交易平台',
            },
        },
    ],
});
router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();
    // 如果有 token 但沒有用戶資料，嘗試獲取用戶資料
    if (userStore.token && !userStore.currentUser) {
        try {
            await userStore.fetchCurrentUser();
        }
        catch (error) {
            console.error('Failed to load user info:', error);
            userStore.logout(); // 清除無效的 token
            if (to.path !== '/forgot-password') {
                next('/login');
                return;
            }
        }
    }
    // 已登入用戶訪問不需要登入的頁面時重定向到首頁
    if (['/login', '/forgot-password'].includes(to.path) && userStore.isAuthenticated) {
        console.log('已登入，重定向到首頁');
        next('/');
        return;
    }
    // 未登入用戶訪問需要登入的頁面時重定向到登入頁
    if (to.meta.requiresAuth && !userStore.isAuthenticated) {
        console.log('重定向到登入頁');
        next('/login');
        return;
    }
    // 檢查管理員權限
    if (to.meta.requiresAdmin && userStore.currentUser?.role !== 'admin') {
        console.log('需要管理員權限，重定向到首頁');
        next('/');
        return;
    }
    // 其他情況正常放行
    console.log('正常放行');
    next();
});
export default router;
//# sourceMappingURL=index.js.map