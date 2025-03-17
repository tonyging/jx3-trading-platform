<!-- views/AccountLinkResult.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { userService } from '@/services/api/user'

// 初始化路由和用戶狀態管理
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 獲取Discord狀態參數
const discordStatus = ref('')
const discordAvatar = ref('')
const globalName = ref('')

// 判斷是否顯示加載中狀態
const isLoading = ref(true)

// 解析狀態參數並顯示對應內容
onMounted(async () => {
  // 確保用戶已登入
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // 獲取URL參數
  discordStatus.value = (route.query.discord as string) || ''

  // 如果是成功狀態，嘗試獲取用戶的Discord資訊
  if (discordStatus.value === 'success') {
    try {
      // 取得最新的用戶資料
      await userStore.fetchCurrentUser()
      const userData = userStore.currentUser

      if (userData) {
        // 獲取 Discord 頭像
        if (userData.discordAvatar) {
          discordAvatar.value = userData.discordAvatar
        }

        // 獲取 Discord 全局名稱 (可能是中文名)
        if (userData.global_name) {
          globalName.value = userData.global_name
        }
      } else {
        // 直接從 API 獲取用戶資料作為後備方案
        try {
          const profileResponse = await userService.getProfile()

          if (profileResponse.status === 'success' && profileResponse.data) {
            const data = profileResponse.data

            if (data.discordAvatar) discordAvatar.value = data.discordAvatar
            if (data.global_name) globalName.value = data.global_name
          }
        } catch (apiError) {
          console.error('直接 API 調用失敗:', apiError)
        }
      }
    } catch (error) {
      console.error('無法獲取用戶Discord資訊:', error)
    }
  }

  // 完成加載
  isLoading.value = false
})

// 返回會員頁面
const goToMemberProfile = () => {
  router.push('/member-info')
}
</script>

<template>
  <div class="account-link-result-page-wrapper">
    <div class="account-link-result-page">
      <div class="result-container">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在處理您的請求...</p>
        </div>

        <template v-else>
          <!-- 成功綁定 -->
          <div v-if="discordStatus === 'success'" class="result-card success">
            <div class="result-icon">✓</div>
            <h2>Discord 帳號綁定成功！</h2>
            <p class="result-description">你的 Discord 帳號已成功連結至本平台。</p>

            <div v-if="globalName" class="discord-info">
              <!-- 如果有頭像，顯示頭像，否則顯示 Discord logo -->
              <div class="discord-avatar-container">
                <img
                  v-if="discordAvatar"
                  :src="discordAvatar"
                  alt="Discord Avatar"
                  class="discord-avatar"
                />
                <img v-else src="/discord-logo.svg" alt="Discord" class="discord-logo" />
              </div>

              <div class="discord-user-details">
                <span class="discord-global-name">{{ globalName }}</span>
              </div>
            </div>

            <p class="additional-info">現在你可以在會員中心查看和管理你的 Discord 帳號連結狀態。</p>

            <button class="primary-button" @click="goToMemberProfile">返回會員中心</button>
          </div>

          <!-- 綁定失敗 - 用戶未認證 -->
          <div v-else-if="discordStatus === 'nouser'" class="result-card error">
            <div class="result-icon">✗</div>
            <h2>Discord 帳號綁定失敗</h2>
            <p class="result-description">無法識別您的帳號資訊，請確保您已登入。</p>

            <div class="action-buttons">
              <button class="secondary-button" @click="router.push('/login')">返回登入頁面</button>
              <button class="primary-button" @click="goToMemberProfile">返回會員中心</button>
            </div>
          </div>

          <!-- 未收到授權碼 -->
          <div v-else-if="discordStatus === 'nocode'" class="result-card warning">
            <div class="result-icon">!</div>
            <h2>授權流程未完成</h2>
            <p class="result-description">
              未收到 Discord 的授權碼，可能是因為您取消了授權或授權流程被中斷。
            </p>

            <div class="action-buttons">
              <button class="secondary-button" @click="goToMemberProfile">返回會員中心</button>
            </div>
          </div>

          <!-- 其他錯誤 -->
          <div v-else-if="discordStatus === 'error'" class="result-card error">
            <div class="result-icon">✗</div>
            <h2>Discord 帳號綁定失敗</h2>
            <p class="result-description">在綁定過程中發生了錯誤，請稍後再試。</p>

            <div class="action-buttons">
              <button class="secondary-button" @click="goToMemberProfile">返回會員中心</button>
            </div>
          </div>

          <!-- Discord 帳號未滿一年 -->
          <div v-else-if="discordStatus === 'account_too_new'" class="result-card warning">
            <div class="result-icon">!</div>
            <h2>Discord 帳號綁定失敗</h2>
            <p class="result-description">
              您嘗試綁定的 Discord 帳號創建未滿一年，基於安全考量，無法完成綁定。
            </p>
            <div class="discord-requirement">
              <div class="requirement-icon">🛡️</div>
              <div class="requirement-text">
                <h3>帳號年齡要求</h3>
                <p>為了維護平台安全與交易品質，我們僅允許綁定創建時間超過一年的 Discord 帳號。</p>
              </div>
            </div>
            <p class="additional-info">
              您可以使用創建時間較長的 Discord 帳號，或等待當前帳號滿一年後再嘗試綁定。
            </p>
            <div class="action-buttons">
              <button class="primary-button" @click="goToMemberProfile">返回會員中心</button>
            </div>
          </div>

          <!-- Discord 帳號已被其他用戶綁定 -->
          <div v-else-if="discordStatus === 'dcisalreadyused'" class="result-card error">
            <div class="result-icon">✗</div>
            <h2>Discord 帳號綁定失敗</h2>
            <p class="result-description">此 Discord 帳號已被其他用戶綁定，請使用其他帳號。</p>
            <div class="discord-requirement">
              <div class="requirement-icon">🔒</div>
              <div class="requirement-text">
                <h3>帳號使用限制</h3>
                <p>為了維護平台安全與交易品質，每個 Discord 帳號只能綁定一個平台用戶。</p>
              </div>
            </div>
            <p class="additional-info">您可以使用其他 Discord 帳號嘗試綁定，或聯繫客服尋求協助。</p>
            <div class="action-buttons">
              <button class="primary-button" @click="goToMemberProfile">返回會員中心</button>
            </div>
          </div>

          <!-- 未知狀態 -->
          <div v-else class="result-card neutral">
            <div class="result-icon">?</div>
            <h2>無效的操作</h2>
            <p class="result-description">您嘗試訪問的頁面不包含有效的操作參數。</p>

            <button class="primary-button" @click="goToMemberProfile">返回會員中心</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 變數定義
$primary-color: #b4282d;
$primary-color-dark: #8c1f23;
$success-color: #4caf50;
$success-color-dark: #3d8b40;
$error-color: #f44336;
$error-color-dark: #c62828;
$warning-color: #ff9800;
$warning-color-dark: #e65100;
$neutral-color: #607d8b;
$neutral-color-dark: #455a64;
$background-color: #f5f5f5;
$text-color: #333333;
$spacing-unit: 8px;
$transition: all 0.3s ease;
$discord-color: #5865f2;
$font-family: 'Microsoft YaHei', '微軟雅黑', sans-serif;

.account-link-result-page-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: $background-color;
  background-image: linear-gradient(135deg, #ffffff, #f0f0f0);
  z-index: 10; // 確保它在其他元素上方
}

// 修改原有的頁面容器樣式
.account-link-result-page {
  width: 100%;
  max-width: 550px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: $font-family;
  padding: $spacing-unit * 3;
}

// 結果卡片樣式
.result-container {
  max-width: 550px;
  width: 100%;
  margin: 0 auto;
  animation: slideUp 0.5s ease;
}

.result-card {
  background-color: white;
  border-radius: $spacing-unit * 2;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: $spacing-unit * 5;
  text-align: center;

  &.success {
    border-top: 5px solid $success-color;
  }

  &.error {
    border-top: 5px solid $error-color;
  }

  &.warning {
    border-top: 5px solid $warning-color;
  }

  &.neutral {
    border-top: 5px solid $neutral-color;
  }

  .result-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    margin: 0 auto $spacing-unit * 3;

    .success & {
      background-color: rgba($success-color, 0.1);
      color: $success-color;
    }

    .error & {
      background-color: rgba($error-color, 0.1);
      color: $error-color;
    }

    .warning & {
      background-color: rgba($warning-color, 0.1);
      color: $warning-color;
    }

    .neutral & {
      background-color: rgba($neutral-color, 0.1);
      color: $neutral-color;
    }
  }

  h2 {
    font-size: 24px;
    margin-bottom: $spacing-unit * 3;

    .success & {
      color: $success-color;
    }

    .error & {
      color: $error-color;
    }

    .warning & {
      color: $warning-color;
    }

    .neutral & {
      color: $neutral-color;
    }
  }

  .result-description {
    font-size: 16px;
    color: #666;
    line-height: 1.5;
    margin-bottom: $spacing-unit * 4;
  }

  .discord-info {
    display: flex;
    align-items: center;
    justify-content: center; // 置中對齊
    margin: $spacing-unit * 4 0;
    padding: $spacing-unit * 3;
    background-color: rgba($discord-color, 0.05);
    border-radius: $spacing-unit;
    border: 1px solid rgba($discord-color, 0.1);
    gap: $spacing-unit * 3; // 增加頭像和名稱之間的間距
  }

  .discord-requirement {
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    margin: $spacing-unit * 4 0;
    padding: $spacing-unit * 3;
    background-color: rgba($warning-color, 0.05);
    border-radius: $spacing-unit;
    border: 1px solid rgba($warning-color, 0.1);
    text-align: left;
    gap: $spacing-unit * 3;

    .requirement-icon {
      font-size: 24px;
      color: $warning-color;
      flex-shrink: 0;
      margin-top: $spacing-unit;
    }

    .requirement-text {
      h3 {
        font-size: 18px;
        color: $warning-color;
        margin: 0 0 $spacing-unit 0;
      }

      p {
        font-size: 14px;
        color: #666;
        line-height: 1.5;
        margin: 0;
      }
    }
  }

  .discord-avatar-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .discord-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid $discord-color;
  }

  .discord-logo {
    width: 48px;
    height: 48px;
  }

  .discord-user-details {
    display: flex;
    flex-direction: column;
    align-items: center; // 置中對齊
    text-align: center;
  }

  .discord-global-name {
    font-weight: bold;
    font-size: 18px;
    color: $discord-color;
    margin-bottom: 4px;
  }

  .additional-info {
    font-size: 14px;
    color: #999;
    margin-bottom: $spacing-unit * 4;
    font-style: italic;
  }

  .action-buttons {
    display: flex;
    gap: $spacing-unit * 2;
    justify-content: center;
    margin-top: $spacing-unit * 4;

    @media (max-width: 480px) {
      flex-direction: column-reverse;
    }
  }
}

// 按鈕樣式
.primary-button,
.secondary-button {
  padding: $spacing-unit * 2 $spacing-unit * 4;
  border-radius: $spacing-unit;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  transition: $transition;
  border: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
}

.primary-button {
  background-color: $primary-color;
  color: white;

  &:hover {
    background-color: $primary-color-dark;
  }

  .success & {
    background-color: $success-color;

    &:hover {
      background-color: $success-color-dark;
    }
  }

  .error & {
    background-color: $error-color;

    &:hover {
      background-color: $error-color-dark;
    }
  }

  .warning & {
    background-color: $warning-color;

    &:hover {
      background-color: $warning-color-dark;
    }
  }
}

.secondary-button {
  background-color: white;
  color: #666;
  border: 1px solid #ddd;

  &:hover {
    background-color: #f9f9f9;
  }
}

// 加載狀態樣式
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-unit * 5;
  background-color: white;
  border-radius: $spacing-unit * 2;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  .loading-spinner {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid rgba($primary-color, 0.1);
    border-top-color: $primary-color;
    animation: spin 1s infinite linear;
    margin-bottom: $spacing-unit * 3;
  }

  p {
    color: #666;
    font-size: 16px;
  }
}

// 動畫
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 響應式調整
@media (max-width: 600px) {
  .result-card {
    padding: $spacing-unit * 3;
  }

  .result-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  h2 {
    font-size: 20px;
  }

  .discord-requirement {
    flex-direction: column;
    align-items: center;
    text-align: center;

    .requirement-text {
      h3 {
        text-align: center;
      }
    }
  }
}
</style>
