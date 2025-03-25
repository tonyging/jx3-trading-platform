import { ref } from 'vue';
const props = defineProps();
// 控制圖片預覽的模態框
const isImageModalOpen = ref(false);
const selectedImage = ref(null);
// 打開圖片預覽
const openImagePreview = (imageUrl) => {
    selectedImage.value = imageUrl;
    isImageModalOpen.value = true;
};
// 關閉圖片預覽
const closeImagePreview = () => {
    isImageModalOpen.value = false;
    selectedImage.value = null;
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("appearance-card") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("appearance-header") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.appearance.officialName);
    if (__VLS_ctx.appearance.nicknames?.length) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("nicknames") },
        });
        for (const [nickname] of __VLS_getVForSourceType((__VLS_ctx.appearance.nicknames))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                key: ((nickname)),
                ...{ class: ("nickname-tag") },
            });
            (nickname);
        }
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("appearance-images") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("image-group adult-images") },
    });
    if (__VLS_ctx.appearance.images?.adultMale) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.appearance.images?.adultMale)))
                        return;
                    __VLS_ctx.openImagePreview(__VLS_ctx.appearance.images.adultMale);
                } },
            ...{ class: ("image-wrapper") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
            src: ((__VLS_ctx.appearance.images.adultMale)),
            alt: ("成人男性"),
            ...{ class: ("appearance-image") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("image-label") },
        });
    }
    if (__VLS_ctx.appearance.images?.adultFemale) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.appearance.images?.adultFemale)))
                        return;
                    __VLS_ctx.openImagePreview(__VLS_ctx.appearance.images.adultFemale);
                } },
            ...{ class: ("image-wrapper") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
            src: ((__VLS_ctx.appearance.images.adultFemale)),
            alt: ("成人女性"),
            ...{ class: ("appearance-image") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("image-label") },
        });
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("image-group child-images") },
    });
    if (__VLS_ctx.appearance.images?.childMale) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.appearance.images?.childMale)))
                        return;
                    __VLS_ctx.openImagePreview(__VLS_ctx.appearance.images.childMale);
                } },
            ...{ class: ("image-wrapper") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
            src: ((__VLS_ctx.appearance.images.childMale)),
            alt: ("孩童男性"),
            ...{ class: ("appearance-image") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("image-label") },
        });
    }
    if (__VLS_ctx.appearance.images?.childFemale) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.appearance.images?.childFemale)))
                        return;
                    __VLS_ctx.openImagePreview(__VLS_ctx.appearance.images.childFemale);
                } },
            ...{ class: ("image-wrapper") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
            src: ((__VLS_ctx.appearance.images.childFemale)),
            alt: ("孩童女性"),
            ...{ class: ("appearance-image") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("image-label") },
        });
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("appearance-footer") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("submitter-info") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.appearance.submittedBy?.name || '未知');
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (new Date(__VLS_ctx.appearance.createdAt).toLocaleDateString());
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("approval-info") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.appearance.approvedBy?.length || 0);
    if (__VLS_ctx.isImageModalOpen) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (__VLS_ctx.closeImagePreview) },
            ...{ class: ("image-preview-modal") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: () => { } },
            ...{ class: ("image-preview-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.closeImagePreview) },
            ...{ class: ("close-modal-btn") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
            src: ((__VLS_ctx.selectedImage)),
            alt: ("圖片預覽"),
            ...{ class: ("full-preview-image") },
        });
    }
    ['appearance-card', 'appearance-header', 'nicknames', 'nickname-tag', 'appearance-images', 'image-group', 'adult-images', 'image-wrapper', 'appearance-image', 'image-label', 'image-wrapper', 'appearance-image', 'image-label', 'image-group', 'child-images', 'image-wrapper', 'appearance-image', 'image-label', 'image-wrapper', 'appearance-image', 'image-label', 'appearance-footer', 'submitter-info', 'approval-info', 'image-preview-modal', 'image-preview-content', 'close-modal-btn', 'full-preview-image',];
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
            isImageModalOpen: isImageModalOpen,
            selectedImage: selectedImage,
            openImagePreview: openImagePreview,
            closeImagePreview: closeImagePreview,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=AppearanceCard.vue.js.map