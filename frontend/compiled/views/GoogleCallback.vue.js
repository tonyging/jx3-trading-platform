import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
onMounted(async () => {
    try {
        const code = route.query.code;
        if (!code) {
            throw new Error('未收到授權碼');
        }
        await userStore.handleGoogleCallback(code);
        router.push('/');
    }
    catch (error) {
        console.error('Google 登入失敗:', error);
        router.push('/auth/google/error');
    }
}); /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("google-callback"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("loading-spinner"),
    });
    ['google-callback', 'loading-spinner',];
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
//# sourceMappingURL=GoogleCallback.vue.js.map