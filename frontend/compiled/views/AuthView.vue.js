import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
const router = useRouter();
const userStore = useUserStore();
// 控制顯示登入還是註冊表單
const isLogin = ref(true);
// 表單數據
const loginForm = ref({
    email: '',
    password: '',
});
const registerForm = ref({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
});
// 錯誤訊息
const errorMessage = ref('');
const isSubmitting = ref(false);
// 切換登入/註冊表單
const toggleForm = () => {
    isLogin.value = !isLogin.value;
    errorMessage.value = ''; // 清除錯誤訊息
};
// 處理登入
const handleLogin = async () => {
    if (!loginForm.value.email || !loginForm.value.password) {
        errorMessage.value = '請填寫所有必填欄位';
        return;
    }
    isSubmitting.value = true;
    try {
        await userStore.login(loginForm.value);
        router.push('/');
    }
    catch (error) {
        const apiError = error;
        errorMessage.value =
            apiError.response?.data?.message ||
                apiError.message ||
                '登入失敗，請檢查您的帳號密碼';
        console.error('登入失敗:', error);
    }
    finally {
        isSubmitting.value = false;
    }
};
// 處理註冊
const handleRegister = async () => {
    if (!registerForm.value.name ||
        !registerForm.value.email ||
        !registerForm.value.password ||
        !registerForm.value.confirmPassword) {
        errorMessage.value = '請填寫所有必填欄位';
        return;
    }
    if (registerForm.value.password !== registerForm.value.confirmPassword) {
        errorMessage.value = '兩次輸入的密碼不一致';
        return;
    }
    isSubmitting.value = true;
    try {
        await userStore.register({
            name: registerForm.value.name,
            email: registerForm.value.email,
            password: registerForm.value.password,
        });
        isLogin.value = true; // 註冊成功後切換到登入表單
        errorMessage.value = '註冊成功，請登入';
    }
    catch (error) {
        const apiError = error;
        errorMessage.value =
            apiError.response?.data?.message || apiError.message || '註冊失敗，請稍後再試';
        console.error('註冊失敗:', error);
    }
    finally {
        isSubmitting.value = false;
    }
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("min-h-screen flex items-center justify-center bg-[#1a1a1a] bg-opacity-90 py-12 px-4 sm:px-6 lg:px-8") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("fixed inset-0 -z-10 bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a]") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("w-full max-w-md") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("text-center mb-8") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
        ...{ class: ("text-4xl font-bold text-[#f0d587] mb-2 font-serif") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: ("text-[#9a8866] text-lg") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("bg-[#2a2a2a] bg-opacity-95 p-8 rounded-lg shadow-xl border border-[#9a8866]") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("flex mb-8 border-b border-[#9a8866]") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.toggleForm) },
        ...{ class: (([
                'flex-1 py-2 text-lg font-medium transition-colors duration-200',
                __VLS_ctx.isLogin
                    ? 'text-[#f0d587] border-b-2 border-[#f0d587]'
                    : 'text-[#9a8866] hover:text-[#f0d587]',
            ])) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.toggleForm) },
        ...{ class: (([
                'flex-1 py-2 text-lg font-medium transition-colors duration-200',
                !__VLS_ctx.isLogin
                    ? 'text-[#f0d587] border-b-2 border-[#f0d587]'
                    : 'text-[#9a8866] hover:text-[#f0d587]',
            ])) },
    });
    if (__VLS_ctx.isLogin) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.handleLogin) },
            ...{ class: ("space-y-6") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            type: ("email"),
            required: (true),
            ...{ class: ("w-full px-4 py-3 bg-[#1a1a1a] border border-[#9a8866] rounded-lg text-white placeholder-[#9a8866] focus:outline-none focus:border-[#f0d587] transition-colors") },
            placeholder: ("電子郵件"),
        });
        (__VLS_ctx.loginForm.email);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            type: ("password"),
            required: (true),
            ...{ class: ("w-full px-4 py-3 bg-[#1a1a1a] border border-[#9a8866] rounded-lg text-white placeholder-[#9a8866] focus:outline-none focus:border-[#f0d587] transition-colors") },
            placeholder: ("密碼"),
        });
        (__VLS_ctx.loginForm.password);
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            type: ("submit"),
            disabled: ((__VLS_ctx.isSubmitting)),
            ...{ class: ("w-full py-3 bg-[#9a8866] hover:bg-[#f0d587] text-[#1a1a1a] rounded-lg font-medium transition-colors duration-200 disabled:opacity-50") },
        });
        (__VLS_ctx.isSubmitting ? '登入中...' : '登入');
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.handleRegister) },
            ...{ class: ("space-y-6") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            value: ((__VLS_ctx.registerForm.name)),
            type: ("text"),
            required: (true),
            ...{ class: ("w-full px-4 py-3 bg-[#1a1a1a] border border-[#9a8866] rounded-lg text-white placeholder-[#9a8866] focus:outline-none focus:border-[#f0d587] transition-colors") },
            placeholder: ("使用者名稱"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            type: ("email"),
            required: (true),
            ...{ class: ("w-full px-4 py-3 bg-[#1a1a1a] border border-[#9a8866] rounded-lg text-white placeholder-[#9a8866] focus:outline-none focus:border-[#f0d587] transition-colors") },
            placeholder: ("電子郵件"),
        });
        (__VLS_ctx.registerForm.email);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            type: ("password"),
            required: (true),
            ...{ class: ("w-full px-4 py-3 bg-[#1a1a1a] border border-[#9a8866] rounded-lg text-white placeholder-[#9a8866] focus:outline-none focus:border-[#f0d587] transition-colors") },
            placeholder: ("密碼"),
        });
        (__VLS_ctx.registerForm.password);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            type: ("password"),
            required: (true),
            ...{ class: ("w-full px-4 py-3 bg-[#1a1a1a] border border-[#9a8866] rounded-lg text-white placeholder-[#9a8866] focus:outline-none focus:border-[#f0d587] transition-colors") },
            placeholder: ("確認密碼"),
        });
        (__VLS_ctx.registerForm.confirmPassword);
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            type: ("submit"),
            disabled: ((__VLS_ctx.isSubmitting)),
            ...{ class: ("w-full py-3 bg-[#9a8866] hover:bg-[#f0d587] text-[#1a1a1a] rounded-lg font-medium transition-colors duration-200 disabled:opacity-50") },
        });
        (__VLS_ctx.isSubmitting ? '註冊中...' : '註冊');
    }
    if (__VLS_ctx.errorMessage) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("mt-4 text-red-400 text-center text-sm") },
        });
        (__VLS_ctx.errorMessage);
    }
    ['min-h-screen', 'flex', 'items-center', 'justify-center', 'bg-[#1a1a1a]', 'bg-opacity-90', 'py-12', 'px-4', 'sm:px-6', 'lg:px-8', 'fixed', 'inset-0', '-z-10', 'bg-gradient-to-b', 'from-[#1a1a1a]', 'to-[#2a2a2a]', 'w-full', 'max-w-md', 'text-center', 'mb-8', 'text-4xl', 'font-bold', 'text-[#f0d587]', 'mb-2', 'font-serif', 'text-[#9a8866]', 'text-lg', 'bg-[#2a2a2a]', 'bg-opacity-95', 'p-8', 'rounded-lg', 'shadow-xl', 'border', 'border-[#9a8866]', 'flex', 'mb-8', 'border-b', 'border-[#9a8866]', 'flex-1', 'py-2', 'text-lg', 'font-medium', 'transition-colors', 'duration-200', 'flex-1', 'py-2', 'text-lg', 'font-medium', 'transition-colors', 'duration-200', 'space-y-6', 'w-full', 'px-4', 'py-3', 'bg-[#1a1a1a]', 'border', 'border-[#9a8866]', 'rounded-lg', 'text-white', 'placeholder-[#9a8866]', 'focus:outline-none', 'focus:border-[#f0d587]', 'transition-colors', 'w-full', 'px-4', 'py-3', 'bg-[#1a1a1a]', 'border', 'border-[#9a8866]', 'rounded-lg', 'text-white', 'placeholder-[#9a8866]', 'focus:outline-none', 'focus:border-[#f0d587]', 'transition-colors', 'w-full', 'py-3', 'bg-[#9a8866]', 'hover:bg-[#f0d587]', 'text-[#1a1a1a]', 'rounded-lg', 'font-medium', 'transition-colors', 'duration-200', 'disabled:opacity-50', 'space-y-6', 'w-full', 'px-4', 'py-3', 'bg-[#1a1a1a]', 'border', 'border-[#9a8866]', 'rounded-lg', 'text-white', 'placeholder-[#9a8866]', 'focus:outline-none', 'focus:border-[#f0d587]', 'transition-colors', 'w-full', 'px-4', 'py-3', 'bg-[#1a1a1a]', 'border', 'border-[#9a8866]', 'rounded-lg', 'text-white', 'placeholder-[#9a8866]', 'focus:outline-none', 'focus:border-[#f0d587]', 'transition-colors', 'w-full', 'px-4', 'py-3', 'bg-[#1a1a1a]', 'border', 'border-[#9a8866]', 'rounded-lg', 'text-white', 'placeholder-[#9a8866]', 'focus:outline-none', 'focus:border-[#f0d587]', 'transition-colors', 'w-full', 'px-4', 'py-3', 'bg-[#1a1a1a]', 'border', 'border-[#9a8866]', 'rounded-lg', 'text-white', 'placeholder-[#9a8866]', 'focus:outline-none', 'focus:border-[#f0d587]', 'transition-colors', 'w-full', 'py-3', 'bg-[#9a8866]', 'hover:bg-[#f0d587]', 'text-[#1a1a1a]', 'rounded-lg', 'font-medium', 'transition-colors', 'duration-200', 'disabled:opacity-50', 'mt-4', 'text-red-400', 'text-center', 'text-sm',];
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
            isLogin: isLogin,
            loginForm: loginForm,
            registerForm: registerForm,
            errorMessage: errorMessage,
            isSubmitting: isSubmitting,
            toggleForm: toggleForm,
            handleLogin: handleLogin,
            handleRegister: handleRegister,
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
//# sourceMappingURL=AuthView.vue.js.map