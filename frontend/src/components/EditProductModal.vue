<!-- components/EditProductModal.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Product } from '@/types'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  product: {
    type: Object as () => Product,
    required: true,
  },
})

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
const localAmount = ref(props.product.amount)
const localPrice = ref(props.product.price)
const localCharacterNickname = ref(props.product.characterNickname || '')
const localCurrency = ref(props.product.currency || '台幣')
const localPaymentMethods = ref<string[]>(props.product.paymentMethods || ['匯款'])
const errorMessage = ref('')

// 可用的支付方式選項
const paymentOptions = ['匯款', 'Line Pay', '街口支付', '支付寶', '微信']

// 可用的幣別選項
const currencyOptions = ['台幣', '人民幣', '港幣']

// 監聽傳入的 product 變化，更新本地狀態
watch(
  () => props.product,
  (newProduct) => {
    localAmount.value = newProduct.amount
    localPrice.value = newProduct.price
    localCharacterNickname.value = newProduct.characterNickname || ''
    localCurrency.value = newProduct.currency || '台幣'
    localPaymentMethods.value = newProduct.paymentMethods || ['匯款']
  },
)

// 關閉模態窗
const closeModal = () => {
  emit('update:isOpen', false)
  errorMessage.value = ''
}

// 切換支付方式選擇
const togglePaymentMethod = (method: string) => {
  const index = localPaymentMethods.value.indexOf(method)
  if (index === -1) {
    localPaymentMethods.value.push(method)
  } else {
    // 確保至少保留一種支付方式
    if (localPaymentMethods.value.length > 1) {
      localPaymentMethods.value.splice(index, 1)
    }
  }
}

const handleSubmit = () => {
  // 清除錯誤訊息
  errorMessage.value = ''

  // 基本驗證
  if (!localAmount.value || !localPrice.value || !localCharacterNickname.value) {
    errorMessage.value = '請填寫所有必填欄位'
    return
  }

  // 角色暱稱長度驗證
  if (localCharacterNickname.value.length > 10) {
    errorMessage.value = '角色暱稱不能超過10個字元'
    return
  }

  // 數值驗證
  if (localAmount.value <= 0) {
    errorMessage.value = '數量必須大於0'
    return
  }

  if (localPrice.value <= 0) {
    errorMessage.value = '價格必須大於0'
    return
  }

  // 確認至少有一種交易方式
  if (localPaymentMethods.value.length === 0) {
    errorMessage.value = '請至少選擇一種交易方式'
    return
  }

  emit('submit', {
    amount: localAmount.value,
    price: localPrice.value,
    paymentMethods: localPaymentMethods.value,
    characterNickname: localCharacterNickname.value.trim(),
    currency: localCurrency.value,
  })
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button class="modal-close-btn" @click="closeModal">✕</button>
      <h2>編輯商品</h2>

      <form @submit.prevent="handleSubmit" class="edit-form">
        <!-- 角色暱稱 -->
        <div class="form-group">
          <label for="characterNickname">角色暱稱 <span class="required">*</span></label>
          <input
            id="characterNickname"
            v-model="localCharacterNickname"
            type="text"
            required
            placeholder="請輸入您在遊戲中的角色暱稱"
            maxlength="10"
          />
          <div class="character-count">{{ localCharacterNickname.length }}/10</div>
        </div>

        <!-- 數量 -->
        <div class="form-group">
          <label for="amount">數量 <span class="required">*</span></label>
          <input
            id="amount"
            v-model.number="localAmount"
            type="number"
            min="1"
            required
            placeholder="請輸入遊戲幣數量"
          />
        </div>

        <!-- 價格 -->
        <div class="form-group">
          <label for="price">價格 <span class="required">*</span></label>
          <input
            id="price"
            v-model.number="localPrice"
            type="number"
            min="1"
            required
            placeholder="請輸入價格"
          />
        </div>

        <!-- 幣別 -->
        <div class="form-group">
          <label>幣別 <span class="required">*</span></label>
          <div class="currency-options">
            <label v-for="option in currencyOptions" :key="option" class="currency-option">
              <input type="radio" name="currency" :value="option" v-model="localCurrency" />
              <span>{{ option }}</span>
            </label>
          </div>
        </div>

        <!-- 交易方式 -->
        <div class="form-group">
          <label>交易方式 <span class="required">*</span></label>
          <div class="payment-options">
            <label v-for="method in paymentOptions" :key="method" class="payment-option">
              <input
                type="checkbox"
                :value="method"
                :checked="localPaymentMethods.includes(method)"
                @change="togglePaymentMethod(method)"
              />
              <span>{{ method }}</span>
            </label>
          </div>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="modal-actions">
          <button type="button" @click="closeModal" class="cancel-button">取消</button>
          <button type="submit" class="confirm-button">確認</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background: white;
  padding: $spacing-unit * 4;
  border-radius: $spacing-unit * 1.5;
  width: 90%;
  max-width: 500px;
  box-shadow: $box-shadow;
  max-height: 90vh;
  overflow-y: auto;

  h2 {
    margin-top: 0;
    margin-bottom: $spacing-unit * 3;
    color: $text-color;
    text-align: center;
    font-weight: 600;
    font-size: 20px;
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
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-unit * 2;
}

.form-group {
  margin-bottom: $spacing-unit * 2;
  position: relative;

  label {
    display: block;
    margin-bottom: $spacing-unit;
    font-weight: 500;
    color: $text-color;
    font-size: 14px;

    .required {
      color: $error-color;
    }
  }

  input[type='text'],
  input[type='number'] {
    width: 100%;
    padding: $spacing-unit * 1.5;
    border: 1px solid #ddd;
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
    top: calc(50% + 5px);
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
  margin-bottom: $spacing-unit * 2;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: $spacing-unit * 2;
  margin-top: $spacing-unit * 2;

  button {
    flex: 1;
    padding: $spacing-unit * 1.5;
    border: none;
    border-radius: $spacing-unit;
    font-weight: 600;
    cursor: pointer;
    transition: $transition;
    font-size: 16px;
  }

  .cancel-button {
    background: white;
    border: 1px solid #e0e0e0;
    color: #666;

    &:hover {
      background: #f5f5f5;
    }
  }

  .confirm-button {
    background: linear-gradient(to right, $primary-color, $primary-hover);
    color: white;

    &:hover {
      transform: translateY(-1px);
      background: linear-gradient(to right, $primary-hover, #f4282d);
    }
  }
}
</style>
