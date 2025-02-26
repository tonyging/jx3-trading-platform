import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { userService } from '@/services/api/user';
import { auth } from '@/firebase/init';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
// 初始化路由和用戶狀態管理
const router = useRouter();
const userStore = useUserStore();
// 當前選中的菜單項目
const currentMenu = ref('general');
// 使用介面來定義選單項目
const menuItems = [
    {
        id: 'general',
        icon: '👤',
        label: '一般',
    },
    {
        id: 'security',
        icon: '🔒',
        label: '交易安全',
    },
    {
        id: 'account-links',
        icon: '🔗',
        label: '帳號連結',
    },
];
// 用戶名稱和電子郵件
const userName = ref('');
const userEmail = ref('');
// 聯絡資訊表單
const contactForm = reactive({
    line: '',
    facebook: '',
    discord: '',
    phone: '',
});
// 通知相關的響應式狀態
const notification = ref({
    show: false,
    message: '',
    type: 'success',
});
// 手機驗證相關的狀態
const phoneVerificationState = reactive({
    phoneNumber: '',
    verificationCode: '',
    verificationId: '',
    isVerifying: false,
    isCodeSent: false,
    isVerified: false,
});
// 顯示通知的方法
const showNotification = (message, type = 'success') => {
    notification.value = {
        show: true,
        message,
        type,
    };
    setTimeout(() => {
        notification.value.show = false;
    }, 3000);
};
// 載入用戶資訊
const loadUserInfo = async () => {
    try {
        const response = await userService.getProfile();
        if (response.status === 'success' && response.data) {
            userName.value = response.data.name;
            userEmail.value = response.data.email;
        }
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.response?.data?.message || apiError.message || '載入用戶資訊失敗', 'error');
        console.error('載入用戶資訊失敗:', error);
    }
};
// 更新用戶資訊
const updateUserInfo = async () => {
    try {
        if (!userName.value.trim()) {
            showNotification('會員名稱不能為空', 'error');
            return;
        }
        const updateData = {
            name: userName.value.trim(),
        };
        const response = await userService.updateProfile(updateData);
        if (response.status === 'success') {
            await userStore.fetchCurrentUser();
            showNotification('會員資料更新成功');
        }
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.response?.data?.message || apiError.message || '更新會員資料失敗', 'error');
        console.error('更新會員資料失敗:', error);
    }
};
// 在掛載時載入用戶資訊
onMounted(async () => {
    if (!userStore.isAuthenticated) {
        router.push('/login');
        return;
    }
    await loadUserInfo();
});
// 發送手機驗證碼
async function handleSendVerification() {
    if (!phoneVerificationState.phoneNumber) {
        showNotification('請輸入手機號碼', 'error');
        return;
    }
    try {
        phoneVerificationState.isVerifying = true;
        // 檢查 reCAPTCHA 是否初始化
        if (!window.recaptchaVerifier) {
            showNotification('reCAPTCHA 未正確初始化', 'error');
            return;
        }
        const formattedPhoneNumber = phoneVerificationState.phoneNumber.startsWith('+')
            ? phoneVerificationState.phoneNumber
            : `+886${phoneVerificationState.phoneNumber.replace(/^0/, '')}`;
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, window.recaptchaVerifier);
        phoneVerificationState.verificationId = confirmationResult.verificationId;
        phoneVerificationState.isCodeSent = true;
        showNotification('驗證碼已發送到您的手機', 'success');
    }
    catch (error) {
        const apiError = error;
        console.error('發送驗證碼錯誤:', error);
        showNotification(apiError.message || '發送驗證碼失敗，請檢查網絡連接', 'error');
        // 重置 reCAPTCHA
        try {
            if (window.recaptchaVerifier?.reset) {
                await window.recaptchaVerifier.reset();
            }
        }
        catch (resetError) {
            console.error('重置 reCAPTCHA 時出錯:', resetError);
        }
    }
    finally {
        phoneVerificationState.isVerifying = false;
    }
}
// 驗證手機驗證碼
async function handleVerifyCode() {
    if (!phoneVerificationState.verificationCode) {
        showNotification('請輸入驗證碼', 'error');
        return;
    }
    try {
        phoneVerificationState.isVerifying = true;
        const response = await userService.updatePhoneNumber(phoneVerificationState.phoneNumber, phoneVerificationState.verificationId);
        if (response.status === 'success') {
            phoneVerificationState.isVerified = true;
            showNotification('手機號碼驗證成功！', 'success');
        }
        else {
            throw new Error(response.message || '驗證失敗');
        }
    }
    catch (error) {
        const apiError = error;
        console.error('驗證碼驗證錯誤:', error);
        showNotification(apiError.message || '驗證失敗，請檢查驗證碼是否正確', 'error');
    }
    finally {
        phoneVerificationState.isVerifying = false;
    }
}
watch(currentMenu, (newMenu) => {
    if (newMenu === 'security') {
        nextTick(() => {
            const recaptchaContainer = document.getElementById('recaptcha-container');
            if (!recaptchaContainer) {
                showNotification('reCAPTCHA 容器未找到', 'error');
                return;
            }
            try {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: () => { },
                    'expired-callback': () => {
                        if (window.recaptchaVerifier?.reset) {
                            window.recaptchaVerifier.reset();
                        }
                    },
                });
                window.recaptchaVerifier.render();
            }
            catch (error) {
                // 記錄完整的錯誤訊息
                console.error('reCAPTCHA 初始化錯誤:', error);
                // 顯示友好的錯誤通知
                const errorMessage = error instanceof Error ? error.message : 'reCAPTCHA 初始化失敗';
                showNotification(errorMessage, 'error');
            }
        });
    }
}); /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['verification-button', 'resend-button', 'settings-container', 'side-menu', 'menu-item', 'menu-item-icon', 'menu-item-text', 'site-header', 'content-wrapper', 'main-content', 'settings-content', 'main-settings-area', 'settings-section', 'user-form', 'form-group', 'menu-item', 'menu-item-icon', 'menu-item-text', 'menu-item-label', 'menu-item-sublabel', 'notification',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("platform-base") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("site-header") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("content-wrapper") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: ("main-content settings-content") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("settings-container") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("side-menu") },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.menuItems))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.currentMenu = item.id;
                } },
            key: ((item.id)),
            ...{ class: ((['menu-item', { active: __VLS_ctx.currentMenu === item.id }])) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("menu-item-icon") },
        });
        (item.icon);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("menu-item-text") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("menu-item-label") },
        });
        (item.label);
        if (item.subLabel) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("menu-item-sublabel") },
            });
            (item.subLabel);
        }
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("main-settings-area") },
    });
    if (__VLS_ctx.currentMenu === 'general') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("settings-section") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.updateUserInfo) },
            ...{ class: ("user-form") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            value: ((__VLS_ctx.userName)),
            type: ("text"),
            placeholder: ("請輸入會員名稱"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            type: ("submit"),
            ...{ class: ("save-button") },
        });
    }
    else if (__VLS_ctx.currentMenu === 'security') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("settings-section") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("security-info") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("security-item") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("security-item-header") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("status verified") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("security-item-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: ("verified-email") },
        });
        (__VLS_ctx.userEmail);
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("security-item") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("security-item-header") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("security-item-content") },
        });
        if (!__VLS_ctx.phoneVerificationState.isVerified) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("phone-verification") },
            });
            if (!__VLS_ctx.phoneVerificationState.isCodeSent) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                    type: ("tel"),
                    placeholder: ("請輸入手機號碼"),
                    disabled: ((__VLS_ctx.phoneVerificationState.isVerifying)),
                });
                (__VLS_ctx.phoneVerificationState.phoneNumber);
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    id: ("recaptcha-container"),
                    ...{ class: ("mb-4") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.handleSendVerification) },
                    type: ("button"),
                    ...{ class: ("verification-button") },
                    disabled: ((__VLS_ctx.phoneVerificationState.isVerifying)),
                });
                (__VLS_ctx.phoneVerificationState.isVerifying ? '發送中...' : '發送驗證碼');
            }
            else {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("verification-code-section") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("verification-input-group") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                    value: ((__VLS_ctx.phoneVerificationState.verificationCode)),
                    type: ("text"),
                    placeholder: ("請輸入驗證碼"),
                    disabled: ((__VLS_ctx.phoneVerificationState.isVerifying)),
                    ...{ class: ("verification-code-input") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("verification-actions") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.handleVerifyCode) },
                    type: ("button"),
                    ...{ class: ("verification-button") },
                    disabled: ((__VLS_ctx.phoneVerificationState.isVerifying)),
                });
                (__VLS_ctx.phoneVerificationState.isVerifying ? '驗證中...' : '驗證');
                __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (() => {
                            __VLS_ctx.phoneVerificationState.isCodeSent = false;
                        }) },
                    type: ("button"),
                    ...{ class: ("verification-button resend-button") },
                    disabled: ((__VLS_ctx.phoneVerificationState.isVerifying)),
                });
            }
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("verified-status") },
            });
            (__VLS_ctx.phoneVerificationState.phoneNumber);
        }
    }
    else if (__VLS_ctx.currentMenu === 'account-links') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("settings-section") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
            ...{ onSubmit: (__VLS_ctx.updateUserInfo) },
            ...{ class: ("user-form") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            value: ((__VLS_ctx.contactForm.line)),
            type: ("text"),
            placeholder: ("請輸入 Line ID"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            value: ((__VLS_ctx.contactForm.facebook)),
            type: ("text"),
            placeholder: ("請輸入 Facebook 連結"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("form-group") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            value: ((__VLS_ctx.contactForm.discord)),
            type: ("text"),
            placeholder: ("請輸入 Discord ID"),
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            type: ("submit"),
            ...{ class: ("save-button") },
        });
    }
    if (__VLS_ctx.notification.show) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ((['notification', `notification-${__VLS_ctx.notification.type}`])) },
        });
        (__VLS_ctx.notification.message);
    }
    ['platform-base', 'site-header', 'content-wrapper', 'main-content', 'settings-content', 'settings-container', 'side-menu', 'active', 'menu-item', 'menu-item-icon', 'menu-item-text', 'menu-item-label', 'menu-item-sublabel', 'main-settings-area', 'settings-section', 'user-form', 'form-group', 'save-button', 'settings-section', 'security-info', 'security-item', 'security-item-header', 'status', 'verified', 'security-item-content', 'verified-email', 'security-item', 'security-item-header', 'security-item-content', 'phone-verification', 'mb-4', 'verification-button', 'verification-code-section', 'verification-input-group', 'verification-code-input', 'verification-actions', 'verification-button', 'verification-button', 'resend-button', 'verified-status', 'settings-section', 'user-form', 'form-group', 'form-group', 'form-group', 'save-button', 'notification',];
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
            currentMenu: currentMenu,
            menuItems: menuItems,
            userName: userName,
            userEmail: userEmail,
            contactForm: contactForm,
            notification: notification,
            phoneVerificationState: phoneVerificationState,
            updateUserInfo: updateUserInfo,
            handleSendVerification: handleSendVerification,
            handleVerifyCode: handleVerifyCode,
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
//# sourceMappingURL=MemberProfile.vue.js.map