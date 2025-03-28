import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { appearanceApi } from '@/services/api/appearance';
const router = useRouter();
const props = defineProps();
const emit = defineEmits();
// 表單資料
const appearanceId = ref('');
const price = ref('');
const characterNickname = ref('');
const currency = ref('台幣');
const errorMessage = ref('');
const isSubmitting = ref(false);
const appearances = ref([]);
const isLoadingAppearances = ref(false);
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
// 可用的幣別選項
const currencyOptions = ['台幣', '人民幣', '港幣', '遊戲幣'];
// 選擇的支付方式
const selectedPaymentMethods = ref(['匯款']);
// 是否為遊戲幣模式（用於控制交易方式的鎖定）
const isGameCurrencyMode = computed(() => currency.value === '遊戲幣');
// 判斷某個支付方式是否應該被禁用
const isPaymentMethodDisabled = (method) => {
    if (isGameCurrencyMode.value) {
        return true; // 遊戲幣模式下所有支付方式都禁用
    }
    // 非遊戲幣模式下，只有「遊戲幣」支付方式被禁用
    return method === '遊戲幣';
};
// 切換支付方式選擇
const togglePaymentMethod = (method) => {
    // 如果是遊戲幣模式，不允許更改任何交易方式
    if (isGameCurrencyMode.value) {
        return;
    }
    // 非遊戲幣模式下，不允許選擇「遊戲幣」支付方式
    if (method === '遊戲幣' && !isGameCurrencyMode.value) {
        return;
    }
    const index = selectedPaymentMethods.value.indexOf(method);
    if (index === -1) {
        // 如果未選中，則添加
        selectedPaymentMethods.value.push(method);
    }
    else {
        // 如果只有一種支付方式，不允許移除
        if (selectedPaymentMethods.value.length === 1) {
            return;
        }
        // 移除方法
        selectedPaymentMethods.value.splice(index, 1);
    }
};
// 關閉 Modal
const handleClose = () => {
    emit('update:isOpen', false);
    // 重置表單
    appearanceId.value = '';
    price.value = '';
    characterNickname.value = '';
    currency.value = '台幣';
    selectedPaymentMethods.value = ['匯款'];
    errorMessage.value = '';
};
// 載入外觀資料
const loadAppearances = async () => {
    try {
        isLoadingAppearances.value = true;
        const response = await appearanceApi.getAllAppearances();
        appearances.value = response.data.appearances;
    }
    catch (error) {
        console.error('載入外觀資料失敗:', error);
        errorMessage.value = '載入外觀資料失敗，請稍後再試';
    }
    finally {
        isLoadingAppearances.value = false;
    }
};
// 驗證和提交表單
const handleSubmit = async () => {
    // 清除錯誤訊息
    errorMessage.value = '';
    // 基本驗證
    if (!appearanceId.value || !price.value || !characterNickname.value) {
        errorMessage.value = '請填寫所有必填欄位';
        return;
    }
    // 角色暱稱長度驗證
    if (characterNickname.value.length > 10) {
        errorMessage.value = '角色暱稱不能超過10個字元';
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
            appearanceId: appearanceId.value,
            price: priceNum,
            characterNickname: characterNickname.value.trim(),
            paymentMethods: selectedPaymentMethods.value,
            currency: currency.value,
        });
    }
    finally {
        isSubmitting.value = false;
    }
};
// 當模態框開啟時載入外觀資料
onMounted(async () => {
    if (props.isOpen) {
        await loadAppearances();
    }
});
watch(() => props.isOpen, async (isOpen) => {
    if (isOpen) {
        await loadAppearances();
    }
});
// 監聽外觀選擇變化，跳轉到外觀提交頁面
watch(() => appearanceId.value, (newValue) => {
    if (newValue === 'new_appearance') {
        // 關閉當前模態框
        emit('update:isOpen', false);
        // 導向外觀提交頁面
        router.push('/appearance/library?tab=pending');
        // 重置 appearanceId
        nextTick(() => {
            appearanceId.value = '';
        });
    }
});
// 監聽幣別變化
watch(() => currency.value, (newCurrency) => {
    if (newCurrency === '遊戲幣') {
        // 如果幣別是遊戲幣，則只能使用遊戲幣支付方式
        selectedPaymentMethods.value = ['遊戲幣'];
    }
    else {
        // 如果幣別不是遊戲幣，則移除「遊戲幣」支付方式選項
        selectedPaymentMethods.value = selectedPaymentMethods.value.filter((method) => method !== '遊戲幣');
        // 如果移除後沒有任何支付方式，則預設選擇「匯款」
        if (selectedPaymentMethods.value.length === 0) {
            selectedPaymentMethods.value = ['匯款'];
        }
    }
}); /* PartiallyEnd: #3632/scriptSetup.vue */
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
            for: ("appearanceSelect"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("required") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            value: ((__VLS_ctx.appearanceId)),
            ...{ class: ("appearance-select") },
            required: (true),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            value: (""),
            disabled: (true),
        });
        for (const [appearance] of __VLS_getVForSourceType((__VLS_ctx.appearances))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: ((appearance._id)),
                value: ((appearance._id)),
            });
            (appearance.officialName);
            (appearance.category);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            value: ("new_appearance"),
            ...{ class: ("new-appearance-option") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: ("characterNickname"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("required") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            id: ("characterNickname"),
            value: ((__VLS_ctx.characterNickname)),
            type: ("text"),
            required: (true),
            placeholder: ("請輸入您在遊戲中的角色暱稱"),
            maxlength: ("10"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("character-count") },
        });
        (__VLS_ctx.characterNickname.length);
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
                ...{ class: ((['payment-option', { disabled: __VLS_ctx.isPaymentMethodDisabled(method) }])) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                ...{ onChange: (...[$event]) => {
                        if (!((props.isOpen)))
                            return;
                        __VLS_ctx.togglePaymentMethod(method);
                    } },
                type: ("checkbox"),
                value: ((method)),
                checked: ((__VLS_ctx.selectedPaymentMethods.includes(method))),
                disabled: ((__VLS_ctx.isPaymentMethodDisabled(method) ||
                    (__VLS_ctx.selectedPaymentMethods.length === 1 && __VLS_ctx.selectedPaymentMethods[0] === method))),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (method);
        }
        if (__VLS_ctx.isGameCurrencyMode) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("locked-mode-hint") },
            });
        }
        else if (!__VLS_ctx.isGameCurrencyMode) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("locked-mode-hint game-coin-disabled-hint") },
            });
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
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
            (__VLS_ctx.currency);
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (option);
        }
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
    ['modal-overlay', 'modal-content', 'modal-close-btn', 'create-form', 'input-group', 'required', 'appearance-select', 'new-appearance-option', 'input-group', 'required', 'character-count', 'input-group', 'required', 'payment-options', 'disabled', 'payment-option', 'locked-mode-hint', 'locked-mode-hint', 'game-coin-disabled-hint', 'input-group', 'required', 'currency-options', 'currency-option', 'input-group', 'required', 'error-message', 'button-group', 'cancel-button', 'submit-button',];
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
            appearanceId: appearanceId,
            price: price,
            characterNickname: characterNickname,
            currency: currency,
            errorMessage: errorMessage,
            isSubmitting: isSubmitting,
            appearances: appearances,
            paymentOptions: paymentOptions,
            currencyOptions: currencyOptions,
            selectedPaymentMethods: selectedPaymentMethods,
            isGameCurrencyMode: isGameCurrencyMode,
            isPaymentMethodDisabled: isPaymentMethodDisabled,
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
//# sourceMappingURL=CreateAppearanceTradeModal.vue.js.map