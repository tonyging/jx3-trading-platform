<!-- MemberProfile.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { userService } from '@/services/api/user'
import { auth } from '@/firebase/init'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import type { UpdateProfileData, UpdateContactInfoData } from '@/types/user'

// 定義可能的錯誤類型
interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier & {
      reset?: () => void
    }
  }
}

// 初始化路由和用戶狀態管理
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 當前選中的菜單項目
const currentMenu = ref('general')

// 定義選單項目的介面
interface MenuItem {
  id: string
  icon: string
  label: string
  subLabel?: string
}

// 使用介面來定義選單項目
const menuItems: MenuItem[] = [
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
  {
    id: 'account-links',
    icon: '🔗',
    label: '帳號連結',
  },
]

// 用戶名稱和電子郵件
const userName = ref('')
const userEmail = ref('')

// 聯絡資訊表單
const contactForm = reactive({
  facebook: '',
  discord: '',
  phone: '',
})

// 通知相關的響應式狀態
const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

// 手機驗證相關的狀態
const phoneVerificationState = reactive({
  phoneNumber: '',
  verificationCode: '',
  verificationId: '',
  isVerifying: false,
  isCodeSent: false,
  isVerified: false,
})

// Discord相關的狀態
const discordState = reactive({
  isLinked: false,
  username: '',
  id: '',
  avatar: '',
  isLinking: false,
  global_name: '',
})

// 計算社交帳號連結狀態 - 已修改為只計算兩個社交账号
const socialAccountsStatus = computed(() => {
  let linked = 0
  const total = 2 // Facebook, Discord (移除了 Line)

  if (contactForm.facebook) linked++
  if (discordState.isLinked) linked++

  return `${linked}/${total}`
})

// 顯示通知的方法
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = {
    show: true,
    message,
    type,
  }

  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 載入用戶資訊
const loadUserInfo = async () => {
  try {
    const response = await userService.getProfile()
    if (response.status === 'success' && response.data) {
      userName.value = response.data.name
      userEmail.value = response.data.email

      // 載入手機資訊
      if (response.data.phoneNumber) {
        phoneVerificationState.phoneNumber = response.data.phoneNumber
        phoneVerificationState.isVerified = !!response.data.isPhoneVerified
      }

      // 載入Discord資訊
      if (response.data.discordId && response.data.discordUsername) {
        discordState.isLinked = true
        discordState.id = response.data.discordId
        discordState.username = response.data.discordUsername
        discordState.avatar = response.data.discordAvatar || ''
        discordState.global_name = response.data.global_name || ''
        // 將Discord資訊同步到表單中
        contactForm.discord = response.data.discordUsername
      }

      // 載入聯絡資訊
      if (response.data.contactInfo) {
        contactForm.facebook = response.data.contactInfo.facebook || ''
        // 如果Discord欄位為空，但用戶已連結Discord，則使用Discord用戶名
        if (!contactForm.discord && discordState.isLinked) {
          contactForm.discord = discordState.username
        }
      }
    }
    console.log(
      '用戶手機資訊: ',
      phoneVerificationState.phoneNumber,
      '驗證狀態: ',
      phoneVerificationState.isVerified,
    )
    console.log('Discord連結狀態:', discordState)
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification(
      apiError.response?.data?.message || (apiError.message as string) || '載入用戶資訊失敗',
      'error',
    )
    console.error('載入用戶資訊失敗:', error)
  }
}

// 更新用戶資訊
const updateUserInfo = async () => {
  try {
    if (!userName.value.trim()) {
      showNotification('會員名稱不能為空', 'error')
      return
    }

    const updateData: UpdateProfileData = {
      name: userName.value.trim(),
    }

    const response = await userService.updateProfile(updateData)

    if (response.status === 'success') {
      await userStore.fetchCurrentUser()
      showNotification('會員資料更新成功')
    }
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification(
      apiError.response?.data?.message || (apiError.message as string) || '更新會員資料失敗',
      'error',
    )
    console.error('更新會員資料失敗:', error)
  }
}

// 更新聯絡資訊
const updateContactInfo = async () => {
  try {
    const updateData: UpdateContactInfoData = {
      contactInfo: {
        facebook: contactForm.facebook.trim(),
      },
    }

    const response = await userService.updateContactInfo(updateData)

    if (response.status === 'success') {
      await userStore.fetchCurrentUser()
      showNotification('聯絡資訊更新成功')
    }
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification(
      apiError.response?.data?.message || (apiError.message as string) || '更新聯絡資訊失敗',
      'error',
    )
    console.error('更新聯絡資訊失敗:', error)
  }
}

// 檢查URL參數是否包含Discord相關信息
const checkDiscordCallback = () => {
  // 檢查URL中是否有Discord相關參數
  const discordStatus = route.query.discord as string

  if (discordStatus === 'success') {
    showNotification('Discord帳號連結成功', 'success')
    // 清除URL參數
    router.replace({ query: {} })
  } else if (discordStatus === 'error') {
    showNotification('Discord帳號連結失敗，請稍後再試', 'error')
    // 清除URL參數
    router.replace({ query: {} })
  }
}

// 獲取Discord授權URL並跳轉
const connectDiscord = async () => {
  try {
    discordState.isLinking = true
    const response = await userService.getDiscordAuthUrl()

    if (response.url) {
      // 將當前頁面URL儲存到localStorage，以便授權後返回
      localStorage.setItem('discordRedirectUrl', window.location.href)

      // 跳轉到Discord授權頁面
      window.location.href = response.url
    } else {
      throw new Error('獲取Discord授權URL失敗')
    }
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification(
      apiError.response?.data?.message || (apiError.message as string) || '連接Discord時發生錯誤',
      'error',
    )
    console.error('連接Discord時發生錯誤:', error)
  } finally {
    discordState.isLinking = false
  }
}

// 解除Discord綁定
const disconnectDiscord = async () => {
  try {
    const response = await userService.unlinkDiscord()

    if (response.status === 'success') {
      // 重置Discord狀態
      discordState.isLinked = false
      discordState.username = ''
      discordState.id = ''
      discordState.avatar = ''
      discordState.global_name = ''
      contactForm.discord = ''

      showNotification('已成功解除Discord帳號連結', 'success')
    }
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification(
      apiError.response?.data?.message ||
        (apiError.message as string) ||
        '解除Discord連結時發生錯誤',
      'error',
    )
    console.error('解除Discord連結時發生錯誤:', error)
  }
}

// 在掛載時載入用戶資訊
onMounted(async () => {
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // 檢查是否有Discord回調信息
  checkDiscordCallback()

  // 載入用戶資訊
  await loadUserInfo()
})

// 發送手機驗證碼
async function handleSendVerification() {
  if (!phoneVerificationState.phoneNumber) {
    showNotification('請輸入手機號碼', 'error')
    return
  }

  try {
    phoneVerificationState.isVerifying = true

    // 檢查 reCAPTCHA 是否初始化
    if (!window.recaptchaVerifier) {
      showNotification('reCAPTCHA 未正確初始化', 'error')
      return
    }

    const formattedPhoneNumber = phoneVerificationState.phoneNumber.startsWith('+')
      ? phoneVerificationState.phoneNumber
      : `+886${phoneVerificationState.phoneNumber.replace(/^0/, '')}`

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhoneNumber,
      window.recaptchaVerifier as RecaptchaVerifier,
    )

    phoneVerificationState.verificationId = confirmationResult.verificationId
    phoneVerificationState.isCodeSent = true
    showNotification('驗證碼已發送到您的手機', 'success')
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error('發送驗證碼錯誤:', error)
    showNotification((apiError.message as string) || '發送驗證碼失敗，請檢查網絡連接', 'error')

    // 重置 reCAPTCHA
    try {
      if (window.recaptchaVerifier?.reset) {
        await window.recaptchaVerifier.reset()
      }
    } catch (resetError: unknown) {
      console.error('重置 reCAPTCHA 時出錯:', resetError)
    }
  } finally {
    phoneVerificationState.isVerifying = false
  }
}

// 驗證手機驗證碼
async function handleVerifyCode() {
  if (!phoneVerificationState.verificationCode) {
    showNotification('請輸入驗證碼', 'error')
    return
  }

  try {
    phoneVerificationState.isVerifying = true

    console.log('開始驗證手機號碼:', {
      phoneNumber: phoneVerificationState.phoneNumber,
      verificationId: phoneVerificationState.verificationId,
    })

    const response = await userService.updatePhoneNumber(
      phoneVerificationState.phoneNumber,
      phoneVerificationState.verificationId,
    )

    console.log('手機驗證響應:', response)

    if (response.status === 'success') {
      phoneVerificationState.isVerified = true
      showNotification('手機號碼驗證成功！', 'success')
    } else {
      throw new Error(response.message || '驗證失敗')
    }
  } catch (error: unknown) {
    const apiError = error as ApiError
    const errorMessage = apiError as string
    if (errorMessage === '此手機號碼已被其他用戶使用') {
      phoneVerificationState.isCodeSent = false
      phoneVerificationState.phoneNumber = ''
      phoneVerificationState.verificationCode = ''
      phoneVerificationState.verificationId = ''
      showNotification('此手機號碼已被其他用戶使用，請使用其他號碼', 'error')
    } else {
      // 其他錯誤時，保持在驗證碼輸入界面
      showNotification('驗證失敗，請檢查驗證碼是否正確', 'error')
    }
  } finally {
    phoneVerificationState.isVerifying = false
  }
}

watch(currentMenu, (newMenu) => {
  if (newMenu === 'security' && !phoneVerificationState.isVerified) {
    nextTick(() => {
      const recaptchaContainer = document.getElementById('recaptcha-container')

      if (!recaptchaContainer) {
        showNotification('reCAPTCHA 容器未找到', 'error')
        return
      }

      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            if (window.recaptchaVerifier?.reset) {
              window.recaptchaVerifier.reset()
            }
          },
        })

        window.recaptchaVerifier.render()
      } catch (error: unknown) {
        // 記錄完整的錯誤訊息
        console.error('reCAPTCHA 初始化錯誤:', error)

        // 顯示友好的錯誤通知
        const errorMessage = error instanceof Error ? error.message : 'reCAPTCHA 初始化失敗'

        showNotification(errorMessage, 'error')
      }
    })
  }
})
</script>

<template>
  <div class="platform-base">
    <!-- 頁面頂部標題 -->
    <div class="site-header">
      <router-link to="/" class="header-link">
        <h1>劍三交易平台</h1>
      </router-link>
    </div>

    <!-- 主要內容區域 -->
    <div class="content-wrapper">
      <main class="main-content settings-content">
        <div class="settings-container">
          <!-- 側邊欄 -->
          <div class="side-menu">
            <div
              v-for="item in menuItems"
              :key="item.id"
              :class="['menu-item', { active: currentMenu === item.id }]"
              @click="currentMenu = item.id"
            >
              <div class="menu-item-icon">{{ item.icon }}</div>
              <div class="menu-item-text">
                <span class="menu-item-label">{{ item.label }}</span>
                <span v-if="item.subLabel" class="menu-item-sublabel">{{ item.subLabel }}</span>
              </div>
            </div>
          </div>

          <!-- 主要內容區 -->
          <div class="main-settings-area">
            <!-- 一般設置 -->
            <div v-if="currentMenu === 'general'" class="settings-section">
              <h2>會員資料</h2>
              <form @submit.prevent="updateUserInfo" class="user-form">
                <div class="form-group">
                  <label>會員名稱</label>
                  <input v-model="userName" type="text" placeholder="請輸入會員名稱" />
                </div>

                <button type="submit" class="save-button">儲存變更</button>
              </form>
            </div>

            <!-- 交易安全 -->
            <div v-else-if="currentMenu === 'security'" class="settings-section">
              <h2>交易安全</h2>
              <div class="security-info">
                <div class="security-item">
                  <div class="security-item-header">
                    <h3>電子郵件驗證</h3>
                    <span class="status verified">✓ 已驗證</span>
                  </div>
                  <div class="security-item-content">
                    <p class="verified-email">{{ userEmail }}</p>
                  </div>
                </div>

                <div class="security-item">
                  <div class="security-item-header">
                    <h3>手機號碼驗證</h3>
                    <span v-if="phoneVerificationState.isVerified" class="status verified">
                      ✓ 已驗證
                    </span>
                  </div>

                  <div class="security-item-content">
                    <div v-if="!phoneVerificationState.isVerified" class="phone-verification">
                      <div v-if="!phoneVerificationState.isCodeSent">
                        <input
                          v-model="phoneVerificationState.phoneNumber"
                          type="tel"
                          placeholder="請輸入手機號碼"
                          :disabled="phoneVerificationState.isVerifying"
                        />
                        <!-- reCAPTCHA container -->
                        <div id="recaptcha-container" class="mb-4"></div>
                        <button
                          type="button"
                          class="verification-button"
                          @click="handleSendVerification"
                          :disabled="phoneVerificationState.isVerifying"
                        >
                          {{ phoneVerificationState.isVerifying ? '發送中...' : '發送驗證碼' }}
                        </button>
                      </div>
                      <div v-else class="verification-code-section">
                        <div class="verification-input-group">
                          <input
                            v-model="phoneVerificationState.verificationCode"
                            type="text"
                            placeholder="請輸入驗證碼"
                            :disabled="phoneVerificationState.isVerifying"
                            class="verification-code-input"
                          />
                          <div class="verification-actions">
                            <button
                              type="button"
                              class="verification-button"
                              @click="handleVerifyCode"
                              :disabled="phoneVerificationState.isVerifying"
                            >
                              {{ phoneVerificationState.isVerifying ? '驗證中...' : '驗證' }}
                            </button>
                            <button
                              type="button"
                              class="verification-button resend-button"
                              @click="
                                () => {
                                  phoneVerificationState.isCodeSent = false
                                }
                              "
                              :disabled="phoneVerificationState.isVerifying"
                            >
                              重新發送
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else>
                      {{ phoneVerificationState.phoneNumber }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 帳號連結 -->
            <div v-else-if="currentMenu === 'account-links'" class="settings-section">
              <h2>帳號連結</h2>

              <!-- 社交帳號狀態信息 -->
              <div class="social-accounts-status">
                <p>已連結帳號：{{ socialAccountsStatus }}</p>
              </div>

              <form @submit.prevent="updateContactInfo" class="user-form">
                <div class="form-group">
                  <label>Facebook 連結</label>
                  <input
                    v-model="contactForm.facebook"
                    type="text"
                    placeholder="請輸入 Facebook 連結"
                  />
                </div>

                <!-- Discord帳號連結 -->
                <div class="form-group discord-section">
                  <label>Discord帳號</label>

                  <div v-if="!discordState.isLinked" class="discord-connect">
                    <p class="discord-status">尚未連結Discord帳號</p>
                    <button
                      type="button"
                      class="discord-connect-button"
                      @click="connectDiscord"
                      :disabled="discordState.isLinking"
                    >
                      <span class="discord-icon">🎮</span>
                      {{ discordState.isLinking ? '連結中...' : '連結Discord帳號' }}
                    </button>
                  </div>

                  <div v-else class="discord-info">
                    <div class="discord-profile">
                      <div v-if="discordState.avatar" class="discord-avatar">
                        <img :src="discordState.avatar" alt="Discord Avatar" />
                      </div>
                      <div class="discord-user-info">
                        <span class="discord-username">
                          {{ discordState.global_name || discordState.username }}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="discord-disconnect-button"
                      @click="disconnectDiscord"
                    >
                      解除連結
                    </button>
                  </div>
                </div>

                <button type="submit" class="save-button">儲存 Facebook 連結</button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 通知組件 -->
    <div v-if="notification.show" :class="['notification', `notification-${notification.type}`]">
      {{ notification.message }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
// 變數定義
$primary-color: #b4282d;
$background-color: #f5f5f5;
$text-color: #333333;
$spacing-unit: 8px;
$transition: all 0.3s ease;
$font-family: 'Microsoft YaHei', '微軟雅黑', sans-serif;
$discord-color: #5865f2;

// 基礎頁面樣式
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

.site-header {
  position: absolute;
  top: $spacing-unit * 3;
  left: $spacing-unit * 3;
  right: $spacing-unit * 3;
  z-index: 10;

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: $primary-color;
    margin: 0;
    font-family: $font-family;
  }
}

.content-wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: $spacing-unit * 10;
  overflow: auto;
}

.main-content.settings-content {
  width: 70%;
  max-width: 840px;
  background: #ffffff;
  border-radius: $spacing-unit * 1.5;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba($primary-color, 0.1);
  overflow: hidden;
}

.settings-container {
  display: flex;
  height: 550px;
}

// 側邊欄樣式
.side-menu {
  width: 175px;
  background-color: #f8f8f8;
  border-right: 1px solid #e0e0e0;
  padding: $spacing-unit * 2 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: $spacing-unit * 2 $spacing-unit * 3;
  cursor: pointer;
  transition: $transition;

  &:hover {
    background-color: rgba($primary-color, 0.05);
  }

  &.active {
    background-color: rgba($primary-color, 0.1);
    border-left: 3px solid $primary-color;
  }

  .menu-item-icon {
    font-size: 20px;
    margin-right: $spacing-unit * 2;
    opacity: 0.7;
  }

  .menu-item-text {
    display: flex;
    flex-direction: column;

    .menu-item-label {
      font-size: 16px;
      color: $text-color;
    }

    .menu-item-sublabel {
      font-size: 12px;
      color: #666;
      margin-top: $spacing-unit;
    }
  }
}

// 主要設置區域
.main-settings-area {
  flex-grow: 1;
  padding: $spacing-unit * 4;
  overflow-y: auto;

  h2 {
    color: $primary-color;
    border-bottom: 2px solid $primary-color;
    padding-bottom: $spacing-unit * 2;
    margin-bottom: $spacing-unit * 3;
  }
}

.settings-section {
  max-width: 550px;
  margin: 0 auto;
}

.user-form {
  .form-group {
    margin-bottom: $spacing-unit * 3;

    label {
      display: block;
      margin-bottom: $spacing-unit;
      color: #666;
    }

    input {
      width: 100%;
      padding: $spacing-unit * 2;
      border: 1px solid #ddd;
      border-radius: $spacing-unit;
      transition: $transition;

      &:focus {
        border-color: $primary-color;
        outline: none;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
      }

      &:disabled {
        background-color: #f0f0f0;
        cursor: not-allowed;
      }
    }
  }
}

.security-info {
  .security-item {
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: $spacing-unit;
    padding: $spacing-unit * 3;
    margin-bottom: $spacing-unit * 3;

    &-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-unit * 2;

      h3 {
        margin: 0;
        font-size: 18px;
        color: $text-color;
      }

      .status {
        font-size: 14px;
        padding: $spacing-unit $spacing-unit * 2;
        border-radius: 20px;

        &.verified {
          background-color: rgba(#4caf50, 0.1);
          color: #4caf50;
        }
      }
    }

    &-content {
      .verified-email {
        color: #666;
        font-size: 16px;
        margin: 0;
      }

      input {
        width: 100%;
        padding: $spacing-unit * 2;
        border: 1px solid #ddd;
        border-radius: $spacing-unit;
        transition: $transition;

        &:focus {
          border-color: $primary-color;
          outline: none;
          box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
        }

        &:disabled {
          background-color: #f0f0f0;
          cursor: not-allowed;
        }
      }
    }
  }
}

.save-button {
  width: 100%;
  padding: $spacing-unit * 2;
  background: linear-gradient(
    to right,
    $primary-color,
    color.scale($primary-color, $lightness: -10%)
  );
  color: white;
  border: none;
  border-radius: $spacing-unit;
  cursor: pointer;
  transition: $transition;

  &:hover {
    opacity: 0.9;
  }
}

.notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: $spacing-unit * 3;
  border-radius: $spacing-unit * 2;
  z-index: 1000;
  text-align: center;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: notificationAnimation 0.5s ease;

  &-success {
    background-color: #4caf50;
  }

  &-error {
    background-color: #f44336;
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

// 手機驗證相關樣式
.phone-verification {
  margin-top: $spacing-unit;
}

.verification-code-section {
  margin-top: $spacing-unit * 2;

  .verification-input-group {
    display: flex;
    flex-direction: column;
    gap: $spacing-unit * 2;
  }

  .verification-code-input {
    width: 100%;
    padding: $spacing-unit * 2;
    border: 1px solid #ddd;
    border-radius: $spacing-unit;
    transition: $transition;

    &:focus {
      border-color: $primary-color;
      outline: none;
      box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
    }

    &:disabled {
      background-color: #f0f0f0;
      cursor: not-allowed;
    }
  }

  .verification-actions {
    display: flex;
    gap: $spacing-unit * 2;

    .verification-button {
      flex: 1;
      background-color: $primary-color;
      color: white;
      padding: $spacing-unit * 1.5;
      border: none;
      border-radius: $spacing-unit;
      cursor: pointer;
      transition: $transition;

      &:hover:not(:disabled) {
        opacity: 0.9;
      }

      &:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }

      &.resend-button {
        background-color: transparent;
        color: $primary-color;
        border: 1px solid $primary-color;

        &:hover:not(:disabled) {
          background-color: rgba($primary-color, 0.1);
        }
      }
    }
  }
}

.verification-button {
  background-color: $primary-color;
  color: white;
  padding: $spacing-unit * 1.5;
  border: none;
  border-radius: $spacing-unit;
  cursor: pointer;
  transition: $transition;
  width: 100%;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
}

.resend-button {
  background-color: transparent;
  color: $primary-color;
  border: 1px solid $primary-color;
  padding: $spacing-unit * 1.5;
  border-radius: $spacing-unit;
  cursor: pointer;
  transition: $transition;

  &:hover:not(:disabled) {
    background-color: rgba($primary-color, 0.1);
  }

  &:disabled {
    border-color: #ccc;
    color: #ccc;
    cursor: not-allowed;
  }
}

.verified-status {
  color: #4caf50;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: $spacing-unit;

  &::before {
    content: '✓';
    display: inline-block;
    width: 20px;
    height: 20px;
    line-height: 20px;
    text-align: center;
    background-color: #4caf50;
    color: white;
    border-radius: 50%;
  }
}

#recaptcha-container {
  margin: $spacing-unit * 2 0;
}

.mb-4 {
  margin-bottom: 1rem;
}

.header-link {
  text-decoration: none;
  display: inline-block;
  color: inherit;
  background-color: transparent;

  &:hover,
  &:active,
  &:focus {
    background-color: transparent;
    text-decoration: none;
    color: inherit;
    outline: none;
  }
}

/* Discord相關樣式 */
.social-accounts-status {
  margin-bottom: $spacing-unit * 3;
  padding: $spacing-unit * 2;
  background-color: rgba($primary-color, 0.05);
  border-radius: $spacing-unit;
  border-left: 3px solid $primary-color;
}

.discord-section {
  border: 1px solid #e0e0e0;
  border-radius: $spacing-unit;
  padding: $spacing-unit * 2;
  background-color: rgba($discord-color, 0.02);
  margin-bottom: $spacing-unit * 3;
}

.discord-connect {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $spacing-unit * 2;
}

.discord-status {
  color: #666;
  margin: 0;
}

.discord-connect-button {
  display: flex;
  align-items: center;
  background-color: $discord-color;
  color: white;
  border: none;
  border-radius: $spacing-unit;
  padding: $spacing-unit * 1.5 $spacing-unit * 2;
  cursor: pointer;
  transition: $transition;

  &:hover:not(:disabled) {
    background-color: darken($discord-color, 5%);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
}

.discord-icon {
  margin-right: $spacing-unit;
  font-size: 18px;
}

.discord-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.discord-profile {
  display: flex;
  align-items: center;
  gap: $spacing-unit * 2;
}

.discord-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.discord-user-info {
  display: flex;
  flex-direction: column;
}

.discord-username {
  font-weight: 500;
  color: $text-color;
}

.discord-id {
  color: #666;
  font-size: 14px;
}

.discord-disconnect-button {
  background-color: transparent;
  color: #f44336;
  border: 1px solid #f44336;
  border-radius: $spacing-unit;
  padding: $spacing-unit $spacing-unit * 2;
  cursor: pointer;
  transition: $transition;

  &:hover {
    background-color: rgba(#f44336, 0.05);
  }
}

// 響應式設計
@media (max-width: 768px) {
  .settings-container {
    flex-direction: column;
    height: auto;
  }

  .side-menu {
    width: 100%;
    display: flex;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
    white-space: nowrap;
    padding: $spacing-unit;
  }

  .menu-item {
    flex-direction: column;
    align-items: center;
    padding: $spacing-unit * 1.5;
    min-width: 100px;

    .menu-item-icon {
      margin-right: 0;
      margin-bottom: $spacing-unit;
    }

    .menu-item-text {
      align-items: center;
      text-align: center;
    }
  }

  .site-header {
    position: static;
    padding: $spacing-unit * 2;
    text-align: center;
  }

  .content-wrapper {
    padding-top: $spacing-unit * 2;
  }

  .main-content.settings-content {
    width: 90%;
    max-width: 840px;
  }

  .main-settings-area {
    padding: $spacing-unit * 2;
  }

  .settings-section {
    max-width: 420px;
    margin: 0 auto;
    padding: $spacing-unit * 2;
  }

  .user-form {
    .form-group {
      input {
        font-size: 16px; // 防止iOS自動縮放
      }
    }
  }

  .transaction-table {
    font-size: 14px;

    th,
    td {
      padding: $spacing-unit;
    }
  }

  // 橫向滾動表格
  .transaction-table-wrapper {
    overflow-x: auto;
    width: 100%;
  }

  // Discord部分的響應式調整
  .discord-info {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-unit * 2;
  }

  .discord-disconnect-button {
    width: 100%;
  }
}

// 更小螢幕的額外調整
@media (max-width: 480px) {
  .menu-item {
    min-width: 80px;
    padding: $spacing-unit;

    .menu-item-icon {
      font-size: 20px;
    }

    .menu-item-text {
      .menu-item-label {
        font-size: 14px;
      }

      .menu-item-sublabel {
        font-size: 10px;
      }
    }
  }

  .notification {
    width: 90%;
    max-width: 300px;
    padding: $spacing-unit * 2;
    font-size: 14px;
  }
}
</style>
