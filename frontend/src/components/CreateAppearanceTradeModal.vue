<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { appearanceApi } from '@/services/api/appearance'
import type { Appearance } from '@/types'
import type { AppearancePaymentMethod, AppearanceCurrency } from '@/types/appearanceTrade'

const router = useRouter()

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  submit: [
    data: {
      appearanceId: string
      price: number
      characterNickname: string
      paymentMethods: AppearancePaymentMethod[]
      currency: AppearanceCurrency
    },
  ]
}>()

// 表單資料
const appearanceId = ref('')
const price = ref('')
const characterNickname = ref('')
const currency = ref<AppearanceCurrency>('台幣')
const errorMessage = ref('')
const isSubmitting = ref(false)
const appearances = ref<Appearance[]>([])
const isLoadingAppearances = ref(false)

// 可用的支付方式選項
const paymentOptions: AppearancePaymentMethod[] = [
  '匯款',
  'Line Pay',
  '街口支付',
  '支付寶',
  '微信',
  '8591',
  '遊戲幣',
]

// 可用的幣別選項
const currencyOptions: AppearanceCurrency[] = ['台幣', '人民幣', '港幣', '遊戲幣']

// 選擇的支付方式
const selectedPaymentMethods = ref<AppearancePaymentMethod[]>(['匯款'])

// 是否為遊戲幣模式（用於控制交易方式的鎖定）
const isGameCurrencyMode = computed(() => currency.value === '遊戲幣')

// 判斷某個支付方式是否應該被禁用
const isPaymentMethodDisabled = (method: AppearancePaymentMethod) => {
  if (isGameCurrencyMode.value) {
    return true // 遊戲幣模式下所有支付方式都禁用
  }

  // 非遊戲幣模式下，只有「遊戲幣」支付方式被禁用
  return method === '遊戲幣'
}

// 切換支付方式選擇
const togglePaymentMethod = (method: AppearancePaymentMethod) => {
  // 如果是遊戲幣模式，不允許更改任何交易方式
  if (isGameCurrencyMode.value) {
    return
  }

  // 非遊戲幣模式下，不允許選擇「遊戲幣」支付方式
  if (method === '遊戲幣' && !isGameCurrencyMode.value) {
    return
  }

  const index = selectedPaymentMethods.value.indexOf(method)

  if (index === -1) {
    // 如果未選中，則添加
    selectedPaymentMethods.value.push(method)
  } else {
    // 如果只有一種支付方式，不允許移除
    if (selectedPaymentMethods.value.length === 1) {
      return
    }

    // 移除方法
    selectedPaymentMethods.value.splice(index, 1)
  }
}

// 關閉 Modal
const handleClose = () => {
  emit('update:isOpen', false)
  // 重置表單
  appearanceId.value = ''
  price.value = ''
  characterNickname.value = ''
  currency.value = '台幣'
  selectedPaymentMethods.value = ['匯款']
  errorMessage.value = ''
}

// 載入外觀資料
const loadAppearances = async () => {
  try {
    isLoadingAppearances.value = true
    const response = await appearanceApi.getAllAppearances()
    appearances.value = response.data.appearances
  } catch (error) {
    console.error('載入外觀資料失敗:', error)
    errorMessage.value = '載入外觀資料失敗，請稍後再試'
  } finally {
    isLoadingAppearances.value = false
  }
}

// 驗證和提交表單
const handleSubmit = async () => {
  // 清除錯誤訊息
  errorMessage.value = ''

  // 基本驗證
  if (!appearanceId.value || !price.value || !characterNickname.value) {
    errorMessage.value = '請填寫所有必填欄位'
    return
  }

  // 角色暱稱長度驗證
  if (characterNickname.value.length > 10) {
    errorMessage.value = '角色暱稱不能超過10個字元'
    return
  }

  // 價格驗證
  const priceNum = Number(price.value)
  if (isNaN(priceNum) || priceNum <= 0) {
    errorMessage.value = '請輸入有效的價格'
    return
  }

  // 確認至少有一種交易方式
  if (selectedPaymentMethods.value.length === 0) {
    errorMessage.value = '請至少選擇一種交易方式'
    return
  }

  // 提交表單
  isSubmitting.value = true
  try {
    emit('submit', {
      appearanceId: appearanceId.value,
      price: priceNum,
      characterNickname: characterNickname.value.trim(),
      paymentMethods: selectedPaymentMethods.value,
      currency: currency.value,
    })
  } finally {
    isSubmitting.value = false
  }
}

// 當模態框開啟時載入外觀資料
onMounted(async () => {
  if (props.isOpen) {
    await loadAppearances()
  }
})

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      await loadAppearances()
    }
  },
)

// 監聽外觀選擇變化，跳轉到外觀提交頁面
watch(
  () => appearanceId.value,
  (newValue) => {
    if (newValue === 'new_appearance') {
      // 關閉當前模態框
      emit('update:isOpen', false)

      // 導向外觀提交頁面
      router.push('/appearance/library?tab=pending')

      // 重置 appearanceId
      nextTick(() => {
        appearanceId.value = ''
      })
    }
  },
)

// 監聽幣別變化
watch(
  () => currency.value,
  (newCurrency) => {
    if (newCurrency === '遊戲幣') {
      // 如果幣別是遊戲幣，則只能使用遊戲幣支付方式
      selectedPaymentMethods.value = ['遊戲幣']
    } else {
      // 如果幣別不是遊戲幣，則移除「遊戲幣」支付方式選項
      selectedPaymentMethods.value = selectedPaymentMethods.value.filter(
        (method) => method !== '遊戲幣',
      )

      // 如果移除後沒有任何支付方式，則預設選擇「匯款」
      if (selectedPaymentMethods.value.length === 0) {
        selectedPaymentMethods.value = ['匯款']
      }
    }
  },
)
</script>

<template>
  <div v-if="props.isOpen" class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <!-- 添加關閉按鈕 -->
      <button class="modal-close-btn" @click="handleClose">✕</button>

      <h3>出售外觀</h3>

      <form @submit.prevent="handleSubmit" class="create-form">
        <!-- 外觀選擇 -->
        <div class="input-group">
          <label for="appearanceSelect">選擇外觀 <span class="required">*</span></label>
          <select v-model="appearanceId" class="appearance-select" required>
            <option value="" disabled>請選擇外觀</option>
            <option v-for="appearance in appearances" :key="appearance._id" :value="appearance._id">
              {{ appearance.officialName }} ({{ appearance.category }})
            </option>
            <option value="new_appearance" class="new-appearance-option">+ 提交新外觀</option>
          </select>
        </div>

        <!-- 角色暱稱 -->
        <div class="input-group">
          <label for="characterNickname">角色暱稱 <span class="required">*</span></label>
          <input
            id="characterNickname"
            v-model="characterNickname"
            type="text"
            required
            placeholder="請輸入您在遊戲中的角色暱稱"
            maxlength="10"
          />
          <div class="character-count">{{ characterNickname.length }}/10</div>
        </div>

        <!-- 交易方式 -->
        <div class="input-group">
          <label>交易方式 <span class="required">*</span></label>
          <div class="payment-options">
            <label
              v-for="method in paymentOptions"
              :key="method"
              :class="['payment-option', { disabled: isPaymentMethodDisabled(method) }]"
            >
              <input
                type="checkbox"
                :value="method"
                :checked="selectedPaymentMethods.includes(method)"
                @change="togglePaymentMethod(method)"
                :disabled="
                  isPaymentMethodDisabled(method) ||
                  (selectedPaymentMethods.length === 1 && selectedPaymentMethods[0] === method)
                "
              />
              <span>{{ method }}</span>
            </label>
          </div>
          <div v-if="isGameCurrencyMode" class="locked-mode-hint">
            使用「遊戲幣」幣別時，交易方式僅限「遊戲幣」
          </div>
          <div v-else-if="!isGameCurrencyMode" class="locked-mode-hint game-coin-disabled-hint">
            非「遊戲幣」幣別下，無法使用「遊戲幣」作為交易方式
          </div>
        </div>

        <!-- 幣別 -->
        <div class="input-group">
          <label>幣別 <span class="required">*</span></label>
          <div class="currency-options">
            <label v-for="option in currencyOptions" :key="option" class="currency-option">
              <input type="radio" name="currency" :value="option" v-model="currency" />
              <span>{{ option }}</span>
            </label>
          </div>
        </div>

        <!-- 價格 -->
        <div class="input-group">
          <label for="price">價格 <span class="required">*</span></label>
          <input
            id="price"
            v-model="price"
            type="number"
            min="0"
            required
            placeholder="請輸入價格"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="button-group">
          <button type="button" class="cancel-button" @click="handleClose">取消</button>
          <button type="submit" class="submit-button" :disabled="isSubmitting">
            {{ isSubmitting ? '處理中...' : '確認' }}
          </button>
        </div>
      </form>
    </div>
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

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  position: relative;
  background: white;
  border-radius: $spacing-unit;
  padding: $spacing-unit * 3;
  width: 90%;
  max-width: 500px;
  box-shadow: $box-shadow;
  max-height: 90vh;
  overflow-y: auto;

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: $text-color;
    margin-bottom: $spacing-unit * 3;
  }
}

.modal-close-btn {
  position: absolute;
  top: $spacing-unit * 2;
  right: $spacing-unit * 2;
  background: none;
  border: none;
  font-size: 20px;
  color: $text-color;
  cursor: pointer;
  transition: $transition;

  &:hover {
    color: $primary-color;
    transform: scale(1.2);
  }
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-unit * 2;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-unit;
  position: relative;

  label {
    font-size: 14px;
    color: $text-color;
    font-weight: 500;

    .required {
      color: $error-color;
    }
  }

  input {
    padding: $spacing-unit * 1.5;
    border: 1px solid #e0e0e0;
    border-radius: $spacing-unit;
    font-size: 16px;
    transition: $transition;

    &:focus {
      border-color: $primary-color;
      outline: none;
      box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
    }
  }

  .character-count {
    position: absolute;
    right: $spacing-unit;
    top: calc(50% + 10px);
    font-size: 12px;
    color: #999;
  }
}

.currency-options,
.payment-options {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-unit * 2;
}

.currency-option,
.payment-option {
  display: flex;
  align-items: center;
  gap: $spacing-unit;
  cursor: pointer;
  font-weight: normal;
  margin-bottom: $spacing-unit;

  input {
    cursor: pointer;
  }

  span {
    font-size: 14px;
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;

    input {
      cursor: not-allowed;
    }

    span {
      color: #999;
    }
  }
}

.locked-mode-hint {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: $spacing-unit;
  padding: $spacing-unit;
  background-color: #f9f9f9;
  border-radius: $spacing-unit;
  border-left: 3px solid #1890ff;

  &.game-coin-disabled-hint {
    border-left-color: #fa8c16;
  }
}

.appearance-select {
  width: 100%;
  padding: $spacing-unit * 1.5;
  border: 1px solid #e0e0e0;
  border-radius: $spacing-unit;
  font-size: 16px;
  transition: $transition;

  &:focus {
    border-color: $primary-color;
    outline: none;
    box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
  }
}

.new-appearance-option {
  color: $primary-color;
  font-weight: bold;
}

.error-message {
  padding: $spacing-unit;
  background-color: rgba($error-color, 0.1);
  color: $error-color;
  border-radius: $spacing-unit;
  font-size: 14px;
}

// 剩餘樣式保持不變
.button-group {
  display: flex;
  gap: $spacing-unit * 2;
  margin-top: $spacing-unit * 2;
}

.cancel-button,
.submit-button {
  flex: 1;
  padding: $spacing-unit * 1.5;
  border-radius: $spacing-unit;
  font-size: 16px;
  cursor: pointer;
  transition: $transition;
  font-weight: 600;
}

.cancel-button {
  background: white;
  border: 1px solid #e0e0e0;
  color: #666;

  &:hover {
    background: #f5f5f5;
  }
}

.submit-button {
  background: linear-gradient(to right, $primary-color, $primary-hover);
  border: none;
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: linear-gradient(to right, $primary-hover, #f4282d);
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
}
</style>
