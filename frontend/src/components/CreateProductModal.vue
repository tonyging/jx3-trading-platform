<!-- components/CreateProductModal.vue -->
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  submit: [
    data: {
      amount: number
      price: number
      paymentMethods: string[]
      characterNickname: string
      currency: string
    },
  ]
}>()

// 表單資料
const amount = ref('')
const price = ref('')
const characterNickname = ref('')
const currency = ref('台幣')
const errorMessage = ref('')
const isSubmitting = ref(false)

// 可用的支付方式選項
const paymentOptions = ['匯款', 'Line Pay', '街口支付', '支付寶', '微信']

// 可用的幣別選項
const currencyOptions = ['台幣', '人民幣', '港幣']

// 選擇的支付方式
const selectedPaymentMethods = ref<string[]>(['匯款'])

// 切換支付方式選擇
const togglePaymentMethod = (method: string) => {
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

// 關閉 Modal
const handleClose = () => {
  emit('update:isOpen', false)
  // 重置表單
  amount.value = ''
  price.value = ''
  characterNickname.value = ''
  currency.value = '台幣'
  selectedPaymentMethods.value = ['匯款']
  errorMessage.value = ''
}

// 驗證和提交表單
const handleSubmit = async () => {
  // 清除錯誤訊息
  errorMessage.value = ''

  // 基本驗證
  if (!amount.value || !price.value || !characterNickname.value) {
    errorMessage.value = '請填寫所有必填欄位'
    return
  }

  // 角色暱稱長度驗證
  if (characterNickname.value.length > 10) {
    errorMessage.value = '角色暱稱不能超過10個字元'
    return
  }

  // 數值驗證
  const amountNum = Number(amount.value)
  const priceNum = Number(price.value)

  if (isNaN(amountNum) || amountNum <= 0) {
    errorMessage.value = '請輸入有效的數量'
    return
  }

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
      amount: amountNum,
      price: priceNum,
      paymentMethods: selectedPaymentMethods.value,
      characterNickname: characterNickname.value.trim(),
      currency: currency.value,
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="props.isOpen" class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <!-- 添加關閉按鈕 -->
      <button class="modal-close-btn" @click="handleClose">✕</button>

      <h3>建立商品</h3>

      <form @submit.prevent="handleSubmit" class="create-form">
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

        <!-- 數量 -->
        <div class="input-group">
          <label for="amount">數量 <span class="required">*</span></label>
          <input
            id="amount"
            v-model="amount"
            type="number"
            min="0"
            step="0.1"
            required
            placeholder="請輸入遊戲幣數量"
          />
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
  position: relative; // 確保按鈕正確定位
  background: white;
  border-radius: $spacing-unit;
  padding: $spacing-unit * 3;
  width: 90%;
  max-width: 450px; // 稍微加寬一點以適應更多內容
  box-shadow: $box-shadow;
  max-height: 90vh; // 添加最大高度
  overflow-y: auto; // 確保內容太多時可以滾動

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
