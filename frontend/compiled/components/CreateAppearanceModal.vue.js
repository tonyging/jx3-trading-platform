import { ref, computed } from 'vue';
const __VLS_props = defineProps();
const { isOpen } = __VLS_props;
const emit = defineEmits();
// 表單資料
const formData = ref({
    officialName: '',
    nicknames: [],
    images: {}, // 保留空對象以維持型別一致性
});
// 臨時的單一暱稱輸入
const tempNickname = ref('');
// 圖片上傳相關，暫時註釋但保留代碼以便未來重新啟用
/*
// 圖片上傳參照
const imageInputs = ref<{
  [key: string]: HTMLInputElement | null
}>({
  adultMale: null,
  adultFemale: null,
  childMale: null,
  childFemale: null,
})

// 圖片預覽
const imagePreview = ref<{
  [key: string]: string
}>({})

// 處理圖片上傳
const handleImageUpload = (type: keyof CreateAppearanceData['images']) => {
  const input = imageInputs.value[type]
  if (input && input.files && input.files[0]) {
    const file = input.files[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result as string
      formData.value.images[type] = result
      imagePreview.value[type] = result
    }

    reader.readAsDataURL(file)
  }
}

// 移除圖片
const removeImage = (type: keyof CreateAppearanceData['images']) => {
  delete formData.value.images[type]
  delete imagePreview.value[type]

  // 重置文件輸入
  const input = imageInputs.value[type]
  if (input) {
    input.value = ''
  }
}
*/
// 驗證表單
const isFormValid = computed(() => {
    return formData.value.officialName.trim() !== '';
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
const submitForm = () => {
    if (isFormValid.value) {
        emit('submit', { ...formData.value });
        resetForm();
    }
};
// 重置表單
const resetForm = () => {
    formData.value = {
        officialName: '',
        nicknames: [],
        images: {},
    };
    // 圖片相關重置，暫時註釋
    /*
    imagePreview.value = {}
  
    // 重置所有文件輸入
    Object.values(imageInputs.value).forEach((input) => {
      if (input) input.value = ''
    })
    */
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
            placeholder: ("請輸入外觀的正式名稱"),
        });
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
            placeholder: ("別稱, 例如:一代金,輸入完畢後請按新增"),
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
            ...{ class: ("form-group image-upload-notice") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
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
            disabled: ((!__VLS_ctx.isFormValid)),
        });
    }
    ['appearance-modal-overlay', 'appearance-modal-content', 'modal-close-btn', 'appearance-form', 'form-group', 'required', 'form-group', 'nickname-input-group', 'add-nickname-btn', 'nicknames-list', 'nickname-tag', 'remove-nickname-btn', 'form-group', 'image-upload-notice', 'form-actions', 'cancel-btn', 'submit-btn',];
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
            formData: formData,
            tempNickname: tempNickname,
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