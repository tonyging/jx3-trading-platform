import { computed, ref } from 'vue';
const props = defineProps({
    product: {
        type: Object,
        required: true,
    },
});
const emit = defineEmits(['confirm', 'cancel']);
// 選擇的交易方式
const selectedPaymentMethod = ref(props.product.paymentMethods && props.product.paymentMethods.length > 0
    ? props.product.paymentMethods[0]
    : '匯款');
// 計算賣家名稱
const sellerName = computed(() => {
    const userId = props.product.userId;
    // 檢查 userId 是否為物件且包含 name
    if (typeof userId === 'object' && userId !== null && 'name' in userId) {
        return userId.name;
    }
    // 若無法取得賣家名稱，則回傳預設值
    return '未知賣家';
});
// 計算單價
const unitPrice = computed(() => props.product.amount / props.product.price);
// 確認購買
const confirmPurchase = () => {
    emit('confirm', {
        amount: props.product.amount, // 直接使用商品完整數量
        totalPrice: props.product.price, // 直接使用商品完整價格
        paymentMethod: selectedPaymentMethod.value, // 新增選擇的交易方式
    });
};
// 格式化價格顯示（根據幣別）
const formatPrice = (price) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: props.product.currency === '台幣'
            ? 'TWD'
            : props.product.currency === '人民幣'
                ? 'CNY'
                : 'HKD',
        minimumFractionDigits: 0,
    }).format(price);
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("purchase-confirm-modal-overlay") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("purchase-confirm-modal") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.$emit('cancel');
            } },
        ...{ class: ("close-button") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("product-details") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("detail-item") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.sellerName);
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("detail-item") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.product.characterNickname || '未設定');
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("detail-item") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.product.amount);
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("detail-item") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.product.currency || '台幣');
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("detail-item") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.unitPrice.toFixed(0));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("detail-item") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.formatPrice(__VLS_ctx.product.price));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("payment-method-selection") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: ((__VLS_ctx.selectedPaymentMethod)),
        ...{ class: ("payment-method-select") },
    });
    for (const [method] of __VLS_getVForSourceType((__VLS_ctx.product.paymentMethods))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: ((method)),
            value: ((method)),
        });
        (method);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("purchase-notice") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("modal-actions") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.$emit('cancel');
            } },
        ...{ class: ("cancel-button") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.confirmPurchase) },
        ...{ class: ("confirm-button") },
    });
    ['purchase-confirm-modal-overlay', 'purchase-confirm-modal', 'close-button', 'product-details', 'detail-item', 'detail-item', 'detail-item', 'detail-item', 'detail-item', 'detail-item', 'payment-method-selection', 'payment-method-select', 'purchase-notice', 'modal-actions', 'cancel-button', 'confirm-button',];
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
            selectedPaymentMethod: selectedPaymentMethod,
            sellerName: sellerName,
            unitPrice: unitPrice,
            confirmPurchase: confirmPurchase,
            formatPrice: formatPrice,
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
//# sourceMappingURL=PurchaseConfirmModal.vue.js.map