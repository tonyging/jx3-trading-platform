import { ref, computed } from 'vue';
const props = defineProps();
const emit = defineEmits();
// 選中的支付方式
const selectedPaymentMethod = ref('');
const errorMessage = ref('');
// 處理關閉模態框
const handleClose = () => {
    emit('update:isOpen', false);
    selectedPaymentMethod.value = '';
    errorMessage.value = '';
};
// 處理確認預訂
const handleConfirm = () => {
    if (!selectedPaymentMethod.value) {
        errorMessage.value = '請選擇一種交易方式';
        return;
    }
    emit('confirm', selectedPaymentMethod.value);
};
// 獲取外觀圖片URL
const getAppearanceImageUrl = computed(() => {
    if (!props.trade)
        return undefined;
    const appearance = props.trade.appearanceId;
    if (typeof appearance !== 'object')
        return undefined;
    if (appearance.imageUrl) {
        if (appearance.imageUrl.includes('firebasestorage.googleapis.com')) {
            return appearance.imageUrl;
        }
        return appearance.imageUrl.startsWith('/uploads')
            ? appearance.imageUrl
            : `/uploads${appearance.imageUrl.startsWith('/') ? appearance.imageUrl : '/' + appearance.imageUrl}`;
    }
    return undefined;
});
// 獲取外觀名稱
const getAppearanceName = () => {
    if (!props.trade)
        return '未知外觀';
    if (typeof props.trade.appearanceId === 'object') {
        return props.trade.appearanceId.officialName || '未知外觀';
    }
    return '未知外觀';
};
// 獲取外觀類型
const getAppearanceCategory = () => {
    if (!props.trade)
        return '未知類型';
    if (typeof props.trade.appearanceId === 'object' && props.trade.appearanceId.category) {
        return props.trade.appearanceId.category;
    }
    return '未知類型';
};
// 獲取外觀暱稱
const getAppearanceNicknames = computed(() => {
    if (!props.trade)
        return [];
    const appearance = props.trade.appearanceId;
    if (typeof appearance !== 'object')
        return [];
    if (!appearance.nicknames)
        return [];
    if (Array.isArray(appearance.nicknames))
        return appearance.nicknames;
    return [];
});
// 格式化價格
const formatPrice = (price) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
    }).format(price);
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['name', 'value', 'cancel-button', 'confirm-button', 'payment-options', 'info-row', 'item', 'name', 'nickname', 'category', 'price', 'payment-options', 'modal-content', 'appearance-image-container', 'modal-content', 'payment-option', 'confirm-button',];
    // CSS variable injection 
    // CSS variable injection end 
    if (__VLS_ctx.isOpen && __VLS_ctx.trade) {
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
            ...{ class: ("appearance-card") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("appearance-image-container") },
        });
        if (__VLS_ctx.getAppearanceImageUrl) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                src: ((__VLS_ctx.getAppearanceImageUrl)),
                alt: ("外觀圖片"),
                ...{ class: ("appearance-image") },
            });
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("no-image") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("appearance-info") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("info-row") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("item name") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("value") },
        });
        (__VLS_ctx.getAppearanceName());
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("item nickname") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("nickname-container value") },
        });
        for (const [nickname, index] of __VLS_getVForSourceType((__VLS_ctx.getAppearanceNicknames))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                key: ((index)),
                ...{ class: ("nickname-tag") },
            });
            (nickname);
        }
        if (__VLS_ctx.getAppearanceNicknames.length === 0) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("nickname-tag no-nickname") },
            });
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("item category") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("category-tag value") },
        });
        (__VLS_ctx.getAppearanceCategory());
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("item price") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("label") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("price-tag value") },
        });
        (__VLS_ctx.formatPrice(__VLS_ctx.trade.price));
        (__VLS_ctx.trade.currency);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("payment-selection") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("payment-options") },
        });
        for (const [method] of __VLS_getVForSourceType((__VLS_ctx.trade.paymentMethods))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.isOpen && __VLS_ctx.trade)))
                            return;
                        __VLS_ctx.selectedPaymentMethod = method;
                    } },
                key: ((method)),
                ...{ class: ((['payment-option', { selected: __VLS_ctx.selectedPaymentMethod === method }])) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("payment-icon") },
            });
            if (method === '匯款') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            }
            else if (method === 'Line Pay') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            }
            else if (method === '街口支付') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            }
            else if (method === '支付寶') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            }
            else if (method === '微信') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            }
            else if (method === '8591') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            }
            else if (method === '遊戲幣') {
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            }
            else {
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("payment-name") },
            });
            (method);
        }
        if (__VLS_ctx.errorMessage) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("error-message") },
            });
            (__VLS_ctx.errorMessage);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("warning-message") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("button-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleClose) },
            type: ("button"),
            ...{ class: ("cancel-button") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleConfirm) },
            type: ("button"),
            ...{ class: ("confirm-button") },
        });
    }
    ['modal-overlay', 'modal-content', 'modal-close-btn', 'appearance-card', 'appearance-image-container', 'appearance-image', 'no-image', 'appearance-info', 'info-row', 'item', 'name', 'label', 'value', 'item', 'nickname', 'label', 'nickname-container', 'value', 'nickname-tag', 'nickname-tag', 'no-nickname', 'item', 'category', 'label', 'category-tag', 'value', 'item', 'price', 'label', 'price-tag', 'value', 'payment-selection', 'payment-options', 'selected', 'payment-option', 'payment-icon', 'payment-name', 'error-message', 'warning-message', 'button-group', 'cancel-button', 'confirm-button',];
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
            errorMessage: errorMessage,
            handleClose: handleClose,
            handleConfirm: handleConfirm,
            getAppearanceImageUrl: getAppearanceImageUrl,
            getAppearanceName: getAppearanceName,
            getAppearanceCategory: getAppearanceCategory,
            getAppearanceNicknames: getAppearanceNicknames,
            formatPrice: formatPrice,
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
//# sourceMappingURL=ReserveTradeModal.vue.js.map