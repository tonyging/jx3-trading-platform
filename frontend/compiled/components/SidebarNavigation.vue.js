import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/appState';
import { useUserStore } from '@/stores/user';
// 獲取 app 儲存庫和使用者儲存庫
const appStore = useAppStore();
const userStore = useUserStore();
// 使用 appStore 中的折疊狀態
const collapsed = computed(() => appStore.isSidebarCollapsed);
// 定義免責聲明顯示狀態
const showDisclaimerTooltip = ref(false);
const __VLS_props = defineProps();
// 獲取router實例
const router = useRouter();
// 判斷是否為管理員
const isAdmin = computed(() => userStore.currentUser?.role === 'admin');
// 側邊欄選單項目
const menuItems = computed(() => {
    const items = [
        {
            title: '遊戲幣',
            id: 'game-currency',
            isTitle: true,
            hasSubMenu: true,
            subMenu: [
                {
                    title: '遊戲幣交易',
                    icon: 'money',
                    route: '/',
                    id: 'game-currency-trade',
                },
            ],
        },
        {
            title: '外觀',
            id: 'appearance',
            isTitle: true,
            hasSubMenu: true,
            subMenu: [
                {
                    title: '外觀資料庫',
                    icon: 'database',
                    route: '/appearance/library',
                    id: 'appearance-library',
                },
                {
                    title: '外觀交易',
                    icon: 'sparkles',
                    route: '/appearance/trade',
                    id: 'appearance-trade',
                },
            ],
        },
        {
            title: '帳號',
            id: 'account',
            isTitle: true,
            hasSubMenu: true,
            subMenu: [
                {
                    title: '帳號交易',
                    icon: 'account',
                    route: '/account/trade',
                    id: 'account-trade',
                },
            ],
        },
    ];
    // 如果是管理員，添加管理員儀表板選項
    if (isAdmin.value) {
        items.push({
            title: '管理員',
            id: 'admin',
            isTitle: true,
            hasSubMenu: true,
            subMenu: [
                {
                    title: '管理員儀表板',
                    icon: 'admin',
                    route: '/admin-dashboard',
                    id: 'admin-dashboard',
                },
            ],
        });
    }
    return items;
});
// 所有子菜單項目集合，用於折疊視圖
const allSubMenuItems = computed(() => {
    const items = [];
    menuItems.value.forEach((item) => {
        if (item.hasSubMenu && item.subMenu) {
            items.push(...item.subMenu.map((subItem) => ({
                ...subItem,
                parentId: item.id, // 添加父級ID以便區分管理員項目
            })));
        }
    });
    return items;
});
// 檢查當前頁面是否為特定頁面
const isActive = (route) => {
    if (!route)
        return false; // 如果沒有路由，不可能是活躍的
    return router.currentRoute.value.path === route;
};
// 檢查當前頁面或其子頁面是否活躍
const isActiveOrChildActive = (item) => {
    if (item.isTitle) {
        // 如果是標題類別，檢查其子項是否活躍
        if (item.hasSubMenu && item.subMenu) {
            return item.subMenu.some((subItem) => isActive(subItem.route));
        }
        return false;
    }
    return isActive(item.route);
};
// 切換側邊欄折疊狀態
const toggleSidebar = () => {
    appStore.toggleSidebar();
};
// 導航到指定路由，但標題分類不可導航
const navigateTo = (route, isTitle) => {
    if (!isTitle && route) {
        router.push(route);
    }
};
// 顯示/隱藏免責聲明浮框
const toggleDisclaimerTooltip = () => {
    showDisclaimerTooltip.value = !showDisclaimerTooltip.value;
};
// 獲取圖標路徑
const getIconPath = (iconName) => {
    if (!iconName)
        return ''; // 如果沒有圖標名稱，返回空字串
    // 使用動態導入確保圖標正確加載
    try {
        return new URL(`../assets/icons/${iconName}.svg`, import.meta.url).href;
    }
    catch (error) {
        console.error(`無法載入圖標: ${iconName}`, error);
        return ''; // 返回空字符串作為後備
    }
}; /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['nav-text', 'nav-link', 'title-category', 'nav-link', 'active', 'title-category', 'nav-link', 'nav-link', 'nav-item', 'title-item', 'icon-wrapper', 'nav-text', 'sub-menu-link', 'active', 'sub-menu-link', 'sub-menu-link', 'nav-list', 'active', 'nav-link', 'icon-wrapper', 'user-avatar', 'user-info', 'icon-wrapper', 'action-text', 'sidebar', 'collapsed', 'nav-text', 'icon-wrapper', 'user-info', 'action-text', 'sidebar-user', 'user-avatar', 'sidebar-actions', 'action-button', 'disclaimer-tooltip', 'collapsed', 'nav-text', 'user-info', 'action-text', 'icon-wrapper', 'sub-menu', 'sidebar-user', 'user-avatar', 'sidebar-actions', 'action-button', 'collapsed-nav', 'sidebar-nav', 'collapsed-nav', 'disclaimer-tooltip',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("sidebar") },
        ...{ class: (({ collapsed: __VLS_ctx.collapsed })) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("sidebar-header") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
        ...{ class: ("logo") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.toggleSidebar) },
        ...{ class: ("toggle-button") },
    });
    if (__VLS_ctx.collapsed) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    if (!__VLS_ctx.collapsed) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
            ...{ class: ("sidebar-nav") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
            ...{ class: ("nav-list") },
        });
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.menuItems))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: ((item.id)),
                ...{ class: ("nav-item") },
                ...{ class: (({
                        active: __VLS_ctx.isActiveOrChildActive(item),
                        'title-category': item.isTitle,
                    })) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!((!__VLS_ctx.collapsed)))
                            return;
                        !item.hasSubMenu && !item.isTitle ? __VLS_ctx.navigateTo(item.route, item.isTitle) : void 0;
                    } },
                ...{ class: ("nav-link") },
                ...{ class: (({ 'title-item': item.isTitle })) },
            });
            if (!item.isTitle) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("icon-wrapper") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                    src: ((__VLS_ctx.getIconPath(item.icon))),
                    alt: ("icon"),
                    ...{ class: ("nav-icon") },
                });
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("nav-text") },
            });
            (item.title);
            if (item.hasSubMenu && item.subMenu) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
                    ...{ class: ("sub-menu") },
                });
                for (const [subItem] of __VLS_getVForSourceType((item.subMenu))) {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                        ...{ onClick: (...[$event]) => {
                                if (!((!__VLS_ctx.collapsed)))
                                    return;
                                if (!((item.hasSubMenu && item.subMenu)))
                                    return;
                                __VLS_ctx.navigateTo(subItem.route, false);
                            } },
                        key: ((subItem.id)),
                        ...{ class: ("sub-menu-item") },
                        ...{ class: (({ active: __VLS_ctx.isActive(subItem.route) })) },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("sub-menu-link") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: ("icon-wrapper") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                        src: ((__VLS_ctx.getIconPath(subItem.icon))),
                        alt: ("icon"),
                        ...{ class: ("nav-icon") },
                    });
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: ("nav-text") },
                    });
                    (subItem.title);
                }
            }
        }
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
            ...{ class: ("sidebar-nav collapsed-nav") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
            ...{ class: ("nav-list") },
        });
        for (const [subItem] of __VLS_getVForSourceType((__VLS_ctx.allSubMenuItems))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                ...{ onClick: (...[$event]) => {
                        if (!(!((!__VLS_ctx.collapsed))))
                            return;
                        __VLS_ctx.navigateTo(subItem.route, false);
                    } },
                key: ((subItem.id)),
                ...{ class: ("nav-item collapsed-item") },
                ...{ class: (({
                        active: __VLS_ctx.isActive(subItem.route),
                    })) },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("nav-link collapsed-link") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("icon-wrapper") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.img)({
                src: ((__VLS_ctx.getIconPath(subItem.icon))),
                alt: ("icon"),
                ...{ class: ("nav-icon") },
            });
        }
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("sidebar-footer") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.navigateTo('/member-info', false);
            } },
        ...{ class: ("sidebar-user") },
        ...{ class: (({ 'collapsed-user': __VLS_ctx.collapsed })) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("user-avatar") },
    });
    (__VLS_ctx.userStore.currentUser?.name?.charAt(0) || '用');
    if (!__VLS_ctx.collapsed) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("user-info") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("user-name") },
        });
        (__VLS_ctx.userStore.currentUser?.name || '使用者');
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("user-status") },
        });
        (__VLS_ctx.userStore.currentUser?.role === 'admin' ? '管理員' : '一般會員');
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("sidebar-actions") },
        ...{ class: (({ 'collapsed-actions': __VLS_ctx.collapsed })) },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMouseenter: (__VLS_ctx.toggleDisclaimerTooltip) },
        ...{ onMouseleave: (__VLS_ctx.toggleDisclaimerTooltip) },
        ...{ onClick: (__VLS_ctx.toggleDisclaimerTooltip) },
        ...{ class: ("disclaimer-container") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ class: ("action-button disclaimer-button") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("icon-wrapper") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: ("action-icon") },
    });
    if (!__VLS_ctx.collapsed) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ("action-text") },
        });
    }
    if (__VLS_ctx.showDisclaimerTooltip) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("disclaimer-tooltip") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("tooltip-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    }
    ['sidebar', 'collapsed', 'sidebar-header', 'logo', 'toggle-button', 'sidebar-nav', 'nav-list', 'nav-item', 'active', 'title-category', 'nav-link', 'title-item', 'icon-wrapper', 'nav-icon', 'nav-text', 'sub-menu', 'sub-menu-item', 'active', 'sub-menu-link', 'icon-wrapper', 'nav-icon', 'nav-text', 'sidebar-nav', 'collapsed-nav', 'nav-list', 'nav-item', 'collapsed-item', 'active', 'nav-link', 'collapsed-link', 'icon-wrapper', 'nav-icon', 'sidebar-footer', 'sidebar-user', 'collapsed-user', 'user-avatar', 'user-info', 'user-name', 'user-status', 'sidebar-actions', 'collapsed-actions', 'disclaimer-container', 'action-button', 'disclaimer-button', 'icon-wrapper', 'action-icon', 'action-text', 'disclaimer-tooltip', 'tooltip-content',];
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
            collapsed: collapsed,
            showDisclaimerTooltip: showDisclaimerTooltip,
            menuItems: menuItems,
            allSubMenuItems: allSubMenuItems,
            isActive: isActive,
            isActiveOrChildActive: isActiveOrChildActive,
            toggleSidebar: toggleSidebar,
            navigateTo: navigateTo,
            toggleDisclaimerTooltip: toggleDisclaimerTooltip,
            getIconPath: getIconPath,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=SidebarNavigation.vue.js.map