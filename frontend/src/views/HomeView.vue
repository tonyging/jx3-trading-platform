<!-- HomeView.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import CreateProductModal from '@/components/CreateProductModal.vue'
import EditProductModal from '@/components/EditProductModal.vue'
import PurchaseConfirmModal from '@/components/PurchaseConfirmModal.vue'
import { productApi } from '@/services/api/product'
import type { Product, ProductListType, ProductStatus, UserRole } from '@/types'

// 定義可能的錯誤類型
interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

// 定義 products
const products = ref<Product[]>([])
const loading = ref(true)
const showPurchaseModal = ref(false)
const selectedProduct = ref<Product | null>(null)

// 定義狀態映射
const statusMap: Record<Product['status'], string> = {
  active: '可購買',
  reserved: '交易中',
  sold: '已售出',
  deleted: '已下架',
}

// 定義角色映射
const roleMap: Record<UserRole, string> = {
  admin: '管理員',
  user: '一般會員',
  banned: '停權會員',
}

const isAdmin = computed(() => {
  console.log('Current user:', userStore.currentUser)
  console.log('Current user role:', userStore.currentUser?.role)
  return userStore.currentUser?.role === 'admin'
})

// 計算表格的總列數
const totalColumns = computed(() => {
  // 基礎列數（賣家、數量、價格、幣值、操作）
  let baseColumns = 5
  // 如果是管理員，加上狀態列
  if (isAdmin.value) {
    baseColumns += 1
  }
  return baseColumns
})

// 添加处理购买点击的方法
const handleBuyProduct = (product: Product) => {
  selectedProduct.value = product
  showPurchaseModal.value = true
}

// 初始化路由和用戶狀態管理
const router = useRouter()
const userStore = useUserStore()

// 使用 storeToRefs 解構 currentUser
const {} = storeToRefs(userStore)

//頁籤狀態
const currentTab = ref<ProductListType>('all')

const sortFieldMap = {
  amount: 'amount',
  price: 'price',
  value: 'ratio',
} as const

const currentSort = ref({
  field: 'price' as keyof typeof sortFieldMap,
  direction: 'desc' as 'asc' | 'desc',
})

const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

// 載入商品列表
const loadProducts = async () => {
  try {
    loading.value = true

    const requestParams: {
      sortBy: string
      order: 'asc' | 'desc'
      tab: ProductListType
      userId?: string
      status?: ProductStatus | ProductStatus[]
      buyerId?: string
    } = {
      sortBy: sortFieldMap[currentSort.value.field],
      order: currentSort.value.direction,
      tab: currentTab.value,
    }

    // 根據不同頁籤設定 status
    switch (currentTab.value) {
      case 'trading':
        requestParams.status = 'reserved' as ProductStatus
        if (userStore.currentUser?.id) {
          requestParams.userId = userStore.currentUser.id
          requestParams.buyerId = userStore.currentUser.id
        }
        break
      case 'my':
        if (!userStore.currentUser?.id) {
          await userStore.fetchCurrentUser()
        }
        if (userStore.currentUser?.id) {
          requestParams.userId = userStore.currentUser.id
          requestParams.status = 'active' as ProductStatus
        } else {
          console.warn('無法獲取用戶 ID')
          showNotification('無法取得用戶資訊', 'error')
          products.value = []
          loading.value = false
          return
        }
        break
      case 'admin':
        requestParams.status = ['active', 'reserved', 'sold'] as ProductStatus[]
        break
      default:
        requestParams.status = 'active' as ProductStatus
    }

    const response = await productApi.getProducts(requestParams)
    console.log('Loaded products:', response.data.products)
    products.value = response.data.products
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification(
      apiError.response?.data?.message || (apiError.message as string) || '載入商品列表失敗',
      'error',
    )
    console.error('載入商品列表失敗:', error)
    products.value = []
  } finally {
    loading.value = false
  }
}

// 切換頁籤的方法
const switchTab = async (tab: ProductListType) => {
  if (tab === 'admin' && userStore.currentUser?.role !== 'admin') {
    showNotification('您沒有權限訪問此頁籤', 'error')
    return
  }
  currentTab.value = tab
  if (tab === 'my' && !userStore.currentUser?.id) {
    try {
      await userStore.fetchCurrentUser()
    } catch (error: unknown) {
      const apiError = error as ApiError
      console.error('Failed to load user info:', error)
      showNotification((apiError.message as string) || '載入用戶資訊失敗', 'error')
    }
  }

  await loadProducts()
}

// 顯示通知的方法
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = {
    show: true,
    message,
    type,
  }

  // 3秒後自動關閉通知
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const isUserMenuOpen = ref(false)

// 添加關閉選單的方法
const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

// 切換用戶菜單顯示狀態
const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

// 處理用戶登出
const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

// 格式化價格顯示
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(price)
}

// 計算幣值（每萬遊戲幣的價格）
const calculateValue = (amount: number, price: number) => {
  return (price / amount).toFixed(2)
}

// 處理排序
const handleSort = async (field: keyof typeof sortFieldMap) => {
  if (currentSort.value.field === field) {
    currentSort.value.direction = currentSort.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value.field = field
    currentSort.value.direction = 'desc'
  }

  await loadProducts()
}

// 獲取排序圖標的類別
const getSortIconClass = (field: string) => {
  if (currentSort.value.field !== field) return 'sort-icon'
  return currentSort.value.direction === 'asc' ? 'sort-icon ascending' : 'sort-icon descending'
}

// 在組件掛載時載入商品列表
onMounted(async () => {
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
  }

  const shouldReload = localStorage.getItem('shouldReload')
  if (shouldReload) {
    localStorage.removeItem('shouldReload')
    window.location.reload()
    return
  }

  const defaultTab = localStorage.getItem('defaultTab')
  if (defaultTab === 'trading') {
    await switchTab('trading')
    localStorage.removeItem('defaultTab')
  }

  // 等待用戶資訊載入完成
  if (!userStore.currentUser?.id) {
    // 可以添加一個簡單的重試機制
    let retries = 3
    while (retries > 0 && !userStore.currentUser?.id) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      retries--
    }
  }
  await loadProducts()
})

// 控制 Modal 的顯示狀態
const isCreateModalOpen = ref(false)

// 處理建立商品的點擊事件
const handleCreateProduct = () => {
  isCreateModalOpen.value = true
}

// 處理表單提交
const handleSubmitProduct = async (data: { amount: number; price: number }) => {
  try {
    await productApi.createProduct(data)
    isCreateModalOpen.value = false
    showNotification('商品建立成功')
    await loadProducts() // 重新載入商品列表
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification((apiError.message as string) || '建立商品失敗，請稍後再試', 'error')
    console.error('建立商品失敗:', error)
  }
}

// 刪除商品的方法
const handleDeleteProduct = async (productId: string) => {
  try {
    await productApi.deleteProduct(productId)
    showNotification('商品已成功刪除')
    await loadProducts() // 重新載入商品列表
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification((apiError.message as string) || '刪除商品失敗，請稍後再試', 'error')
    console.error('刪除商品失敗:', error)
  }
}
// 編輯商品相關狀態和方法
const isEditModalOpen = ref(false)
const currentEditProduct = ref<Product | null>(null)

// 打開編輯商品彈窗
const handleEditProduct = (product: Product) => {
  currentEditProduct.value = product
  isEditModalOpen.value = true
}

// 提交編輯商品
const handleSubmitEditProduct = async (data: { amount: number; price: number }) => {
  if (!currentEditProduct.value) return

  try {
    await productApi.updateProduct(currentEditProduct.value.id, data)
    isEditModalOpen.value = false
    showNotification('商品更新成功')
    await loadProducts() // 重新載入商品列表
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification((apiError.message as string) || '更新商品失敗，請稍後再試', 'error')
    console.error('更新商品失敗:', error)
  }
}

// 確認購買商品頁面
const handleConfirmPurchase = async (purchaseData: { amount: number; totalPrice: number }) => {
  if (selectedProduct.value) {
    try {
      const response = await productApi.reserveProduct(
        selectedProduct.value.id,
        purchaseData.amount,
      )

      console.log('Purchase response:', response)

      // 確保我們有收到交易資料
      if (!response.data?.transaction?.id) {
        throw new Error('未收到有效的交易資訊')
      }

      // 關閉購買模態框
      showPurchaseModal.value = false

      // 使用正確的交易 ID 進行跳轉
      router.push(`/transactions/${response.data.transaction.id}`)

      // 顯示成功訊息
      showNotification('購買成功！正在前往交易詳情頁面...', 'success')
    } catch (error: unknown) {
      const apiError = error as ApiError
      // 提供更詳細的錯誤訊息
      const errorMessage = (apiError.message as string) || '購買失敗，請稍後再試'

      showNotification(errorMessage, 'error')
      console.error('購買失敗詳情:', error)
      console.error('選擇的商品:', selectedProduct.value)
    }
  }
}

const handleViewTransaction = (product: Product) => {
  if (product.transactionId) {
    let transactionId: string | undefined

    if (typeof product.transactionId === 'object') {
      // 優先使用 id，如果沒有再用 _id
      transactionId = product.transactionId.id || product.transactionId._id
    } else {
      transactionId = product.transactionId
    }

    if (!transactionId) {
      console.error('交易 ID 無效:', product.transactionId)
      showNotification('交易資訊異常', 'error')
      return
    }

    console.log('Resolved Transaction ID:', transactionId)
    router.push(`/transactions/${transactionId}`)
  } else {
    console.error('找不到交易ID:', product)
    showNotification('找不到相關交易資訊', 'error')
  }
}

const getStatusDisplay = (status: Product['status']) => {
  return statusMap[status] || `未知狀態(${status})`
}

// 添加狀態標籤的樣式
const getStatusClass = (status: ProductStatus) => {
  const classMap: Record<ProductStatus, string> = {
    active: 'status-active',
    reserved: 'status-reserved',
    sold: 'status-sold',
    deleted: 'status-deleted',
  }
  return classMap[status] || 'status-unknown'
}

// 轉換角色為中文顯示
const getRoleDisplay = (role: UserRole | undefined) => {
  if (!role) return '未知角色'
  return roleMap[role] || '未知角色'
}

const handleMemberInfo = () => {
  router.push('/member-info')
  closeUserMenu()
}
</script>

<template>
  <div class="platform-base" @click="closeUserMenu">
    <!-- 頁面頂部標題和用戶選單 -->
    <div class="site-header">
      <h1>劍三交易平台</h1>
      <div class="user-menu-container" @click.stop>
        <div class="user-avatar" @click.stop="toggleUserMenu">
          {{ userStore.currentUser?.name?.charAt(0) || '用' }}
        </div>
        <div v-if="isUserMenuOpen" class="user-dropdown-menu">
          <div class="user-info">
            <p class="user-name">
              {{ userStore.currentUser?.name || '用戶' }}
              <span class="role-tag">({{ getRoleDisplay(userStore.currentUser?.role) }})</span>
            </p>
            <p class="user-email">{{ userStore.currentUser?.email }}</p>
          </div>
          <div class="user-actions">
            <button class="menu-button profile-button" @click="handleMemberInfo">會員資訊</button>
            <button class="menu-button logout-button" @click="handleLogout">登出</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要內容區域 -->
    <div class="content-wrapper">
      <main class="main-content trade-content">
        <!-- 添加創建商品按鈕 -->
        <div class="table-header">
          <div class="tabs">
            <button :class="['tab', { active: currentTab === 'all' }]" @click="switchTab('all')">
              全部商品
            </button>
            <button :class="['tab', { active: currentTab === 'my' }]" @click="switchTab('my')">
              我的商品
            </button>
            <button
              :class="['tab', { active: currentTab === 'trading' }]"
              @click="switchTab('trading')"
            >
              交易中
            </button>
            <button
              v-if="userStore.currentUser?.role === 'admin'"
              :class="['tab', { active: currentTab === 'admin' }]"
              @click="switchTab('admin')"
            >
              管理員
            </button>
          </div>
          <button class="create-button" @click="handleCreateProduct">建立商品</button>
        </div>
        <!-- 商品列表區域 -->
        <div class="trade-table">
          <table>
            <thead>
              <tr>
                <th>賣家</th>
                <th>
                  <div class="sort-header" @click="handleSort('amount')">
                    數量
                    <span :class="getSortIconClass('amount')" />
                  </div>
                </th>
                <th>
                  <div class="sort-header" @click="handleSort('price')">
                    價格
                    <span :class="getSortIconClass('price')" />
                  </div>
                </th>
                <th>
                  <div class="sort-header" @click="handleSort('value')">
                    幣值
                    <span :class="getSortIconClass('value')" />
                  </div>
                </th>
                <!-- 管理員的狀態欄位 -->
                <th v-if="isAdmin">狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td :colspan="totalColumns" class="status-message">載入中...</td>
              </tr>
              <tr v-else-if="products.length === 0">
                <td :colspan="totalColumns" class="status-message">暫無商品</td>
              </tr>
              <tr v-else v-for="product in products" :key="product.id">
                <td>{{ typeof product.userId === 'object' ? product.userId.name : '未知賣家' }}</td>
                <td>{{ product.amount }}</td>
                <td>{{ formatPrice(product.price) }}</td>
                <td>{{ calculateValue(product.price, product.amount) }}</td>
                <td v-if="isAdmin">
                  <span
                    :class="['status-tag', getStatusClass(product.status)]"
                    :title="product.status"
                  >
                    {{ getStatusDisplay(product.status) }}
                  </span>
                </td>
                <td>
                  <!-- 交易中頁籤的按鈕邏輯 -->
                  <template v-if="currentTab === 'trading'">
                    <button
                      class="view-button"
                      @click="handleViewTransaction(product)"
                      :disabled="!product.transactionId"
                    >
                      {{ product.transactionId ? '查看交易' : '交易資訊異常' }}
                    </button>
                  </template>

                  <!-- 管理員頁籤的按鈕邏輯 -->
                  <template v-else-if="currentTab === 'admin'">
                    <div class="admin-actions">
                      <button
                        v-if="product.transactionId"
                        class="view-button"
                        @click="handleViewTransaction(product)"
                      >
                        查看交易
                      </button>
                      <button class="delete-button" @click="handleDeleteProduct(product.id)">
                        刪除
                      </button>
                    </div>
                  </template>

                  <!-- 其他頁籤的按鈕邏輯 -->
                  <template v-else>
                    <template
                      v-if="
                        typeof product.userId === 'object' &&
                        product.userId.id === userStore.currentUser?.id
                      "
                    >
                      <div class="product-actions">
                        <button class="edit-button" @click="handleEditProduct(product)">
                          編輯
                        </button>
                        <button class="delete-button" @click="handleDeleteProduct(product.id)">
                          刪除
                        </button>
                      </div>
                    </template>
                    <template v-else>
                      <button class="buy-button" @click="handleBuyProduct(product)">購買</button>
                    </template>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>
  <CreateProductModal v-model:isOpen="isCreateModalOpen" @submit="handleSubmitProduct" />
  <EditProductModal
    v-if="currentEditProduct"
    v-model:isOpen="isEditModalOpen"
    :product="currentEditProduct"
    @submit="handleSubmitEditProduct"
  />
  <PurchaseConfirmModal
    v-if="showPurchaseModal && selectedProduct"
    :product="selectedProduct"
    @confirm="handleConfirmPurchase"
    @cancel="showPurchaseModal = false"
  />
  <!-- 通知組件 -->
  <div v-if="notification.show" :class="['notification', `notification-${notification.type}`]">
    {{ notification.message }}
  </div>
</template>

<style lang="scss" scoped>
// 基礎變數定義
$primary-color: #b4282d;
$primary-hover: #d4282d;
$background-color: #f5f5f5;
$text-color: #333333;
$error-color: #ff4d4f;
$font-family: 'Microsoft YaHei', '微軟雅黑', sans-serif;
$spacing-unit: 8px;
$box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
$transition: all 0.3s ease;

// 基礎頁面容器
.platform-base {
  height: 100%;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  background-color: $background-color;
  background-image: linear-gradient(135deg, #ffffff, #f0f0f0);
  overflow-y: auto;
}

// 頁面頂部結構
.site-header {
  position: absolute;
  top: $spacing-unit * 3;
  left: $spacing-unit * 3;
  right: $spacing-unit * 3;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: $primary-color;
    margin: 0;
    font-family: $font-family;
  }
}

// 內容區域包裝容器
.content-wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: $spacing-unit * 10;
  overflow: auto;
}

// 主要內容區域 - 交易頁面特定樣式
.main-content.trade-content {
  width: 90%;
  max-width: 1440px;
  padding: $spacing-unit * 4;
  background: #ffffff;
  border-radius: $spacing-unit * 1.5;
  box-shadow: $box-shadow;
  border: 1px solid rgba($primary-color, 0.1);
}

// 用戶菜單相關樣式
.user-menu-container {
  position: relative;
}

.admin-actions {
  display: flex;
  gap: $spacing-unit * 2;
  align-items: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background-color: $primary-color;
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-weight: bold;
  transition: $transition;

  &:hover {
    background-color: $primary-hover;
  }
}

.status-tag {
  display: inline-block;
  padding: $spacing-unit ($spacing-unit * 1.5);
  border-radius: $spacing-unit;
  font-size: 14px;
  font-weight: 500;

  &.status-active {
    background-color: #e6f7ff;
    color: #1890ff;
    border: 1px solid #91d5ff;
  }

  &.status-reserved {
    background-color: #fff7e6;
    color: #fa8c16;
    border: 1px solid #ffd591;
  }

  &.status-sold {
    background-color: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }

  &.status-deleted {
    background-color: #fff1f0;
    color: #f5222d;
    border: 1px solid #ffa39e;
  }

  &.status-unknown {
    background-color: #f5f5f5;
    color: #666666;
    border: 1px solid #d9d9d9;
  }
}

.user-dropdown-menu {
  position: absolute;
  top: calc(100% + #{$spacing-unit});
  right: 0;
  width: 250px;
  background: white;
  border-radius: $spacing-unit;
  box-shadow: $box-shadow;
  border: 1px solid rgba($primary-color, 0.1);
  padding: $spacing-unit * 2;
  z-index: 20;

  .user-info {
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: $spacing-unit * 2;
    margin-bottom: $spacing-unit * 2;

    .user-name {
      margin: 0;
      font-weight: 600;
      color: $text-color;
      display: flex;
      align-items: center;
      gap: $spacing-unit;

      .role-tag {
        font-size: 0.85em;
        color: #666;
        font-weight: normal;
      }
    }

    .user-email {
      margin: 0;
      color: #666666;
      font-size: 14px;
    }
  }

  .user-actions {
    display: flex;
    flex-direction: column;
    gap: $spacing-unit;

    .menu-button {
      width: 100%;
      padding: $spacing-unit * 1.5 $spacing-unit * 2;
      color: white;
      border: none;
      border-radius: $spacing-unit;
      font-size: 16px;
      cursor: pointer;
      transition: $transition;
      font-weight: 600;

      &:hover {
        transform: translateY(-1px);
      }
    }

    .profile-button {
      background: linear-gradient(to right, #4a90e2, #357abd);

      &:hover {
        background: linear-gradient(to right, #357abd, #2868a9);
      }
    }

    .logout-button {
      background: linear-gradient(to right, $primary-color, $primary-hover);

      &:hover {
        background: linear-gradient(to right, $primary-hover, #f4282d);
      }
    }
  }
}

// 添加創建按鈕相關樣式
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-unit * 3;
}

.tabs {
  display: flex;
  gap: $spacing-unit * 2;
}

.tab {
  background: transparent;
  border: none;
  color: #666;
  font-weight: 500;
  padding: $spacing-unit $spacing-unit * 2;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: $transition;

  &.active {
    color: $primary-color;
    border-bottom-color: $primary-color;
    font-weight: 600;
  }

  &:hover {
    color: $primary-color;
  }
}

.create-button {
  padding: $spacing-unit * 1.5 $spacing-unit * 3;
  background: linear-gradient(to right, $primary-color, $primary-hover);
  color: white;
  border: none;
  border-radius: $spacing-unit;
  font-size: 16px;
  cursor: pointer;
  transition: $transition;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: $spacing-unit;

  &:hover {
    transform: translateY(-1px);
    // 修改漸層背景的寫法，使用更安全的顏色值
    background: linear-gradient(to right, $primary-hover, #f4282d);
  }
}

// 交易表格相關樣式
.trade-table {
  width: 100%;
  background: white;
  border-radius: $spacing-unit;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f8f8f8;
  padding: $spacing-unit * 2;
  text-align: left;
  font-weight: 600;
  color: $text-color;
}

.sort-header {
  display: flex;
  align-items: center;
  gap: $spacing-unit;
  cursor: pointer;
  user-select: none;

  &:hover {
    color: $primary-color;
  }
}

td {
  padding: $spacing-unit * 2;
  border-top: 1px solid #eee;
  color: $text-color;
}

// 排序圖標樣式
.sort-icon {
  width: 0;
  height: 0;
  display: inline-block;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid #ccc;
  border-top: 4px solid #ccc;
  vertical-align: middle;
  margin-left: $spacing-unit;

  &.ascending {
    border-bottom-color: $primary-color;
    border-top-color: #ccc;
  }

  &.descending {
    border-top-color: $primary-color;
    border-bottom-color: #ccc;
  }
}

.delete-button {
  padding: $spacing-unit $spacing-unit * 2;
  background: linear-gradient(to right, #888, #666);
  color: white;
  border: none;
  border-radius: $spacing-unit;
  cursor: pointer;
  transition: $transition;
  font-weight: 600;

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(to right, #777, #555);
  }
}

// 狀態訊息樣式
.status-message {
  text-align: center;
  color: #666;
  padding: $spacing-unit * 3;
}

// 購買按鈕樣式
.buy-button {
  padding: $spacing-unit $spacing-unit * 2;
  background: linear-gradient(to right, $primary-color, $primary-hover);
  color: white;
  border: none;
  border-radius: $spacing-unit;
  cursor: pointer;
  transition: $transition;
  font-weight: 600;

  &:hover {
    transform: translateY(-1px);
  }
}

.view-button {
  // 正常狀態的樣式
  padding: $spacing-unit $spacing-unit * 2;
  background: linear-gradient(to right, #4a90e2, #4a7de2); // 藍色漸層
  color: white;
  border: none;
  border-radius: $spacing-unit;
  cursor: pointer;
  transition: $transition;
  font-weight: 600;

  // 懸停效果
  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(to right, #4a7de2, #4a5de2); // 略深的藍色漸層
  }

  // 禁用狀態的樣式
  &:disabled {
    background: linear-gradient(to right, #ccc, #999);
    cursor: not-allowed;
    transform: none;
    opacity: 0.7;

    &:hover {
      transform: none;
      background: linear-gradient(to right, #ccc, #999);
    }
  }
}

.product-actions {
  display: flex;
  gap: $spacing-unit * 2;

  .edit-button {
    padding: $spacing-unit $spacing-unit * 2;
    background: linear-gradient(to right, #4caf50, #45a049);
    color: white;
    border: none;
    border-radius: $spacing-unit;
    cursor: pointer;
    transition: $transition;
    font-weight: 600;

    &:hover {
      transform: translateY(-1px);
      background: linear-gradient(to right, #45a049, #3d8b40);
    }
  }
}

.delete-button {
  padding: $spacing-unit $spacing-unit * 2;
  background: linear-gradient(to right, #888, #666);
  color: white;
  border: none;
  border-radius: $spacing-unit;
  cursor: pointer;
  transition: $transition;
  font-weight: 600;

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(to right, #777, #555);
  }
}

// 響應式設計
@media (max-width: 768px) {
  .site-header {
    position: static;
    width: 100%;
    text-align: center;
    padding: $spacing-unit * 2;
    flex-direction: column;
    gap: $spacing-unit * 2;
  }

  .content-wrapper {
    padding-top: 0;
  }

  .main-content.trade-content {
    width: 95%;
    padding: $spacing-unit * 2;
    margin-top: $spacing-unit * 2;
  }

  .trade-table {
    overflow-x: auto;
  }

  th,
  td {
    padding: $spacing-unit * 1.5;
    white-space: nowrap;
  }

  .sort-header {
    white-space: nowrap;
  }

  .view-button {
    padding: $spacing-unit ($spacing-unit * 1.5);
    font-size: 14px;
  }
}

.notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  display: inline-block; // 使寬度根據內容調整
  max-width: 90%; // 防止在較長文字時過寬
  width: auto; // 自動調整寬度

  padding: $spacing-unit * 3;
  border-radius: $spacing-unit * 2;
  z-index: 1000;
  text-align: center;

  word-wrap: break-word; // 長文字自動換行
  white-space: normal; // 允許文字自然換行

  animation: notificationAnimation 0.5s ease;

  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  &-success {
    background-color: #4caf50;
    color: white;
  }

  &-error {
    background-color: $error-color;
    color: white;
  }
}

@keyframes notificationAnimation {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
