import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
const userStore = useUserStore();
const router = useRouter();
const handleLogout = async () => {
    userStore.logout();
    router.push('/login');
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("min-h-screen flex flex-col"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
         class: ("bg-white shadow"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("container mx-auto px-4"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("flex justify-between h-16"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("flex"),
    });
    const __VLS_0 = {}.RouterLink;
    /** @type { [typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ] } */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        to: ("/"),
         class: ("flex items-center"),
    }));
    const __VLS_2 = __VLS_1({
        to: ("/"),
         class: ("flex items-center"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
         class: ("text-xl font-bold text-gray-900"),
    });
    __VLS_5.slots.default;
    var __VLS_5;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("flex items-center"),
    });
    if (__VLS_ctx.userStore.isAuthenticated) {
        const __VLS_6 = {}.RouterLink;
        /** @type { [typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ] } */ ;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
            to: ("/profile"),
             class: ("text-gray-700 hover:text-gray-900 px-3 py-2"),
        }));
        const __VLS_8 = __VLS_7({
            to: ("/profile"),
             class: ("text-gray-700 hover:text-gray-900 px-3 py-2"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        __VLS_11.slots.default;
        var __VLS_11;
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
             onClick: (__VLS_ctx.handleLogout),
             class: ("text-gray-700 hover:text-gray-900 px-3 py-2"),
        });
    }
    else {
        const __VLS_12 = {}.RouterLink;
        /** @type { [typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ] } */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            to: ("/login"),
             class: ("text-gray-700 hover:text-gray-900 px-3 py-2"),
        }));
        const __VLS_14 = __VLS_13({
            to: ("/login"),
             class: ("text-gray-700 hover:text-gray-900 px-3 py-2"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        __VLS_17.slots.default;
        var __VLS_17;
        const __VLS_18 = {}.RouterLink;
        /** @type { [typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ] } */ ;
        // @ts-ignore
        const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({
            to: ("/register"),
             class: ("text-gray-700 hover:text-gray-900 px-3 py-2"),
        }));
        const __VLS_20 = __VLS_19({
            to: ("/register"),
             class: ("text-gray-700 hover:text-gray-900 px-3 py-2"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_19));
        __VLS_23.slots.default;
        var __VLS_23;
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
         class: ("flex-1"),
    });
    var __VLS_24 = {};
    __VLS_elementAsFunction(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
         class: ("bg-gray-100"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
         class: ("container mx-auto px-4 py-6"),
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
         class: ("text-center text-gray-600"),
    });
    ['min-h-screen', 'flex', 'flex-col', 'bg-white', 'shadow', 'container', 'mx-auto', 'px-4', 'flex', 'justify-between', 'h-16', 'flex', 'flex', 'items-center', 'text-xl', 'font-bold', 'text-gray-900', 'flex', 'items-center', 'text-gray-700', 'hover:text-gray-900', 'px-3', 'py-2', 'text-gray-700', 'hover:text-gray-900', 'px-3', 'py-2', 'text-gray-700', 'hover:text-gray-900', 'px-3', 'py-2', 'text-gray-700', 'hover:text-gray-900', 'px-3', 'py-2', 'flex-1', 'bg-gray-100', 'container', 'mx-auto', 'px-4', 'py-6', 'text-center', 'text-gray-600',];
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
            userStore: userStore,
            handleLogout: handleLogout,
        };
    },
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEl: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=MainLayout.vue.js.map