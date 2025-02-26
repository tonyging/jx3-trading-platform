import { ref } from 'vue';
const props = defineProps({
    product: {
        type: Object,
        required: true,
    },
});
const purchaseAmount = ref(1);
const emit = defineEmits(['confirm-purchase', 'close']);
const calculateTotalPrice = () => {
    const unitPrice = props.product.price / props.product.amount;
    return (unitPrice * purchaseAmount.value).toFixed(2);
};
const formatPrice = (price) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
    }).format(price);
};
const confirmPurchase = () => {
    if (purchaseAmount.value > 0 && purchaseAmount.value <= props.product.amount) {
        emit('confirm-purchase', {
            amount: purchaseAmount.value,
        });
    }
};
const closeModal = () => {
    emit('close');
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("purchase-modal-overlay"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("purchase-modal"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("modal-header"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
         onClick: (__VLS_ctx.closeModal),
         class: ("close-button"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("product-info"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.product.amount);
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.formatPrice(__VLS_ctx.product.price / __VLS_ctx.product.amount));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("purchase-amount"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        for: ("amount-input"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
        id: ("amount-input"),
        type: ("number"),
        max: ((__VLS_ctx.product.amount)),
        min: ((1)),
    });
    (__VLS_ctx.purchaseAmount);
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("purchase-summary"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.calculateTotalPrice());
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("modal-actions"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
         onClick: (__VLS_ctx.closeModal),
         class: ("cancel-button"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
         onClick: (__VLS_ctx.confirmPurchase),
         class: ("confirm-button"),
        disabled: ((__VLS_ctx.purchaseAmount < 1 || __VLS_ctx.purchaseAmount > __VLS_ctx.product.amount)),
    });
    ['purchase-modal-overlay', 'purchase-modal', 'modal-header', 'close-button', 'product-info', 'purchase-amount', 'purchase-summary', 'modal-actions', 'cancel-button', 'confirm-button',];
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
            purchaseAmount: purchaseAmount,
            calculateTotalPrice: calculateTotalPrice,
            formatPrice: formatPrice,
            confirmPurchase: confirmPurchase,
            closeModal: closeModal,
        };
    },
    emits: {},
    props: {
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
        product: {
            type: Object,
            required: true,
        },
    },
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=PurchaseModal.vue.js.map