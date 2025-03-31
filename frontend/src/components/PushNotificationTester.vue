<!-- components/PushNotificationTester.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { userService } from '@/services/api/user'

const isLoading = ref(false)
const message = ref('')
const isSuccess = ref(false)

const testPushNotification = async () => {
  isLoading.value = true
  message.value = ''

  try {
    // 直接使用 userService
    const response = await userService.testPushNotification()

    isSuccess.value = true
    message.value = response.message || '測試推播通知已發送！'

    // 5秒後清除訊息
    setTimeout(() => {
      message.value = ''
    }, 5000)
  } catch (error) {
    console.error('測試推播失敗:', error)
    isSuccess.value = false
    message.value = error.response?.data?.message || '發送測試推播通知失敗'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="push-tester">
    <button @click="testPushNotification" :disabled="isLoading" class="test-button">
      {{ isLoading ? '發送中...' : '測試推播通知' }}
    </button>

    <div v-if="message" class="result-message" :class="{ success: isSuccess, error: !isSuccess }">
      {{ message }}
    </div>
  </div>
</template>

<style scoped>
.push-tester {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.test-button {
  background-color: #b4282d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-button:hover:not(:disabled) {
  background-color: #a3181d;
  transform: translateY(-1px);
}

.test-button:disabled {
  background-color: #d8888d;
  cursor: not-allowed;
}

.result-message {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.success {
  background-color: #e8f5e9;
  color: #2e7d32;
  border-left: 4px solid #2e7d32;
}

.error {
  background-color: #ffebee;
  color: #c62828;
  border-left: 4px solid #c62828;
}
</style>
