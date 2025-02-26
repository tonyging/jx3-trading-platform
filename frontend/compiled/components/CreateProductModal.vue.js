import { ref } from 'vue';
const props = defineProps();
const emit = defineEmits();
// 表單資料
const amount = ref('');
const price = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);
// 關閉 Modal
const handleClose = () => {
    emit('update:isOpen', false);
    // 重置表單
    amount.value = '';
    price.value = '';
    errorMessage.value = '';
};
// 驗證和提交表單
const handleSubmit = async () => {
    // 清除錯誤訊息
    errorMessage.value = '';
    // 基本驗證
    if (!amount.value || !price.value) {
        errorMessage.value = '請填寫所有必填欄位';
        return;
    }
    // 數值驗證
    const amountNum = Number(amount.value);
    const priceNum = Number(price.value);
    if (isNaN(amountNum) || amountNum <= 0) {
        errorMessage.value = '請輸入有效的數量';
        return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
        errorMessage.value = '請輸入有效的價格';
        return;
    }
    // 提交表單
    isSubmitting.value = true;
    try {
        emit('submit', {
            amount: amountNum,
            price: priceNum,
        });
    }
    finally {
        isSubmitting.value = false;
    }
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['cancel-button', 'submit-button',];
    // CSS variable injection 
    // CSS variable injection end 
    if (props.isOpen) {
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
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.handleSubmit) },
            ...{ class: ("create-form") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: ("amount"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            id: ("amount"),
            type: ("number"),
            min: ("0"),
            step: ("0.1"),
            required: (true),
            placeholder: ("請輸入遊戲幣數量"),
        });
        (__VLS_ctx.amount);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: ("price"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            id: ("price"),
            type: ("number"),
            min: ("0"),
            required: (true),
            placeholder: ("請輸入價格"),
        });
        (__VLS_ctx.price);
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
    ['modal-overlay', 'modal-content', 'modal-close-btn', 'create-form', 'input-group', 'input-group', 'error-message', 'button-group', 'cancel-button', 'submit-button',];
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
            amount: amount,
            price: price,
            errorMessage: errorMessage,
            isSubmitting: isSubmitting,
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
//# sourceMappingURL=CreateProductModal.vue.js.map