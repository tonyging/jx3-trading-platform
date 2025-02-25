<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/types'

const props = defineProps({
  product: {
    type: Object as () => Product,
    required: true,
  },
})

const emit = defineEmits(['confirm', 'cancel'])

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
  })
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
          <span>購買數量：</span>
          <strong>{{ product.amount }} </strong>
        </div>
        <div class="detail-item">
          <span>幣值：</span>
          <strong>{{ unitPrice.toFixed(0) }} </strong>
        </div>
        <div class="detail-item">
          <span>總價：</span>
          <strong>{{ product.price }} 元</strong>
        </div>
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
  max-width: 340px;
  padding: $spacing-unit * 3;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: relative;

  h2 {
    text-align: center;
    color: $primary-color;
    margin-bottom: $spacing-unit * 2;
    font-size: 1.25rem;
  }

  .product-details,
  .price-details {
    margin-bottom: $spacing-unit * 2;

    .detail-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: $spacing-unit;
      font-size: 0.95rem;

      span {
        color: #666;
      }

      strong {
        color: #333;
      }
    }
  }

  .purchase-input {
    margin-bottom: $spacing-unit * 3;

    label {
      display: block;
      margin-bottom: $spacing-unit;
    }

    input {
      width: 100%;
      padding: $spacing-unit * 2;
      border: 1px solid #ddd;
      border-radius: $spacing-unit;
    }
  }

  .modal-actions {
    display: flex;
    justify-content: space-between;
    gap: $spacing-unit;

    button {
      flex: 1;
      padding: $spacing-unit * 1.5;
      border: none;
      border-radius: $spacing-unit;
      cursor: pointer;
      transition: $transition;
      font-size: 0.95rem;
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
        opacity: 0.9;
      }
    }
  }
}

.close-button {
  position: absolute;
  top: $spacing-unit;
  right: $spacing-unit;
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

.input-group {
  display: flex;
  gap: $spacing-unit;
  align-items: center;

  input {
    flex: 1;
  }

  .max-amount-button {
    padding: $spacing-unit * 1.5 $spacing-unit * 2;
    background: #f0f0f0;
    border: none;
    border-radius: $spacing-unit;
    cursor: pointer;
    color: #666;
    transition: $transition;

    &:hover {
      background: #e0e0e0;
      color: $primary-color;
    }
  }
}
</style>
