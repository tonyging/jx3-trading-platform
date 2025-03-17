import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
const router = useRouter();
const userStore = useUserStore();
// 最後更新日期
const lastUpdated = ref('2025年3月17日');
// 是否顯示載入狀態
const isLoading = ref(true);
onMounted(async () => {
    // 確保用戶已登入
    if (!userStore.isAuthenticated) {
        router.push('/login');
        return;
    }
    // 模擬載入延遲
    setTimeout(() => {
        isLoading.value = false;
    }, 500);
});
// 返回上一頁或會員中心
const goBack = () => {
    router.push('/member-info');
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['policy-header', 'policy-section', 'policy-section', 'policy-section', 'policy-section', 'contact-link', 'btn-back', 'privacy-policy-container', 'policy-header', 'policy-section',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("privacy-policy-page") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("privacy-policy-container") },
    });
    if (__VLS_ctx.isLoading) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("loading-container") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("spinner") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("policy-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("policy-header") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: ("update-date") },
        });
        (__VLS_ctx.lastUpdated);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("policy-sections") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: ("policy-section") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: ("policy-section") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: ("policy-section") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: ("policy-section") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: ("policy-section") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: ("policy-section") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: ("policy-section") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            href: ("mailto:privacy@example.com"),
            ...{ class: ("contact-link") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("action-buttons") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.goBack) },
            ...{ class: ("btn-back") },
        });
    }
    ['privacy-policy-page', 'privacy-policy-container', 'loading-container', 'spinner', 'policy-content', 'policy-header', 'update-date', 'policy-sections', 'policy-section', 'policy-section', 'policy-section', 'policy-section', 'policy-section', 'policy-section', 'policy-section', 'contact-link', 'action-buttons', 'btn-back',];
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
            lastUpdated: lastUpdated,
            isLoading: isLoading,
            goBack: goBack,
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
//# sourceMappingURL=PrivacyPolicyView.vue.js.map