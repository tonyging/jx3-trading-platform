import { ref, computed } from 'vue';
import { appearanceApi } from '@/services/api/appearance';
const __VLS_props = defineProps();
const { isOpen } = __VLS_props;
const emit = defineEmits();
// 分類選項
const categories = [
    '外觀禮盒',
    '上衣',
    '髮型',
    '披風',
    '頭飾',
    '背掛',
    '腰掛',
    '面掛',
    '肩飾',
    '眼飾',
    '手飾',
    '佩囊',
    '小頭像',
    '寵物',
    '掛寵',
    '坐騎',
    '馬具',
    '其他',
];
// 表單資料
const formData = ref({
    officialName: '',
    nicknames: [],
});
// 選擇的分類
const selectedCategory = ref('其他');
// 臨時的單一暱稱輸入
const tempNickname = ref('');
// 提交中狀態
const isSubmitting = ref(false);
// 驗證表單
const isFormValid = computed(() => {
    return formData.value.officialName.trim() !== '' && categories.includes(selectedCategory.value);
});
// 新增暱稱
const addNickname = () => {
    const nickname = tempNickname.value.trim();
    if (nickname && !formData.value.nicknames.includes(nickname)) {
        formData.value.nicknames.push(nickname);
        tempNickname.value = '';
    }
};
// 移除暱稱
const removeNickname = (nickname) => {
    formData.value.nicknames = formData.value.nicknames.filter((n) => n !== nickname);
};
// 提交表單
const submitForm = async () => {
    if (isFormValid.value && !isSubmitting.value) {
        isSubmitting.value = true;
        try {
            await appearanceApi.submitAppearance({
                officialName: formData.value.officialName,
                nicknames: formData.value.nicknames,
                category: selectedCategory.value,
            });
            // 重置表單並關閉
            resetForm();
            // 通知父組件提交成功，讓父組件刷新數據
            emit('submit');
            // 關閉模態窗
            emit('close');
        }
        catch (error) {
            // 錯誤處理
            console.error('提交外觀失敗', error);
            alert('提交外觀失敗，請稍後再試。');
        }
        finally {
            isSubmitting.value = false;
        }
    }
};
// 重置表單
const resetForm = () => {
    formData.value = {
        officialName: '',
        nicknames: [],
    };
    selectedCategory.value = '其他';
    tempNickname.value = '';
};
// 關閉模態窗
const closeModal = () => {
    resetForm();
    emit('close');
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    if (isOpen) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (__VLS_ctx.closeModal) },
            ...{ class: ("appearance-modal-overlay") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("appearance-modal-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.closeModal) },
            ...{ class: ("modal-close-btn") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.submitForm) },
            ...{ class: ("appearance-form") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: ("officialName"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("required") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            id: ("officialName"),
            value: ((__VLS_ctx.formData.officialName)),
            type: ("text"),
            required: (true),
            placeholder: ("請輸入遊戲內的正式名稱"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("required") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("category-grid") },
        });
        for (const [category] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!((isOpen)))
                            return;
                        __VLS_ctx.selectedCategory = category;
                    } },
                key: ((category)),
                type: ("button"),
                ...{ class: ("category-btn") },
                ...{ class: (({ selected: __VLS_ctx.selectedCategory === category })) },
            });
            (category);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("nickname-input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            ...{ onKeyup: (__VLS_ctx.addNickname) },
            value: ((__VLS_ctx.tempNickname)),
            type: ("text"),
            placeholder: ("選填, 例如:一代金,輸入完畢後請按新增"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.addNickname) },
            type: ("button"),
            ...{ class: ("add-nickname-btn") },
        });
        if (__VLS_ctx.formData.nicknames.length) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("nicknames-list") },
            });
            for (const [nickname] of __VLS_getVForSourceType((__VLS_ctx.formData.nicknames))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    key: ((nickname)),
                    ...{ class: ("nickname-tag") },
                });
                (nickname);
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!((isOpen)))
                                return;
                            if (!((__VLS_ctx.formData.nicknames.length)))
                                return;
                            __VLS_ctx.removeNickname(nickname);
                        } },
                    type: ("button"),
                    ...{ class: ("remove-nickname-btn") },
                });
            }
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-actions") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.closeModal) },
            type: ("button"),
            ...{ class: ("cancel-btn") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            type: ("submit"),
            ...{ class: ("submit-btn") },
            disabled: ((!__VLS_ctx.isFormValid || __VLS_ctx.isSubmitting)),
        });
        (__VLS_ctx.isSubmitting ? '提交中...' : '提交');
    }
    ['appearance-modal-overlay', 'appearance-modal-content', 'modal-close-btn', 'appearance-form', 'form-group', 'required', 'form-group', 'required', 'category-grid', 'category-btn', 'selected', 'form-group', 'nickname-input-group', 'add-nickname-btn', 'nicknames-list', 'nickname-tag', 'remove-nickname-btn', 'form-actions', 'cancel-btn', 'submit-btn',];
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
            categories: categories,
            formData: formData,
            selectedCategory: selectedCategory,
            tempNickname: tempNickname,
            isSubmitting: isSubmitting,
            isFormValid: isFormValid,
            addNickname: addNickname,
            removeNickname: removeNickname,
            submitForm: submitForm,
            closeModal: closeModal,
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
//# sourceMappingURL=CreateAppearanceModal.vue.js.map