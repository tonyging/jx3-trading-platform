import { computed } from 'vue';
const props = withDefaults(defineProps(), {
    maxVisiblePages: 5,
});
const emit = defineEmits();
// 計算分頁數字
const pageNumbers = computed(() => {
    const { currentPage, totalPages, maxVisiblePages } = props;
    const halfVisiblePages = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - halfVisiblePages);
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    // 調整開始和結束頁面
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }
    return pages;
});
// 是否顯示第一頁省略號
const showFirstEllipsis = computed(() => props.currentPage > Math.floor(props.maxVisiblePages / 2) + 1);
// 是否顯示最後一頁省略號
const showLastEllipsis = computed(() => props.currentPage < props.totalPages - Math.floor(props.maxVisiblePages / 2));
// 變更頁面
const changePage = (page) => {
    if (page >= 1 && page <= props.totalPages) {
        emit('page-change', page);
    }
}; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    maxVisiblePages: 5,
});
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("pagination-container") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.changePage(__VLS_ctx.currentPage - 1);
            } },
        ...{ class: ("pagination-button prev-button") },
        disabled: ((__VLS_ctx.currentPage === 1)),
    });
    if (__VLS_ctx.showFirstEllipsis) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.showFirstEllipsis)))
                        return;
                    __VLS_ctx.changePage(1);
                } },
            ...{ class: ("pagination-button") },
        });
    }
    if (__VLS_ctx.showFirstEllipsis) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("ellipsis") },
        });
    }
    for (const [page] of __VLS_getVForSourceType((__VLS_ctx.pageNumbers))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.changePage(page);
                } },
            key: ((page)),
            ...{ class: ("pagination-button") },
            ...{ class: (({ active: page === __VLS_ctx.currentPage })) },
        });
        (page);
    }
    if (__VLS_ctx.showLastEllipsis) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("ellipsis") },
        });
    }
    if (__VLS_ctx.showLastEllipsis) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.showLastEllipsis)))
                        return;
                    __VLS_ctx.changePage(__VLS_ctx.totalPages);
                } },
            ...{ class: ("pagination-button") },
        });
        (__VLS_ctx.totalPages);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.changePage(__VLS_ctx.currentPage + 1);
            } },
        ...{ class: ("pagination-button next-button") },
        disabled: ((__VLS_ctx.currentPage === __VLS_ctx.totalPages)),
    });
    ['pagination-container', 'pagination-button', 'prev-button', 'pagination-button', 'ellipsis', 'pagination-button', 'active', 'ellipsis', 'pagination-button', 'pagination-button', 'next-button',];
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
            pageNumbers: pageNumbers,
            showFirstEllipsis: showFirstEllipsis,
            showLastEllipsis: showLastEllipsis,
            changePage: changePage,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=AppearancePagination.vue.js.map