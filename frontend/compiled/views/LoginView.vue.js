import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
// 初始化路由和用戶狀態管理工具
const router = useRouter();
const userStore = useUserStore();
// 定義表單相關的響應式變數
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
// 處理登入表單提交
async function handleLogin() {
    console.log('開始登入流程:', { email: email.value });
    // 驗證表單輸入
    if (!email.value || !password.value) {
        errorMessage.value = '請填寫所有必填欄位';
        return;
    }
    // 設置載入狀態並清除錯誤訊息
    isLoading.value = true;
    errorMessage.value = '';
    try {
        // 方法1：使用 void 斷言告訴編譯器我們知道不使用回傳值
        void (await userStore.login({
            email: email.value,
            password: password.value,
        }));
        localStorage.setItem('shouldReload', 'true');
        router.push('/');
    }
    catch (error) {
        const apiError = error;
        errorMessage.value =
            apiError.response?.data?.message ||
                apiError.message ||
                '登入失敗，請檢查您的帳號密碼';
        // 可選：記錄完整的錯誤信息
        console.error('登入失敗:', error);
    }
    finally {
        isLoading.value = false;
    }
}
// 處理 Google 登入
async function handleGoogleLogin() {
    try {
        isLoading.value = true;
        errorMessage.value = '';
        // 獲取 Google 登入 URL
        const url = await userStore.getGoogleAuthUrl();
        window.location.href = url;
    }
    catch (error) {
        const apiError = error;
        errorMessage.value = apiError.message || '無法啟動 Google 登入';
        // 記錄完整的錯誤信息
        console.error('Google 登入失敗:', error);
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.handleLogin) },
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
    (__VLS_ctx.email);
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("input-group") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
        type: ("password"),
        required: (true),
        placeholder: ("密碼"),
        ...{ class: (({ error: __VLS_ctx.errorMessage })) },
    });
    (__VLS_ctx.password);
    if (__VLS_ctx.errorMessage) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("error-text") },
        });
        (__VLS_ctx.errorMessage);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("forgot-password") },
    });
    const __VLS_0 = {}.RouterLink;
    /** @type { [typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ] } */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        to: ("/forgot-password"),
    }));
    const __VLS_2 = __VLS_1({
        to: ("/forgot-password"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_5.slots.default;
    var __VLS_5;
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: ("submit"),
        disabled: ((__VLS_ctx.isLoading)),
    });
    (__VLS_ctx.isLoading ? '處理中...' : '繼續');
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("register-prompt") },
    });
    const __VLS_6 = {}.RouterLink;
    /** @type { [typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ] } */ ;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
        to: ("/register"),
    }));
    const __VLS_8 = __VLS_7({
        to: ("/register"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    __VLS_11.slots.default;
    var __VLS_11;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("divider") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleGoogleLogin) },
        type: ("button"),
        ...{ class: ("google-login-button") },
        disabled: ((__VLS_ctx.isLoading)),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
        src: ("@/assets/google-icon.svg"),
        alt: ("Google"),
    });
    ['login-page', 'site-header', 'content-wrapper', 'main-content', 'login-form', 'input-group', 'error', 'input-group', 'error', 'error-text', 'forgot-password', 'register-prompt', 'divider', 'google-login-button',];
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
            password: password,
            errorMessage: errorMessage,
            isLoading: isLoading,
            handleLogin: handleLogin,
            handleGoogleLogin: handleGoogleLogin,
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
//# sourceMappingURL=LoginView.vue.js.map