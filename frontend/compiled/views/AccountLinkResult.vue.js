import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { userService } from '@/services/api/user';
// 初始化路由和用戶狀態管理
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
// 獲取Discord狀態參數
const discordStatus = ref('');
const discordAvatar = ref('');
const globalName = ref('');
// 判斷是否顯示加載中狀態
const isLoading = ref(true);
// 解析狀態參數並顯示對應內容
onMounted(async () => {
    // 確保用戶已登入
    if (!userStore.isAuthenticated) {
        router.push('/login');
        return;
    }
    // 獲取URL參數
    discordStatus.value = route.query.discord || '';
    // 如果是成功狀態，嘗試獲取用戶的Discord資訊
    if (discordStatus.value === 'success') {
        try {
            // 取得最新的用戶資料
            await userStore.fetchCurrentUser();
            const userData = userStore.currentUser;
            if (userData) {
                // 獲取 Discord 頭像
                if (userData.discordAvatar) {
                    discordAvatar.value = userData.discordAvatar;
                }
                // 獲取 Discord 全局名稱 (可能是中文名)
                if (userData.global_name) {
                    globalName.value = userData.global_name;
                }
            }
            else {
                // 直接從 API 獲取用戶資料作為後備方案
                try {
                    const profileResponse = await userService.getProfile();
                    if (profileResponse.status === 'success' && profileResponse.data) {
                        const data = profileResponse.data;
                        if (data.discordAvatar)
                            discordAvatar.value = data.discordAvatar;
                        if (data.global_name)
                            globalName.value = data.global_name;
                    }
                }
                catch (apiError) {
                    console.error('直接 API 調用失敗:', apiError);
                }
            }
        }
        catch (error) {
            console.error('無法獲取用戶Discord資訊:', error);
        }
    }
    // 完成加載
    isLoading.value = false;
});
// 返回會員頁面
const goToMemberProfile = () => {
    router.push('/member-info');
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['success', 'error', 'warning', 'neutral', 'success', 'error', 'warning', 'neutral', 'primary-button', 'success', 'error', 'warning', 'secondary-button', 'result-card', 'result-icon', 'discord-requirement', 'requirement-text',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("account-link-result-page-wrapper") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("account-link-result-page") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("result-container") },
    });
    if (__VLS_ctx.isLoading) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("loading-state") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("loading-spinner") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    }
    else {
        if (__VLS_ctx.discordStatus === 'success') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-card success") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-icon") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: ("result-description") },
            });
            if (__VLS_ctx.globalName) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("discord-info") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("discord-avatar-container") },
                });
                if (__VLS_ctx.discordAvatar) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                        src: ((__VLS_ctx.discordAvatar)),
                        alt: ("Discord Avatar"),
                        ...{ class: ("discord-avatar") },
                    });
                }
                else {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                        src: ("/discord-logo.svg"),
                        alt: ("Discord"),
                        ...{ class: ("discord-logo") },
                    });
                }
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("discord-user-details") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ("discord-global-name") },
                });
                (__VLS_ctx.globalName);
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: ("additional-info") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.goToMemberProfile) },
                ...{ class: ("primary-button") },
            });
        }
        else if (__VLS_ctx.discordStatus === 'nouser') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-card error") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-icon") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: ("result-description") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("action-buttons") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(!((__VLS_ctx.isLoading))))
                            return;
                        if (!(!((__VLS_ctx.discordStatus === 'success'))))
                            return;
                        if (!((__VLS_ctx.discordStatus === 'nouser')))
                            return;
                        __VLS_ctx.router.push('/login');
                    } },
                ...{ class: ("secondary-button") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.goToMemberProfile) },
                ...{ class: ("primary-button") },
            });
        }
        else if (__VLS_ctx.discordStatus === 'nocode') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-card warning") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-icon") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: ("result-description") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("action-buttons") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.goToMemberProfile) },
                ...{ class: ("secondary-button") },
            });
        }
        else if (__VLS_ctx.discordStatus === 'error') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-card error") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-icon") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: ("result-description") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("action-buttons") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.goToMemberProfile) },
                ...{ class: ("secondary-button") },
            });
        }
        else if (__VLS_ctx.discordStatus === 'account_too_new') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-card warning") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-icon") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: ("result-description") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("discord-requirement") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("requirement-icon") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("requirement-text") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: ("additional-info") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("action-buttons") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.goToMemberProfile) },
                ...{ class: ("primary-button") },
            });
        }
        else if (__VLS_ctx.discordStatus === 'dcisalreadyused') {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-card error") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-icon") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: ("result-description") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("discord-requirement") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("requirement-icon") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("requirement-text") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: ("additional-info") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("action-buttons") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.goToMemberProfile) },
                ...{ class: ("primary-button") },
            });
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-card neutral") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("result-icon") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: ("result-description") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.goToMemberProfile) },
                ...{ class: ("primary-button") },
            });
        }
    }
    ['account-link-result-page-wrapper', 'account-link-result-page', 'result-container', 'loading-state', 'loading-spinner', 'result-card', 'success', 'result-icon', 'result-description', 'discord-info', 'discord-avatar-container', 'discord-avatar', 'discord-logo', 'discord-user-details', 'discord-global-name', 'additional-info', 'primary-button', 'result-card', 'error', 'result-icon', 'result-description', 'action-buttons', 'secondary-button', 'primary-button', 'result-card', 'warning', 'result-icon', 'result-description', 'action-buttons', 'secondary-button', 'result-card', 'error', 'result-icon', 'result-description', 'action-buttons', 'secondary-button', 'result-card', 'warning', 'result-icon', 'result-description', 'discord-requirement', 'requirement-icon', 'requirement-text', 'additional-info', 'action-buttons', 'primary-button', 'result-card', 'error', 'result-icon', 'result-description', 'discord-requirement', 'requirement-icon', 'requirement-text', 'additional-info', 'action-buttons', 'primary-button', 'result-card', 'neutral', 'result-icon', 'result-description', 'primary-button',];
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
            discordStatus: discordStatus,
            discordAvatar: discordAvatar,
            globalName: globalName,
            isLoading: isLoading,
            goToMemberProfile: goToMemberProfile,
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
//# sourceMappingURL=AccountLinkResult.vue.js.map