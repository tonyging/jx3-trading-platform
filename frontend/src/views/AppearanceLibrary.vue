<!-- src/views/AppearanceLibrary.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { appearanceApi } from '@/services/api/appearance'
import type { Appearance, AppearanceSubmission } from '@/types'
import CreateAppearanceModal from '@/components/CreateAppearanceModal.vue'
import AppearancePagination from '@/components/AppearancePagination.vue'
import { useUserStore } from '@/stores/user'

// 獲取用戶信息
const userStore = useUserStore()

// 定義目前的活躍頁籤
const activeTab = ref<'official' | 'pending'>('official')

// 定義資料狀態
const appearances = ref<Appearance[]>([])
const pendingSubmissions = ref<AppearanceSubmission[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// 分頁相關狀態
const pagination = ref({
  current: 1,
  total: 1,
  totalRecords: 0,
})

// 搜尋相關狀態
const searchQuery = ref('')

// 控制提交外觀的模態窗
const isCreateModalOpen = ref(false)

// 拒絕外觀的相關狀態
const rejectModalOpen = ref(false)
const currentSubmissionId = ref('')
const rejectReason = ref('')

// 載入資料的方法
const loadData = async () => {
  isLoading.value = true
  error.value = null

  try {
    switch (activeTab.value) {
      case 'official':
        const officialResponse = await appearanceApi.getAllAppearances({
          page: pagination.value.current,
          query: searchQuery.value,
        })
        appearances.value = officialResponse.data.appearances
        pagination.value = officialResponse.data.pagination
        break
      case 'pending':
        const pendingResponse = await appearanceApi.getPendingSubmissions({
          page: pagination.value.current,
        })
        pendingSubmissions.value = pendingResponse.data.submissions
        pagination.value = pendingResponse.data.pagination
        break
    }
  } catch (err) {
    console.error('載入資料時發生錯誤', err)
    error.value = '無法載入資料，請稍後再試'
  } finally {
    isLoading.value = false
  }
}

// 分頁變更事件
const handlePageChange = (page: number) => {
  pagination.value.current = page
  loadData()
}

// 搜尋事件
const handleSearch = () => {
  pagination.value.current = 1
  loadData()
}

// 切換頁籤事件
const handleTabChange = (tab: 'official' | 'pending') => {
  activeTab.value = tab
  pagination.value.current = 1
  loadData()
}

// 提交新外觀
const handleSubmitAppearance = async (data: {
  officialName: string
  nicknames?: string[]
  images?: {
    adultMale?: string
    adultFemale?: string
    childMale?: string
    childFemale?: string
  }
}) => {
  try {
    await appearanceApi.submitAppearance(data)
    isCreateModalOpen.value = false
    // 重新載入待審核頁籤
    activeTab.value = 'pending'
    loadData()
  } catch (error) {
    console.error('提交外觀失敗', error)
  }
}

// 檢查提交者是否為當前用戶
const isCurrentUser = (submission: AppearanceSubmission): boolean => {
  if (!userStore.currentUser || !userStore.currentUser.id) return false

  // 檢查 submittedBy 是否為物件或字串
  if (typeof submission.submittedBy === 'object' && submission.submittedBy !== null) {
    return submission.submittedBy._id === userStore.currentUser.id
  } else if (typeof submission.submittedBy === 'string') {
    return submission.submittedBy === userStore.currentUser.id
  }

  return false
}

// 處理刪除提交的外觀
const handleDeleteSubmission = async (submissionId: string) => {
  try {
    await appearanceApi.deleteSubmission(submissionId)
    loadData()
  } catch (error) {
    console.error('刪除提交失敗', error)
  }
}

// 打開拒絕模態窗
const openRejectModal = (submissionId: string) => {
  currentSubmissionId.value = submissionId
  rejectReason.value = ''
  rejectModalOpen.value = true
}

// 關閉拒絕模態窗
const closeRejectModal = () => {
  rejectModalOpen.value = false
  currentSubmissionId.value = ''
}

// 提交拒絕
const submitReject = async () => {
  if (!rejectReason.value.trim()) {
    alert('請提供拒絕理由')
    return
  }

  try {
    await appearanceApi.reviewSubmission(currentSubmissionId.value, 'reject', rejectReason.value)
    closeRejectModal()
    loadData()
  } catch (error) {
    console.error('拒絕外觀失敗', error)
  }
}

// 審核外觀的方法
const handleReviewAppearance = async (submissionId: string, action: 'approve' | 'reject') => {
  try {
    if (action === 'reject') {
      openRejectModal(submissionId)
      return
    }

    await appearanceApi.reviewSubmission(submissionId, action)
    loadData()
  } catch (error) {
    console.error('審核外觀失敗', error)
  }
}

// 判斷提交者名稱
// const getSubmitterName = (submission: AppearanceSubmission): string => {
//   if (typeof submission.submittedBy === 'object' && submission.submittedBy !== null) {
//     return submission.submittedBy.name || '未知用戶'
//   }
//   return '未知用戶'
// }

// 獲取適當的圖片URL
const getAppearanceImage = (appearance: Appearance | AppearanceSubmission): string | undefined => {
  if (!appearance.images) return undefined
  return (
    appearance.images.adultMale ||
    appearance.images.adultFemale ||
    appearance.images.childMale ||
    appearance.images.childFemale ||
    undefined
  )
}

// 生命週期鉤子
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="appearance-library-container">
    <!-- 頁籤導航 -->
    <nav class="appearance-tabs">
      <button :class="{ active: activeTab === 'official' }" @click="handleTabChange('official')">
        外觀資料庫
      </button>
      <button :class="{ active: activeTab === 'pending' }" @click="handleTabChange('pending')">
        提交外觀數據
      </button>
    </nav>

    <!-- 內容區域 -->
    <main class="appearance-content">
      <!-- 搜尋框 - 在外觀資料庫頁籤顯示 -->
      <div v-if="activeTab === 'official'" class="search-container">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="搜尋外觀名稱或暱稱"
          @keyup.enter="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">搜尋</button>
      </div>

      <!-- 載入指示器 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>載入中...</p>
      </div>

      <!-- 錯誤提示 -->
      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="loadData">重試</button>
      </div>

      <!-- 不同頁籤的內容 -->
      <template v-else>
        <!-- 官方外觀列表 -->
        <section v-if="activeTab === 'official'" class="official-appearances">
          <div v-if="appearances.length === 0" class="empty-state">
            <p>沒有找到符合條件的外觀</p>
          </div>
          <div v-else class="appearances-flex">
            <div v-for="appearance in appearances" :key="appearance._id" class="appearance-card">
              <div class="appearance-image-container">
                <img
                  v-if="getAppearanceImage(appearance)"
                  :src="getAppearanceImage(appearance)"
                  alt="外觀圖片"
                  class="appearance-image"
                />
                <div v-else class="no-image">
                  <span>無照片</span>
                </div>
              </div>
              <div class="appearance-info">
                <h3 class="appearance-name">{{ appearance.officialName }}</h3>
                <div class="appearance-nicknames">
                  <span
                    v-for="(nickname, index) in appearance.nicknames"
                    :key="index"
                    class="nickname-tag"
                  >
                    {{ nickname }}
                  </span>
                  <span
                    v-if="!appearance.nicknames || appearance.nicknames.length === 0"
                    class="no-nickname"
                  >
                    無暱稱
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 待審核外觀列表 -->
        <section v-if="activeTab === 'pending'" class="pending-appearances">
          <div v-if="pendingSubmissions.length === 0 && !isLoading" class="empty-state">
            <div class="appearance-card add-card" @click="isCreateModalOpen = true">
              <div class="add-icon">+</div>
            </div>
          </div>
          <div v-else class="appearances-flex">
            <!-- 提交新外觀的卡片 -->
            <div class="appearance-card add-card" @click="isCreateModalOpen = true">
              <div class="add-icon">+</div>
            </div>

            <!-- 審核中的外觀提交 -->
            <div
              v-for="submission in pendingSubmissions"
              :key="submission._id"
              class="appearance-card submission-card"
            >
              <div class="appearance-image-container">
                <img
                  v-if="getAppearanceImage(submission)"
                  :src="getAppearanceImage(submission)"
                  alt="外觀圖片"
                  class="appearance-image"
                />
                <div v-else class="no-image">
                  <span>無照片</span>
                </div>
              </div>

              <div class="appearance-info">
                <h3 class="appearance-name">{{ submission.officialName }}</h3>

                <div
                  class="appearance-nicknames"
                  v-if="submission.nicknames && submission.nicknames.length > 0"
                >
                  <span
                    v-for="(nickname, index) in submission.nicknames"
                    :key="index"
                    class="nickname-tag"
                  >
                    {{ nickname }}
                  </span>
                </div>
                <div v-else class="no-nicknames">無暱稱</div>
              </div>

              <!-- 根據提交者是否為當前用戶顯示不同的按鈕 -->
              <div class="submission-actions">
                <!-- 如果提交者是當前用戶，顯示刪除按鈕 -->
                <button
                  v-if="isCurrentUser(submission)"
                  class="delete-btn"
                  @click="handleDeleteSubmission(submission._id)"
                >
                  刪除
                </button>

                <!-- 如果提交者不是當前用戶，顯示批准/拒絕按鈕 -->
                <template v-else>
                  <button
                    class="approve-btn"
                    @click="handleReviewAppearance(submission._id, 'approve')"
                  >
                    批准
                  </button>
                  <button
                    class="reject-btn"
                    @click="handleReviewAppearance(submission._id, 'reject')"
                  >
                    拒絕
                  </button>
                </template>
              </div>
            </div>
          </div>
        </section>
      </template>
    </main>

    <!-- 分頁元件 -->
    <AppearancePagination
      v-if="pagination.total > 1"
      :current-page="pagination.current"
      :total-pages="pagination.total"
      @page-change="handlePageChange"
    />

    <!-- 提交外觀的模態窗 -->
    <CreateAppearanceModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @submit="handleSubmitAppearance"
    />

    <!-- 拒絕外觀的模態窗 -->
    <div v-if="rejectModalOpen" class="modal-overlay">
      <div class="reject-modal">
        <h3>拒絕外觀提交</h3>
        <p>請提供拒絕的理由:</p>
        <textarea v-model="rejectReason" placeholder="請輸入拒絕理由" rows="4"></textarea>
        <div class="modal-actions">
          <button class="cancel-btn" @click="closeRejectModal">取消</button>
          <button class="submit-btn" @click="submitReject">確認拒絕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 基礎變數定義
$primary-color: #b4282d;
$primary-hover: #d4282d;
$background-color: #f5f5f5;
$text-color: #333333;
$success-color: #52c41a;
$warning-color: #faad14;
$error-color: #f5222d;
$font-family: 'Microsoft YaHei', '微軟雅黑', sans-serif;
$spacing-unit: 8px;
$box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
$transition: all 0.3s ease;

.appearance-library-container {
  width: 90%;
  margin: $spacing-unit * 6 auto;
  max-width: 1200px;
  padding: $spacing-unit * 2;
  border-radius: $spacing-unit * 1.5;
  background: #ffffff;
  box-shadow: $box-shadow;
  border: 1px solid rgba($primary-color, 0.1);
  border-radius: $spacing-unit * 1.5;
  flex-direction: column;
}

.appearance-tabs {
  display: flex;
  padding: 0 $spacing-unit * 3;
  margin: $spacing-unit * 3 0;
  border-bottom: 1px solid #e0e0e0;

  button {
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
}

.appearance-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 $spacing-unit * 3;
}

.search-container {
  margin-bottom: $spacing-unit * 4;
  display: flex;
  gap: $spacing-unit;

  input {
    flex: 1;
    padding: $spacing-unit * 1.5;
    border: 1px solid #e0e0e0;
    border-radius: $spacing-unit;
    font-family: $font-family;
    transition: $transition;

    &:focus {
      border-color: $primary-color;
      outline: none;
      box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
    }
  }

  .search-btn {
    padding: $spacing-unit * 1.5 $spacing-unit * 3;
    background-color: $primary-color;
    color: white;
    border: none;
    border-radius: $spacing-unit;
    cursor: pointer;
    transition: $transition;

    &:hover {
      background-color: $primary-hover;
    }
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-unit * 8 0;
  flex: 1;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba($primary-color, 0.1);
    border-radius: 50%;
    border-top: 4px solid $primary-color;
    animation: spin 1s linear infinite;
    margin-bottom: $spacing-unit * 2;
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

.error-container {
  text-align: center;
  padding: $spacing-unit * 4;
  flex: 1;

  p {
    color: $error-color;
    margin-bottom: $spacing-unit * 2;
  }

  button {
    padding: $spacing-unit $spacing-unit * 2;
    background-color: $primary-color;
    color: white;
    border: none;
    border-radius: $spacing-unit;
    cursor: pointer;
  }
}

.empty-state {
  text-align: center;
  padding: $spacing-unit * 6;
  color: #999;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.official-appearances,
.pending-appearances {
  flex: 1;
  display: flex;
  flex-direction: column;
}

// 改為 Flexbox 布局，更好地實現橫排顯示和換行
.appearances-flex {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-unit * 3;
  margin-bottom: $spacing-unit * 4;
  width: 100%;
}

.appearance-card {
  flex: 0 0 calc(33% - #{$spacing-unit * 2});
  max-width: calc(33% - #{$spacing-unit * 2});
  display: flex;
  flex-direction: column;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: $spacing-unit;
  overflow: hidden;
  transition: box-shadow $transition;
  margin-bottom: $spacing-unit * 2;
  min-width: 250px; // 確保最小寬度

  &:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .appearance-image-container {
    height: 200px; // 稍微增加高度
    overflow: hidden;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;

    .appearance-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-image {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 14px;
    }
  }

  .appearance-info {
    padding: $spacing-unit * 2;
    flex: 1;
    display: flex;
    flex-direction: column;

    .appearance-name {
      margin: 0 0 $spacing-unit 0;
      font-size: 18px; // 增加字體大小
      font-weight: 600;
      color: $text-color;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    // 提交者信息已移除

    .appearance-nicknames {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .nickname-tag {
        font-size: 14px; // 增加字體大小
        padding: 4px $spacing-unit;
        background-color: rgba($primary-color, 0.1);
        color: $primary-color;
        border-radius: $spacing-unit;
        white-space: nowrap;
      }

      .no-nickname {
        font-size: 14px;
        color: #999;
      }
    }

    .no-nicknames {
      font-size: 14px;
      color: #999;
    }
  }
}

.submission-card {
  .submission-actions {
    display: flex;
    gap: $spacing-unit;
    padding: $spacing-unit * 2;
    border-top: 1px solid #f0f0f0;
    margin-top: auto; // 確保按鈕在底部

    .approve-btn,
    .reject-btn,
    .delete-btn {
      flex: 1;
      padding: $spacing-unit * 1.5; // 增加按鈕高度
      border: none;
      border-radius: $spacing-unit;
      color: white;
      font-weight: 500;
      transition: $transition;
      cursor: pointer;
      font-size: 16px; // 增加字體大小
    }

    .approve-btn {
      background-color: $success-color;

      &:hover {
        background-color: rgba($success-color, 0.8);
      }
    }

    .reject-btn {
      background-color: $error-color;

      &:hover {
        background-color: rgba($error-color, 0.8);
      }
    }

    .delete-btn {
      background-color: $error-color;

      &:hover {
        background-color: rgba($error-color, 0.8);
      }
    }
  }
}

.add-card {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba($primary-color, 0.3);
  background-color: rgba($background-color, 0.5);
  min-height: 280px; // 確保與其他卡片高度一致
  order: 999; // 確保加號卡片始終排在最後

  .add-icon {
    font-size: 64px; // 增加字體大小
    color: $primary-color;
    opacity: 0.6;
    transition: $transition;
  }

  &:hover .add-icon {
    opacity: 1;
    transform: scale(1.1);
  }
}

// 拒絕模態窗樣式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.reject-modal {
  background-color: white;
  border-radius: $spacing-unit;
  padding: $spacing-unit * 3;
  width: 90%;
  max-width: 500px;
  box-shadow: $box-shadow;

  h3 {
    margin: 0 0 $spacing-unit * 2 0;
    color: $error-color;
  }

  p {
    margin-bottom: $spacing-unit;
  }

  textarea {
    width: 100%;
    padding: $spacing-unit;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin-bottom: $spacing-unit * 2;
    resize: vertical;

    &:focus {
      border-color: $primary-color;
      outline: none;
    }
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-unit;

    button {
      padding: $spacing-unit $spacing-unit * 2;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      transition: $transition;

      &.cancel-btn {
        background-color: #f0f0f0;
        color: #666;

        &:hover {
          background-color: #e0e0e0;
        }
      }

      &.submit-btn {
        background-color: $error-color;
        color: white;

        &:hover {
          background-color: rgba($error-color, 0.8);
        }
      }
    }
  }
}

// 響應式設計 - 根據屏幕大小調整一排顯示的卡片數量
@media (min-width: 1600px) {
  .appearance-card {
    flex: 0 0 calc(33.333% - #{$spacing-unit * 2});
    max-width: calc(33.333% - #{$spacing-unit * 2});
  }
}

@media (max-width: 1200px) {
  .appearance-card {
    flex: 0 0 calc(50% - #{$spacing-unit * 2});
    max-width: calc(50% - #{$spacing-unit * 2});
  }
}

@media (max-width: 768px) {
  .appearance-content,
  .appearance-tabs {
    padding: 0 $spacing-unit * 2;
  }

  .appearance-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;

    button {
      padding: $spacing-unit * 1.5 $spacing-unit * 2;
      white-space: nowrap;
    }
  }

  .appearances-flex {
    gap: $spacing-unit * 2;
  }

  .appearance-card {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

@media (max-width: 576px) {
  .search-container {
    flex-direction: column;
  }

  .appearance-card {
    flex: 0 0 100%;
    max-width: 100%;

    .appearance-image-container {
      height: 200px;
    }
  }
}
</style>
