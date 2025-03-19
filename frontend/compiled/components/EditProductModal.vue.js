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
const emit = defineEmits();
// 表單資料
const localAmount = ref(props.product.amount);
const localPrice = ref(props.product.price);
const localCharacterNickname = ref(props.product.characterNickname || '');
const localCurrency = ref(props.product.currency || '台幣');
const localPaymentMethods = ref(props.product.paymentMethods || ['匯款']);
const errorMessage = ref('');
// 可用的支付方式選項
const paymentOptions = ['匯款', 'Line Pay', '街口支付', '支付寶', '微信'];
// 可用的幣別選項
const currencyOptions = ['台幣', '人民幣', '港幣'];
// 監聽傳入的 product 變化，更新本地狀態
watch(() => props.product, (newProduct) => {
    localAmount.value = newProduct.amount;
    localPrice.value = newProduct.price;
    localCharacterNickname.value = newProduct.characterNickname || '';
    localCurrency.value = newProduct.currency || '台幣';
    localPaymentMethods.value = newProduct.paymentMethods || ['匯款'];
});
// 關閉模態窗
const closeModal = () => {
    emit('update:isOpen', false);
    errorMessage.value = '';
};
// 切換支付方式選擇
const togglePaymentMethod = (method) => {
    const index = localPaymentMethods.value.indexOf(method);
    if (index === -1) {
        localPaymentMethods.value.push(method);
    }
    else {
        // 確保至少保留一種支付方式
        if (localPaymentMethods.value.length > 1) {
            localPaymentMethods.value.splice(index, 1);
        }
    }
};
const handleSubmit = () => {
    // 清除錯誤訊息
    errorMessage.value = '';
    // 基本驗證
    if (!localAmount.value || !localPrice.value || !localCharacterNickname.value) {
        errorMessage.value = '請填寫所有必填欄位';
        return;
    }
    // 角色暱稱長度驗證
    if (localCharacterNickname.value.length > 10) {
        errorMessage.value = '角色暱稱不能超過10個字元';
        return;
    }
    // 數值驗證
    if (localAmount.value <= 0) {
        errorMessage.value = '數量必須大於0';
        return;
    }
    if (localPrice.value <= 0) {
        errorMessage.value = '價格必須大於0';
        return;
    }
    // 確認至少有一種交易方式
    if (localPaymentMethods.value.length === 0) {
        errorMessage.value = '請至少選擇一種交易方式';
        return;
    }
    emit('submit', {
        amount: localAmount.value,
        price: localPrice.value,
        paymentMethods: localPaymentMethods.value,
        characterNickname: localCharacterNickname.value.trim(),
        currency: localCurrency.value,
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
            ...{ onClick: (__VLS_ctx.closeModal) },
            ...{ class: ("modal-overlay") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("modal-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.closeModal) },
            ...{ class: ("modal-close-btn") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.handleSubmit) },
            ...{ class: ("edit-form") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: ("characterNickname"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("required") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            id: ("characterNickname"),
            value: ((__VLS_ctx.localCharacterNickname)),
            type: ("text"),
            required: (true),
            placeholder: ("請輸入您在遊戲中的角色暱稱"),
            maxlength: ("10"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("character-count") },
        });
        (__VLS_ctx.localCharacterNickname.length);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: ("amount"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("required") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            id: ("amount"),
            type: ("number"),
            min: ("1"),
            required: (true),
            placeholder: ("請輸入遊戲幣數量"),
        });
        (__VLS_ctx.localAmount);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-group") },
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
            min: ("1"),
            required: (true),
            placeholder: ("請輸入價格"),
        });
        (__VLS_ctx.localPrice);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("required") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("currency-options") },
        });
        for (const [option] of __VLS_getVForSourceType((__VLS_ctx.currencyOptions))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                key: ((option)),
                ...{ class: ("currency-option") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                type: ("radio"),
                name: ("currency"),
                value: ((option)),
            });
            (__VLS_ctx.localCurrency);
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (option);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-group") },
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
                        if (!((__VLS_ctx.isOpen)))
                            return;
                        __VLS_ctx.togglePaymentMethod(method);
                    } },
                type: ("checkbox"),
                value: ((method)),
                checked: ((__VLS_ctx.localPaymentMethods.includes(method))),
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
            ...{ class: ("modal-actions") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.closeModal) },
            type: ("button"),
            ...{ class: ("cancel-button") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            type: ("submit"),
            ...{ class: ("confirm-button") },
        });
    }
    ['modal-overlay', 'modal-content', 'modal-close-btn', 'edit-form', 'form-group', 'required', 'character-count', 'form-group', 'required', 'form-group', 'required', 'form-group', 'required', 'currency-options', 'currency-option', 'form-group', 'required', 'payment-options', 'payment-option', 'error-message', 'modal-actions', 'cancel-button', 'confirm-button',];
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
            localCharacterNickname: localCharacterNickname,
            localCurrency: localCurrency,
            localPaymentMethods: localPaymentMethods,
            errorMessage: errorMessage,
            paymentOptions: paymentOptions,
            currencyOptions: currencyOptions,
            closeModal: closeModal,
            togglePaymentMethod: togglePaymentMethod,
            handleSubmit: handleSubmit,
        };
    },
    __typeEmits: {},
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
    __typeEmits: {},
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