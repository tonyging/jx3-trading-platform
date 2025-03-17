<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 最後更新日期
const lastUpdated = ref('2025年3月17日')

// 是否顯示載入狀態
const isLoading = ref(true)

onMounted(async () => {
  // 確保用戶已登入
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // 模擬載入延遲
  setTimeout(() => {
    isLoading.value = false
  }, 500)
})

// 返回上一頁或會員中心
const goBack = () => {
  router.push('/member-info')
}
</script>

<template>
  <div class="privacy-policy-page">
    <div class="privacy-policy-container">
      <div v-if="isLoading" class="loading-container">
        <div class="spinner"></div>
        <p>正在載入隱私政策...</p>
      </div>

      <div v-else class="policy-content">
        <div class="policy-header">
          <h1>隱私政策</h1>
          <p class="update-date">最後更新：{{ lastUpdated }}</p>
        </div>

        <div class="policy-sections">
          <section class="policy-section">
            <h2>1. 資訊收集</h2>
            <p>我們致力於保護您的個人隱私。本隱私政策說明我們如何收集、使用和保護您的個人資訊。</p>
          </section>

          <section class="policy-section">
            <h2>2. 收集的資訊類型</h2>
            <ul>
              <li>個人識別資訊（如姓名、電子郵件地址）</li>
              <li>帳戶使用資料</li>
              <li>技術資訊（如IP位址、瀏覽器類型）</li>
            </ul>
          </section>

          <section class="policy-section">
            <h2>3. 資訊使用目的</h2>
            <ul>
              <li>提供和改善服務</li>
              <li>客戶支援</li>
              <li>個性化使用體驗</li>
              <li>安全和防fraud管理</li>
            </ul>
          </section>

          <section class="policy-section">
            <h2>4. 資訊共享</h2>
            <p>
              我們不會在未經您同意的情況下出售或租借您的個人資訊給第三方。
              我們可能會與提供服務支持的合作夥伴共享必要資訊。
            </p>
          </section>

          <section class="policy-section">
            <h2>5. 資訊安全</h2>
            <p>
              我們採取適當的技術和組織措施，包括加密和安全協議，
              以保護您的個人資訊安全，防止未經授權的存取、洩露或破壞。
            </p>
          </section>

          <section class="policy-section">
            <h2>6. 您的權利</h2>
            <ul>
              <li>查看和更新您的個人資訊</li>
              <li>要求刪除您的資訊</li>
              <li>撤回同意</li>
              <li>限制我們對您資訊的處理</li>
            </ul>
          </section>

          <section class="policy-section">
            <h2>7. 聯絡我們</h2>
            <p>
              如有任何隱私相關問題，請聯絡：
              <a href="mailto:privacy@example.com" class="contact-link"> akintech.dev@gmail.com </a>
            </p>
          </section>
        </div>

        <div class="action-buttons">
          <button @click="goBack" class="btn-back">返回會員中心</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.privacy-policy-page {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  background-color: #f4f4f4;
  padding: 20px;
  box-sizing: border-box;
}

.privacy-policy-container {
  width: 100%;
  max-width: 800px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #333;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.policy-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #eee;
  padding-bottom: 20px;
}

.policy-header h1 {
  color: #333;
  font-size: 24px;
  margin-bottom: 10px;
}

.update-date {
  color: #666;
  font-size: 14px;
}

.policy-sections {
  margin-bottom: 30px;
}

.policy-section {
  margin-bottom: 20px;
}

.policy-section h2 {
  color: #444;
  font-size: 18px;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
}

.policy-section p {
  color: #666;
  line-height: 1.6;
}

.policy-section ul {
  list-style-type: disc;
  padding-left: 30px;
  color: #666;
}

.policy-section ul li {
  margin-bottom: 10px;
  line-height: 1.5;
}

.contact-link {
  color: #0066cc;
  text-decoration: none;
  transition: color 0.3s ease;
}

.contact-link:hover {
  color: #004080;
  text-decoration: underline;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.btn-back {
  background-color: #333;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-back:hover {
  background-color: #555;
}

@media (max-width: 600px) {
  .privacy-policy-container {
    padding: 20px;
  }

  .policy-header h1 {
    font-size: 20px;
  }

  .policy-section h2 {
    font-size: 16px;
  }
}
</style>
