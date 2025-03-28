// view/AppearanceTradeDetailView.vue
<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { appearanceTradeApi } from '@/services/api/appearanceTrade'
import { uploadImageToFirebase } from '@/firebase/storage'
import type { AppearanceTrade, AppearanceTradeStatus } from '@/types/appearanceTrade'

// 定義可能的錯誤類型
interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

// 定義消息發送者的類型
interface MessageSender {
  _id: string
  name?: string
}

// 獲取路由參數
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const tradeId = route.params.id as string

// 反應式狀態
const trade = ref<AppearanceTrade | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const message = ref('')
const isSendingMessage = ref(false)
const cancelReason = ref('')
const showCancelModal = ref(false)
const isConfirming = ref(false)
const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

// 訊息圖片相關的狀態
const messageImageFile = ref<File | null>(null)
const messageImagePreview = ref<string | null>(null)
const isUploadingMessageImage = ref(false)

// 計算屬性
const isSeller = computed(() => {
  if (!trade.value || !userStore.currentUser) return false
  return typeof trade.value.sellerId === 'object'
    ? trade.value.sellerId._id === userStore.currentUser.id
    : trade.value.sellerId === userStore.currentUser.id
})

const isBuyer = computed(() => {
  if (!trade.value || !userStore.currentUser || !trade.value.buyerId) return false
  return typeof trade.value.buyerId === 'object'
    ? trade.value.buyerId._id === userStore.currentUser.id
    : trade.value.buyerId === userStore.currentUser.id
})

const isTradeParticipant = computed(() => isSeller.value || isBuyer.value)

const canSendMessage = computed(() => {
  return (
    isTradeParticipant.value &&
    trade.value &&
    trade.value.status !== 'completed' &&
    trade.value.status !== 'cancelled' &&
    trade.value.status !== 'deleted'
  )
})

const canConfirmTransaction = computed(() => {
  return (
    trade.value &&
    (trade.value.status === 'trading' || trade.value.status === 'pending_confirmation') &&
    ((isSeller.value && !trade.value.sellerConfirmed) ||
      (isBuyer.value && !trade.value.buyerConfirmed))
  )
})

const canCancelTransaction = computed(() => {
  return (
    isTradeParticipant.value &&
    trade.value &&
    (trade.value.status === 'trading' || trade.value.status === 'pending_confirmation')
  )
})

// 獲取發送者的名稱
const getSenderName = (sender: string | MessageSender): string => {
  if (typeof sender === 'object' && sender !== null) {
    return sender.name || '未知用戶'
  }

  // 如果 sender 是 ID，嘗試在交易對象中查找
  if (trade.value) {
    // 檢查是否是賣家
    if (
      typeof trade.value.sellerId === 'object' &&
      trade.value.sellerId !== null &&
      trade.value.sellerId._id === sender
    ) {
      return trade.value.sellerId.name || '賣家'
    }

    // 檢查是否是買家
    if (
      typeof trade.value.buyerId === 'object' &&
      trade.value.buyerId !== null &&
      trade.value.buyerId._id === sender
    ) {
      return trade.value.buyerId.name || '買家'
    }
  }

  // 如果找不到匹配，使用角色名稱
  return isSeller.value && sender === userStore.currentUser?.id
    ? '我(賣家)'
    : isBuyer.value && sender === userStore.currentUser?.id
      ? '我(買家)'
      : '用戶'
}

// 獲取發送者頭像的首字母
const getSenderInitial = (sender: string | MessageSender): string => {
  const name = getSenderName(sender)
  return name.charAt(0) || '?'
}

const statusText = computed(() => {
  if (!trade.value) return ''
  const statusMap: Record<AppearanceTradeStatus, string> = {
    pending: '待交易',
    trading: '交易中',
    pending_confirmation: '待確認',
    completed: '已完成',
    cancelled: '已取消',
    deleted: '已下架',
  }
  return statusMap[trade.value.status] || trade.value.status
})

const statusClass = computed(() => {
  if (!trade.value) return ''
  const classMap: Record<AppearanceTradeStatus, string> = {
    pending: 'status-pending',
    trading: 'status-trading',
    pending_confirmation: 'status-pending-confirmation',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
    deleted: 'status-deleted',
  }
  return classMap[trade.value.status] || ''
})

// 方法
async function fetchTradeDetails() {
  loading.value = true
  error.value = null

  try {
    const response = await appearanceTradeApi.getAppearanceTradeById(tradeId)
    trade.value = response.data.trade
  } catch (err) {
    console.error('獲取交易詳情失敗:', err)
    const apiError = err as ApiError
    error.value =
      apiError.response?.data?.message || apiError.message || '無法載入交易詳情，請稍後再試。'
  } finally {
    loading.value = false
  }
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

async function sendMessage() {
  if (!message.value.trim() || isSendingMessage.value) return

  isSendingMessage.value = true
  try {
    const response = await appearanceTradeApi.sendMessage(tradeId, message.value)
    trade.value = response.data.trade
    message.value = ''
    showNotification('訊息發送成功')
  } catch (err) {
    console.error('發送訊息失敗:', err)
    const apiError = err as ApiError
    showNotification(
      apiError.response?.data?.message || apiError.message || '訊息發送失敗，請稍後再試。',
      'error',
    )
  } finally {
    isSendingMessage.value = false
  }
}

async function confirmTransaction() {
  if (isConfirming.value) return

  isConfirming.value = true
  try {
    const method = isSeller.value ? 'sellerConfirmTrade' : 'buyerConfirmTrade'
    const response = await appearanceTradeApi[method](tradeId)
    trade.value = response.data.trade
    showNotification('交易確認成功')
  } catch (err) {
    console.error('確認交易失敗:', err)
    const apiError = err as ApiError
    showNotification(
      apiError.response?.data?.message || apiError.message || '無法確認交易，請稍後再試。',
      'error',
    )
  } finally {
    isConfirming.value = false
  }
}

async function cancelTransaction() {
  try {
    const response = await appearanceTradeApi.cancelTrade(tradeId, cancelReason.value)
    trade.value = response.data.trade
    showCancelModal.value = false
    cancelReason.value = ''
    showNotification('交易已取消')
  } catch (err) {
    console.error('取消交易失敗:', err)
    const apiError = err as ApiError
    showNotification(
      apiError.response?.data?.message || apiError.message || '無法取消交易，請稍後再試。',
      'error',
    )
  }
}

// 生命週期鉤子
onMounted(() => {
  fetchTradeDetails()
})

// 定時刷新交易詳情
let refreshInterval: number | null = null

onMounted(() => {
  fetchTradeDetails()

  // 每60秒自動刷新一次
  refreshInterval = window.setInterval(() => {
    if (trade.value && ['trading', 'pending_confirmation'].includes(trade.value.status)) {
      fetchTradeDetails()
    }
  }, 60000)
})

// 組件卸載時清除定時器
onUnmounted(() => {
  if (refreshInterval !== null) {
    clearInterval(refreshInterval)
  }

  // 清理預覽URL
  if (messageImagePreview.value) {
    URL.revokeObjectURL(messageImagePreview.value)
  }
})

// 格式化時間的輔助函數
function formatDate(dateString: string | Date) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

// 監聽路由變化，重新獲取數據
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      fetchTradeDetails()
    }
  },
)

// 獲取外觀名稱
const getAppearanceName = computed(() => {
  if (!trade.value) return '未知外觀'
  if (typeof trade.value.appearanceId === 'object') {
    return trade.value.appearanceId.officialName || '未知外觀'
  }
  return '未知外觀'
})

// 獲取外觀類型
const getAppearanceCategory = computed(() => {
  if (!trade.value) return '未知類型'
  if (typeof trade.value.appearanceId === 'object' && trade.value.appearanceId.category) {
    return trade.value.appearanceId.category
  }
  return '未知類型'
})

// 獲取外觀圖片
const getAppearanceImage = computed(() => {
  if (!trade.value) return null
  if (typeof trade.value.appearanceId === 'object' && trade.value.appearanceId.imageUrl) {
    return trade.value.appearanceId.imageUrl
  }
  return null
})

// 交易確認狀態信息
const confirmationStatus = computed(() => {
  if (!trade.value) return { seller: false, buyer: false }
  return {
    seller: trade.value.sellerConfirmed,
    buyer: trade.value.buyerConfirmed,
  }
})

// 獲取賣家名稱和聯絡方式
const getSellerInfo = computed(() => {
  if (!trade.value) return { name: '未知賣家' }
  if (typeof trade.value.sellerId === 'object') {
    return {
      name: trade.value.sellerId.name || '未知賣家',
    }
  }
  return { name: '未知賣家' }
})

// 獲取買家名稱和聯絡方式
const getBuyerInfo = computed(() => {
  if (!trade.value || !trade.value.buyerId) return { name: '無買家' }
  if (typeof trade.value.buyerId === 'object') {
    return {
      name: trade.value.buyerId.name || '未知買家',
    }
  }
  return { name: '未知買家' }
})

// 處理訊息圖片選擇
function handleMessageImageSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    messageImageFile.value = target.files[0]

    // 創建預覽URL
    if (messageImagePreview.value) {
      URL.revokeObjectURL(messageImagePreview.value)
    }
    messageImagePreview.value = URL.createObjectURL(messageImageFile.value)
  }
}

// 取消圖片選擇
function cancelMessageImage() {
  messageImageFile.value = null
  if (messageImagePreview.value) {
    URL.revokeObjectURL(messageImagePreview.value)
    messageImagePreview.value = null
  }
}

// 發送圖片訊息
async function sendImageMessage() {
  if (!messageImageFile.value || isUploadingMessageImage.value) return

  isUploadingMessageImage.value = true
  try {
    // 上傳圖片到Firebase
    const imagePath = `appearance-trades/${tradeId}/messages/${Date.now()}`
    const imageUrl = await uploadImageToFirebase(messageImageFile.value, imagePath)

    // 將圖片URL作為特殊格式訊息發送
    // 例如: [image]圖片URL[/image]
    const imageMessage = `[image]${imageUrl}[/image]`
    const response = await appearanceTradeApi.sendMessage(tradeId, imageMessage)
    trade.value = response.data.trade

    // 清除圖片預覽和檔案
    cancelMessageImage()
    showNotification('圖片已發送')
  } catch (err) {
    console.error('發送圖片訊息失敗:', err)
    const apiError = err as ApiError
    showNotification(
      apiError.response?.data?.message || apiError.message || '圖片發送失敗，請稍後再試。',
      'error',
    )
  } finally {
    isUploadingMessageImage.value = false
  }
}

// 判斷訊息是否為圖片訊息的輔助函數
function isImageMessage(content: string): boolean {
  return content.startsWith('[image]') && content.endsWith('[/image]')
}

// 從圖片訊息中提取圖片URL
function extractImageUrl(content: string): string {
  return content.replace('[image]', '').replace('[/image]', '')
}

// 檢查訊息並釋放資源
onUnmounted(() => {
  if (refreshInterval !== null) {
    clearInterval(refreshInterval)
  }

  if (messageImagePreview.value) {
    URL.revokeObjectURL(messageImagePreview.value)
  }
})
</script>

<template>
  <div class="appearance-trade-detail">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>載入中...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button class="primary-button" @click="fetchTradeDetails">重新載入</button>
    </div>

    <div v-else-if="trade" class="trade-container">
      <!-- 頁面導航 -->
      <div class="page-header">
        <button class="back-button" @click="router.go(-1)"><span>&#8592;</span> 返回列表</button>
      </div>

      <!-- 頁面標題區域 -->
      <div class="page-title-section">
        <div class="title-status-container">
          <h1 class="page-title">交易詳情</h1>
          <div class="trade-status" :class="statusClass">{{ statusText }}</div>
        </div>

        <div class="header-actions-container" v-if="canConfirmTransaction || canCancelTransaction">
          <!-- 交易確認狀態 -->
          <div class="confirmation-status-inline">
            <span class="confirmation-label">交易確認 </span>
            <div class="status-indicator" :class="{ confirmed: confirmationStatus.seller }">
              <span class="status-icon">{{ confirmationStatus.seller ? '✓' : '○' }}</span>
              <span class="status-label">賣家</span>
            </div>
            <div class="status-indicator" :class="{ confirmed: confirmationStatus.buyer }">
              <span class="status-icon">{{ confirmationStatus.buyer ? '✓' : '○' }}</span>
              <span class="status-label">買家</span>
            </div>
          </div>

          <!-- 操作按鈕 -->
          <div class="header-actions">
            <button
              v-if="canConfirmTransaction"
              class="header-action-button confirm-button"
              @click="confirmTransaction"
              :disabled="isConfirming"
            >
              <span v-if="!isConfirming">{{ isSeller ? '賣家確認交易' : '買家確認交易' }}</span>
              <span v-else>確認中...</span>
            </button>

            <button
              v-if="canCancelTransaction"
              class="header-action-button cancel-button"
              @click="showCancelModal = true"
            >
              取消交易
            </button>
          </div>
        </div>
      </div>

      <!-- 主要內容區域 -->
      <div class="trade-content-area">
        <!-- 左側區域 -->
        <div class="trade-left-column">
          <!-- 外觀信息卡片 -->
          <div class="info-card appearance-card">
            <h2 class="card-title">外觀資訊</h2>
            <div class="appearance-info">
              <div class="appearance-image-container">
                <div v-if="getAppearanceImage" class="appearance-image">
                  <img :src="getAppearanceImage" :alt="getAppearanceName" />
                </div>
                <div v-else class="appearance-image appearance-placeholder">
                  <span>尚無圖片</span>
                </div>
              </div>
              <div class="appearance-details">
                <h3 class="appearance-name">{{ getAppearanceName }}</h3>
                <div class="appearance-category">分類：{{ getAppearanceCategory }}</div>
                <div
                  class="appearance-nicknames"
                  v-if="
                    typeof trade.appearanceId === 'object' &&
                    trade.appearanceId.nicknames &&
                    trade.appearanceId.nicknames.length > 0
                  "
                >
                  <span>別名：{{ trade.appearanceId.nicknames.join('、') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 交易詳情卡片 -->
          <div class="info-card trade-details-card">
            <h2 class="card-title">交易詳情</h2>
            <div class="detail-content">
              <div class="detail-row">
                <div class="detail-item">
                  <span class="detail-label">交易價格：</span>
                  <span class="detail-value price">{{ trade.price }} {{ trade.currency }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">支付方式：</span>
                  <span class="detail-value">{{
                    trade.selectedPaymentMethod || trade.paymentMethods.join('、')
                  }}</span>
                </div>
              </div>

              <div class="detail-row">
                <div class="detail-item">
                  <span class="detail-label">賣家：</span>
                  <span class="detail-value">{{ getSellerInfo.name }}</span>
                </div>
                <div class="detail-item" v-if="trade.buyerId">
                  <span class="detail-label">買家：</span>
                  <span class="detail-value">{{ getBuyerInfo.name }}</span>
                </div>
              </div>

              <!-- 付款證明展示 -->
              <div class="payment-proof-section" v-if="trade.paymentProof">
                <h3 class="section-title">付款證明</h3>
                <div class="payment-proof">
                  <div class="payment-proof-image">
                    <img :src="trade.paymentProof.imageUrl" alt="付款證明" />
                  </div>
                  <div class="payment-proof-info">
                    <div class="upload-time">
                      上傳時間：{{ formatDate(trade.paymentProof.uploadTime) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側訊息區域 -->
        <div class="trade-right-column">
          <div class="messages-container">
            <h2 class="messages-title">交易訊息</h2>

            <div class="security-notice">
              <div class="notice-icon">⚠️</div>
              <div class="notice-text">
                <strong>注意：</strong
                >交易過程中請務必提高警惕,謹防詐騙。所有交易風險由買賣雙方自行承擔,本平台不承擔任何法律責任。如遇可疑情況，請立即取消交易並聯繫管理員。
              </div>
            </div>

            <div class="messages-box">
              <div class="messages-list" v-if="trade.messages && trade.messages.length > 0">
                <div
                  v-for="(msg, index) in trade.messages"
                  :key="index"
                  class="message-item"
                  :class="{
                    'my-message':
                      (typeof msg.sender === 'object' ? msg.sender._id : msg.sender) ===
                      userStore.currentUser?.id,
                    'other-message':
                      (typeof msg.sender === 'object' ? msg.sender._id : msg.sender) !==
                      userStore.currentUser?.id,
                  }"
                >
                  <div class="message-avatar">
                    {{ getSenderInitial(msg.sender) }}
                  </div>
                  <div class="message-content">
                    <div class="message-header">
                      <span class="message-sender">
                        {{ getSenderName(msg.sender) }}
                      </span>
                      <span class="message-time"> {{ formatDate(msg.timestamp) }} </span>
                    </div>
                    <!-- 處理不同類型的訊息內容 -->
                    <div v-if="isImageMessage(msg.content)" class="message-image">
                      <img :src="extractImageUrl(msg.content)" alt="圖片訊息" />
                    </div>
                    <div v-else class="message-text">{{ msg.content }}</div>
                  </div>
                </div>
              </div>

              <div class="no-messages" v-else>
                <p>暫無交易訊息</p>
              </div>
            </div>

            <div class="message-input-container" v-if="canSendMessage">
              <div class="message-input-wrapper">
                <!-- 圖片預覽區域 -->
                <div v-if="messageImagePreview" class="message-image-preview">
                  <img :src="messageImagePreview" alt="圖片預覽" />
                  <button class="cancel-image-button" @click="cancelMessageImage">✕</button>
                  <button
                    class="send-image-button"
                    @click="sendImageMessage"
                    :disabled="isUploadingMessageImage"
                  >
                    {{ isUploadingMessageImage ? '發送中...' : '發送圖片' }}
                  </button>
                </div>

                <!-- 文字訊息輸入區域 -->
                <div class="message-text-input" :class="{ 'with-preview': messageImagePreview }">
                  <textarea
                    v-model="message"
                    placeholder="輸入訊息..."
                    @keyup.enter.ctrl="sendMessage"
                    class="message-input"
                  ></textarea>
                  <div class="message-controls">
                    <div class="message-tip">Ctrl + Enter 快速發送</div>
                    <div class="message-actions">
                      <label class="upload-image-button" title="上傳圖片">
                        <input
                          type="file"
                          accept="image/*"
                          @change="handleMessageImageSelect"
                          class="file-input"
                        />
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </label>
                      <button
                        class="send-button"
                        @click="sendMessage"
                        :disabled="!message.trim() || isSendingMessage"
                      >
                        {{ isSendingMessage ? '發送中...' : '發送' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 取消交易確認彈窗 -->
    <div class="modal-overlay" v-if="showCancelModal">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">確定要取消此交易嗎？</h3>
        <p class="modal-description">請提供取消原因以便對方了解情況：</p>
        <textarea
          v-model="cancelReason"
          placeholder="請輸入取消原因..."
          rows="4"
          class="modal-textarea"
        ></textarea>
        <div class="modal-actions">
          <button class="secondary-button" @click="showCancelModal = false">返回</button>
          <button class="danger-button" @click="cancelTransaction" :disabled="!cancelReason.trim()">
            確定取消交易
          </button>
        </div>
      </div>
    </div>

    <!-- 通知組件 -->
    <div v-if="notification.show" :class="['notification', `notification-${notification.type}`]">
      {{ notification.message }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 基礎變數
$primary-color: #b4282d;
$primary-hover: #d4282d;
$secondary-color: #2d6987;
$secondary-hover: #1e5b79;
$background-color: #f5f5f5;
$text-color: #333333;
$text-light: #666666;
$text-lighter: #999999;
$error-color: #ff4d4f;
$error-hover: #ff7875;
$success-color: #52c41a;
$success-dark: #389e0d;
$warning-color: #faad14;
$warning-dark: #d48806;
$border-color: #e0e0e0;
$card-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
$transition: all 0.3s ease;

.appearance-trade-detail {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: $background-color;
  min-height: calc(100vh - 40px);

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    text-align: center;
    padding: 30px;
    background: white;
    border-radius: 8px;
    box-shadow: $card-shadow;

    .loading-spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top: 4px solid $primary-color;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  }

  .trade-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  // 頁面頭部
  .page-header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 10px;

    .back-button {
      display: inline-flex;
      align-items: center;
      background: white;
      border: none;
      color: $text-color;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      transition: $transition;

      span {
        margin-right: 8px;
        font-size: 18px;
      }

      &:hover {
        background-color: #f9f9f9;
        color: $primary-color;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }

  // 頁面標題區域
  .page-title-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .title-status-container {
      display: flex;
      align-items: center;
    }

    .page-title {
      font-size: 24px;
      font-weight: 700;
      color: $primary-color;
      margin: 0;
      margin-right: 16px;
    }

    .trade-status {
      padding: 5px 12px;
      border-radius: 16px;
      font-weight: 500;
      font-size: 13px;
      color: white;

      &.status-pending {
        background-color: $warning-color;
      }

      &.status-trading {
        background-color: $primary-color;
      }

      &.status-pending-confirmation {
        background-color: $secondary-color;
      }

      &.status-completed {
        background-color: $success-color;
      }

      &.status-cancelled {
        background-color: $error-color;
      }

      &.status-deleted {
        background-color: $text-lighter;
      }
    }

    // 新增的容器以包裹確認狀態和操作按鈕
    .header-actions-container {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    // 修改的確認狀態樣式，使其與操作按鈕更一致
    .confirmation-status-inline {
      display: flex;
      align-items: center;
      background-color: #f0f0f0; // 更改為淺灰色背景
      border-radius: 4px; // 與按鈕保持一致的圓角
      padding: 8px 16px; // 與按鈕相同的內部填充
      border: none; // 移除邊框
      height: 36px; // 指定高度與按鈕一致
      white-space: nowrap; // 防止文字換行

      .confirmation-label {
        font-size: 14px; // 調整字體大小
        color: $text-color; // 更深的文字顏色
        margin-right: 10px;
        font-weight: 500;
      }

      .status-indicator {
        display: flex;
        align-items: center;
        margin-right: 10px;
        &:last-child {
          margin-right: 0;
        }

        .status-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          background-color: #e0e0e0; // 更深的背景色
          color: $text-light;
          border: none; // 移除邊框
          margin-right: 4px;
          transition: $transition;
        }

        .status-label {
          font-size: 14px; // 調整與按鈕一致
          color: $text-color; // 更深的文字顏色
        }

        &.confirmed {
          .status-icon {
            background-color: $success-color;
            color: white;
          }

          .status-label {
            color: $success-dark;
            font-weight: 500;
          }
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;

      .header-action-button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: $transition;
        white-space: nowrap;
        display: flex;
        align-items: center;
        height: 36px; // 明確指定高度
      }

      .confirm-button {
        background-color: $secondary-color;
        color: white;

        &:hover:not(:disabled) {
          background-color: $secondary-hover;
        }

        &:disabled {
          background-color: #b2b2b2;
          cursor: not-allowed;
        }
      }

      .cancel-button {
        background-color: $error-color;
        color: white;

        &:hover {
          background-color: $error-hover;
        }
      }
    }
  }

  // 響應式設計調整
  @media (max-width: 768px) {
    .page-title-section {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;

      .header-actions-container {
        width: 100%;
        flex-direction: column;
        gap: 12px;
      }

      .confirmation-status-inline {
        width: 100%;
        justify-content: center; // 在移動端居中顯示
      }

      .header-actions {
        width: 100%;

        .header-action-button {
          flex: 1;
          justify-content: center;
        }
      }
    }
  }

  // 主要內容區域
  .trade-content-area {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 20px;
  }

  // 左側列
  .trade-left-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  // 右側列
  .trade-right-column {
    display: flex;
    flex-direction: column;
  }

  // 通用卡片樣式
  .info-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: $card-shadow;
    overflow: hidden;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      padding: 14px 20px;
      border-bottom: 1px solid $border-color;
      color: $text-color;
    }
  }

  // 外觀信息卡片
  .appearance-card {
    .appearance-info {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .appearance-image-container {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        height: auto;

        .appearance-image {
          width: 100%;
          max-width: 710px;
          height: auto;
          aspect-ratio: 710 / 400;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid $border-color;

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          &.appearance-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f0f0f0;
            color: $text-lighter;
            font-size: 16px;
            min-height: 200px;
          }
        }
      }

      .appearance-details {
        .appearance-name {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: $text-color;
        }

        .appearance-category,
        .appearance-nicknames {
          font-size: 14px;
          color: $text-light;
          margin-bottom: 6px;
          line-height: 1.4;
        }
      }
    }
  }

  // 交易詳情卡片
  .trade-details-card {
    .detail-content {
      padding: 16px 20px;

      .detail-row {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .detail-item {
        flex: 1;
        min-width: 180px;

        .detail-label {
          font-size: 14px;
          color: $text-light;
          margin-right: 6px;
        }

        .detail-value {
          font-size: 15px;
          font-weight: 500;
          color: $text-color;

          &.price {
            color: $primary-color;
            font-size: 18px;
            font-weight: 600;
          }
        }
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        margin: 16px 0 12px;
        color: $text-color;
        border-bottom: 1px solid $border-color;
        padding-bottom: 8px;
      }

      .payment-proof {
        .payment-proof-image {
          margin-bottom: 12px;
          border-radius: 6px;
          border: 1px solid $border-color;
          overflow: hidden;
          text-align: center;

          img {
            max-width: 100%;
            max-height: 200px;
          }
        }

        .payment-proof-info {
          font-size: 14px;
          color: $text-light;
        }
      }

      // 交易操作區域樣式
      .trade-actions-section {
        margin-top: 24px;

        .trade-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;

          .action-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #fafafa;
            border-radius: 8px;
            padding: 16px;
            transition: $transition;
            border-left: 4px solid transparent;

            &:hover {
              background-color: #f5f5f5;
            }

            &.confirm-action {
              border-left-color: $secondary-color;
            }

            &.cancel-action {
              border-left-color: $error-color;
            }

            .action-info {
              flex: 1;

              .action-title {
                font-size: 16px;
                font-weight: 600;
                margin: 0 0 6px 0;
                color: $text-color;
              }

              .action-description {
                font-size: 14px;
                color: $text-light;
                margin: 0 0 12px 0;
                line-height: 1.4;
              }

              .confirmation-status {
                display: flex;
                gap: 20px;
                margin-top: 8px;

                .status-item {
                  display: flex;
                  align-items: center;
                  font-size: 14px;
                  color: $text-light;

                  &.confirmed {
                    color: $success-dark;
                    font-weight: 500;
                  }

                  .status-icon {
                    margin-right: 6px;
                    font-weight: bold;
                  }
                }
              }
            }

            .confirm-button,
            .cancel-button {
              padding: 8px 20px;
              border: none;
              border-radius: 4px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: $transition;
              white-space: nowrap;
            }

            .confirm-button {
              background-color: $secondary-color;
              color: white;

              &:hover:not(:disabled) {
                background-color: $secondary-hover;
              }

              &:disabled {
                background-color: #b2b2b2;
                cursor: not-allowed;
              }
            }

            .cancel-button {
              background-color: $error-color;
              color: white;

              &:hover {
                background-color: $error-hover;
              }
            }
          }
        }
      }
    }
  }

  // 訊息容器
  .messages-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: $card-shadow;
    display: flex;
    flex-direction: column;
    height: 100%;

    .messages-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      padding: 14px 20px;
      border-bottom: 1px solid $border-color;
      color: $text-color;
    }

    .security-notice {
      display: flex;
      padding: 12px 20px;
      background-color: rgba($warning-color, 0.05);
      border-bottom: 1px solid rgba($warning-color, 0.2);

      .notice-icon {
        margin-right: 12px;
        font-size: 16px;
      }

      .notice-text {
        font-size: 13px;
        color: $text-light;
        line-height: 1.5;

        strong {
          color: $warning-dark;
        }
      }
    }

    .messages-box {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      height: 400px;
      overflow-y: auto;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .message-item {
        display: flex;
        gap: 12px;
        max-width: 80%;

        &.my-message {
          align-self: flex-end;
          flex-direction: row-reverse;

          .message-avatar {
            margin-left: 0;
            margin-right: 0;
          }

          .message-content {
            background-color: rgba($primary-color, 0.1);

            .message-header {
              flex-direction: row-reverse;
            }
          }
        }

        &.other-message {
          align-self: flex-start;

          .message-content {
            background-color: #f0f0f0;
          }
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: $primary-color;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 16px;
          font-weight: 500;
          flex-shrink: 0;
        }

        .message-content {
          border-radius: 8px;
          padding: 12px;
          flex: 1;

          .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;

            .message-sender {
              font-size: 13px;
              font-weight: 600;
              color: $text-color;
              margin-right: 8px;
            }

            .message-time {
              font-size: 12px;
              color: $text-lighter;
            }
          }

          .message-text {
            font-size: 14px;
            line-height: 1.5;
            color: $text-color;
            word-break: break-word;
          }

          .message-image {
            margin-top: 4px;

            img {
              max-width: 100%;
              max-height: 200px;
              border-radius: 4px;
              cursor: pointer;
              transition: $transition;

              &:hover {
                opacity: 0.9;
              }
            }
          }
        }
      }
    }

    .no-messages {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40px 0;
      color: $text-lighter;
      font-size: 14px;
      flex-grow: 1;
    }

    // 新增和修改的樣式
    .message-input-container {
      padding: 16px 20px;
      border-top: 1px solid $border-color;
      margin-top: auto;

      // 新增包裝器元素樣式
      .message-input-wrapper {
        display: flex;
        flex-direction: column;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      // 圖片預覽區域 - 更新為像 Claude 界面風格
      .message-image-preview {
        position: relative;
        border-radius: 8px 8px 0 0;
        padding: 16px;
        background-color: white;
        border: 1px solid $border-color;
        border-bottom: none;

        img {
          max-width: 100%;
          max-height: 300px;
          border-radius: 4px;
          display: block;
          margin: 0 auto;
          object-fit: contain;
        }

        .cancel-image-button {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: $transition;
          z-index: 5;

          &:hover {
            background-color: rgba(0, 0, 0, 0.8);
          }
        }

        .send-image-button {
          position: absolute;
          bottom: 16px;
          right: 16px;
          background-color: $primary-color;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: $transition;

          &:hover:not(:disabled) {
            background-color: $primary-hover;
          }

          &:disabled {
            background-color: #b2b2b2;
            cursor: not-allowed;
          }
        }
      }

      // 文字輸入區域 - 修改以配合圖片預覽
      .message-text-input {
        border: 1px solid $border-color;
        border-radius: 8px;
        background-color: white;

        // 當有圖片預覽時的特殊樣式
        &.with-preview {
          border-top: none;
          border-radius: 0 0 8px 8px;
        }

        .message-input {
          width: 100%;
          min-height: 60px;
          max-height: 120px;
          padding: 12px 16px;
          border: none;
          border-bottom: 1px solid $border-color;
          border-radius: 8px 8px 0 0;
          resize: none;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;

          // 當有圖片預覽時取消上圓角
          .with-preview & {
            border-radius: 0;
          }

          &:focus {
            outline: none;
            border-color: $border-color;
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
          }
        }

        .message-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;

          .message-tip {
            font-size: 12px;
            color: $text-lighter;
          }

          .message-actions {
            display: flex;
            align-items: center;
            gap: 8px;

            .upload-image-button {
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              background-color: transparent;
              border-radius: 4px;
              transition: $transition;

              &:hover {
                background-color: #f0f0f0;
              }

              svg {
                color: $text-light;
              }

              .file-input {
                display: none;
              }
            }

            .send-button {
              background-color: $primary-color;
              color: white;
              border: none;
              border-radius: 4px;
              padding: 6px 16px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: $transition;

              &:hover:not(:disabled) {
                background-color: $primary-hover;
              }

              &:disabled {
                background-color: #cccccc;
                color: #f5f5f5;
                cursor: not-allowed;
              }
            }
          }
        }
      }
    }
  }

  // 取消交易彈窗
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;

    .modal-content {
      background: white;
      border-radius: 8px;
      padding: 24px;
      width: 90%;
      max-width: 480px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);

      .modal-title {
        margin: 0 0 12px;
        font-size: 18px;
        font-weight: 600;
        color: $text-color;
      }

      .modal-description {
        margin: 0 0 16px;
        color: $text-light;
        font-size: 14px;
      }

      .modal-textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid $border-color;
        border-radius: 4px;
        resize: vertical;
        font-family: inherit;
        font-size: 14px;
        min-height: 100px;
        margin-bottom: 20px;

        &:focus {
          outline: none;
          border-color: $primary-color;
        }
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
    }
  }

  // 通知樣式
  .notification {
    position: fixed;
    top: 24px;
    right: 24px;
    display: inline-block;
    max-width: 300px;
    width: auto;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 1000;
    text-align: center;
    word-wrap: break-word;
    white-space: normal;
    animation: fadeInRight 0.3s ease;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    font-size: 14px;

    &-success {
      background-color: #f6ffed;
      border: 1px solid #b7eb8f;
      color: $success-color;
    }

    &-error {
      background-color: #fff2f0;
      border: 1px solid #ffccc7;
      color: $error-color;
    }
  }

  @keyframes fadeInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .primary-button {
    background-color: $primary-color;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: $transition;

    &:hover:not(:disabled) {
      background-color: $primary-hover;
    }

    &:disabled {
      background-color: #b2b2b2;
      cursor: not-allowed;
    }
  }

  .secondary-button {
    background-color: white;
    color: $text-color;
    border: 1px solid $border-color;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: $transition;

    &:hover:not(:disabled) {
      background-color: #f5f5f5;
    }

    &:disabled {
      color: #b2b2b2;
      cursor: not-allowed;
    }
  }

  .danger-button {
    background-color: $error-color;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: $transition;

    &:hover:not(:disabled) {
      background-color: $error-hover;
    }

    &:disabled {
      background-color: #b2b2b2;
      cursor: not-allowed;
    }
  }

  // 響應式調整
  @media (max-width: 1200px) {
    .appearance-card {
      .appearance-info {
        .appearance-image-container {
          .appearance-image {
            width: 100%;
            max-width: 710px;
          }
        }
      }
    }
  }

  @media (max-width: 992px) {
    .trade-content-area {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    padding: 16px;

    .message-input-container {
      .message-text-input {
        .message-controls {
          .message-tip {
            display: none; // 在小螢幕上隱藏提示
          }
        }
      }
    }

    .trade-details-card {
      .detail-content {
        .trade-actions-section {
          .trade-actions {
            .action-item {
              flex-direction: column;
              align-items: flex-start;

              .action-info {
                margin-bottom: 16px;
                width: 100%;
              }

              .confirm-button,
              .cancel-button {
                width: 100%;
              }
            }
          }
        }
      }
    }

    .appearance-card {
      .appearance-info {
        .appearance-image-container {
          height: auto;

          .appearance-image {
            height: auto;
            max-height: 400px;
          }
        }
      }
    }

    .page-title-section {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;

      .header-actions-container {
        width: 100%;
        flex-direction: column;
        gap: 12px;
      }

      .confirmation-status-inline {
        width: 100%;
        justify-content: center; // 在移動端居中顯示
      }

      .header-actions {
        width: 100%;

        .header-action-button {
          flex: 1;
          justify-content: center;
        }
      }
    }
  }

  @media (max-width: 480px) {
    .message-input-container {
      padding: 12px;

      .message-text-input {
        .message-controls {
          flex-direction: row;
          padding: 8px;

          .message-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      }
    }
  }
}
</style>
