<!-- components/PurchaseConfirmModal.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Product } from '@/types'

const props = defineProps({
  product: {
    type: Object as () => Product,
    required: true,
  },
})

const emit = defineEmits(['confirm', 'cancel'])

// 選擇的交易方式
const selectedPaymentMethod = ref(
  props.product.paymentMethods && props.product.paymentMethods.length > 0
    ? props.product.paymentMethods[0]
    : '匯款',
)

// 計算賣家名稱
const sellerName = computed(() => {
  const userId = props.product.userId
  // 檢查 userId 是否為物件且包含 name
  if (typeof userId === 'object' && userId !== null && 'name' in userId) {
    return userId.name
  }
  // 若無法取得賣家名稱，則回傳預設值
  return '未知賣家'
})

// 計算單價
const unitPrice = computed(() => props.product.amount / props.product.price)

// 確認購買
const confirmPurchase = () => {
  emit('confirm', {
    amount: props.product.amount, // 直接使用商品完整數量
    totalPrice: props.product.price, // 直接使用商品完整價格
    paymentMethod: selectedPaymentMethod.value, // 新增選擇的交易方式
  })
}

// 格式化價格顯示（根據幣別）
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency:
      props.product.currency === '台幣'
        ? 'TWD'
        : props.product.currency === '人民幣'
          ? 'CNY'
          : 'HKD',
    minimumFractionDigits: 0,
  }).format(price)
}
</script>

<template>
  <div class="purchase-confirm-modal-overlay">
    <div class="purchase-confirm-modal">
      <button class="close-button" @click="$emit('cancel')">&times;</button>
      <h2>確認購買</h2>

      <div class="product-details">
        <div class="detail-item">
          <span>賣家：</span>
          <strong>{{ sellerName }}</strong>
        </div>
        <div class="detail-item">
          <span>角色暱稱：</span>
          <strong>{{ product.characterNickname || '未設定' }}</strong>
        </div>
        <div class="detail-item">
          <span>購買數量：</span>
          <strong>{{ product.amount }} </strong>
        </div>
        <div class="detail-item">
          <span>幣別：</span>
          <strong>{{ product.currency || '台幣' }}</strong>
        </div>
        <div class="detail-item">
          <span>幣值：</span>
          <strong>1 : {{ unitPrice.toFixed(0) }}</strong>
        </div>
        <div class="detail-item">
          <span>總價：</span>
          <strong>{{ formatPrice(product.price) }}</strong>
        </div>

        <!-- 選擇交易方式 -->
        <div class="payment-method-selection">
          <span>交易方式：</span>
          <select v-model="selectedPaymentMethod" class="payment-method-select">
            <option v-for="method in product.paymentMethods" :key="method" :value="method">
              {{ method }}
            </option>
          </select>
        </div>
      </div>

      <div class="purchase-notice">
        <p>確認購買後，商品將進入交易狀態，請及時與賣家聯繫。</p>
      </div>

      <div class="modal-actions">
        <button class="cancel-button" @click="$emit('cancel')">取消</button>
        <button class="confirm-button" @click="confirmPurchase">確認購買</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #b4282d;
$spacing-unit: 8px;
$transition: all 0.3s ease;

.purchase-confirm-modal-overlay {
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

.purchase-confirm-modal {
  background: white;
  border-radius: $spacing-unit * 2;
  width: 90%;
  max-width: 400px;
  padding: $spacing-unit * 3;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: relative;

  h2 {
    text-align: center;
    color: $primary-color;
    margin-bottom: $spacing-unit * 3;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .product-details {
    margin-bottom: $spacing-unit * 3;
    border-bottom: 1px solid #eee;
    padding-bottom: $spacing-unit * 2;

    .detail-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: $spacing-unit * 1.5;
      font-size: 0.95rem;

      span {
        color: #666;
      }

      strong {
        color: #333;
        font-weight: 500;
      }
    }
  }

  .payment-method-selection {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: $spacing-unit * 2;

    span {
      color: #666;
      font-size: 0.95rem;
    }

    .payment-method-select {
      padding: $spacing-unit $spacing-unit * 2;
      border: 1px solid #ddd;
      border-radius: $spacing-unit;
      font-size: 0.95rem;
      min-width: 120px;
      background-color: #f9f9f9;

      &:focus {
        outline: none;
        border-color: $primary-color;
      }
    }
  }

  .purchase-notice {
    margin-bottom: $spacing-unit * 3;

    p {
      font-size: 0.85rem;
      color: #666;
      text-align: center;
      margin: 0;
    }
  }

  .modal-actions {
    display: flex;
    justify-content: space-between;
    gap: $spacing-unit * 2;

    button {
      flex: 1;
      padding: $spacing-unit * 1.5;
      border: none;
      border-radius: $spacing-unit;
      cursor: pointer;
      transition: $transition;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .cancel-button {
      background: #f0f0f0;
      color: #333;

      &:hover {
        background: #e0e0e0;
      }
    }

    .confirm-button {
      background: linear-gradient(to right, $primary-color, #8c1f23);
      color: white;

      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      &:not(:disabled):hover {
        background: linear-gradient(to right, #8c1f23, $primary-color);
        transform: translateY(-1px);
      }
    }
  }
}

.close-button {
  position: absolute;
  top: $spacing-unit * 2;
  right: $spacing-unit * 2;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: $transition;

  &:hover {
    background: #f0f0f0;
    color: $primary-color;
  }
}
</style>
