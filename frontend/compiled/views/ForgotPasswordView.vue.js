import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
const router = useRouter();
const userStore = useUserStore();
// 定義表單相關的響應式變數
const email = ref('');
const verificationCode = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
// 定義當前步驟
const currentStep = ref(1); // 1: 輸入信箱, 2: 輸入驗證碼, 3: 重設密碼
// 檢查密碼是否匹配
const passwordsMatch = computed(() => {
    return newPassword.value === confirmPassword.value;
});
// 處理發送驗證碼
async function handleSendVerification() {
    if (!email.value) {
        errorMessage.value = '請輸入電子郵件地址';
        return;
    }
    try {
        isLoading.value = true;
        errorMessage.value = '';
        successMessage.value = '';
        console.log('準備發送驗證碼到:', email.value);
        const response = await userStore.sendPasswordResetCode({
            email: email.value,
        });
        console.log('發送驗證碼回應:', response);
        // 檢查回應是否成功
        if (response?.status === 'success') {
            successMessage.value = response.message || '驗證碼已發送到您的信箱';
            currentStep.value = 2;
        }
        else {
            errorMessage.value = response?.message || '發送驗證碼失敗，請稍後再試';
        }
    }
    catch (error) {
        console.error('發送驗證碼時發生錯誤:', error);
        // 確保顯示完整的錯誤訊息
        if (error.response?.data?.message) {
            errorMessage.value = error.response.data.message;
        }
        else if (error.message) {
            errorMessage.value = error.message;
        }
        else {
            errorMessage.value = '發送驗證碼失敗，請稍後再試';
        }
    }
    finally {
        isLoading.value = false;
    }
}
// 處理驗證碼確認
async function handleVerifyCode() {
    if (!verificationCode.value) {
        errorMessage.value = '請輸入驗證碼';
        return;
    }
    try {
        isLoading.value = true;
        errorMessage.value = '';
        successMessage.value = '';
        console.log('準備驗證驗證碼:', { email: email.value, code: verificationCode.value });
        const response = await userStore.verifyPasswordResetCode({
            email: email.value,
            code: verificationCode.value,
        });
        console.log('驗證碼驗證回應:', response);
        if (response?.status === 'success') {
            currentStep.value = 3;
        }
        else {
            errorMessage.value = response?.message || '驗證碼錯誤，請重新輸入';
        }
    }
    catch (error) {
        console.error('驗證碼驗證時發生錯誤:', error);
        errorMessage.value = error.response?.data?.message || error.message || '驗證碼錯誤，請重新輸入';
    }
    finally {
        isLoading.value = false;
    }
}
// 處理密碼重設
async function handleResetPassword() {
    if (!newPassword.value || !confirmPassword.value) {
        errorMessage.value = '請填寫所有必填欄位';
        return;
    }
    if (!passwordsMatch.value) {
        errorMessage.value = '兩次輸入的密碼不一致';
        return;
    }
    if (newPassword.value.length < 8) {
        errorMessage.value = '密碼長度至少需要 8 個字元';
        return;
    }
    try {
        isLoading.value = true;
        errorMessage.value = '';
        successMessage.value = '';
        console.log('準備重設密碼:', { email: email.value });
        const response = await userStore.resetPassword({
            email: email.value,
            code: verificationCode.value,
            newPassword: newPassword.value,
        });
        console.log('重設密碼回應:', response);
        if (response?.status === 'success') {
            successMessage.value = response.message || '密碼重設成功！';
            // 只有在完全成功時才跳轉
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        }
        else {
            errorMessage.value = response?.message || '重設密碼失敗，請稍後再試';
        }
    }
    catch (error) {
        console.error('重設密碼時發生錯誤:', error);
        errorMessage.value =
            error.response?.data?.message || error.message || '重設密碼失敗，請稍後再試';
    }
    finally {
        isLoading.value = false;
    }
}
; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("login-page") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("site-header") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("content-wrapper") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: ("main-content") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    if (__VLS_ctx.currentStep === 1) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.handleSendVerification) },
            ...{ class: ("login-form") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            type: ("email"),
            required: (true),
            placeholder: ("請輸入您的電子郵件地址"),
            ...{ class: (({ error: __VLS_ctx.errorMessage })) },
        });
        (__VLS_ctx.email);
        if (__VLS_ctx.errorMessage) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("error-text") },
            });
            (__VLS_ctx.errorMessage);
        }
        if (__VLS_ctx.successMessage) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("success-text") },
            });
            (__VLS_ctx.successMessage);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            type: ("submit"),
            disabled: ((__VLS_ctx.isLoading)),
        });
        (__VLS_ctx.isLoading ? '處理中...' : '發送驗證碼');
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("back-to-login") },
        });
        const __VLS_0 = {}.RouterLink;
        /** @type { [typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ] } */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            to: ("/login"),
        }));
        const __VLS_2 = __VLS_1({
            to: ("/login"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        __VLS_5.slots.default;
        var __VLS_5;
    }
    if (__VLS_ctx.currentStep === 2) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.handleVerifyCode) },
            ...{ class: ("login-form") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("verification-message") },
        });
        (__VLS_ctx.email);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (__VLS_ctx.handleSendVerification) },
            ...{ class: ("resend-link") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            value: ((__VLS_ctx.verificationCode)),
            type: ("text"),
            required: (true),
            placeholder: ("請輸入驗證碼"),
            ...{ class: (({ error: __VLS_ctx.errorMessage })) },
        });
        if (__VLS_ctx.errorMessage) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("error-text") },
            });
            (__VLS_ctx.errorMessage);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            type: ("submit"),
            disabled: ((__VLS_ctx.isLoading)),
        });
        (__VLS_ctx.isLoading ? '驗證中...' : '驗證');
    }
    if (__VLS_ctx.currentStep === 3) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.handleResetPassword) },
            ...{ class: ("login-form") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            type: ("password"),
            required: (true),
            placeholder: ("請輸入新密碼"),
            ...{ class: (({ error: __VLS_ctx.errorMessage })) },
        });
        (__VLS_ctx.newPassword);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            type: ("password"),
            required: (true),
            placeholder: ("請再次輸入新密碼"),
            ...{ class: (({ error: __VLS_ctx.errorMessage })) },
        });
        (__VLS_ctx.confirmPassword);
        if (__VLS_ctx.errorMessage) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("error-text") },
            });
            (__VLS_ctx.errorMessage);
        }
        if (__VLS_ctx.successMessage) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("success-text") },
            });
            (__VLS_ctx.successMessage);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            type: ("submit"),
            disabled: ((__VLS_ctx.isLoading)),
        });
        (__VLS_ctx.isLoading ? '處理中...' : '重設密碼');
    }
    ['login-page', 'site-header', 'content-wrapper', 'main-content', 'login-form', 'input-group', 'error', 'error-text', 'success-text', 'back-to-login', 'login-form', 'verification-message', 'resend-link', 'input-group', 'error', 'error-text', 'login-form', 'input-group', 'error', 'input-group', 'error', 'error-text', 'success-text',];
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
            email: email,
            verificationCode: verificationCode,
            newPassword: newPassword,
            confirmPassword: confirmPassword,
            errorMessage: errorMessage,
            successMessage: successMessage,
            isLoading: isLoading,
            currentStep: currentStep,
            handleSendVerification: handleSendVerification,
            handleVerifyCode: handleVerifyCode,
            handleResetPassword: handleResetPassword,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=ForgotPasswordView.vue.js.map