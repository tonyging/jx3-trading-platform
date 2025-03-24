<!-- components/SidebarNavigation.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/appState'
import { useUserStore } from '@/stores/user'

// 獲取 app 儲存庫和使用者儲存庫
const appStore = useAppStore()
const userStore = useUserStore()

// 使用 appStore 中的折疊狀態
const collapsed = computed(() => appStore.isSidebarCollapsed)

// 定義props
type Props = {
  activeRoute?: string
}
defineProps<Props>()

// 定義子選單項目接口
interface SubMenuItem {
  title: string
  icon: string
  route: string
  id: string
}

// 定義菜單項目接口
interface MenuItem {
  title: string
  id: string
  isTitle: boolean
  hasSubMenu: boolean
  subMenu?: SubMenuItem[]
  route?: string
  icon?: string
}

interface ExtendedSubMenuItem extends SubMenuItem {
  parentId: string
}

// 獲取router實例
const router = useRouter()

// 判斷是否為管理員
const isAdmin = computed(() => userStore.currentUser?.role === 'admin')

// 移除展開相關邏輯，因為子選單始終顯示

// 側邊欄選單項目
const menuItems = computed((): MenuItem[] => {
  const items: MenuItem[] = [
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
  ]

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
    })
  }

  return items
})

// 所有子菜單項目集合，用於折疊視圖
const allSubMenuItems = computed((): ExtendedSubMenuItem[] => {
  const items: ExtendedSubMenuItem[] = []
  menuItems.value.forEach((item) => {
    if (item.hasSubMenu && item.subMenu) {
      items.push(
        ...item.subMenu.map((subItem) => ({
          ...subItem,
          parentId: item.id, // 添加父級ID以便區分管理員項目
        })),
      )
    }
  })
  return items
})

// 檢查當前頁面是否為特定頁面
const isActive = (route: string | undefined) => {
  if (!route) return false // 如果沒有路由，不可能是活躍的
  return router.currentRoute.value.path === route
}

// 檢查當前頁面或其子頁面是否活躍
const isActiveOrChildActive = (item: MenuItem) => {
  if (item.isTitle) {
    // 如果是標題類別，檢查其子項是否活躍
    if (item.hasSubMenu && item.subMenu) {
      return item.subMenu.some((subItem) => isActive(subItem.route))
    }
    return false
  }
  return isActive(item.route)
}

// 切換側邊欄折疊狀態
const toggleSidebar = () => {
  appStore.toggleSidebar()
}

// 導航到指定路由，但標題分類不可導航
const navigateTo = (route: string | undefined, isTitle: boolean) => {
  if (!isTitle && route) {
    router.push(route)
  }
}

// 獲取圖標路徑
const getIconPath = (iconName: string | undefined) => {
  if (!iconName) return '' // 如果沒有圖標名稱，返回空字串

  // 使用動態導入確保圖標正確加載
  try {
    return new URL(`../assets/icons/${iconName}.svg`, import.meta.url).href
  } catch (error) {
    console.error(`無法載入圖標: ${iconName}`, error)
    return '' // 返回空字符串作為後備
  }
}
</script>

<template>
  <div class="sidebar" :class="{ collapsed: collapsed }">
    <!-- 側邊欄頂部 LOGO 區域 -->
    <div class="sidebar-header">
      <h1 class="logo">劍三交易平台</h1>
      <button class="toggle-button" @click="toggleSidebar">
        <span v-if="collapsed">›</span>
        <span v-else>‹</span>
      </button>
    </div>

    <!-- 導航菜單 - 完整模式 -->
    <nav class="sidebar-nav" v-if="!collapsed">
      <ul class="nav-list">
        <li
          v-for="item in menuItems"
          :key="item.id"
          class="nav-item"
          :class="{
            active: isActiveOrChildActive(item),
            'title-category': item.isTitle,
          }"
        >
          <div
            class="nav-link"
            :class="{ 'title-item': item.isTitle }"
            @click="
              !item.hasSubMenu && !item.isTitle ? navigateTo(item.route, item.isTitle) : void 0
            "
          >
            <!-- 只有非標題項目才顯示圖標 -->
            <div v-if="!item.isTitle" class="icon-wrapper">
              <img :src="getIconPath(item.icon)" alt="icon" class="nav-icon" />
            </div>
            <span class="nav-text">{{ item.title }}</span>
          </div>

          <!-- 子選單 - 始終顯示 -->
          <ul v-if="item.hasSubMenu && item.subMenu" class="sub-menu">
            <li
              v-for="subItem in item.subMenu"
              :key="subItem.id"
              class="sub-menu-item"
              :class="{ active: isActive(subItem.route) }"
              @click="navigateTo(subItem.route, false)"
            >
              <div class="sub-menu-link">
                <div class="icon-wrapper">
                  <img :src="getIconPath(subItem.icon)" alt="icon" class="nav-icon" />
                </div>
                <span class="nav-text">{{ subItem.title }}</span>
              </div>
            </li>
          </ul>
        </li>
      </ul>
    </nav>

    <!-- 導航菜單 - 折疊模式下只顯示子選單圖標 -->
    <nav class="sidebar-nav collapsed-nav" v-else>
      <ul class="nav-list">
        <li
          v-for="subItem in allSubMenuItems"
          :key="subItem.id"
          class="nav-item collapsed-item"
          :class="{
            active: isActive(subItem.route),
          }"
          @click="navigateTo(subItem.route, false)"
        >
          <div class="nav-link collapsed-link">
            <div class="icon-wrapper">
              <img :src="getIconPath(subItem.icon)" alt="icon" class="nav-icon" />
            </div>
          </div>
        </li>
      </ul>
    </nav>

    <!-- 使用者資訊 -->
    <div
      class="sidebar-user"
      :class="{ 'collapsed-user': collapsed }"
      @click="navigateTo('/member-info', false)"
    >
      <div class="user-avatar">
        {{ userStore.currentUser?.name?.charAt(0) || '用' }}
      </div>
      <div class="user-info" v-if="!collapsed">
        <div class="user-name">{{ userStore.currentUser?.name || '使用者' }}</div>
        <div class="user-status">
          {{ userStore.currentUser?.role === 'admin' ? '管理員' : '一般會員' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 樣式保持不變
$primary-color: #b4282d;
$primary-hover: #d4282d;
$background-color: #f5f5f5;
$text-color: #333333;
$error-color: #ff4d4f;
$admin-color: $primary-color; // 將管理員顏色設為與主題色相同
$admin-hover: $primary-hover; // 將管理員懸停顏色設為與主題懸停色相同
$transition: all 0.3s ease;
$box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
$font-family: 'Microsoft YaHei', '微軟雅黑', sans-serif;

// 側邊欄專用顏色
$sidebar-color: #202123; // 更暗的背景色，與主應用程式風格一致
$sidebar-hover: #2a2b2d; // 輕微提亮的懸停效果
$sidebar-active: $primary-color; // 使用主題紅色作為活動項目的背景
$sidebar-text: white;
$sidebar-text-muted: rgba(255, 255, 255, 0.7);
$sidebar-border: rgba(255, 255, 255, 0.1);
$sidebar-title-color: rgba(255, 255, 255, 0.6); // 標題項目的顏色

// 側邊欄基本樣式
.sidebar {
  width: 210px; // 縮小側邊欄寬度
  height: 100vh;
  background: $sidebar-color;
  color: $sidebar-text;
  transition: $transition;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.15);
  font-family: $font-family;

  &.collapsed {
    width: 72px;

    .nav-text,
    h1 {
      display: none;
    }

    .icon-wrapper {
      margin-right: 0;
    }

    .user-info {
      display: none;
    }
  }
}

// 側邊欄頭部
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid $sidebar-border;

  .logo {
    margin: 0;
    font-size: 18px; // 稍微調小字體，以適應更長的標題
    font-weight: 600;
    color: $sidebar-text;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px; // 限制寬度，避免過長
  }

  .toggle-button {
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 4px;
    color: $sidebar-text;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px; // 增加與標題的間距
    flex-shrink: 0; // 防止按鈕被壓縮

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

// 導航菜單
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;

  .nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .nav-item {
    padding: 0;
    cursor: pointer;
    margin-bottom: 1px; // 再減少項目間距
    border-radius: 0 4px 4px 0;
    margin-right: 8px;

    // 標題分類樣式
    &.title-category {
      .nav-link {
        cursor: default; // 標題不可點擊，顯示默認鼠標

        &:hover {
          background: transparent; // 標題不顯示懸停效果
        }

        .nav-text {
          color: $sidebar-title-color;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
          margin-bottom: 2px; // 減少下方間距
        }
      }

      &.active .nav-link {
        background: transparent; // 即使活躍也不顯示背景

        &::before {
          display: none; // 移除活躍標記
        }
      }
    }

    &:not(.title-category):hover {
      & > .nav-link {
        background: $sidebar-hover;
      }
    }

    &.active:not(.title-category) {
      & > .nav-link {
        background: $sidebar-active;
        position: relative;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background: white;
        }
      }
    }
  }

  .nav-link,
  .sub-menu-link {
    display: flex;
    align-items: center;
    padding: 6px 12px; // 減少左右間距
    position: relative;

    &.title-item {
      padding-top: 10px; // 減少標題頂部間距
      padding-bottom: 2px; // 進一步減少底部間距
      padding-left: 16px; // 減少標題左側縮進
    }

    // 首個標題項特殊處理，頂部間距更小
    .nav-item:first-child &.title-item {
      padding-top: 4px; // 遊戲幣標題的頂部間距特別小
    }

    .icon-wrapper {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0; // 防止縮小
    }

    .nav-icon {
      width: 20px;
      height: 20px;
      filter: invert(1); // 將黑色圖標變為白色
      object-fit: contain; // 確保圖標保持比例
      max-width: 100%;
    }

    .nav-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 15px;
      flex: 1;
    }
  }

  // 子選單樣式 - 始終顯示
  .sub-menu {
    list-style: none;
    padding: 0;
    margin: 0 0 2px 0; // 進一步減少底部間距
    display: block; // 始終顯示
    max-height: none; // 移除高度限制

    .sub-menu-item {
      padding-left: 16px; // 減少子選單項左側間距
      cursor: pointer;
      margin-bottom: 2px; // 減少項目間距

      &:hover .sub-menu-link {
        background: $sidebar-hover;
      }

      &.active .sub-menu-link {
        background: rgba($sidebar-active, 0.3);
        position: relative;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background: $sidebar-active;
        }
      }
    }

    .sub-menu-link {
      padding: 6px 12px; // 同步減少左右間距
      border-radius: 0 4px 4px 0;
    }
  }
}

// 折疊模式下的導航菜單樣式
.collapsed-nav {
  padding: 10px 0 10px; // 調整上下間距
  display: flex;
  flex-direction: column;
  align-items: center;

  .nav-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%; // 確保寬度佔滿
    padding: 0 16px; // 添加左右內邊距
  }

  .collapsed-item {
    margin: 8px 0; // 調整間距
    width: auto; // 不佔滿寬度
    display: flex;
    justify-content: center;

    &.active .nav-link {
      background: $sidebar-active;
      border-radius: 4px;

      // 移除左側白條
      &::before {
        display: none;
      }
    }
  }

  .collapsed-link {
    padding: 8px;
    border-radius: 4px;
    transition: $transition;
    width: 36px; // 固定寬度
    height: 36px; // 固定高度
    display: flex;
    align-items: center;
    justify-content: center;

    .icon-wrapper {
      margin: 0; // 移除右側間距
    }

    &:hover {
      background: $sidebar-hover;
    }
  }
}

// 使用者資訊區域
.sidebar-user {
  padding: 16px;
  border-top: 1px solid $sidebar-border;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: $transition;

  &:hover {
    background: $sidebar-hover;
  }

  &.collapsed-user {
    padding: 16px 0 20px; // 調整上下間距
    justify-content: center;

    .user-avatar {
      width: 36px; // 與圖標容器大小一致
      height: 36px; // 與圖標容器大小一致
      margin-right: 0;
      font-size: 16px; // 調整字體大小
    }
  }

  .user-avatar {
    min-width: 40px; // 確保最小寬度，防止變形
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: $primary-color;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
    margin-right: 12px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    flex-shrink: 0; // 防止頭像在小螢幕上被壓縮
  }

  .user-info {
    .user-name {
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-status {
      font-size: 12px;
      color: $sidebar-text-muted;
    }
  }
}

// 適配不同螢幕尺寸
@media (max-width: 768px) {
  .sidebar {
    width: 72px;

    &.collapsed {
      width: 0;
      overflow: hidden;
    }

    .nav-text,
    h1 {
      display: none;
    }

    .icon-wrapper {
      margin-right: 0;
    }

    .user-info {
      display: none;
    }

    .sidebar-user {
      justify-content: center;
      padding: 16px 0;

      .user-avatar {
        margin-right: 0;
      }
    }

    .expand-button {
      display: none;
    }

    &:hover:not(.collapsed) {
      width: 210px; // 保持一致的寬度

      .nav-text,
      h1,
      .user-info {
        display: block;
      }

      .icon-wrapper {
        margin-right: 12px;
      }

      .sub-menu {
        display: block;
      }

      .sidebar-user {
        justify-content: flex-start;
        padding: 16px;

        .user-avatar {
          margin-right: 12px;
        }
      }

      // 懸停時顯示正常側邊欄
      .collapsed-nav {
        display: none;
      }

      .sidebar-nav:not(.collapsed-nav) {
        display: block;
      }
    }
  }
}
</style>
