<!-- AdminDashboard.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { adminApi } from '@/services/api/admin'
import type { User, Product, Transaction } from '@/types'

// 定義可能的錯誤類型
interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

// 初始化路由和用戶狀態管理
const router = useRouter()
const userStore = useUserStore()

// 儀表板資料
const stats = ref({
  totalUsers: 0,
  totalProducts: 0,
  activeProducts: 0,
  totalTransactions: 0,
  completedTransactions: 0,
})

// 最近用戶列表
const recentUsers = ref<User[]>([])
// 最近商品列表
const recentProducts = ref<Product[]>([])
// 最近交易列表
const recentTransactions = ref<Transaction[]>([])

// 載入狀態
const loading = ref(true)
// 錯誤訊息
const errorMessage = ref('')

// 當前活動的標籤
const activeTab = ref('overview')

// 計算是否為管理員
const isAdmin = computed(() => {
  return userStore.currentUser?.role === 'admin'
})

// 初始化頁面資料
const initDashboard = async () => {
  if (!isAdmin.value) {
    router.push('/')
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''

    // 載入儀表板統計數據
    const statsResponse = await adminApi.getStats()
    stats.value = statsResponse.data

    // 載入最近用戶
    const usersResponse = await adminApi.getRecentUsers()
    recentUsers.value = usersResponse.data.users

    // 載入最近商品
    const productsResponse = await adminApi.getRecentProducts()
    recentProducts.value = productsResponse.data.products

    // 載入最近交易
    const transactionsResponse = await adminApi.getRecentTransactions()
    recentTransactions.value = transactionsResponse.data.transactions
  } catch (error: unknown) {
    const apiError = error as ApiError
    errorMessage.value =
      apiError.response?.data?.message || (apiError.message as string) || '載入儀表板資料失敗'
    console.error('儀表板錯誤:', error)
  } finally {
    loading.value = false
  }
}

// 更改用戶角色
const updateUserRole = async (
  userId: string,
  role: 'user' | 'admin' | 'banned',
  banDuration?: number,
  banReason?: string,
) => {
  try {
    await adminApi.updateUserRole(userId, { role, banDuration, banReason })
    // 重新載入用戶列表
    const usersResponse = await adminApi.getRecentUsers()
    recentUsers.value = usersResponse.data.users
    showNotification('用戶角色更新成功', 'success')
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification(
      apiError.response?.data?.message || (apiError.message as string) || '更新用戶角色失敗',
      'error',
    )
  }
}

// 刪除商品
const deleteProduct = async (productId: string) => {
  try {
    await adminApi.deleteProduct(productId)
    // 重新載入商品列表
    const productsResponse = await adminApi.getRecentProducts()
    recentProducts.value = productsResponse.data.products
    showNotification('商品刪除成功', 'success')
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification(
      apiError.response?.data?.message || (apiError.message as string) || '刪除商品失敗',
      'error',
    )
  }
}

// 通知組件狀態
const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

// 顯示通知
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = {
    show: true,
    message,
    type,
  }

  // 3秒後自動關閉
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 切換標籤
const switchTab = (tab: string) => {
  activeTab.value = tab
}

// 格式化時間
const formatDate = (dateInput: Date | string | undefined) => {
  if (!dateInput) return '未設定'

  try {
    const date = dateInput instanceof Date ? dateInput : new Date(String(dateInput))
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (error) {
    console.error('日期格式化錯誤:', error)
    return '無效日期'
  }
}

// 格式化價格
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(price)
}

// 在組件掛載時載入資料
onMounted(() => {
  initDashboard()
})
</script>

<template>
  <div class="admin-dashboard">
    <!-- 頁面標題 -->
    <div class="dashboard-header">
      <h1>管理員儀表板</h1>
      <button class="back-button" @click="router.push('/')">返回首頁</button>
    </div>

    <!-- 載入狀態顯示 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>

    <!-- 錯誤訊息顯示 -->
    <div v-else-if="errorMessage" class="error-message">
      <p>{{ errorMessage }}</p>
      <button @click="initDashboard">重試</button>
    </div>

    <!-- 儀表板內容 -->
    <div v-else class="dashboard-content">
      <!-- 儀表板選項卡 -->
      <div class="dashboard-tabs">
        <button
          :class="['tab-button', { active: activeTab === 'overview' }]"
          @click="switchTab('overview')"
        >
          概覽
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'users' }]"
          @click="switchTab('users')"
        >
          用戶管理
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'products' }]"
          @click="switchTab('products')"
        >
          商品管理
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'transactions' }]"
          @click="switchTab('transactions')"
        >
          交易管理
        </button>
      </div>

      <!-- 概覽頁面 -->
      <div v-if="activeTab === 'overview'" class="dashboard-panel">
        <h2>平台概覽</h2>

        <!-- 統計卡片 -->
        <div class="stats-cards">
          <div class="stat-card">
            <h3>總用戶數</h3>
            <div class="stat-number">{{ stats.totalUsers }}</div>
          </div>
          <div class="stat-card">
            <h3>總商品數</h3>
            <div class="stat-number">{{ stats.totalProducts }}</div>
          </div>
          <div class="stat-card">
            <h3>上架商品</h3>
            <div class="stat-number">{{ stats.activeProducts }}</div>
          </div>
          <div class="stat-card">
            <h3>總交易數</h3>
            <div class="stat-number">{{ stats.totalTransactions }}</div>
          </div>
          <div class="stat-card">
            <h3>已完成交易</h3>
            <div class="stat-number">{{ stats.completedTransactions }}</div>
          </div>
        </div>

        <!-- 最近活動摘要 -->
        <div class="recent-activity">
          <div class="activity-section">
            <h3>最近註冊用戶</h3>
            <table>
              <thead>
                <tr>
                  <th>用戶名</th>
                  <th>電子郵件</th>
                  <th>註冊時間</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in recentUsers.slice(0, 5)" :key="user.id">
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.createdAt ? formatDate(user.createdAt.toString()) : '未設定' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="activity-section">
            <h3>最近發布商品</h3>
            <table>
              <thead>
                <tr>
                  <th>商品編號</th>
                  <th>賣家</th>
                  <th>數量</th>
                  <th>價格</th>
                  <th>發布時間</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in recentProducts.slice(0, 5)" :key="product._id">
                  <td>{{ product._id.substring(0, 8) }}...</td>
                  <td>{{ typeof product.userId === 'object' ? product.userId.name : '未知' }}</td>
                  <td>{{ product.amount }}</td>
                  <td>{{ formatPrice(product.price) }}</td>
                  <td>{{ formatDate(product.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="activity-section">
            <h3>最近交易</h3>
            <table>
              <thead>
                <tr>
                  <th>交易編號</th>
                  <th>買家</th>
                  <th>賣家</th>
                  <th>金額</th>
                  <th>狀態</th>
                  <th>時間</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in recentTransactions.slice(0, 5)" :key="transaction._id">
                  <td>{{ transaction._id.substring(0, 8) }}...</td>
                  <td>
                    {{ typeof transaction.buyer === 'object' ? transaction.buyer.name : '未知' }}
                  </td>
                  <td>
                    {{ typeof transaction.seller === 'object' ? transaction.seller.name : '未知' }}
                  </td>
                  <td>{{ formatPrice(transaction.price) }}</td>
                  <td>{{ transaction.status }}</td>
                  <td>{{ formatDate(transaction.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 用戶管理頁面 -->
      <div v-if="activeTab === 'users'" class="dashboard-panel">
        <h2>用戶管理</h2>
        <div class="management-controls">
          <input type="text" placeholder="搜尋用戶..." class="search-input" />
        </div>

        <table class="management-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用戶名</th>
              <th>電子郵件</th>
              <th>角色</th>
              <th>註冊時間</th>
              <th>手機驗證</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in recentUsers" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span :class="['role-badge', `role-${user.role}`]">{{ user.role }}</span>
              </td>
              <td>{{ user.createdAt ? formatDate(user.createdAt.toString()) : '未設定' }}</td>
              <td>{{ user.isPhoneVerified ? '已驗證' : '未驗證' }}</td>
              <td class="action-buttons">
                <div class="dropdown">
                  <button class="dropdown-toggle">設定角色</button>
                  <div class="dropdown-menu">
                    <button @click="updateUserRole(user.id, 'user')">普通用戶</button>
                    <button @click="updateUserRole(user.id, 'admin')">管理員</button>
                    <button @click="updateUserRole(user.id, 'banned', 7, '違反規定')">
                      停權 (7天)
                    </button>
                    <button @click="updateUserRole(user.id, 'banned', 30, '嚴重違規')">
                      停權 (30天)
                    </button>
                    <button @click="updateUserRole(user.id, 'banned', undefined, '永久停權')">
                      永久停權
                    </button>
                  </div>
                </div>
                <button class="view-button" @click="router.push(`/user-detail/${user.id}`)">
                  查看詳情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 商品管理頁面 -->
      <div v-if="activeTab === 'products'" class="dashboard-panel">
        <h2>商品管理</h2>
        <div class="management-controls">
          <input type="text" placeholder="搜尋商品..." class="search-input" />
          <div class="filter-controls">
            <select class="filter-select">
              <option value="all">所有狀態</option>
              <option value="active">上架中</option>
              <option value="reserved">交易中</option>
              <option value="sold">已售出</option>
              <option value="deleted">已下架</option>
            </select>
          </div>
        </div>

        <table class="management-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>賣家</th>
              <th>數量</th>
              <th>價格</th>
              <th>狀態</th>
              <th>創建時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in recentProducts" :key="product._id">
              <td>{{ product._id.substring(0, 8) }}...</td>
              <td>{{ typeof product.userId === 'object' ? product.userId.name : '未知' }}</td>
              <td>{{ product.amount }}</td>
              <td>{{ formatPrice(product.price) }}</td>
              <td>
                <span :class="['status-badge', `status-${product.status}`]">{{
                  product.status
                }}</span>
              </td>
              <td>{{ formatDate(product.createdAt) }}</td>
              <td class="action-buttons">
                <button class="view-button" @click="router.push(`/product-detail/${product._id}`)">
                  查看詳情
                </button>
                <button
                  class="delete-button"
                  @click="deleteProduct(product._id)"
                  v-if="product.status !== 'deleted'"
                >
                  下架商品
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 交易管理頁面 -->
      <div v-if="activeTab === 'transactions'" class="dashboard-panel">
        <h2>交易管理</h2>
        <div class="management-controls">
          <input type="text" placeholder="搜尋交易..." class="search-input" />
          <div class="filter-controls">
            <select class="filter-select">
              <option value="all">所有狀態</option>
              <option value="reserved">已預訂</option>
              <option value="pending_payment">待付款</option>
              <option value="payment_confirmed">付款確認</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>

        <table class="management-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>買家</th>
              <th>賣家</th>
              <th>數量</th>
              <th>價格</th>
              <th>狀態</th>
              <th>創建時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in recentTransactions" :key="transaction._id">
              <td>{{ transaction._id.substring(0, 8) }}...</td>
              <td>{{ typeof transaction.buyer === 'object' ? transaction.buyer.name : '未知' }}</td>
              <td>
                {{ typeof transaction.seller === 'object' ? transaction.seller.name : '未知' }}
              </td>
              <td>{{ transaction.amount }}</td>
              <td>{{ formatPrice(transaction.price) }}</td>
              <td>
                <span :class="['status-badge', `status-${transaction.status}`]">
                  {{ transaction.status }}
                </span>
              </td>
              <td>{{ formatDate(transaction.createdAt) }}</td>
              <td class="action-buttons">
                <button
                  class="view-button"
                  @click="router.push(`/transactions/${transaction._id}`)"
                >
                  查看詳情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 通知組件 -->
    <div v-if="notification.show" :class="['notification', `notification-${notification.type}`]">
      {{ notification.message }}
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

.admin-dashboard {
  min-height: 100vh;
  background-color: $background-color;
  padding: $spacing-unit * 4;
  font-family: $font-family;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-unit * 4;

  h1 {
    font-size: 28px;
    color: $primary-color;
    margin: 0;
  }

  .back-button {
    padding: $spacing-unit * 1.5 $spacing-unit * 3;
    background: linear-gradient(to right, #f0f0f0, #e0e0e0);
    color: $text-color;
    border: none;
    border-radius: $spacing-unit;
    cursor: pointer;
    transition: $transition;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: $spacing-unit;

    &:hover {
      transform: translateY(-1px);
      background: linear-gradient(to right, #e0e0e0, #d0d0d0);
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: white;
  border-radius: $spacing-unit;
  box-shadow: $box-shadow;

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid $primary-color;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: $spacing-unit * 2;
  }

  p {
    color: $text-color;
    font-size: 16px;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: white;
  border-radius: $spacing-unit;
  box-shadow: $box-shadow;
  color: $error-color;

  p {
    font-size: 18px;
    margin-bottom: $spacing-unit * 3;
  }

  button {
    padding: $spacing-unit * 1.5 $spacing-unit * 3;
    background: linear-gradient(to right, $primary-color, $primary-hover);
    color: white;
    border: none;
    border-radius: $spacing-unit;
    cursor: pointer;
    transition: $transition;
    font-weight: 600;

    &:hover {
      transform: translateY(-1px);
    }
  }
}

.dashboard-tabs {
  display: flex;
  gap: $spacing-unit * 2;
  margin-bottom: $spacing-unit * 3;
  background: white;
  padding: $spacing-unit * 2;
  border-radius: $spacing-unit;
  box-shadow: $box-shadow;

  .tab-button {
    padding: $spacing-unit * 1.5 $spacing-unit * 3;
    background: none;
    border: none;
    color: $text-color;
    font-size: 16px;
    cursor: pointer;
    transition: $transition;
    font-weight: 500;
    border-bottom: 2px solid transparent;

    &.active {
      color: $primary-color;
      border-bottom-color: $primary-color;
      font-weight: 600;
    }

    &:hover:not(.active) {
      color: $primary-hover;
    }
  }
}

.dashboard-panel {
  background: white;
  border-radius: $spacing-unit;
  box-shadow: $box-shadow;
  padding: $spacing-unit * 3;

  h2 {
    font-size: 22px;
    color: $primary-color;
    margin-top: 0;
    margin-bottom: $spacing-unit * 3;
    padding-bottom: $spacing-unit * 2;
    border-bottom: 1px solid #eee;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: $spacing-unit * 3;
  margin-bottom: $spacing-unit * 4;

  .stat-card {
    background: #f8f8f8;
    border-radius: $spacing-unit;
    padding: $spacing-unit * 3;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: $transition;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    h3 {
      font-size: 16px;
      color: #666;
      margin-top: 0;
      margin-bottom: $spacing-unit;
    }

    .stat-number {
      font-size: 32px;
      font-weight: 600;
      color: $primary-color;
    }
  }
}

.recent-activity {
  display: flex;
  flex-direction: column;
  gap: $spacing-unit * 4;

  .activity-section {
    h3 {
      font-size: 18px;
      color: $text-color;
      margin-bottom: $spacing-unit * 2;
    }

    table {
      width: 100%;
      border-collapse: collapse;

      th,
      td {
        padding: $spacing-unit * 1.5;
        text-align: left;
        border-bottom: 1px solid #eee;
      }

      th {
        font-weight: 600;
        color: #666;
        background: #f8f8f8;
      }

      td {
        color: $text-color;
      }

      tr:hover td {
        background-color: #f5f5f5;
      }
    }
  }
}

.management-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: $spacing-unit * 3;

  .search-input {
    flex: 1;
    padding: $spacing-unit * 1.5 $spacing-unit * 2;
    border: 1px solid #e0e0e0;
    border-radius: $spacing-unit;
    font-size: 16px;
    max-width: 300px;

    &:focus {
      border-color: $primary-color;
      outline: none;
    }
  }

  .filter-controls {
    display: flex;
    gap: $spacing-unit * 2;

    .filter-select {
      padding: $spacing-unit * 1.5 $spacing-unit * 2;
      border: 1px solid #e0e0e0;
      border-radius: $spacing-unit;
      font-size: 16px;
      background: white;

      &:focus {
        border-color: $primary-color;
        outline: none;
      }
    }
  }
}

.management-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: $spacing-unit * 3;

  th,
  td {
    padding: $spacing-unit * 1.5;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    font-weight: 600;
    color: #666;
    background: #f8f8f8;
  }

  td {
    color: $text-color;
  }

  tr:hover td {
    background-color: #f5f5f5;
  }

  .action-buttons {
    display: flex;
    gap: $spacing-unit;

    button {
      padding: $spacing-unit $spacing-unit * 2;
      border: none;
      border-radius: $spacing-unit;
      cursor: pointer;
      transition: $transition;
      font-weight: 600;
      font-size: 14px;
    }

    .view-button {
      background: linear-gradient(to right, #4a90e2, #4a7de2);
      color: white;

      &:hover {
        transform: translateY(-1px);
        background: linear-gradient(to right, #4a7de2, #4a5de2);
      }
    }

    .delete-button {
      background: linear-gradient(to right, #888, #666);
      color: white;

      &:hover {
        transform: translateY(-1px);
        background: linear-gradient(to right, #777, #555);
      }
    }
  }

  .role-badge,
  .status-badge {
    display: inline-block;
    padding: $spacing-unit ($spacing-unit * 1.5);
    border-radius: $spacing-unit;
    font-size: 14px;
    font-weight: 500;
  }

  .role-badge {
    &.role-admin {
      background-color: #e6f7ff;
      color: #1890ff;
      border: 1px solid #91d5ff;
    }

    &.role-user {
      background-color: #f6ffed;
      color: #52c41a;
      border: 1px solid #b7eb8f;
    }

    &.role-banned {
      background-color: #fff1f0;
      color: #ff4d4f;
      border: 1px solid #ffa39e;
    }
  }

  .status-badge {
    &.status-active {
      background-color: #e6f7ff;
      color: #1890ff;
      border: 1px solid #91d5ff;
    }

    &.status-reserved {
      background-color: #fff7e6;
      color: #fa8c16;
      border: 1px solid #ffd591;
    }

    &.status-sold,
    &.status-completed,
    &.status-payment_confirmed {
      background-color: #f6ffed;
      color: #52c41a;
      border: 1px solid #b7eb8f;
    }

    &.status-deleted,
    &.status-cancelled {
      background-color: #fff1f0;
      color: #ff4d4f;
      border: 1px solid #ffa39e;
    }

    &.status-pending_payment {
      background-color: #f9f0ff;
      color: #722ed1;
      border: 1px solid #d3adf7;
    }
  }
}

.dropdown {
  position: relative;
  display: inline-block;

  .dropdown-toggle {
    background: linear-gradient(to right, #4caf50, #45a049);
    color: white;
    padding: $spacing-unit $spacing-unit * 2;
    border: none;
    border-radius: $spacing-unit;
    cursor: pointer;
    transition: $transition;
    font-weight: 600;
    font-size: 14px;

    &:hover {
      transform: translateY(-1px);
      background: linear-gradient(to right, #45a049, #3d8b40);
    }
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 10;
    background: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    border-radius: $spacing-unit;
    padding: $spacing-unit;
    min-width: 150px;
    display: none;

    button {
      display: block;
      width: 100%;
      text-align: left;
      padding: $spacing-unit $spacing-unit * 2;
      border: none;
      background: none;
      color: $text-color;
      cursor: pointer;
      transition: $transition;
      font-size: 14px;

      &:hover {
        background: #f5f5f5;
        color: $primary-color;
      }
    }
  }

  &:hover .dropdown-menu {
    display: block;
  }
}

.notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: inline-block;
  max-width: 90%;
  width: auto;
  padding: $spacing-unit * 3;
  border-radius: $spacing-unit * 2;
  z-index: 1000;
  text-align: center;
  word-wrap: break-word;
  white-space: normal;
  animation: notificationAnimation 0.5s ease;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  &-success {
    background-color: #4caf50;
    color: white;
  }

  &-error {
    background-color: $error-color;
    color: white;
  }
}

@keyframes notificationAnimation {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

// 響應式設計
@media (max-width: 1024px) {
  .stats-cards {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: $spacing-unit * 2;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-unit * 2;
    margin-bottom: $spacing-unit * 3;

    h1 {
      font-size: 24px;
    }

    .back-button {
      width: 100%;
    }
  }

  .dashboard-tabs {
    flex-wrap: wrap;
    gap: $spacing-unit;

    .tab-button {
      padding: $spacing-unit $spacing-unit * 2;
      flex: 1;
      min-width: 120px;
      text-align: center;
    }
  }

  .stats-cards {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: $spacing-unit * 2;

    .stat-card {
      padding: $spacing-unit * 2;

      .stat-number {
        font-size: 24px;
      }
    }
  }

  .management-controls {
    flex-direction: column;
    gap: $spacing-unit * 2;

    .search-input {
      max-width: 100%;
    }

    .filter-controls {
      justify-content: flex-start;

      .filter-select {
        flex: 1;
      }
    }
  }

  .management-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;

    .action-buttons {
      flex-direction: column;
      gap: $spacing-unit;

      button {
        width: 100%;
      }
    }
  }
}

// 添加免責聲明區域
.disclaimer {
  margin-top: $spacing-unit * 4;
  padding: $spacing-unit * 2;
  background: #fff5f5;
  text-align: center;
  font-size: 12px;
  color: #f5222d;
  border-radius: $spacing-unit;

  span {
    display: inline-block;
    line-height: 1.6;
  }
}
</style>
