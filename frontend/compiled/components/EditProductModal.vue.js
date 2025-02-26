import { ref, watch } from 'vue';
const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true,
    },
    product: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(['update:isOpen', 'submit']);
const localAmount = ref(props.product.amount);
const localPrice = ref(props.product.price);
// 监听传入的 product 变化，更新本地状态
watch(() => props.product, (newProduct) => {
    localAmount.value = newProduct.amount;
    localPrice.value = newProduct.price;
});
const closeModal = () => {
    emit('update:isOpen', false);
};
const handleSubmit = () => {
    // 简单的验证
    if (localAmount.value <= 0 || localPrice.value <= 0) {
        alert('數量和價格必須大於0');
        return;
    }
    emit('submit', {
        amount: localAmount.value,
        price: localPrice.value,
    });
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    if (__VLS_ctx.isOpen) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
             onClick: (__VLS_ctx.closeModal),
             class: ("modal-overlay"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
             class: ("modal-content"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
             class: ("form-group"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: ("amount"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            type: ("number"),
            id: ("amount"),
            min: ("1"),
        });
        (__VLS_ctx.localAmount);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
             class: ("form-group"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: ("price"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            type: ("number"),
            id: ("price"),
            min: ("1"),
        });
        (__VLS_ctx.localPrice);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
             class: ("modal-actions"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
             onClick: (__VLS_ctx.closeModal),
             class: ("cancel-button"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
             onClick: (__VLS_ctx.handleSubmit),
             class: ("confirm-button"),
        });
    }
    ['modal-overlay', 'modal-content', 'form-group', 'form-group', 'modal-actions', 'cancel-button', 'confirm-button',];
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
            localAmount: localAmount,
            localPrice: localPrice,
            closeModal: closeModal,
            handleSubmit: handleSubmit,
        };
    },
    emits: {},
    props: {
        isOpen: {
            type: Boolean,
            required: true,
        },
        product: {
            type: Object,
            required: true,
        },
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    props: {
        isOpen: {
            type: Boolean,
            required: true,
        },
        product: {
            type: Object,
            required: true,
        },
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=EditProductModal.vue.js.map