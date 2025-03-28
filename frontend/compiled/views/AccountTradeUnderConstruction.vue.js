// src/views/AccountTradeUnderConstruction.vue
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const progress = ref(10); // 假設目前完成度為35%
const releaseDate = ref('2025年5月'); // 預計上線日期
// 返回首頁
const navigateToHome = () => {
    router.push('/');
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['content-container', 'page-title', 'construction-icon', 'content-container', 'features-preview', 'actions',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("under-construction-container") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("content-container") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("construction-icon") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: ("http://www.w3.org/2000/svg"),
        viewBox: ("0 0 24 24"),
        fill: ("none"),
        stroke: ("currentColor"),
        'stroke-width': ("2"),
        'stroke-linecap': ("round"),
        'stroke-linejoin': ("round"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.polygon, __VLS_intrinsicElements.polygon)({
        points: ("12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.line, __VLS_intrinsicElements.line)({
        x1: ("12"),
        y1: ("22"),
        x2: ("12"),
        y2: ("15.5"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.polyline, __VLS_intrinsicElements.polyline)({
        points: ("22 8.5 12 15.5 2 8.5"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.polyline, __VLS_intrinsicElements.polyline)({
        points: ("2 15.5 12 8.5 22 15.5"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.line, __VLS_intrinsicElements.line)({
        x1: ("12"),
        y1: ("2"),
        x2: ("12"),
        y2: ("8.5"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
        ...{ class: ("page-title") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("progress-container") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("progress-bar") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("progress-fill") },
        ...{ style: (({ width: `${__VLS_ctx.progress}%` })) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("progress-text") },
    });
    (__VLS_ctx.progress);
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: ("description") },
    });
    (__VLS_ctx.releaseDate);
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("features-preview") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: ("feature-icon") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: ("feature-text") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: ("feature-icon") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: ("feature-text") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: ("feature-icon") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: ("feature-text") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("notification") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("notification-icon") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("notification-content") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        href: ("https://discord.gg/wzr3r9ByvQ"),
        target: ("_blank"),
        ...{ class: ("discord-link") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("actions") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.navigateToHome) },
        ...{ class: ("primary-button") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.router.go(-1);
            } },
        ...{ class: ("secondary-button") },
    });
    ['under-construction-container', 'content-container', 'construction-icon', 'page-title', 'progress-container', 'progress-bar', 'progress-fill', 'progress-text', 'description', 'features-preview', 'feature-icon', 'feature-text', 'feature-icon', 'feature-text', 'feature-icon', 'feature-text', 'notification', 'notification-icon', 'notification-content', 'discord-link', 'actions', 'primary-button', 'secondary-button',];
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
            progress: progress,
            releaseDate: releaseDate,
            navigateToHome: navigateToHome,
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
//# sourceMappingURL=AccountTradeUnderConstruction.vue.js.map