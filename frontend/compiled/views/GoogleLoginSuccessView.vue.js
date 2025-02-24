import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
onMounted(async () => {
    const { token, email, name } = route.query;
    if (token && email && name) {
        try {
            // 將 token 存儲到 localStorage 或 Pinia store
            userStore.setUser({
                token: token,
                email: email,
                name: name,
            });
            // 可以在這裡進行一些額外的用戶信息獲取或初始化
            // 導航到主頁或儀表板
            router.push('/');
        }
        catch (error) {
            console.error('Google 登入處理失敗:', error);
            router.push('/auth/google/error');
        }
    }
    else {
        // 如果缺少必要的參數
        router.push('/login');
    }
}); /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
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
        return {};
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=GoogleLoginSuccessView.vue.js.map