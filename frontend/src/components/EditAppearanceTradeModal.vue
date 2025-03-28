// components/EditAppearanceTradeModal.vue
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { AppearanceTrade, AppearancePaymentMethod } from '@/types/appearanceTrade'

const props = defineProps<{
  isOpen: boolean
  trade: AppearanceTrade | null
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  submit: [
    data: {
      price: number
      paymentMethods: AppearancePaymentMethod[]
    },
  ]
}>()

// 表單資料
const price = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

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

// 選擇的支付方式
const selectedPaymentMethods = ref<AppearancePaymentMethod[]>([])

// 切換支付方式選擇
const togglePaymentMethod = (method: AppearancePaymentMethod) => {
  const index = selectedPaymentMethods.value.indexOf(method)
  if (index === -1) {
    selectedPaymentMethods.value.push(method)
  } else {
    // 確保至少保留一種支付方式
    if (selectedPaymentMethods.value.length > 1) {
      selectedPaymentMethods.value.splice(index, 1)
    }
  }
}

// 初始化表單數據
const initFormData = () => {
  if (props.trade) {
    price.value = props.trade.price.toString()
    selectedPaymentMethods.value = props.trade.paymentMethods
      ? [...props.trade.paymentMethods]
      : ['匯款']
  }
}

// 關閉 Modal
const handleClose = () => {
  emit('update:isOpen', false)
  // 重置表單
  errorMessage.value = ''
}

// 驗證和提交表單
const handleSubmit = async () => {
  // 清除錯誤訊息
  errorMessage.value = ''

  // 基本驗證
  if (!price.value) {
    errorMessage.value = '請填寫價格'
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
      price: priceNum,
      paymentMethods: selectedPaymentMethods.value,
    })
  } finally {
    isSubmitting.value = false
  }
}

// 監聽 Modal 打開狀態，初始化數據
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      initFormData()
    }
  },
)

// 監聽 trade 變化，初始化數據
watch(
  () => props.trade,
  (trade) => {
    if (trade) {
      initFormData()
    }
  },
)

// 組件掛載時初始化數據
onMounted(() => {
  if (props.isOpen && props.trade) {
    initFormData()
  }
})
</script>

<template>
  <div v-if="props.isOpen && props.trade" class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <!-- 添加關閉按鈕 -->
      <button class="modal-close-btn" @click="handleClose">✕</button>

      <h3>編輯外觀交易</h3>

      <div class="trade-info">
        <div class="trade-info-item">
          <span class="label">外觀名稱：</span>
          <span class="value">{{
            typeof props.trade.appearanceId === 'object'
              ? props.trade.appearanceId.officialName
              : '未知外觀'
          }}</span>
        </div>
        <div class="trade-info-item">
          <span class="label">角色暱稱：</span>
          <span class="value">{{ props.trade.characterNickname }}</span>
        </div>
        <div class="trade-info-item">
          <span class="label">幣別：</span>
          <span class="value">{{ props.trade.currency }}</span>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="edit-form">
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

        <!-- 交易方式 -->
        <div class="input-group">
          <label>交易方式 <span class="required">*</span></label>
          <div class="payment-options">
            <label v-for="method in paymentOptions" :key="method" class="payment-option">
              <input
                type="checkbox"
                :value="method"
                :checked="selectedPaymentMethods.includes(method)"
                @change="togglePaymentMethod(method)"
              />
              <span>{{ method }}</span>
            </label>
          </div>
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

.trade-info {
  margin-bottom: $spacing-unit * 3;
  padding: $spacing-unit * 2;
  background-color: #f9f9f9;
  border-radius: $spacing-unit;
  border: 1px solid #e0e0e0;
}

.trade-info-item {
  margin-bottom: $spacing-unit;

  &:last-child {
    margin-bottom: 0;
  }

  .label {
    font-weight: 500;
    color: #666;
  }

  .value {
    font-weight: 600;
  }
}

.edit-form {
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
}

.payment-options {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-unit * 2;
}

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
}

.error-message {
  color: $error-color;
  font-size: 14px;
}

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
