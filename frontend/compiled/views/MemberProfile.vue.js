import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { userService } from '@/services/api/user';
import { auth } from '@/firebase/init';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
// 初始化路由和用戶狀態管理
const router = useRouter();
const route = useRoute();
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
];
// 處理登出功能
const handleLogout = () => {
    userStore.logout();
    router.push('/login');
    showNotification('登出成功', 'success');
};
// 用戶名稱和電子郵件
const userName = ref('');
const userEmail = ref('');
// 聯絡資訊表單
const contactForm = reactive({
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
    countryCode: '+886',
});
// 國家選項
const countryOptions = [
    { code: '+886', name: '台灣', placeholder: '例：0912345678' },
    { code: '+852', name: '香港', placeholder: '例：98765432' },
];
// Discord相關的狀態
const discordState = reactive({
    isLinked: false,
    username: '',
    id: '',
    avatar: '',
    isLinking: false,
    global_name: '',
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
            // 載入手機資訊
            if (response.data.phoneNumber) {
                phoneVerificationState.phoneNumber = response.data.phoneNumber;
                phoneVerificationState.isVerified = !!response.data.isPhoneVerified;
            }
            // 載入Discord資訊
            if (response.data.discordId && response.data.discordUsername) {
                discordState.isLinked = true;
                discordState.id = response.data.discordId;
                discordState.username = response.data.discordUsername;
                discordState.avatar = response.data.discordAvatar || '';
                discordState.global_name = response.data.global_name || '';
            }
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
// 檢查URL參數是否包含Discord相關信息
const checkDiscordCallback = () => {
    // 檢查URL中是否有Discord相關參數
    const discordStatus = route.query.discord;
    if (discordStatus === 'success') {
        showNotification('Discord帳號連結成功', 'success');
        // 清除URL參數
        router.replace({ query: {} });
    }
    else if (discordStatus === 'error') {
        showNotification('Discord帳號連結失敗，請稍後再試', 'error');
        // 清除URL參數
        router.replace({ query: {} });
    }
};
// 獲取Discord授權URL並跳轉
const connectDiscord = async () => {
    try {
        discordState.isLinking = true;
        const response = await userService.getDiscordAuthUrl();
        if (response.url) {
            // 將當前頁面URL儲存到localStorage，以便授權後返回
            localStorage.setItem('discordRedirectUrl', window.location.href);
            // 跳轉到Discord授權頁面
            window.location.href = response.url;
        }
        else {
            throw new Error('獲取Discord授權URL失敗');
        }
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.response?.data?.message || apiError.message || '連接Discord時發生錯誤', 'error');
        console.error('連接Discord時發生錯誤:', error);
    }
    finally {
        discordState.isLinking = false;
    }
};
// 解除Discord綁定
const disconnectDiscord = async () => {
    try {
        const response = await userService.unlinkDiscord();
        if (response.status === 'success') {
            // 重置Discord狀態
            discordState.isLinked = false;
            discordState.username = '';
            discordState.id = '';
            discordState.avatar = '';
            discordState.global_name = '';
            contactForm.discord = '';
            showNotification('已成功解除Discord帳號連結', 'success');
        }
    }
    catch (error) {
        const apiError = error;
        showNotification(apiError.response?.data?.message ||
            apiError.message ||
            '解除Discord連結時發生錯誤', 'error');
        console.error('解除Discord連結時發生錯誤:', error);
    }
};
// 在掛載時載入用戶資訊
onMounted(async () => {
    if (!userStore.isAuthenticated) {
        router.push('/login');
        return;
    }
    // 檢查是否有特定參數來切換到交易安全頁籤
    if (route.query.tab === 'security') {
        currentMenu.value = 'security';
    }
    // 檢查是否有Discord回調信息
    checkDiscordCallback();
    // 載入用戶資訊
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
        // 根據選擇的國家處理手機號碼格式
        let formattedPhoneNumber;
        // 台灣號碼處理
        if (phoneVerificationState.countryCode === '+886') {
            // 移除開頭的 0
            formattedPhoneNumber = phoneVerificationState.phoneNumber.startsWith('0')
                ? `+886${phoneVerificationState.phoneNumber.substring(1)}`
                : `+886${phoneVerificationState.phoneNumber}`;
        }
        // 香港號碼處理
        else if (phoneVerificationState.countryCode === '+852') {
            formattedPhoneNumber = `+852${phoneVerificationState.phoneNumber}`;
        }
        // 其他情況，直接使用輸入的號碼加上國碼
        else {
            formattedPhoneNumber = `${phoneVerificationState.countryCode}${phoneVerificationState.phoneNumber}`;
        }
        console.log('發送驗證碼到:', formattedPhoneNumber);
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
        console.log('開始驗證手機號碼:', {
            phoneNumber: phoneVerificationState.phoneNumber,
            verificationId: phoneVerificationState.verificationId,
        });
        const response = await userService.updatePhoneNumber(phoneVerificationState.phoneNumber, phoneVerificationState.verificationId);
        console.log('手機驗證響應:', response);
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
        const errorMessage = apiError;
        if (errorMessage === '此手機號碼已被其他用戶使用') {
            phoneVerificationState.isCodeSent = false;
            phoneVerificationState.phoneNumber = '';
            phoneVerificationState.verificationCode = '';
            phoneVerificationState.verificationId = '';
            showNotification('此手機號碼已被其他用戶使用，請使用其他號碼', 'error');
        }
        else {
            // 其他錯誤時，保持在驗證碼輸入界面
            showNotification('驗證失敗，請檢查驗證碼是否正確', 'error');
        }
    }
    finally {
        phoneVerificationState.isVerifying = false;
    }
}
watch(currentMenu, (newMenu) => {
    if (newMenu === 'security' && !phoneVerificationState.isVerified) {
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
    ['verification-button', 'resend-button', 'settings-container', 'side-menu', 'menu-item', 'menu-item-icon', 'menu-item-text', 'main-settings-area', 'settings-section', 'user-form', 'form-group', 'discord-info', 'country-select-container', 'country-select', 'menu-item', 'menu-item-icon', 'menu-item-text', 'menu-item-label', 'menu-item-sublabel', 'notification', 'discord-unlink-button', 'discord-button', 'discord-connect', 'save-button', 'logout-button',];
    // CSS variable injection 
    // CSS variable injection end 
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
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleLogout) },
            type: ("button"),
            ...{ class: ("logout-button") },
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
        if (__VLS_ctx.phoneVerificationState.isVerified) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("status verified") },
            });
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("security-item-content") },
        });
        if (!__VLS_ctx.phoneVerificationState.isVerified) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("phone-verification") },
            });
            if (!__VLS_ctx.phoneVerificationState.isCodeSent) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("country-select-container") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    value: ((__VLS_ctx.phoneVerificationState.countryCode)),
                    ...{ class: ("country-select") },
                    disabled: ((__VLS_ctx.phoneVerificationState.isVerifying)),
                });
                for (const [country] of __VLS_getVForSourceType((__VLS_ctx.countryOptions))) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                        key: ((country.code)),
                        value: ((country.code)),
                    });
                    (country.name);
                    (country.code);
                }
                __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
                    type: ("tel"),
                    placeholder: ((__VLS_ctx.countryOptions.find((c) => c.code === __VLS_ctx.phoneVerificationState.countryCode)
                        ?.placeholder)),
                    disabled: ((__VLS_ctx.phoneVerificationState.isVerifying)),
                    ...{ class: ("phone-input") },
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
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            (__VLS_ctx.phoneVerificationState.phoneNumber);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("security-item discord-section") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("security-item-header") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        if (__VLS_ctx.discordState.isLinked) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("status verified") },
            });
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("security-item-content") },
        });
        if (!__VLS_ctx.discordState.isLinked) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("discord-connect") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: ("discord-status") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.connectDiscord) },
                type: ("button"),
                ...{ class: ("discord-connect-button") },
                disabled: ((__VLS_ctx.discordState.isLinking)),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("discord-icon") },
            });
            (__VLS_ctx.discordState.isLinking ? '連結中...' : '連結Discord帳號');
        }
        else {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("discord-info") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("discord-profile-container") },
            });
            if (__VLS_ctx.discordState.avatar) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("discord-avatar") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                    src: ((__VLS_ctx.discordState.avatar)),
                    alt: ("Discord Avatar"),
                });
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("discord-user-details") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("discord-username") },
            });
            (__VLS_ctx.discordState.global_name || __VLS_ctx.discordState.username);
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.disconnectDiscord) },
                type: ("button"),
                ...{ class: ("discord-unlink-button") },
            });
        }
    }
    if (__VLS_ctx.notification.show) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ((['notification', `notification-${__VLS_ctx.notification.type}`])) },
        });
        (__VLS_ctx.notification.message);
    }
    ['settings-container', 'side-menu', 'active', 'menu-item', 'menu-item-icon', 'menu-item-text', 'menu-item-label', 'menu-item-sublabel', 'main-settings-area', 'settings-section', 'user-form', 'form-group', 'save-button', 'logout-button', 'settings-section', 'security-info', 'security-item', 'security-item-header', 'status', 'verified', 'security-item-content', 'verified-email', 'security-item', 'security-item-header', 'status', 'verified', 'security-item-content', 'phone-verification', 'country-select-container', 'country-select', 'phone-input', 'mb-4', 'verification-button', 'verification-code-section', 'verification-input-group', 'verification-code-input', 'verification-actions', 'verification-button', 'verification-button', 'resend-button', 'security-item', 'discord-section', 'security-item-header', 'status', 'verified', 'security-item-content', 'discord-connect', 'discord-status', 'discord-connect-button', 'discord-icon', 'discord-info', 'discord-profile-container', 'discord-avatar', 'discord-user-details', 'discord-username', 'discord-unlink-button', 'notification',];
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
            handleLogout: handleLogout,
            userName: userName,
            userEmail: userEmail,
            notification: notification,
            phoneVerificationState: phoneVerificationState,
            countryOptions: countryOptions,
            discordState: discordState,
            updateUserInfo: updateUserInfo,
            connectDiscord: connectDiscord,
            disconnectDiscord: disconnectDiscord,
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