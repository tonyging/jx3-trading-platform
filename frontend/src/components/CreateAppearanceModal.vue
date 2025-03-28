<!-- src/components/CreateAppearanceModal.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { AppearanceCategory } from '@/types'
import { appearanceApi } from '@/services/api/appearance'

// 定義屬性和事件
const { isOpen } = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit'): void
}>()

// 分類選項
const categories: AppearanceCategory[] = [
  '外觀禮盒',
  '上衣',
  '髮型',
  '披風',
  '頭飾',
  '背掛',
  '腰掛',
  '面掛',
  '肩飾',
  '眼飾',
  '手飾',
  '佩囊',
  '小頭像',
  '寵物',
  '掛寵',
  '坐騎',
  '馬具',
  '其他',
]

// 表單資料
const formData = ref({
  officialName: '',
  nicknames: [] as string[],
})

// 選擇的分類
const selectedCategory = ref<AppearanceCategory>('其他')

// 臨時的單一暱稱輸入
const tempNickname = ref('')

// 提交中狀態
const isSubmitting = ref(false)

// 驗證表單
const isFormValid = computed(() => {
  return formData.value.officialName.trim() !== '' && categories.includes(selectedCategory.value)
})

// 新增暱稱
const addNickname = () => {
  const nickname = tempNickname.value.trim()
  if (nickname && !formData.value.nicknames.includes(nickname)) {
    formData.value.nicknames.push(nickname)
    tempNickname.value = ''
  }
}

// 移除暱稱
const removeNickname = (nickname: string) => {
  formData.value.nicknames = formData.value.nicknames.filter((n) => n !== nickname)
}

// 提交表單
const submitForm = async () => {
  if (isFormValid.value && !isSubmitting.value) {
    isSubmitting.value = true
    try {
      await appearanceApi.submitAppearance({
        officialName: formData.value.officialName,
        nicknames: formData.value.nicknames,
        category: selectedCategory.value,
      })

      // 重置表單並關閉
      resetForm()

      // 通知父組件提交成功，讓父組件刷新數據
      emit('submit')

      // 關閉模態窗
      emit('close')
    } catch (error) {
      // 錯誤處理
      console.error('提交外觀失敗', error)
      alert('提交外觀失敗，請稍後再試。')
    } finally {
      isSubmitting.value = false
    }
  }
}

// 重置表單
const resetForm = () => {
  formData.value = {
    officialName: '',
    nicknames: [],
  }
  selectedCategory.value = '其他'
  tempNickname.value = ''
}

// 關閉模態窗
const closeModal = () => {
  resetForm()
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="appearance-modal-overlay" @click.self="closeModal">
    <div class="appearance-modal-content">
      <button class="modal-close-btn" @click="closeModal">✕</button>

      <h2>新增外觀數據</h2>

      <form @submit.prevent="submitForm" class="appearance-form">
        <!-- 外觀名稱 -->
        <div class="form-group">
          <label for="officialName">正式名稱 <span class="required">*</span></label>
          <input
            id="officialName"
            v-model="formData.officialName"
            type="text"
            required
            placeholder="請輸入遊戲內的正式名稱"
          />
        </div>

        <!-- 分類選擇 -->
        <div class="form-group">
          <label>外觀分類 <span class="required">*</span></label>
          <div class="category-grid">
            <button
              v-for="category in categories"
              :key="category"
              type="button"
              class="category-btn"
              :class="{ selected: selectedCategory === category }"
              @click="selectedCategory = category"
            >
              {{ category }}
            </button>
          </div>
        </div>

        <!-- 暱稱管理 -->
        <div class="form-group">
          <label>外觀別稱</label>
          <div class="nickname-input-group">
            <input
              v-model="tempNickname"
              type="text"
              placeholder="選填, 例如:一代金,輸入完畢後請按新增"
              @keyup.enter="addNickname"
            />
            <button type="button" @click="addNickname" class="add-nickname-btn">新增</button>
          </div>

          <div class="nicknames-list" v-if="formData.nicknames.length">
            <span v-for="nickname in formData.nicknames" :key="nickname" class="nickname-tag">
              {{ nickname }}
              <button type="button" @click="removeNickname(nickname)" class="remove-nickname-btn">
                ✕
              </button>
            </span>
          </div>
        </div>

        <!-- 提交按鈕 -->
        <div class="form-actions">
          <button type="button" class="cancel-btn" @click="closeModal">取消</button>
          <button type="submit" class="submit-btn" :disabled="!isFormValid || isSubmitting">
            {{ isSubmitting ? '提交中...' : '提交' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #b4282d;
$primary-color-hover: #a3181d; // 預先定義的深色版本，取代 darken
$background-color: #f5f5f5;
$background-color-hover: #e5e5e5; // 預先定義的深色版本，取代 darken
$text-color: #333;
$border-color: #e0e0e0;

.appearance-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.appearance-modal-content {
  background-color: white;
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
  position: relative;

  .modal-close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: $text-color;
  }

  h2 {
    margin-bottom: 20px;
    color: $primary-color;
    text-align: center;
  }

  .appearance-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 10px;

    label {
      font-weight: bold;

      .required {
        color: $primary-color;
      }
    }

    input[type='text'] {
      padding: 10px;
      border: 1px solid $border-color;
      border-radius: 4px;
    }
  }

  .nickname-input-group {
    display: flex;
    gap: 10px;

    input {
      flex: 1;
    }

    .add-nickname-btn {
      background-color: $primary-color;
      color: white;
      border: none;
      padding: 10px;
      border-radius: 4px;
      cursor: pointer;
    }
  }

  .nicknames-list {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;

    .nickname-tag {
      background-color: $background-color;
      padding: 5px 10px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 5px;

      .remove-nickname-btn {
        background: none;
        border: none;
        color: $primary-color;
        cursor: pointer;
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    gap: 20px;

    button {
      flex: 1;
      padding: 12px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .cancel-btn {
      background-color: $background-color;
      color: $text-color;

      &:hover {
        background-color: $background-color-hover;
      }
    }

    .submit-btn {
      background-color: $primary-color;
      color: white;

      &:disabled {
        background-color: #e57a7e; // 使用具體顏色值代替 lighten
        cursor: not-allowed;
      }

      &:not(:disabled):hover {
        background-color: $primary-color-hover;
      }
    }
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;

  .category-btn {
    padding: 8px;
    border: 1px solid $border-color;
    background-color: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;

    &.selected {
      background-color: $primary-color;
      color: white;
      border-color: $primary-color;
    }

    &:hover {
      background-color: $background-color;
    }
  }
}
</style>
