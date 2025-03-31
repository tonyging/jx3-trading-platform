import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useAppStore } from '@/stores/appState';
import SidebarNavigation from '@/components/SidebarNavigation.vue';
import PushNotificationRequest from '@/components/PushNotificationRequest.vue';
import axios from 'axios';
const userStore = useUserStore();
const appStore = useAppStore();
const router = useRouter();
// 計算當前路由，用於側邊欄高亮顯示
const currentRoute = computed(() => {
    return router.currentRoute.value.path;
});
// 計算主內容區域的樣式
const mainContentClass = computed(() => {
    return {
        'with-sidebar': userStore.isAuthenticated,
        'sidebar-collapsed': appStore.isSidebarCollapsed,
    };
});
async function preWarmBackend() {
    try {
        appStore.setBackendWaking(true);
        appStore.incrementConnectionAttempts();
        await axios.get(`${import.meta.env.VITE_API_BASE_URL}/healthz`, {
            timeout: 10000, // 10 秒超時
        });
        appStore.setBackendWaking(false);
        appStore.resetConnectionAttempts();
    }
    catch (error) {
        console.log('正在喚醒後端服務...', error);
        // 5 秒後重試
        setTimeout(() => {
            if (appStore.connectionAttempts < 5) {
                // 最多嘗試 5 次
                preWarmBackend();
            }
            else {
                appStore.setBackendWaking(false);
            }
        }, 5000);
    }
}
onMounted(async () => {
    preWarmBackend();
    if (userStore.token && !userStore.currentUser) {
        try {
            await userStore.fetchCurrentUser();
        }
        catch (error) {
            console.error('Failed to load user info:', error);
        }
    }
}); /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("app-container") },
    });
    if (__VLS_ctx.userStore.isAuthenticated) {
        // @ts-ignore
        /** @type { [typeof SidebarNavigation, ] } */ ;
        // @ts-ignore
        const __VLS_0 = __VLS_asFunctionalComponent(SidebarNavigation, new SidebarNavigation({
            activeRoute: ((__VLS_ctx.currentRoute)),
        }));
        const __VLS_1 = __VLS_0({
            activeRoute: ((__VLS_ctx.currentRoute)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: ("main-content") },
        ...{ class: ((__VLS_ctx.mainContentClass)) },
    });
    const __VLS_5 = {}.RouterView;
    /** @type { [typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ] } */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({}));
    const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
    if (__VLS_ctx.userStore.isAuthenticated) {
        // @ts-ignore
        /** @type { [typeof PushNotificationRequest, ] } */ ;
        // @ts-ignore
        const __VLS_11 = __VLS_asFunctionalComponent(PushNotificationRequest, new PushNotificationRequest({}));
        const __VLS_12 = __VLS_11({}, ...__VLS_functionalComponentArgsRest(__VLS_11));
    }
    if (__VLS_ctx.appStore.isBackendWaking) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("backend-waking-overlay") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("loading-spinner") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: ("waking-message") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: ("waking-submessage") },
        });
        if (__VLS_ctx.appStore.connectionAttempts > 1) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.appStore.connectionAttempts);
        }
    }
    ['app-container', 'main-content', 'backend-waking-overlay', 'loading-spinner', 'waking-message', 'waking-submessage',];
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
            SidebarNavigation: SidebarNavigation,
            PushNotificationRequest: PushNotificationRequest,
            userStore: userStore,
            appStore: appStore,
            currentRoute: currentRoute,
            mainContentClass: mainContentClass,
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
//# sourceMappingURL=App.vue.js.map