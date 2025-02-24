<!-- src/views/GoogleError.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="google-error">
    <div class="error-container">
      <h2>Google 登入失敗</h2>
      <p>很抱歉，Google 登入過程中發生錯誤。</p>
      <button @click="goToLogin">返回登入頁面</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.google-error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;

  .error-container {
    text-align: center;
    padding: 2rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    h2 {
      color: #b4282d;
      margin-bottom: 1rem;
    }

    p {
      color: #666;
      margin-bottom: 1.5rem;
    }

    button {
      padding: 0.8rem 1.5rem;
      background: #b4282d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover {
        background: darken(#b4282d, 10%);
      }
    }
  }
}
</style>
