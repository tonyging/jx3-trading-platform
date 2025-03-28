<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AppearanceTrade, AppearancePaymentMethod } from '@/types/appearanceTrade'

const props = defineProps<{
  isOpen: boolean
  trade: AppearanceTrade | null
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  confirm: [paymentMethod: AppearancePaymentMethod]
}>()

// 選中的支付方式
const selectedPaymentMethod = ref<AppearancePaymentMethod | ''>('')
const errorMessage = ref('')

// 處理關閉模態框
const handleClose = () => {
  emit('update:isOpen', false)
  selectedPaymentMethod.value = ''
  errorMessage.value = ''
}

// 處理確認預訂
const handleConfirm = () => {
  if (!selectedPaymentMethod.value) {
    errorMessage.value = '請選擇一種交易方式'
    return
  }
  emit('confirm', selectedPaymentMethod.value)
}

// 獲取外觀圖片URL
const getAppearanceImageUrl = computed(() => {
  if (!props.trade) return undefined

  const appearance = props.trade.appearanceId
  if (typeof appearance !== 'object') return undefined

  if (appearance.imageUrl) {
    if (appearance.imageUrl.includes('firebasestorage.googleapis.com')) {
      return appearance.imageUrl
    }

    return appearance.imageUrl.startsWith('/uploads')
      ? appearance.imageUrl
      : `/uploads${appearance.imageUrl.startsWith('/') ? appearance.imageUrl : '/' + appearance.imageUrl}`
  }
  return undefined
})

// 獲取外觀名稱
const getAppearanceName = () => {
  if (!props.trade) return '未知外觀'

  if (typeof props.trade.appearanceId === 'object') {
    return props.trade.appearanceId.officialName || '未知外觀'
  }
  return '未知外觀'
}

// 獲取外觀類型
const getAppearanceCategory = () => {
  if (!props.trade) return '未知類型'

  if (typeof props.trade.appearanceId === 'object' && props.trade.appearanceId.category) {
    return props.trade.appearanceId.category
  }
  return '未知類型'
}

// 獲取外觀暱稱
const getAppearanceNicknames = computed(() => {
  if (!props.trade) return []

  const appearance = props.trade.appearanceId
  if (typeof appearance !== 'object') return []

  if (!appearance.nicknames) return []
  if (Array.isArray(appearance.nicknames)) return appearance.nicknames
  return []
})

// 格式化價格
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(price)
}
</script>

<template>
  <div v-if="isOpen && trade" class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <!-- 添加關閉按鈕 -->
      <button class="modal-close-btn" @click="handleClose">✕</button>

      <h3>確認購買資訊</h3>

      <!-- 外觀資訊卡片 -->
      <div class="appearance-card">
        <!-- 圖片容器 -->
        <div class="appearance-image-container">
          <img
            v-if="getAppearanceImageUrl"
            :src="getAppearanceImageUrl"
            alt="外觀圖片"
            class="appearance-image"
          />
          <div v-else class="no-image">
            <span>尚無圖片</span>
          </div>
        </div>

        <!-- 外觀資訊 -->
        <div class="appearance-info">
          <div class="info-row">
            <div class="item name">
              <span class="label">名稱</span>
              <div class="value">{{ getAppearanceName() }}</div>
            </div>

            <div class="item nickname">
              <span class="label">暱稱</span>
              <div class="nickname-container value">
                <span
                  v-for="(nickname, index) in getAppearanceNicknames"
                  :key="index"
                  class="nickname-tag"
                >
                  {{ nickname }}
                </span>
                <span v-if="getAppearanceNicknames.length === 0" class="nickname-tag no-nickname"
                  >無暱稱</span
                >
              </div>
            </div>

            <div class="item category">
              <span class="label">類型</span>
              <div class="category-tag value">{{ getAppearanceCategory() }}</div>
            </div>

            <div class="item price">
              <span class="label">價格</span>
              <div class="price-tag value">{{ formatPrice(trade.price) }} {{ trade.currency }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="payment-selection">
        <h4>選擇交易方式</h4>
        <div class="payment-options">
          <div
            v-for="method in trade.paymentMethods"
            :key="method"
            :class="['payment-option', { selected: selectedPaymentMethod === method }]"
            @click="selectedPaymentMethod = method"
          >
            <div class="payment-icon">
              <span v-if="method === '匯款'">🏦</span>
              <span v-else-if="method === 'Line Pay'">💚</span>
              <span v-else-if="method === '街口支付'">📱</span>
              <span v-else-if="method === '支付寶'">💙</span>
              <span v-else-if="method === '微信'">💬</span>
              <span v-else-if="method === '8591'">🔄</span>
              <span v-else-if="method === '遊戲幣'">🎮</span>
              <span v-else>💰</span>
            </div>
            <div class="payment-name">{{ method }}</div>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div class="warning-message">
        <p>
          請注意：本平台僅提供媒合服務，不參與交易過程和金流處理。請謹慎辨識交易對象，確保交易安全。
        </p>
      </div>

      <div class="button-group">
        <button type="button" class="cancel-button" @click="handleClose">取消</button>
        <button type="button" class="confirm-button" @click="handleConfirm">確認購買</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 基礎變數定義（與外觀資料庫保持一致）
$primary-color: #b4282d;
$primary-hover: #d4282d;
$background-color: #f5f5f5;
$text-color: #333333;
$error-color: #ff4d4f;
$font-family: 'Microsoft YaHei', '微軟雅黑', sans-serif;
$spacing-unit: 8px;
$box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
$transition: all 0.3s ease;

// 模態框基本樣式
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

// 外觀卡片樣式
.appearance-card {
  border: 1px solid #e0e0e0;
  border-radius: $spacing-unit;
  overflow: hidden;
  margin-bottom: $spacing-unit * 3;
}

.appearance-image-container {
  height: 0;
  padding-bottom: 56.34%; // 16:9 寬高比
  position: relative;
  overflow: hidden;
  background-color: #f5f5f5;

  .appearance-image {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    top: 0;
    left: 0;
  }

  .no-image {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 14px;
  }
}

.appearance-info {
  padding: $spacing-unit * 2;
  position: relative;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: $spacing-unit * 1.5;

  .item {
    display: flex;
    flex-direction: column;
    gap: $spacing-unit / 2;

    &.name {
      grid-column: 1 / 2;
      grid-row: 1 / 2;
    }

    &.nickname {
      grid-column: 2 / 3;
      grid-row: 1 / 2;
    }

    &.category {
      grid-column: 1 / 2;
      grid-row: 2 / 3;
    }

    &.price {
      grid-column: 2 / 3;
      grid-row: 2 / 3;
      justify-content: flex-start;
    }

    .label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .value {
      font-size: 14px;
      color: $text-color;
    }
  }

  .name .value {
    font-size: 16px;
    font-weight: 600;
    color: $text-color;
  }

  .category-tag {
    display: inline-block;
    background-color: rgba(75, 145, 250, 0.1);
    color: $primary-color;
    padding: 4px $spacing-unit;
    border-radius: $spacing-unit;
    font-weight: 500;
    font-size: 14px;
    text-align: center;
  }

  .nickname-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .nickname-tag {
    font-size: 12px;
    padding: 3px $spacing-unit;
    background-color: rgba($background-color, 0.9);
    color: #666;
    border: 1px solid #e0e0e0;
    border-radius: $spacing-unit;
    white-space: nowrap;

    &.no-nickname {
      color: #999;
      background-color: rgba($background-color, 0.6);
    }
  }

  .price-tag {
    display: inline-block;
    font-size: 16px;
    font-weight: 600;
    color: $primary-color;
    background-color: rgba($primary-color, 0.1);
    padding: 4px $spacing-unit * 1.5;
    border-radius: $spacing-unit;
    text-align: center;
  }
}

// 支付方式選擇樣式
.payment-selection {
  margin-bottom: $spacing-unit * 3;

  h4 {
    margin-top: 0;
    margin-bottom: $spacing-unit * 1.5;
    font-size: 16px;
    color: $text-color;
  }
}

.payment-options {
  display: grid;
  grid-template-columns: repeat(5, 1fr); // 改為5個一排
  gap: $spacing-unit;
}

.payment-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-unit;
  border: 1px solid #e0e0e0;
  border-radius: $spacing-unit;
  cursor: pointer;
  transition: $transition;

  &:hover {
    border-color: $primary-color;
    background-color: rgba($primary-color, 0.05);
  }

  &.selected {
    border-color: $primary-color;
    background-color: rgba($primary-color, 0.1);
  }

  .payment-icon {
    font-size: 20px; // 縮小圖標
    margin-bottom: $spacing-unit / 2; // 減少間距
  }

  .payment-name {
    font-size: 12px; // 縮小字體
    text-align: center;
  }
}

// 錯誤訊息
.error-message {
  color: $error-color;
  font-size: 14px;
  margin-bottom: $spacing-unit * 2;
  padding: $spacing-unit;
  background-color: rgba($error-color, 0.1);
  border-radius: $spacing-unit;
  text-align: center;
}

// 警告訊息
.warning-message {
  padding: $spacing-unit * 2;
  background-color: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: $spacing-unit;
  margin-bottom: $spacing-unit * 3;

  p {
    color: #d48806;
    font-size: 14px;
    margin: 0;
    line-height: 1.5;
  }
}

// 按鈕群組
.button-group {
  display: flex;
  gap: $spacing-unit * 2;
}

.cancel-button,
.confirm-button {
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

.confirm-button {
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

// 響應式媒體查詢
@media (max-width: 768px) {
  .payment-options {
    grid-template-columns: repeat(4, 1fr); // 中等屏幕改為4個一排
  }
}

@media (max-width: 576px) {
  .info-row {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, auto);

    .item {
      &.name {
        grid-column: 1;
        grid-row: 1;
      }

      &.nickname {
        grid-column: 1;
        grid-row: 2;
      }

      &.category {
        grid-column: 1;
        grid-row: 3;
      }

      &.price {
        grid-column: 1;
        grid-row: 4;
      }
    }
  }

  .payment-options {
    grid-template-columns: repeat(3, 1fr); // 小螢幕改為3個一排
  }

  .modal-content {
    width: 95%;
    padding: $spacing-unit * 2;
  }

  .appearance-image-container {
    padding-bottom: 66.67%; // 調整較小螢幕的寬高比
  }
}

// 動畫效果
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-content {
  animation: fadeIn 0.3s ease-out;
}

.payment-option {
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.95);
  }
}

.confirm-button {
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: all 0.3s;
  }

  &:hover::before {
    left: 100%;
  }
}
</style>
