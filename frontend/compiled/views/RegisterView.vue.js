import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { userService } from '@/services/api/user';
const router = useRouter();
const userStore = useUserStore();
// 定義註冊流程的不同階段
var RegisterStage;
(function (RegisterStage) {
    RegisterStage[RegisterStage["EmailPassword"] = 0] = "EmailPassword";
    RegisterStage[RegisterStage["VerificationCode"] = 1] = "VerificationCode";
    RegisterStage[RegisterStage["UserName"] = 2] = "UserName";
})(RegisterStage || (RegisterStage = {}));
// 使用響應式狀態管理整個註冊過程
const currentStage = ref(RegisterStage.EmailPassword);
const formData = reactive({
    email: '',
    password: '',
    verificationCode: '',
    name: '',
});
const errorMessage = ref('');
const isLoading = ref(false);
// 第一階段 - 郵箱與密碼驗證
const validateEmailPassword = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
        errorMessage.value = '請輸入電子郵件';
        return false;
    }
    if (!emailRegex.test(formData.email)) {
        errorMessage.value = '請輸入有效的電子郵件地址';
        return false;
    }
    if (!formData.password) {
        errorMessage.value = '請輸入密碼';
        return false;
    }
    if (formData.password.length < 8) {
        errorMessage.value = '密碼長度至少需要8個字符';
        return false;
    }
    return true;
};
// 發送驗證碼
const sendVerificationCode = async () => {
    if (!validateEmailPassword())
        return;
    isLoading.value = true;
    errorMessage.value = '';
    try {
        console.log('Attempting to send verification code with:', {
            email: formData.email,
            passwordLength: formData.password.length,
        });
        const response = await userService.sendVerificationCode({
            email: formData.email,
            password: formData.password,
        });
        console.log('Verification code send response:', response);
        currentStage.value = RegisterStage.VerificationCode;
    }
    catch (error) {
        console.log('error', error);
        errorMessage.value = error || '發送驗證碼失敗';
    }
    finally {
        isLoading.value = false;
    }
};
// 驗證碼驗證
const verifyCode = async () => {
    if (!formData.verificationCode) {
        errorMessage.value = '請輸入驗證碼';
        return;
    }
    isLoading.value = true;
    errorMessage.value = '';
    try {
        await userService.verifyCode({
            email: formData.email,
            code: formData.verificationCode,
        });
        currentStage.value = RegisterStage.UserName;
    }
    catch (error) {
        errorMessage.value = error.response?.data?.message || '驗證碼錯誤';
    }
    finally {
        isLoading.value = false;
    }
};
// 完成註冊
const completeRegistration = async () => {
    if (!formData.name) {
        errorMessage.value = '請輸入使用者名稱';
        return;
    }
    isLoading.value = true;
    errorMessage.value = '';
    try {
        const response = await userService.completeRegistration({
            email: formData.email,
            name: formData.name,
        });
        // 自動登入並跳轉到主頁
        await userStore.login({
            email: formData.email,
            password: formData.password,
        });
        router.push('/');
    }
    catch (error) {
        errorMessage.value = error.response?.data?.message || '註冊失敗';
    }
    finally {
        isLoading.value = false;
    }
}; /* PartiallyEnd: #3632/scriptSetup.vue */
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
        ...{ class: ("content-wrapper") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: ("main-content") },
    });
    if (__VLS_ctx.currentStage === __VLS_ctx.RegisterStage.EmailPassword) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    }
    else if (__VLS_ctx.currentStage === __VLS_ctx.RegisterStage.VerificationCode) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    }
    else if (__VLS_ctx.currentStage === __VLS_ctx.RegisterStage.UserName) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    }
    if (__VLS_ctx.currentStage === __VLS_ctx.RegisterStage.EmailPassword) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.sendVerificationCode) },
            ...{ class: ("login-form") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            type: ("email"),
            required: (true),
            placeholder: ("電子郵件地址"),
            ...{ class: (({ error: __VLS_ctx.errorMessage })) },
        });
        (__VLS_ctx.formData.email);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            type: ("password"),
            required: (true),
            placeholder: ("密碼"),
            ...{ class: (({ error: __VLS_ctx.errorMessage })) },
        });
        (__VLS_ctx.formData.password);
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
        (__VLS_ctx.isLoading ? '發送中...' : '繼續');
    }
    else if (__VLS_ctx.currentStage === __VLS_ctx.RegisterStage.VerificationCode) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.verifyCode) },
            ...{ class: ("login-form") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: ("verification-subtitle") },
        });
        (__VLS_ctx.formData.email);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            value: ((__VLS_ctx.formData.verificationCode)),
            type: ("text"),
            required: (true),
            placeholder: ("驗證碼"),
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
        (__VLS_ctx.isLoading ? '驗證中...' : '繼續');
    }
    else if (__VLS_ctx.currentStage === __VLS_ctx.RegisterStage.UserName) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.completeRegistration) },
            ...{ class: ("login-form") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("input-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            value: ((__VLS_ctx.formData.name)),
            type: ("text"),
            required: (true),
            placeholder: ("名稱"),
            ...{ class: (({ error: __VLS_ctx.errorMessage })) },
        });
        if (__VLS_ctx.errorMessage) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("error-text") },
            });
            (__VLS_ctx.errorMessage);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: ("terms-agreement") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            href: ("#"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            type: ("submit"),
            disabled: ((__VLS_ctx.isLoading)),
        });
        (__VLS_ctx.isLoading ? '註冊中...' : '繼續');
    }
    if (__VLS_ctx.currentStage === __VLS_ctx.RegisterStage.EmailPassword) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("register-prompt") },
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
    ['login-page', 'content-wrapper', 'main-content', 'login-form', 'input-group', 'error', 'input-group', 'error', 'error-text', 'login-form', 'verification-subtitle', 'input-group', 'error', 'error-text', 'login-form', 'input-group', 'error', 'error-text', 'terms-agreement', 'register-prompt',];
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
            RegisterStage: RegisterStage,
            currentStage: currentStage,
            formData: formData,
            errorMessage: errorMessage,
            isLoading: isLoading,
            sendVerificationCode: sendVerificationCode,
            verifyCode: verifyCode,
            completeRegistration: completeRegistration,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=RegisterView.vue.js.map