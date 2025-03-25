<!-- src/components/CreateAppearanceModal.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// 定義屬性和事件
const { isOpen } = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: CreateAppearanceData): void
}>()

// 定義表單資料型別
interface CreateAppearanceData {
  officialName: string
  nicknames: string[]
  // 保留圖片字段以便未來重新啟用
  images: {
    adultMale?: string
    adultFemale?: string
    childMale?: string
    childFemale?: string
  }
}

// 表單資料
const formData = ref<CreateAppearanceData>({
  officialName: '',
  nicknames: [],
  images: {}, // 保留空對象以維持型別一致性
})

// 臨時的單一暱稱輸入
const tempNickname = ref('')

// 圖片上傳相關，暫時註釋但保留代碼以便未來重新啟用
/*
// 圖片上傳參照
const imageInputs = ref<{
  [key: string]: HTMLInputElement | null
}>({
  adultMale: null,
  adultFemale: null,
  childMale: null,
  childFemale: null,
})

// 圖片預覽
const imagePreview = ref<{
  [key: string]: string
}>({})

// 處理圖片上傳
const handleImageUpload = (type: keyof CreateAppearanceData['images']) => {
  const input = imageInputs.value[type]
  if (input && input.files && input.files[0]) {
    const file = input.files[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result as string
      formData.value.images[type] = result
      imagePreview.value[type] = result
    }

    reader.readAsDataURL(file)
  }
}

// 移除圖片
const removeImage = (type: keyof CreateAppearanceData['images']) => {
  delete formData.value.images[type]
  delete imagePreview.value[type]

  // 重置文件輸入
  const input = imageInputs.value[type]
  if (input) {
    input.value = ''
  }
}
*/

// 驗證表單
const isFormValid = computed(() => {
  return formData.value.officialName.trim() !== ''
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
const submitForm = () => {
  if (isFormValid.value) {
    emit('submit', { ...formData.value })
    resetForm()
  }
}

// 重置表單
const resetForm = () => {
  formData.value = {
    officialName: '',
    nicknames: [],
    images: {},
  }
  // 圖片相關重置，暫時註釋
  /*
  imagePreview.value = {}

  // 重置所有文件輸入
  Object.values(imageInputs.value).forEach((input) => {
    if (input) input.value = ''
  })
  */
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

      <h2>提交新外觀</h2>

      <form @submit.prevent="submitForm" class="appearance-form">
        <!-- 外觀名稱 -->
        <div class="form-group">
          <label for="officialName">外觀正式名稱 <span class="required">*</span></label>
          <input
            id="officialName"
            v-model="formData.officialName"
            type="text"
            required
            placeholder="請輸入外觀的正式名稱"
          />
        </div>

        <!-- 暱稱管理 -->
        <div class="form-group">
          <label>外觀別稱</label>
          <div class="nickname-input-group">
            <input
              v-model="tempNickname"
              type="text"
              placeholder="別稱, 例如:一代金,輸入完畢後請按新增"
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

        <!-- 圖片上傳部分暫時註釋 -->
        <!--
        <div class="form-group">
          <label>外觀圖片</label>
          <div class="image-upload-grid">
            <div
              v-for="(label, type) in {
                adultMale: '成男',
                adultFemale: '成女',
                childMale: '正太',
                childFemale: '蘿莉',
              }"
              :key="type"
              class="image-upload-item"
            >
              <label :for="`${type}Upload`">{{ label }}</label>

              <div v-if="imagePreview[type]" class="image-preview">
                <img :src="imagePreview[type]" :alt="label" />
                <button type="button" @click="removeImage(type)" class="remove-image-btn">
                  移除
                </button>
              </div>

              <input
                :id="`${type}Upload`"
                type="file"
                accept="image/*"
                :ref="(el) => (imageInputs[type] = el)"
                @change="() => handleImageUpload(type)"
                style="display: none"
              />

              <button
                v-if="!imagePreview[type]"
                type="button"
                @click="imageInputs[type]?.click()"
                class="upload-image-btn"
              >
                上傳圖片
              </button>
            </div>
          </div>
        </div>
        -->

        <!-- 添加功能暫時停用的提示 -->
        <div class="form-group image-upload-notice">
          <p>【圖片上傳功能暫時停用，未來將重新開放】</p>
        </div>

        <!-- 提交按鈕 -->
        <div class="form-actions">
          <button type="button" class="cancel-btn" @click="closeModal">取消</button>
          <button type="submit" class="submit-btn" :disabled="!isFormValid">提交</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #b4282d;
$background-color: #f5f5f5;
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

  /* 圖片上傳相關樣式保留 */
  .image-upload-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    .image-upload-item {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;

      .image-preview {
        position: relative;
        width: 100%;
        aspect-ratio: 1/1;
        overflow: hidden;
        border-radius: 8px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-image-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
      }

      .upload-image-btn {
        background-color: $background-color;
        border: 1px dashed $border-color;
        color: $text-color;
        padding: 10px;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
      }
    }
  }

  /* 添加圖片上傳功能暫時停用的提示樣式 */
  .image-upload-notice {
    background-color: $background-color;
    padding: 15px;
    border-radius: 8px;
    text-align: center;

    p {
      color: $text-color;
      font-style: italic;
      margin: 0;
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
        background-color: #e0e0e0; // 替代 darken 函數
      }
    }

    .submit-btn {
      background-color: $primary-color;
      color: white;

      &:disabled {
        background-color: #e09a9d; // 替代 lighten 函數
        cursor: not-allowed;
      }

      &:not(:disabled):hover {
        background-color: #8e2124; // 替代 darken 函數
      }
    }
  }
}
</style>
