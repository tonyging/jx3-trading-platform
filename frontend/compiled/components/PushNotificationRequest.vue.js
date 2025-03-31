import { ref, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { registerServiceWorker, requestNotificationPermission, subscribeToPushNotifications, } from '@/registerServiceWorker';
import { userService } from '@/services/api/user';
const userStore = useUserStore();
const isSubscribed = ref(false);
const notificationPermissionState = ref(Notification.permission);
const showPermissionPrompt = ref(false);
const isLoading = ref(false);
const error = ref('');
const dismissedForSession = ref(false);
// 處理訂閱推播
const handleSubscribe = async () => {
    isLoading.value = true;
    error.value = '';
    try {
        const hasPermission = await requestNotificationPermission();
        notificationPermissionState.value = Notification.permission;
        if (!hasPermission) {
            showPermissionPrompt.value = true;
            if (Notification.permission === 'denied') {
                error.value = '通知權限已被拒絕，請在瀏覽器設定中啟用通知';
            }
            return;
        }
        const registration = await registerServiceWorker();
        if (!registration) {
            error.value = '無法註冊 Service Worker';
            return;
        }
        const subscription = await subscribeToPushNotifications(registration);
        if (!subscription) {
            error.value = '訂閱推播服務失敗';
            return;
        }
        // 將訂閱資訊發送到後端
        await userService.savePushSubscription(subscription);
        isSubscribed.value = true;
        localStorage.setItem('pushNotificationsSubscribed', 'true');
    }
    catch (err) {
        console.error('訂閱過程中發生錯誤:', err);
        error.value = '訂閱過程中發生錯誤，請稍後再試';
    }
    finally {
        isLoading.value = false;
    }
};
// 打開瀏覽器通知設定
const openNotificationSettings = () => {
    if (typeof window !== 'undefined') {
        // 開啟瀏覽器通知設定頁面或提供指導
        alert('請在瀏覽器設定中啟用通知\n\n在 Chrome 中：設定 > 隱私權和安全性 > 網站設定 > 通知');
    }
};
// 關閉提示框並記住本次會話不再顯示
const dismissPrompt = () => {
    showPermissionPrompt.value = false;
    dismissedForSession.value = true;
    sessionStorage.setItem('notificationPromptDismissed', 'true');
};
// 檢查推播訂閱狀態
const checkSubscriptionStatus = async () => {
    try {
        // 先檢查本地存儲
        if (localStorage.getItem('pushNotificationsSubscribed') === 'true') {
            isSubscribed.value = true;
            return;
        }
        // 如果用戶已登入，檢查後端的訂閱狀態
        if (userStore.isAuthenticated) {
            const response = await userService.checkPushSubscriptionStatus();
            isSubscribed.value = response.data.isSubscribed;
            // 同步本地存儲
            if (isSubscribed.value) {
                localStorage.setItem('pushNotificationsSubscribed', 'true');
            }
        }
    }
    catch (err) {
        console.error('檢查訂閱狀態時發生錯誤:', err);
    }
};
onMounted(async () => {
    // 檢查是否已訂閱
    await checkSubscriptionStatus();
    // 檢查通知權限狀態
    notificationPermissionState.value = Notification.permission;
    // 檢查本次會話是否已經關閉過提示
    dismissedForSession.value = sessionStorage.getItem('notificationPromptDismissed') === 'true';
    // 如果用戶登入且未訂閱且未拒絕通知且本次會話未關閉過提示，顯示訂閱提示
    if (userStore.isAuthenticated &&
        !isSubscribed.value &&
        notificationPermissionState.value !== 'denied' &&
        !dismissedForSession.value) {
        // 延遲顯示以避免立即彈出影響用戶體驗
        setTimeout(() => {
            showPermissionPrompt.value = true;
        }, 3000);
    }
});
// 組件卸載時清理
onUnmounted(() => {
    // 可以進行一些清理工作
}); /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['subscribe-button', 'dismiss-button', 'settings-button', 'notification-prompt', 'prompt-actions',];
    // CSS variable injection 
    // CSS variable injection end 
    const __VLS_0 = {}.transition;
    /** @type { [typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ] } */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        name: ("fade"),
    }));
    const __VLS_2 = __VLS_1({
        name: ("fade"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    var __VLS_6 = {};
    if (__VLS_ctx.showPermissionPrompt && !__VLS_ctx.isSubscribed && !__VLS_ctx.dismissedForSession) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("notification-prompt") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("prompt-container") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.dismissPrompt) },
            ...{ class: ("close-button") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("prompt-icon") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: ("http://www.w3.org/2000/svg"),
            width: ("24"),
            height: ("24"),
            viewBox: ("0 0 24 24"),
            fill: ("none"),
            stroke: ("currentColor"),
            'stroke-width': ("2"),
            'stroke-linecap': ("round"),
            'stroke-linejoin': ("round"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
            d: ("M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
            d: ("M13.73 21a2 2 0 0 1-3.46 0"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("prompt-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("prompt-actions") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleSubscribe) },
            ...{ class: ("subscribe-button") },
            disabled: ((__VLS_ctx.isLoading)),
        });
        (__VLS_ctx.isLoading ? '處理中...' : '開啟通知');
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.dismissPrompt) },
            ...{ class: ("dismiss-button") },
        });
        if (__VLS_ctx.error) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("prompt-error") },
            });
            (__VLS_ctx.error);
            if (__VLS_ctx.notificationPermissionState === 'denied') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.openNotificationSettings) },
                    ...{ class: ("settings-button") },
                });
            }
        }
    }
    __VLS_5.slots.default;
    var __VLS_5;
    ['notification-prompt', 'prompt-container', 'close-button', 'prompt-icon', 'prompt-content', 'prompt-actions', 'subscribe-button', 'dismiss-button', 'prompt-error', 'settings-button',];
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
            isSubscribed: isSubscribed,
            notificationPermissionState: notificationPermissionState,
            showPermissionPrompt: showPermissionPrompt,
            isLoading: isLoading,
            error: error,
            dismissedForSession: dismissedForSession,
            handleSubscribe: handleSubscribe,
            openNotificationSettings: openNotificationSettings,
            dismissPrompt: dismissPrompt,
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
//# sourceMappingURL=PushNotificationRequest.vue.js.map