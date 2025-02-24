<script setup lang="ts">
import { ref, watch } from 'vue'
import { Product } from '@/services/api/product'

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

const emit = defineEmits(['update:isOpen', 'submit'])

const localAmount = ref(props.product.amount)
const localPrice = ref(props.product.price)

// 监听传入的 product 变化，更新本地状态
watch(
  () => props.product,
  (newProduct) => {
    localAmount.value = newProduct.amount
    localPrice.value = newProduct.price
  },
)

const closeModal = () => {
  emit('update:isOpen', false)
}

const handleSubmit = () => {
  // 简单的验证
  if (localAmount.value <= 0 || localPrice.value <= 0) {
    alert('數量和價格必須大於0')
    return
  }

  emit('submit', {
    amount: localAmount.value,
    price: localPrice.value,
  })
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h2>編輯商品</h2>
      <div class="form-group">
        <label for="amount">數量</label>
        <input type="number" id="amount" v-model.number="localAmount" min="1" />
      </div>
      <div class="form-group">
        <label for="price">價格</label>
        <input type="number" id="price" v-model.number="localPrice" min="1" />
      </div>
      <div class="modal-actions">
        <button @click="closeModal" class="cancel-button">取消</button>
        <button @click="handleSubmit" class="confirm-button">確認</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #b4282d;
$spacing-unit: 8px;
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
  background: white;
  padding: $spacing-unit * 4;
  border-radius: $spacing-unit * 2;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  h2 {
    margin-top: 0;
    margin-bottom: $spacing-unit * 3;
    color: $primary-color;
    text-align: center;
  }

  .form-group {
    margin-bottom: $spacing-unit * 3;

    label {
      display: block;
      margin-bottom: $spacing-unit;
      font-weight: 600;
    }

    input {
      width: 100%;
      padding: $spacing-unit * 2;
      border: 1px solid #ddd;
      border-radius: $spacing-unit;
      font-size: 16px;
    }
  }

  .modal-actions {
    display: flex;
    justify-content: space-between;
    gap: $spacing-unit * 2;

    button {
      flex: 1;
      padding: $spacing-unit * 2;
      border: none;
      border-radius: $spacing-unit;
      font-weight: 600;
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
      background: linear-gradient(to right, $primary-color, #8b1d24);
      color: white;

      &:hover {
        opacity: 0.9;
      }
    }
  }
}
</style>
