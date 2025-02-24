import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
const userStore = useUserStore();
// 用於存儲用戶資料的響應式變數
const username = ref('');
const email = ref('');
const isEditing = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
// 當元件載入時，從 store 中獲取用戶資料
onMounted(() => {
    if (userStore.currentUser) {
        username.value = userStore.currentUser.username;
        email.value = userStore.currentUser.email;
    }
});
// 處理資料更新
const handleUpdateProfile = async () => {
    try {
        // 這裡之後會加入更新用戶資料的邏輯
        isEditing.value = false;
        successMessage.value = '個人資料更新成功';
    }
    catch (error) {
        errorMessage.value = '更新失敗，請稍後再試';
    }
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("min-h-screen bg-gray-50 py-8") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("max-w-3xl mx-auto px-4 sm:px-6 lg:px-8") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("bg-white shadow rounded-lg p-6") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("mb-8") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
        ...{ class: ("text-2xl font-bold text-gray-900") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: ("mt-1 text-sm text-gray-600") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("space-y-6") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: ("block text-sm font-medium text-gray-700") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("mt-1") },
    });
    if (__VLS_ctx.isEditing) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.input)({
            value: ((__VLS_ctx.username)),
            type: ("text"),
            ...{ class: ("shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md") },
        });
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: ("py-2") },
        });
        (__VLS_ctx.username);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: ("block text-sm font-medium text-gray-700") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: ("py-2") },
    });
    (__VLS_ctx.email);
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("flex justify-end space-x-3") },
    });
    if (!__VLS_ctx.isEditing) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!((!__VLS_ctx.isEditing)))
                        return;
                    __VLS_ctx.isEditing = true;
                } },
            ...{ class: ("px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500") },
        });
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!((!__VLS_ctx.isEditing))))
                        return;
                    __VLS_ctx.isEditing = false;
                } },
            ...{ class: ("px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleUpdateProfile) },
            ...{ class: ("px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500") },
        });
    }
    if (__VLS_ctx.errorMessage) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("mt-4 text-sm text-red-600") },
        });
        (__VLS_ctx.errorMessage);
    }
    if (__VLS_ctx.successMessage) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("mt-4 text-sm text-green-600") },
        });
        (__VLS_ctx.successMessage);
    }
    ['min-h-screen', 'bg-gray-50', 'py-8', 'max-w-3xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'bg-white', 'shadow', 'rounded-lg', 'p-6', 'mb-8', 'text-2xl', 'font-bold', 'text-gray-900', 'mt-1', 'text-sm', 'text-gray-600', 'space-y-6', 'block', 'text-sm', 'font-medium', 'text-gray-700', 'mt-1', 'shadow-sm', 'focus:ring-indigo-500', 'focus:border-indigo-500', 'block', 'w-full', 'sm:text-sm', 'border-gray-300', 'rounded-md', 'py-2', 'block', 'text-sm', 'font-medium', 'text-gray-700', 'py-2', 'flex', 'justify-end', 'space-x-3', 'px-4', 'py-2', 'border', 'border-gray-300', 'rounded-md', 'shadow-sm', 'text-sm', 'font-medium', 'text-gray-700', 'bg-white', 'hover:bg-gray-50', 'focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'focus:ring-indigo-500', 'px-4', 'py-2', 'border', 'border-gray-300', 'rounded-md', 'shadow-sm', 'text-sm', 'font-medium', 'text-gray-700', 'bg-white', 'hover:bg-gray-50', 'focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'focus:ring-indigo-500', 'px-4', 'py-2', 'border', 'border-transparent', 'rounded-md', 'shadow-sm', 'text-sm', 'font-medium', 'text-white', 'bg-indigo-600', 'hover:bg-indigo-700', 'focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'focus:ring-indigo-500', 'mt-4', 'text-sm', 'text-red-600', 'mt-4', 'text-sm', 'text-green-600',];
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
            username: username,
            email: email,
            isEditing: isEditing,
            errorMessage: errorMessage,
            successMessage: successMessage,
            handleUpdateProfile: handleUpdateProfile,
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
//# sourceMappingURL=ProfileView.vue.js.map