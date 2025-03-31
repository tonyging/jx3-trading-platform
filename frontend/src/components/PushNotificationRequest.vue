<!-- components/PushNotificationRequest.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPushNotifications,
} from '@/registerServiceWorker'
import { userService } from '@/services/api/user'

const userStore = useUserStore()
const isSubscribed = ref(false)
const notificationPermissionState = ref(Notification.permission)
const showPermissionPrompt = ref(false)
const isLoading = ref(false)
const error = ref('')
const dismissedForSession = ref(false)

// 處理訂閱推播
const handleSubscribe = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const hasPermission = await requestNotificationPermission()
    notificationPermissionState.value = Notification.permission

    if (!hasPermission) {
      showPermissionPrompt.value = true
      if (Notification.permission === 'denied') {
        error.value = '通知權限已被拒絕，請在瀏覽器設定中啟用通知'
      }
      return
    }

    const registration = await registerServiceWorker()
    if (!registration) {
      error.value = '無法註冊 Service Worker'
      return
    }

    const subscription = await subscribeToPushNotifications(registration)
    if (!subscription) {
      error.value = '訂閱推播服務失敗'
      return
    }

    // 將訂閱資訊發送到後端
    await userService.savePushSubscription(subscription)

    isSubscribed.value = true
    localStorage.setItem('pushNotificationsSubscribed', 'true')
  } catch (err) {
    console.error('訂閱過程中發生錯誤:', err)
    error.value = '訂閱過程中發生錯誤，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 打開瀏覽器通知設定
const openNotificationSettings = () => {
  if (typeof window !== 'undefined') {
    // 開啟瀏覽器通知設定頁面或提供指導
    alert('請在瀏覽器設定中啟用通知\n\n在 Chrome 中：設定 > 隱私權和安全性 > 網站設定 > 通知')
  }
}

// 關閉提示框並記住本次會話不再顯示
const dismissPrompt = () => {
  showPermissionPrompt.value = false
  dismissedForSession.value = true
  sessionStorage.setItem('notificationPromptDismissed', 'true')
}

// 檢查推播訂閱狀態
const checkSubscriptionStatus = async () => {
  try {
    // 如果用戶已登入，檢查後端的訂閱狀態
    if (userStore.isAuthenticated) {
      const response = await userService.checkPushSubscriptionStatus()
      isSubscribed.value = response.data.isSubscribed

      // 同步本地存儲
      if (isSubscribed.value) {
        localStorage.setItem('pushNotificationsSubscribed', 'true')
      }
    }
  } catch (err) {
    console.error('檢查訂閱狀態時發生錯誤:', err)
  }
}

onMounted(async () => {
  // 檢查是否已訂閱
  await checkSubscriptionStatus()

  // 檢查通知權限狀態
  notificationPermissionState.value = Notification.permission

  // 檢查本次會話是否已經關閉過提示
  dismissedForSession.value = sessionStorage.getItem('notificationPromptDismissed') === 'true'

  // 如果用戶登入且未訂閱且未拒絕通知且本次會話未關閉過提示，顯示訂閱提示
  if (
    userStore.isAuthenticated &&
    !isSubscribed.value &&
    notificationPermissionState.value !== 'denied' &&
    !dismissedForSession.value
  ) {
    // 延遲顯示以避免立即彈出影響用戶體驗
    setTimeout(() => {
      showPermissionPrompt.value = true
    }, 3000)
  }
})

// 組件卸載時清理
onUnmounted(() => {
  // 可以進行一些清理工作
})
</script>

<template>
  <transition name="fade">
    <div
      v-if="showPermissionPrompt && !isSubscribed && !dismissedForSession"
      class="notification-prompt"
    >
      <div class="prompt-container">
        <button class="close-button" @click="dismissPrompt">×</button>

        <div class="prompt-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>

        <div class="prompt-content">
          <h3>接收即時交易通知</h3>
          <p>開啟推播通知，即時掌握您的交易狀態和訊息更新。</p>
        </div>

        <div class="prompt-actions">
          <button class="subscribe-button" @click="handleSubscribe" :disabled="isLoading">
            {{ isLoading ? '處理中...' : '開啟通知' }}
          </button>

          <button class="dismiss-button" @click="dismissPrompt">稍後再說</button>
        </div>

        <div v-if="error" class="prompt-error">
          {{ error }}
          <button
            v-if="notificationPermissionState === 'denied'"
            class="settings-button"
            @click="openNotificationSettings"
          >
            開啟設定
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
$primary-color: #b4282d;
$primary-hover: #a3181d;
$background-color: #f5f5f5;
$text-color: #333333;
$error-color: #ff4d4f;

.notification-prompt {
  position: fixed;
  bottom: 20px;
  right: 20px;
  max-width: 360px;
  z-index: 1000;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.prompt-container {
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 20px;
  animation: slide-in 0.3s ease-out forwards;
}

.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  font-size: 18px;
  color: rgba($text-color, 0.5);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;

  &:hover {
    background: rgba($text-color, 0.05);
    color: rgba($text-color, 0.8);
  }
}

.prompt-icon {
  color: $primary-color;
  margin-bottom: 12px;
  display: flex;
  justify-content: center;

  svg {
    width: 32px;
    height: 32px;
  }
}

.prompt-content {
  margin-bottom: 16px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 8px;
    color: $text-color;
    text-align: center;
  }

  p {
    font-size: 14px;
    margin: 0;
    color: rgba($text-color, 0.8);
    text-align: center;
    line-height: 1.5;
  }
}

.prompt-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.subscribe-button,
.dismiss-button,
.settings-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.subscribe-button {
  background: linear-gradient(to right, $primary-color, $primary-hover);
  color: white;
  flex: 1;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.dismiss-button {
  background: transparent;
  color: $text-color;
  border: 1px solid #ddd;

  &:hover {
    background: $background-color;
  }
}

.settings-button {
  background: transparent;
  color: $primary-color;
  padding: 4px 8px;
  border: 1px solid $primary-color;
  font-size: 12px;
  margin-left: 8px;

  &:hover {
    background: rgba($primary-color, 0.05);
  }
}

.prompt-error {
  color: $error-color;
  font-size: 12px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

// 動畫
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes slide-in {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

// 響應式調整
@media (max-width: 576px) {
  .notification-prompt {
    bottom: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .prompt-actions {
    flex-direction: column;
  }
}
</style>
