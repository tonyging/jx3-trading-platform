<script setup lang="ts">
import { ref } from 'vue'
import { Product } from '@/services/api/product'

const props = defineProps({
  product: {
    type: Object as () => Product,
    required: true,
  },
})

const purchaseAmount = ref(1)
const emit = defineEmits(['confirm-purchase', 'close'])

const calculateTotalPrice = () => {
  const unitPrice = props.product.price / props.product.amount
  return (unitPrice * purchaseAmount.value).toFixed(2)
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(price)
}

const confirmPurchase = () => {
  if (purchaseAmount.value > 0 && purchaseAmount.value <= props.product.amount) {
    emit('confirm-purchase', {
      amount: purchaseAmount.value,
    })
  }
}

const closeModal = () => {
  emit('close')
}
</script>

<template>
  <div class="purchase-modal-overlay">
    <div class="purchase-modal">
      <div class="modal-header">
        <h2>購買遊戲幣</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>

      <div class="product-info">
        <p>可購買數量：{{ product.amount }}</p>
        <p>單價：{{ formatPrice(product.price / product.amount) }}/萬幣</p>
      </div>

      <div class="purchase-amount">
        <label for="amount-input">選擇購買數量</label>
        <input
          id="amount-input"
          type="number"
          v-model.number="purchaseAmount"
          :max="product.amount"
          :min="1"
        />
      </div>

      <div class="purchase-summary">
        <p>總價：{{ calculateTotalPrice() }}</p>
      </div>

      <div class="modal-actions">
        <button class="cancel-button" @click="closeModal">取消</button>
        <button
          class="confirm-button"
          @click="confirmPurchase"
          :disabled="purchaseAmount < 1 || purchaseAmount > product.amount"
        >
          確認購買
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #b4282d;
$spacing-unit: 8px;
$transition: all 0.3s ease;

.purchase-modal-overlay {
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

.purchase-modal {
  background: white;
  border-radius: $spacing-unit * 2;
  width: 90%;
  max-width: 500px;
  padding: $spacing-unit * 4;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-unit * 3;

    h2 {
      margin: 0;
      color: $primary-color;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;

      &:hover {
        color: $primary-color;
      }
    }
  }

  .product-info {
    margin-bottom: $spacing-unit * 3;

    p {
      margin: $spacing-unit 0;
      color: #666;
    }
  }

  .purchase-amount {
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

  .purchase-summary {
    margin-bottom: $spacing-unit * 3;
    text-align: right;
    font-weight: bold;
  }

  .modal-actions {
    display: flex;
    justify-content: space-between;

    button {
      flex: 1;
      padding: $spacing-unit * 2;
      margin: 0 $spacing-unit;
      border: none;
      border-radius: $spacing-unit;
      cursor: pointer;
      transition: $transition;
    }

    .cancel-button {
      background: #f0f0f0;
      color: #333;

      &:hover {
        background: #e0e0e0;
      }
    }

    .confirm-button {
      background: linear-gradient(to right, $primary-color, darken($primary-color, 10%));
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
</style>
