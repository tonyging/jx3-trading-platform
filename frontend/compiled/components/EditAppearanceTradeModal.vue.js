// components/EditAppearanceTradeModal.vue
import { ref, onMounted, watch } from 'vue';
const props = defineProps();
const emit = defineEmits();
// 表單資料
const price = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);
// 可用的支付方式選項
const paymentOptions = [
    '匯款',
    'Line Pay',
    '街口支付',
    '支付寶',
    '微信',
    '8591',
    '遊戲幣',
];
// 選擇的支付方式
const selectedPaymentMethods = ref([]);
// 切換支付方式選擇
const togglePaymentMethod = (method) => {
    const index = selectedPaymentMethods.value.indexOf(method);
    if (index === -1) {
        selectedPaymentMethods.value.push(method);
    }
    else {
        // 確保至少保留一種支付方式
        if (selectedPaymentMethods.value.length > 1) {
            selectedPaymentMethods.value.splice(index, 1);
        }
    }
};
// 初始化表單數據
const initFormData = () => {
    if (props.trade) {
        price.value = props.trade.price.toString();
        selectedPaymentMethods.value = props.trade.paymentMethods
            ? [...props.trade.paymentMethods]
            : ['匯款'];
    }
};
// 關閉 Modal
const handleClose = () => {
    emit('update:isOpen', false);
    // 重置表單
    errorMessage.value = '';
};
// 驗證和提交表單
const handleSubmit = async () => {
    // 清除錯誤訊息
    errorMessage.value = '';
    // 基本驗證
    if (!price.value) {
        errorMessage.value = '請填寫價格';
        return;
    }
    // 價格驗證
    const priceNum = Number(price.value);
    if (isNaN(priceNum) || priceNum <= 0) {
        errorMessage.value = '請輸入有效的價格';
        return;
    }
    // 確認至少有一種交易方式
    if (selectedPaymentMethods.value.length === 0) {
        errorMessage.value = '請至少選擇一種交易方式';
        return;
    }
    // 提交表單
    isSubmitting.value = true;
    try {
        emit('submit', {
            price: priceNum,
            paymentMethods: selectedPaymentMethods.value,
        });
    }
    finally {
        isSubmitting.value = false;
    }
};
// 監聽 Modal 打開狀態，初始化數據
watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        initFormData();
    }
});
// 監聽 trade 變化，初始化數據
watch(() => props.trade, (trade) => {
    if (trade) {
        initFormData();
    }
});
// 組件掛載時初始化數據
onMounted(() => {
    if (props.isOpen && props.trade) {
        initFormData();
    }
}); /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['cancel-button', 'submit-button',];
    // CSS variable injection 
    // CSS variable injection end 
    if (props.isOpen && props.trade) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (__VLS_ctx.handleClose) },
            ...{ class: ("modal-overlay") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: () => { } },
            ...{ class: ("modal-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleClose) },
            ...{ class: ("modal-close-btn") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("trade-info") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("trade-info-item") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("value") },
        });
        (typeof props.trade.appearanceId === 'object'
            ? props.trade.appearanceId.officialName
            : '未知外觀');
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("trade-info-item") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("value") },
        });
        (props.trade.characterNickname);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("trade-info-item") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("value") },
        });
        (props.trade.currency);
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.handleSubmit) },
            ...{ class: ("edit-form") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: ("price"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("required") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            id: ("price"),
            type: ("number"),
            min: ("0"),
            required: (true),
            placeholder: ("請輸入價格"),
        });
        (__VLS_ctx.price);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("required") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("payment-options") },
        });
        for (const [method] of __VLS_getVForSourceType((__VLS_ctx.paymentOptions))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                key: ((method)),
                ...{ class: ("payment-option") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                ...{ onChange: (...[$event]) => {
                        if (!((props.isOpen && props.trade)))
                            return;
                        __VLS_ctx.togglePaymentMethod(method);
                    } },
                type: ("checkbox"),
                value: ((method)),
                checked: ((__VLS_ctx.selectedPaymentMethods.includes(method))),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (method);
        }
        if (__VLS_ctx.errorMessage) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("error-message") },
            });
            (__VLS_ctx.errorMessage);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("button-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleClose) },
            type: ("button"),
            ...{ class: ("cancel-button") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            type: ("submit"),
            ...{ class: ("submit-button") },
            disabled: ((__VLS_ctx.isSubmitting)),
        });
        (__VLS_ctx.isSubmitting ? '處理中...' : '確認');
    }
    ['modal-overlay', 'modal-content', 'modal-close-btn', 'trade-info', 'trade-info-item', 'label', 'value', 'trade-info-item', 'label', 'value', 'trade-info-item', 'label', 'value', 'edit-form', 'input-group', 'required', 'input-group', 'required', 'payment-options', 'payment-option', 'error-message', 'button-group', 'cancel-button', 'submit-button',];
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
            price: price,
            errorMessage: errorMessage,
            isSubmitting: isSubmitting,
            paymentOptions: paymentOptions,
            selectedPaymentMethods: selectedPaymentMethods,
            togglePaymentMethod: togglePaymentMethod,
            handleClose: handleClose,
            handleSubmit: handleSubmit,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=EditAppearanceTradeModal.vue.js.map