// AppearanceTradeView.vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { appearanceTradeApi } from '@/services/api/appearanceTrade'
import type {
  AppearanceTrade,
  AppearanceTradeStatus,
  AppearancePaymentMethod,
  AppearanceCurrency,
} from '@/types/appearanceTrade'
import { ratingApi } from '@/services/api/rating'

import CreateAppearanceTradeModal from '@/components/CreateAppearanceTradeModal.vue'
import EditAppearanceTradeModal from '@/components/EditAppearanceTradeModal.vue'
import ReserveTradeModal from '@/components/ReserveTradeModal.vue'

// 定義可能的錯誤類型
interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

// 定義 trades
const trades = ref<AppearanceTrade[]>([])
const loading = ref(true)
const selectedTrade = ref<AppearanceTrade | null>(null)
const showAccountVerificationModal = ref(false)
const verificationMessage = ref('')
const ratedTransactions = ref<Set<string>>(new Set())
const ratingScore = ref(5)
const ratingComment = ref('')
const showPreviousRatingModal = ref(false)
const previousRating = ref<{
  score: number
  comment: string
  createdAt: string
} | null>(null)

// 定義狀態映射
const statusMap: Record<AppearanceTradeStatus, string> = {
  pending: '待交易',
  trading: '交易中',
  pending_confirmation: '待確認',
  completed: '已完成',
  cancelled: '已取消',
  deleted: '已下架',
}

const isAdmin = computed(() => {
  return userStore.currentUser?.role === 'admin'
})

// 計算表格的總列數
const totalColumns = computed(() => {
  // 基礎列數（賣家、外觀名稱、類型、幣別、價格、交易方式、操作）
  let baseColumns = 7
  // 如果是管理員，加上狀態列
  if (isAdmin.value) {
    baseColumns += 1
  }
  return baseColumns
})

// 初始化路由和用戶狀態管理
const router = useRouter()
const userStore = useUserStore()

//頁籤狀態
const currentTab = ref<'all' | 'my' | 'trading'>('all')

const sortFieldMap = {
  price: 'price',
  createdAt: 'createdAt',
} as const

const currentSort = ref({
  field: 'createdAt' as keyof typeof sortFieldMap,
  direction: 'desc' as 'asc' | 'desc',
})

const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

// 載入外觀交易列表
const loadTrades = async () => {
  try {
    loading.value = true

    const requestParams: {
      sortBy: string
      order: 'asc' | 'desc'
      status?: AppearanceTradeStatus | AppearanceTradeStatus[]
      sellerId?: string
      buyerId?: string
    } = {
      sortBy: sortFieldMap[currentSort.value.field],
      order: currentSort.value.direction,
    }

    // 根據不同頁籤設定 status
    switch (currentTab.value) {
      case 'trading':
        requestParams.status = 'trading'
        if (userStore.currentUser?.id) {
          requestParams.sellerId = userStore.currentUser.id
          requestParams.buyerId = userStore.currentUser.id
        }
        break
      case 'my':
        if (!userStore.currentUser?.id) {
          await userStore.fetchCurrentUser()
        }
        if (userStore.currentUser?.id) {
          requestParams.sellerId = userStore.currentUser.id
          requestParams.status = 'pending'
        } else {
          showNotification('無法取得用戶資訊', 'error')
          trades.value = []
          loading.value = false
          return
        }
        break
      default:
        requestParams.status = 'pending' // 全部頁籤只顯示待交易
    }

    const response = await appearanceTradeApi.getAppearanceTrades(requestParams)
    trades.value = response.data.trades
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification(
      apiError.response?.data?.message || (apiError.message as string) || '載入外觀交易列表失敗',
      'error',
    )
    trades.value = []
  } finally {
    loading.value = false
  }
}

// 帳號驗證機制
const checkAccountVerification = async (action: () => void) => {
  await userStore.fetchCurrentUser()
  const currentUser = userStore.currentUser

  if (!currentUser?.isPhoneVerified && !currentUser?.discordId) {
    verificationMessage.value = '您需要先驗證手機號碼和綁定 Discord 帳號'
    showAccountVerificationModal.value = true
    return
  }

  if (!currentUser?.isPhoneVerified) {
    verificationMessage.value = '您需要先驗證手機號碼'
    showAccountVerificationModal.value = true
    return
  }

  if (!currentUser?.discordId) {
    verificationMessage.value = '您需要先綁定 Discord 帳號'
    showAccountVerificationModal.value = true
    return
  }

  action()
}

// 處理交易
const handleReserveTrade = (trade: AppearanceTrade) => {
  checkAccountVerification(() => {
    selectedTrade.value = trade
    showReserveModal.value = true
  })
}

// 切換頁籤的方法
const switchTab = async (tab: 'all' | 'my' | 'trading') => {
  currentTab.value = tab
  if (tab === 'my' && !userStore.currentUser?.id) {
    try {
      await userStore.fetchCurrentUser()
    } catch (error: unknown) {
      const apiError = error as ApiError
      showNotification((apiError.message as string) || '載入用戶資訊失敗', 'error')
    }
  }

  await loadTrades()
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

// 格式化價格顯示
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(price)
}

// 格式化交易方式顯示
const formatPaymentMethods = (methods: AppearancePaymentMethod[] | undefined) => {
  if (!methods || methods.length === 0) return '未設定'
  return methods.join(', ')
}

// 處理排序
const handleSort = async (field: keyof typeof sortFieldMap) => {
  if (currentSort.value.field === field) {
    currentSort.value.direction = currentSort.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value.field = field
    currentSort.value.direction = 'desc'
  }

  await loadTrades()
}

// 獲取排序圖標的類別
const getSortIconClass = (field: string) => {
  if (currentSort.value.field !== field) return 'sort-icon'
  return currentSort.value.direction === 'asc' ? 'sort-icon ascending' : 'sort-icon descending'
}

// 在組件掛載時載入交易列表
onMounted(async () => {
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
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
  await loadTrades()
})

// 控制創建交易 Modal 的顯示狀態
const isCreateModalOpen = ref(false)
const showReserveModal = ref(false)

// 處理創建外觀交易的事件
const handleCreateTrade = () => {
  checkAccountVerification(() => {
    isCreateModalOpen.value = true
  })
}

// 處理表單提交
const handleSubmitTrade = async (data: {
  appearanceId: string
  price: number
  characterNickname: string
  paymentMethods: AppearancePaymentMethod[]
  currency: AppearanceCurrency
}) => {
  try {
    await appearanceTradeApi.createAppearanceTrade(data)
    isCreateModalOpen.value = false
    showNotification('外觀交易建立成功')
    await loadTrades() // 重新載入交易列表
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification((apiError.message as string) || '建立外觀交易失敗，請稍後再試', 'error')
  }
}

// 刪除交易的方法
const handleDeleteTrade = async (trade: AppearanceTrade) => {
  checkAccountVerification(async () => {
    try {
      await appearanceTradeApi.deleteTrade(trade._id)
      showNotification('外觀交易已成功刪除')
      await loadTrades()
    } catch (error: unknown) {
      const apiError = error as ApiError
      showNotification((apiError.message as string) || '刪除外觀交易失敗，請稍後再試', 'error')
    }
  })
}

// 編輯交易相關狀態和方法
const isEditModalOpen = ref(false)
const currentEditTrade = ref<AppearanceTrade | null>(null)

// 打開編輯交易彈窗
const handleEditTrade = (trade: AppearanceTrade) => {
  checkAccountVerification(() => {
    currentEditTrade.value = trade
    isEditModalOpen.value = true
  })
}

// 提交編輯交易
const handleSubmitEditTrade = async (data: {
  price: number
  paymentMethods: AppearancePaymentMethod[]
}) => {
  if (!currentEditTrade.value) return
  try {
    await appearanceTradeApi.updateTrade(currentEditTrade.value._id, data)
    isEditModalOpen.value = false
    showNotification('外觀交易更新成功')
    await loadTrades() // 重新載入交易列表
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification((apiError.message as string) || '更新外觀交易失敗，請稍後再試', 'error')
  }
}

// 確認預定外觀交易
const handleConfirmReservation = async (paymentMethod: AppearancePaymentMethod) => {
  if (selectedTrade.value) {
    try {
      const response = await appearanceTradeApi.reserveAppearanceTrade(
        selectedTrade.value._id,
        paymentMethod,
      )

      // 關閉預訂模態框
      showReserveModal.value = false

      // 跳轉到交易詳情頁面
      router.push(`/appearance-trades/${selectedTrade.value._id}`)

      // 顯示成功訊息
      showNotification('購買成功！正在前往交易詳情頁面...', 'success')
    } catch (error: unknown) {
      const apiError = error as ApiError
      // 提供更詳細的錯誤訊息
      const errorMessage = (apiError.message as string) || '購買失敗，請稍後再試'

      showNotification(errorMessage, 'error')
    }
  }
}

// 獲取外觀名稱
const getAppearanceName = (trade: AppearanceTrade) => {
  if (typeof trade.appearanceId === 'object') {
    return trade.appearanceId.officialName || '未知外觀'
  }
  return '未知外觀'
}

// 獲取外觀類型
const getAppearanceCategory = (trade: AppearanceTrade) => {
  if (typeof trade.appearanceId === 'object' && trade.appearanceId.category) {
    return trade.appearanceId.category
  }
  return '未知類型'
}

// 查看交易詳情
const handleViewTrade = (trade: AppearanceTrade) => {
  router.push(`/appearance-trades/${trade._id}`)
}

// 獲取狀態顯示
const getStatusDisplay = (status: AppearanceTradeStatus) => {
  return statusMap[status] || `未知狀態(${status})`
}

// 添加狀態標籤的樣式
const getStatusClass = (status: AppearanceTradeStatus) => {
  const classMap: Record<AppearanceTradeStatus, string> = {
    pending: 'status-pending',
    trading: 'status-trading',
    pending_confirmation: 'status-pending-confirmation',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
    deleted: 'status-deleted',
  }
  return classMap[status] || 'status-unknown'
}

// 獲取貨幣顯示
const getCurrencyDisplay = (currency: AppearanceCurrency) => {
  const currencyMap: Record<AppearanceCurrency, string> = {
    台幣: '台幣',
    人民幣: '人民幣',
    港幣: '港幣',
    遊戲幣: '遊戲幣',
  }
  return currencyMap[currency] || currency
}
</script>

<template>
  <!-- 主要內容區域 -->
  <main class="main-content trade-content">
    <!-- 頁籤和創建按鈕 -->
    <div class="table-header">
      <div class="tabs">
        <button :class="['tab', { active: currentTab === 'all' }]" @click="switchTab('all')">
          我要買外觀
        </button>
        <button :class="['tab', { active: currentTab === 'my' }]" @click="switchTab('my')">
          我的出售
        </button>
        <button
          :class="['tab', { active: currentTab === 'trading' }]"
          @click="switchTab('trading')"
        >
          交易中
        </button>
      </div>
      <button class="create-button" @click="handleCreateTrade">出售外觀</button>
    </div>

    <!-- 交易列表區域 -->
    <div class="trade-table">
      <table>
        <thead>
          <tr>
            <th>外觀名稱</th>
            <th>類型</th>
            <th>幣別</th>
            <th>
              <div class="sort-header" @click="handleSort('price')">
                價格
                <span :class="getSortIconClass('price')" />
              </div>
            </th>
            <th>交易方式</th>
            <th v-if="isAdmin">狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="totalColumns" class="status-message">載入中...</td>
          </tr>
          <tr v-else-if="trades.length === 0">
            <td :colspan="totalColumns" class="status-message">暫無外觀交易</td>
          </tr>
          <tr v-else v-for="trade in trades" :key="trade._id">
            <td>{{ getAppearanceName(trade) }}</td>
            <td>{{ getAppearanceCategory(trade) }}</td>
            <td>{{ getCurrencyDisplay(trade.currency) }}</td>
            <td>{{ formatPrice(trade.price) }}</td>
            <td v-if="currentTab !== 'trading'">
              {{ formatPaymentMethods(trade.paymentMethods) }}
            </td>
            <td v-else>
              {{ trade.selectedPaymentMethod }}
            </td>
            <td v-if="isAdmin">
              <span :class="['status-tag', getStatusClass(trade.status)]" :title="trade.status">
                {{ getStatusDisplay(trade.status) }}
              </span>
            </td>
            <td>
              <!-- 交易中頁籤的按鈕邏輯 -->
              <template v-if="currentTab === 'trading'">
                <button class="view-button" @click="handleViewTrade(trade)">查看交易</button>
              </template>

              <!-- 其他頁籤的按鈕邏輯 -->
              <template v-else>
                <template
                  v-if="
                    typeof trade.sellerId === 'object' &&
                    trade.sellerId._id === userStore.currentUser?.id
                  "
                >
                  <div class="product-actions">
                    <button class="edit-button" @click="handleEditTrade(trade)">編輯</button>
                    <button class="delete-button" @click="handleDeleteTrade(trade)">刪除</button>
                  </div>
                </template>
                <template v-else>
                  <button class="buy-button" @click="handleReserveTrade(trade)">購買</button>
                </template>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 模態框 -->
    <!-- 創建外觀交易模態框 -->
    <CreateAppearanceTradeModal v-model:isOpen="isCreateModalOpen" @submit="handleSubmitTrade" />

    <!-- 編輯外觀交易模態框 -->
    <EditAppearanceTradeModal
      v-model:isOpen="isEditModalOpen"
      :trade="currentEditTrade"
      @submit="handleSubmitEditTrade"
    />

    <!-- 預訂外觀交易模態框 -->
    <ReserveTradeModal
      v-model:isOpen="showReserveModal"
      :trade="selectedTrade"
      @confirm="handleConfirmReservation"
    />

    <!-- 帳號驗證 Modal -->
    <div v-if="showAccountVerificationModal" class="verification-modal-overlay">
      <div class="verification-modal">
        <div class="verification-modal-content">
          <h2>帳號未完成驗證</h2>
          <p>{{ verificationMessage }}</p>
          <div class="verification-modal-actions">
            <button class="cancel-button" @click="showAccountVerificationModal = false">
              取消
            </button>
            <button
              class="verify-button"
              @click="
                () => {
                  showAccountVerificationModal = false
                  router.push('/member-info?tab=security')
                }
              "
            >
              前往驗證
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知組件 -->
    <div v-if="notification.show" :class="['notification', `notification-${notification.type}`]">
      {{ notification.message }}
    </div>
  </main>
</template>

// AppearanceTradeView.vue - 繼續樣式部分
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
$admin-color: #2d66b4;
$admin-hover: #3a7bd5;

// 主要內容區域 - 交易頁面特定樣式
.main-content.trade-content {
  max-width: 1200px;
  padding: $spacing-unit * 4;
  background: #ffffff;
  border-radius: $spacing-unit * 1.5;
  box-shadow: $box-shadow;
  border: 1px solid rgba($primary-color, 0.1);
  width: 90%;
  margin: $spacing-unit * 6 auto;
  height: auto;
}

.admin-actions {
  display: flex;
  gap: $spacing-unit * 2;
  align-items: center;
}

.status-tag {
  display: inline-block;
  padding: $spacing-unit ($spacing-unit * 1.5);
  border-radius: $spacing-unit;
  font-size: 14px;
  font-weight: 500;

  &.status-pending {
    background-color: #e6f7ff;
    color: #1890ff;
    border: 1px solid #91d5ff;
  }

  &.status-trading {
    background-color: #fff7e6;
    color: #fa8c16;
    border: 1px solid #ffd591;
  }

  &.status-pending-confirmation {
    background-color: #f9f0ff;
    color: #722ed1;
    border: 1px solid #d3adf7;
  }

  &.status-completed {
    background-color: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }

  &.status-cancelled {
    background-color: #fff1f0;
    color: #f5222d;
    border: 1px solid #ffa39e;
  }

  &.status-deleted {
    background-color: #f5f5f5;
    color: #666666;
    border: 1px solid #d9d9d9;
  }

  &.status-unknown {
    background-color: #f5f5f5;
    color: #666666;
    border: 1px solid #d9d9d9;
  }
}

// 添加創建按鈕相關樣式
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-unit * 4;
  padding: 0 $spacing-unit;
}

.tabs {
  display: flex;
  gap: $spacing-unit * 2;
  flex-wrap: wrap;
}

.tab {
  background: transparent;
  border: none;
  color: #666;
  font-weight: 500;
  padding: $spacing-unit * 1.5 $spacing-unit * 2;
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
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(to right, $primary-hover, #f4282d);
  }
}

// 交易表格相關樣式
.trade-table {
  width: 100%;
  overflow-x: auto;
  background: white;
  border-radius: $spacing-unit;
  margin: $spacing-unit * 3 0;
  padding: $spacing-unit * 2;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  min-width: 800px;
  height: auto;
}

thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f8f8f8;
}

th {
  background: #f8f8f8;
  padding: $spacing-unit * 2;
  text-align: left;
  font-weight: 600;
  color: $text-color;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

th {
  padding: $spacing-unit * 2.5;
}

td {
  padding: $spacing-unit * 2;
  border-top: 1px solid #eee;
  color: $text-color;
  word-break: break-word;
}

// 排序圖標樣式
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

.buy-button {
  padding: $spacing-unit * 1.5 $spacing-unit * 2;
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

.delete-button {
  padding: $spacing-unit * 1.5 $spacing-unit * 2;
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
  padding: $spacing-unit * 4;
  font-size: 16px;
}

.view-button {
  padding: $spacing-unit * 1.5 $spacing-unit * 2;
  background: linear-gradient(to right, #4a90e2, #4a7de2);
  color: white;
  border: none;
  border-radius: $spacing-unit;
  cursor: pointer;
  transition: $transition;
  font-weight: 600;

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(to right, #4a7de2, #4a5de2);
  }

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
    padding: $spacing-unit * 1.5 $spacing-unit * 2;
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

.verification-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.verification-modal {
  background: white;
  border-radius: $spacing-unit * 2;
  width: 90%;
  max-width: 500px;
  padding: $spacing-unit * 4;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  .verification-modal-content {
    text-align: center;

    h2 {
      color: $primary-color;
      margin-bottom: $spacing-unit * 3;
    }

    p {
      color: $text-color;
      margin-bottom: $spacing-unit * 4;
      line-height: 1.6;
    }

    .verification-modal-actions {
      display: flex;
      justify-content: center;
      gap: $spacing-unit * 3;

      .cancel-button,
      .verify-button {
        padding: $spacing-unit * 1.5 $spacing-unit * 3;
        border: none;
        border-radius: $spacing-unit;
        cursor: pointer;
        transition: $transition;
        font-weight: 600;
      }

      .cancel-button {
        background: #f5f5f5;
        color: $text-color;

        &:hover {
          background: #e0e0e0;
        }
      }

      .verify-button {
        background: linear-gradient(to right, $primary-color, $primary-hover);
        color: white;

        &:hover {
          transform: translateY(-2px);
        }
      }
    }
  }
}

// 通知樣式
.notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: inline-block;
  max-width: 90%;
  width: auto;
  padding: $spacing-unit * 3;
  border-radius: $spacing-unit * 2;
  z-index: 1000;
  text-align: center;
  word-wrap: break-word;
  white-space: normal;
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

// 響應式設計
@media (max-width: 768px) {
  .main-content.trade-content {
    width: 100%;
    padding: $spacing-unit * 3;
    border-radius: $spacing-unit;
    margin: $spacing-unit * 4 auto;
  }

  .table-header {
    flex-direction: column;
    gap: $spacing-unit * 2;

    .tabs {
      overflow-x: auto;
      padding-bottom: $spacing-unit;
      width: 100%;
      justify-content: flex-start;
    }

    .create-button {
      width: 100%;
      justify-content: center;
    }
  }

  .trade-table {
    overflow-x: auto;
    padding: $spacing-unit;
    margin: $spacing-unit * 2 0;
  }

  th,
  td {
    padding: $spacing-unit;
    font-size: 14px;
  }

  .view-button,
  .buy-button,
  .edit-button,
  .delete-button {
    padding: $spacing-unit ($spacing-unit * 1.5);
    font-size: 14px;
  }
}
</style>
