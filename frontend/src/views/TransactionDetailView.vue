<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { transactionApi } from '@/services/api/transaction'
import type { Transaction } from '@/services/api/transaction'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const transaction = ref<Transaction | null>(null)
const newMessage = ref('')
const loading = ref(true)
const error = ref<string | null>(null)
const permissionDenied = ref(false) // 新增權限被拒絕的狀態

// 載入交易詳情
const loadTransactionDetails = async () => {
  try {
    loading.value = true
    error.value = null
    permissionDenied.value = false

    const response = await transactionApi.getTransactionDetails(route.params.id as string)
    transaction.value = response.data
  } catch (err: unknown) {
    console.error('載入交易詳情錯誤:', err)

    const errorMessage = String(err)

    // 檢查是否為權限錯誤
    if (errorMessage.includes('權限') || errorMessage.includes('沒有權限')) {
      permissionDenied.value = true
      error.value = errorMessage
    } else {
      error.value = errorMessage
    }
  } finally {
    loading.value = false
  }
}

// 發送訊息
const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  try {
    await transactionApi.sendMessage(route.params.id as string, newMessage.value)
    newMessage.value = ''
    await loadTransactionDetails() // 重新載入交易詳情以更新訊息
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : '發送訊息失敗'
  }
}

// 格式化時間
const formatTime = (timestamp: Date | string) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化金額
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: getCurrencyCode(transaction.value?.currency || '台幣'),
    minimumFractionDigits: 0,
  }).format(price)
}

// 幣種轉換為貨幣代碼
const getCurrencyCode = (currency: string) => {
  switch (currency) {
    case '台幣':
      return 'TWD'
    case '人民幣':
      return 'CNY'
    case '港幣':
      return 'HKD'
    default:
      return 'TWD'
  }
}

onMounted(() => {
  loadTransactionDetails()
})

const goBackToTradingTab = () => {
  router.push('/')
  localStorage.setItem('defaultTab', 'trading')
}

// 檢查是否可以結束交易的計算屬性
const canCompleteTransaction = computed(() => {
  if (!transaction.value) return false

  // 只有買家和賣家可以操作
  const isParticipant =
    transaction.value.seller._id === userStore.currentUser?.id ||
    transaction.value.buyer._id === userStore.currentUser?.id

  // 只有在特定狀態可以結束
  const isValidStatus = ['reserved', 'pending_payment'].includes(transaction.value.status)

  // 如果是買家且已確認，則不可點擊
  if (userRole.value === 'buyer' && transaction.value.buyerConfirmed) {
    return false
  }

  // 如果是賣家且已確認，則不可點擊
  if (userRole.value === 'seller' && transaction.value.sellerConfirmed) {
    return false
  }

  return isParticipant && isValidStatus
})

// 新增通知方法
const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

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

// 完成交易的方法
const completeTransaction = async () => {
  try {
    if (!canCompleteTransaction.value) {
      showNotification('您沒有權限完成此交易', 'error')
      return
    }
    // 彈出確認對話框
    const confirmed = confirm('確定要結束這筆交易嗎？')
    if (!confirmed) return

    console.log('Attempting to complete transaction:', route.params.id)

    const response = await transactionApi.completeTransaction(route.params.id as string)

    console.log('Complete transaction response:', response)

    // 顯示成功訊息
    showNotification('交易已成功結束', 'success')

    // 重新載入交易詳情以更新狀態
    await loadTransactionDetails()
  } catch (error: unknown) {
    // 處理可能的錯誤
    showNotification(error instanceof Error ? error.message : '結束交易失敗', 'error')
  }
}

const formatStatus = (status: string) => {
  const statusMap: { [key: string]: string } = {
    reserved: '交易中',
    pending_payment: '等待付款',
    payment_confirmed: '付款確認',
    completed: '已完成',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

// 判斷當前用戶是買家還是賣家
const userRole = computed(() => {
  if (!transaction.value || !userStore.currentUser) return null

  if (transaction.value.seller._id === userStore.currentUser.id) {
    return 'seller'
  } else if (transaction.value.buyer._id === userStore.currentUser.id) {
    return 'buyer'
  }

  return null
})

// 監聽 transaction 的變化
watch(
  () => transaction.value,
  (newTransaction) => {
    if (newTransaction) {
      console.log('=== Transaction Details ===')
      console.log('Transaction ID:', newTransaction._id)
      console.log('Status:', newTransaction.status)
      console.log('Seller Confirmed:', newTransaction.sellerConfirmed)
      console.log('Buyer Confirmed:', newTransaction.buyerConfirmed)
      console.log('Full Transaction Object:', newTransaction)
      console.log('========================')
    }
  },
)
</script>

<template>
  <main class="main-content trade-content">
    <!-- 權限被拒絕的畫面 -->
    <div v-if="permissionDenied" class="permission-denied">
      <div class="permission-denied-content">
        <h1>權限不足</h1>
        <p>您沒有權限查看此交易詳情。</p>
        <p>只有交易的買賣雙方和管理員可以訪問此頁面。</p>
        <button class="back-button" @click="goBackToTradingTab">返回交易列表</button>
      </div>
    </div>

    <!-- 正常顯示交易詳情的畫面 -->
    <template v-else>
      <div class="page-header">
        <div class="title-status-wrapper">
          <h1 class="page-title">交易詳情</h1>
        </div>
        <div class="page-actions">
          <button class="back-button" @click="goBackToTradingTab">← 返回交易列表</button>
          <button
            v-if="
              transaction &&
              transaction.status !== 'completed' &&
              transaction.status !== 'cancelled' &&
              (canCompleteTransaction ||
                (userRole === 'buyer' && transaction?.buyerConfirmed) ||
                (userRole === 'seller' && transaction?.sellerConfirmed))
            "
            class="complete-transaction-button"
            :class="{
              'waiting-confirmation':
                (userRole === 'buyer' && transaction?.buyerConfirmed) ||
                (userRole === 'seller' && transaction?.sellerConfirmed),
            }"
            :disabled="
              (userRole === 'buyer' && transaction?.buyerConfirmed) ||
              (userRole === 'seller' && transaction?.sellerConfirmed)
            "
            @click="completeTransaction"
          >
            {{
              (userRole === 'buyer' && transaction?.buyerConfirmed) ||
              (userRole === 'seller' && transaction?.sellerConfirmed)
                ? '等待對方確認'
                : '完成交易'
            }}
          </button>
        </div>
      </div>
      <div v-if="loading" class="status-message">載入中...</div>
      <div v-else-if="error && !permissionDenied" class="status-message error">{{ error }}</div>
      <div v-else-if="transaction" class="transaction-container">
        <div class="content-grid">
          <!-- 左側資訊區 -->
          <div class="left-column">
            <!-- 交易狀態卡片 -->
            <section class="card transaction-status">
              <h2>交易資訊</h2>
              <!-- 交易狀態獨占一行 -->
              <div class="status-item status-row">
                <span class="label">交易狀態</span>
                <span class="value" :class="'status-' + transaction.status">
                  {{ formatStatus(transaction.status) }}
                </span>
              </div>

              <!-- 遊戲幣數量和金額放在同一行 -->
              <div class="status-row-container">
                <div class="status-item">
                  <span class="label">遊戲幣數量</span>
                  <span class="value">{{ transaction.amount }}</span>
                </div>
                <div class="status-item">
                  <span class="label">金額</span>
                  <span class="value">{{ formatPrice(transaction.price) }}</span>
                </div>
              </div>

              <!-- 幣種和交易方式放在同一行 -->
              <div class="status-row-container">
                <div class="status-item">
                  <span class="label">幣種</span>
                  <span class="value">{{ transaction.currency || '台幣' }}</span>
                </div>
                <div class="status-item">
                  <span class="label">交易方式</span>
                  <span class="value">{{ transaction.paymentMethod || '匯款' }}</span>
                </div>
              </div>
            </section>

            <!-- 賣家資訊 -->
            <section class="card seller-info">
              <h2>賣家資訊</h2>
              <div class="contact-info">
                <div class="info-item">
                  <span class="label">賣家名稱</span>
                  <span class="value">{{ transaction.seller.name }}</span>
                </div>
                <div class="info-item">
                  <span class="label">角色暱稱</span>
                  <span class="value">{{ transaction.characterNickname || '未設定' }}</span>
                </div>
                <div class="info-item" v-if="transaction.seller.contactInfo?.line">
                  <span class="label">LINE ID</span>
                  <span class="value">{{ transaction.seller.contactInfo?.line }}</span>
                </div>
                <div class="info-item" v-if="transaction.seller.contactInfo?.discord">
                  <span class="label">Discord</span>
                  <span class="value">{{ transaction.seller.contactInfo?.discord }}</span>
                </div>
              </div>
            </section>
          </div>

          <!-- 右側留言板 -->
          <div class="right-column">
            <section class="card message-board">
              <div class="message-header-wrapper">
                <h2>交易留言</h2>
                <div class="confirmation-status" v-if="transaction">
                  <span class="status-badge">
                    賣家確認: {{ transaction.sellerConfirmed ? '✅' : '❌' }}
                  </span>
                  <span class="status-badge">
                    買家確認: {{ transaction.buyerConfirmed ? '✅' : '❌' }}
                  </span>
                </div>
              </div>

              <div class="messages">
                <div v-for="message in transaction.messages" :key="message._id" class="message">
                  <div class="message-header">
                    <span
                      class="sender"
                      :class="
                        message.sender === transaction.seller._id
                          ? 'seller-message'
                          : 'buyer-message'
                      "
                    >
                      {{
                        message.sender === transaction.seller._id
                          ? `${transaction.seller.name} (賣家)`
                          : `${transaction.buyer.name} (買家)`
                      }}
                    </span>
                    <span class="time">{{ formatTime(message.timestamp) }}</span>
                  </div>
                  <div
                    class="message-content"
                    :class="
                      message.sender === transaction.seller._id ? 'seller-message' : 'buyer-message'
                    "
                  >
                    {{ message.content }}
                  </div>
                </div>
              </div>

              <div class="message-input">
                <textarea
                  v-model="newMessage"
                  placeholder="輸入訊息..."
                  @keyup.enter.ctrl="sendMessage"
                ></textarea>
                <button class="send-button" @click="sendMessage" :disabled="!newMessage.trim()">
                  發送
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </template>
  </main>

  <!-- 通知組件 -->
  <div v-if="notification.show" :class="['notification', `notification-${notification.type}`]">
    {{ notification.message }}
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #b4282d;
$primary-hover: #d4282d;
$background-color: #f5f5f5;
$text-color: #333333;
$spacing-unit: 8px;
$box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
$transition: all 0.3s ease;
$error-color: #ff4d4f;

.platform-base {
  height: 100%;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  overflow-y: auto;
  background-color: $background-color;
  background-image: linear-gradient(135deg, #ffffff, #f0f0f0);
}

.content-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: $spacing-unit * 4;
  padding-bottom: $spacing-unit * 6;
}

.disclaimer {
  margin-top: auto; /* 推到底部 */
  padding: $spacing-unit * 2;
  background: #fff5f5;
  text-align: center;
  font-size: 12px;
  color: #f5222d;
  width: 100%;

  span {
    display: inline-block;
    line-height: 1.6;
  }
}

.main-content {
  width: 90%;
  margin: $spacing-unit * 6 auto;
  max-width: 1200px;
  padding: $spacing-unit * 2;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: $primary-color;
  margin-bottom: 0;
}

.card {
  background: white;
  border-radius: $spacing-unit;
  padding: $spacing-unit * 1.5;
  box-shadow: $box-shadow;
  margin-bottom: $spacing-unit * 2;

  h2 {
    color: $primary-color;
    font-size: 16px;
    margin-bottom: $spacing-unit;
  }
}

.transaction-status {
  .status-row {
    margin-bottom: $spacing-unit * 2;
    padding-bottom: $spacing-unit;
    border-bottom: 1px solid #f0f0f0;
  }

  .status-row-container {
    display: flex;
    gap: $spacing-unit * 3;
    margin-bottom: $spacing-unit * 2;

    .status-item {
      flex: 1;

      &:first-child {
        border-right: 1px solid #f0f0f0;
        padding-right: $spacing-unit * 2;
      }
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .status-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: $spacing-unit;
  }

  .status-item {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .label {
      color: #666;
      font-size: 13px;
    }

    .value {
      font-size: 15px;
      font-weight: 600;
      color: $text-color;
    }
  }
}

.seller-info {
  .contact-info {
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: $spacing-unit 0;
      border-bottom: 1px solid #eee;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-size: 13px;
        color: #666;
      }

      .value {
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
}

.message-board {
  .messages {
    max-height: 500px;
    overflow-y: auto;
    margin-bottom: 2px;
    padding-right: $spacing-unit * 2;
  }

  .message {
    background: #f8f8f8;
    border-radius: $spacing-unit;
    padding: $spacing-unit * 2;
    margin-bottom: $spacing-unit * 2;

    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: $spacing-unit;

      .sender {
        font-weight: 600;

        &.seller-message {
          color: $primary-color; // 賣家使用主色
        }

        &.buyer-message {
          color: #1890ff; // 買家使用藍色
        }
      }

      .time {
        color: #666;
        font-size: 14px;
      }
    }

    .message-content {
      line-height: 1.5;
      white-space: pre-wrap;
    }
  }

  .message-input {
    display: flex;
    gap: $spacing-unit * 2;
    margin-top: $spacing-unit * 3;

    textarea {
      flex: 1;
      min-height: 80px;
      padding: $spacing-unit * 2;
      border: 1px solid #ddd;
      border-radius: $spacing-unit;
      resize: vertical;
      font-family: inherit;

      &:focus {
        outline: none;
        border-color: $primary-color;
      }
    }

    .send-button {
      align-self: flex-end;
      padding: $spacing-unit * 2 $spacing-unit * 4;
      background: linear-gradient(to right, $primary-color, $primary-hover);
      color: white;
      border: none;
      border-radius: $spacing-unit;
      cursor: pointer;
      transition: $transition;
      font-weight: 600;

      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      &:not(:disabled):hover {
        transform: translateY(-1px);
      }
    }
  }

  .message-header-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-unit * 2;
    padding-bottom: $spacing-unit * 2;
    border-bottom: 1px solid #eee;

    h2 {
      margin-bottom: 0;
    }

    .confirmation-status {
      display: flex;
      gap: $spacing-unit;
      align-items: center;

      .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px $spacing-unit;
        background: #f8f8f8;
        border-radius: 4px;
        font-size: 13px;
        color: $text-color;
        border: 1px solid #eee;
      }
    }
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-unit * 3;
}

.page-actions {
  display: flex;
  gap: $spacing-unit * 2;
}

// 調整返回按鈕和結束交易按鈕的基本樣式
.back-button,
.complete-transaction-button {
  padding: $spacing-unit * 1.5 $spacing-unit * 3;
  border: none;
  border-radius: $spacing-unit;
  cursor: pointer;
  transition: $transition;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: $spacing-unit;
  &.waiting-confirmation {
    background: #cccccc;
    cursor: not-allowed;
    color: #666666;

    &:hover {
      transform: none;
      background: #cccccc;
    }
  }
}

// 返回按鈕樣式
.back-button {
  background: linear-gradient(to right, #f0f0f0, #e0e0e0);
  color: $text-color;

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(to right, #e0e0e0, #d0d0d0);
  }
}

// 結束交易按鈕樣式
.complete-transaction-button {
  background: linear-gradient(to right, #52c41a, #4caf50);
  color: white;

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(to right, #4caf50, #45a049);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}

// 狀態顏色
.status {
  &-reserved {
    color: #1890ff;
  }
  &-pending_payment {
    color: #1890ff;
  }
  &-payment_confirmed {
    color: #52c41a;
  }
  &-completed {
    color: #52c41a;
  }
  &-cancelled {
    color: #ff4d4f;
  }
}

.status-message {
  text-align: center;
  padding: $spacing-unit * 4;
  font-size: 16px;

  &.error {
    color: $primary-color;
  }
}

.notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: inline-block;
  max-width: 90%;
  width: auto;
  padding: #{$spacing-unit * 3};
  border-radius: #{$spacing-unit * 2};
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
    background-color: #{$error-color};
    color: white;
  }
}

.title-status-wrapper {
  display: flex;
  align-items: center;
  gap: $spacing-unit * 2;
}

.confirmation-status {
  display: flex;
  gap: $spacing-unit * 2;
  align-items: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: $spacing-unit $spacing-unit * 2;
  background: #f5f5f5;
  border-radius: $spacing-unit;
  font-size: 14px;
  color: $text-color;

  &:has(span) {
    gap: $spacing-unit;
  }
}

// 權限被拒絕頁面的樣式
.permission-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  text-align: center;

  .permission-denied-content {
    background: white;
    padding: $spacing-unit * 6;
    border-radius: $spacing-unit * 2;
    box-shadow: $box-shadow;
    max-width: 600px;
    width: 100%;

    h1 {
      color: $primary-color;
      font-size: 28px;
      margin-bottom: $spacing-unit * 3;
    }

    p {
      color: $text-color;
      font-size: 16px;
      margin-bottom: $spacing-unit * 2;
      line-height: 1.6;
    }

    .back-button {
      margin: $spacing-unit * 4 auto 0;
      padding: $spacing-unit * 2 $spacing-unit * 4;
      background: linear-gradient(to right, $primary-color, $primary-hover);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      width: auto;
      min-width: 180px;
    }
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

.content-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 2fr;
  gap: $spacing-unit * 3;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.right-column {
  .message-board {
    position: sticky;
    top: $spacing-unit * 2;
  }
}

// 響應式設計
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-unit * 2;
  }

  .page-actions {
    width: 100%;
    flex-direction: column;
  }

  .back-button,
  .complete-transaction-button {
    width: 100%;
  }

  .content-wrapper {
    padding: $spacing-unit * 2;
  }

  .main-content {
    width: 100%;
    margin-top: $spacing-unit * 2;
  }

  .status-grid {
    grid-template-columns: 1fr !important;
  }

  .message-input {
    flex-direction: column;

    .send-button {
      width: 100%;
      margin-top: $spacing-unit;
    }
  }

  .title-status-wrapper {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .confirmation-status {
    flex-wrap: wrap;
  }

  .message-board {
    .message-header-wrapper {
      flex-direction: column;
      align-items: flex-start;
      gap: $spacing-unit;

      .confirmation-status {
        width: 100%;
        justify-content: space-between;

        .status-badge {
          flex: 1;
          justify-content: center;
        }
      }
    }
  }

  // 權限被拒絕頁面的響應式設計
  .permission-denied {
    .permission-denied-content {
      padding: $spacing-unit * 3;
      margin: 0 $spacing-unit;

      h1 {
        font-size: 22px;
      }

      p {
        font-size: 14px;
      }

      .back-button {
        width: 100%;
      }
    }
  }
}
</style>
