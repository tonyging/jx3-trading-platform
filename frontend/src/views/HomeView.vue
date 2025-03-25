// HomeView.vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import CreateProductModal from '@/components/CreateProductModal.vue'
import EditProductModal from '@/components/EditProductModal.vue'
import PurchaseConfirmModal from '@/components/PurchaseConfirmModal.vue'
import { productApi } from '@/services/api/product'
import type { Product, ProductListType, ProductStatus } from '@/types'
import { ratingApi } from '@/services/api/rating'

// 定義可能的錯誤類型
interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

// 定義 products
const products = ref<Product[]>([])
const loading = ref(true)
const showPurchaseModal = ref(false)
const selectedProduct = ref<Product | null>(null)
const showAccountVerificationModal = ref(false)
const verificationMessage = ref('')
const ratedTransactions = ref<Set<string>>(new Set())
const ratingScore = ref(5)
const ratingComment = ref('')
const showPreviousRatingModal = ref(false)
const previousRating = ref<{
  score: number
  comment: string
  createdAt: string
} | null>(null)

// 定義狀態映射
const statusMap: Record<Product['status'], string> = {
  active: '可購買',
  reserved: '交易中',
  sold: '已售出',
  deleted: '已下架',
}

const isAdmin = computed(() => {
  return userStore.currentUser?.role === 'admin'
})

// 計算表格的總列數
const totalColumns = computed(() => {
  // 基礎列數（賣家、數量、價格、幣值、操作）
  let baseColumns = currentTab.value === 'completed' ? 4 : 8
  // 如果是管理員，加上狀態列
  if (isAdmin.value) {
    baseColumns += 1
  }
  return baseColumns
})

// 檢查用戶是否已評價交易
const checkRatingStatus = async (transactionId: string): Promise<boolean> => {
  try {
    const response = await ratingApi.checkRatingExists(
      transactionId,
      userStore.currentUser?.id || '',
    )
    return response.exists
  } catch (error) {
    console.error('檢查評價狀態失敗:', error)
    return false
  }
}

// 處理購買點擊
const handleBuyProduct = (product: Product) => {
  checkAccountVerification(() => {
    selectedProduct.value = product
    showPurchaseModal.value = true
  })
}

// 初始化路由和用戶狀態管理
const router = useRouter()
const userStore = useUserStore()

// 使用 storeToRefs 解構 currentUser
const {} = storeToRefs(userStore)

//頁籤狀態
const currentTab = ref<ProductListType>('all')

const sortFieldMap = {
  amount: 'amount',
  price: 'price',
  value: 'ratio',
} as const

const currentSort = ref({
  field: 'price' as keyof typeof sortFieldMap,
  direction: 'desc' as 'asc' | 'desc',
})

const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

// 載入商品列表
const loadProducts = async () => {
  try {
    loading.value = true

    const requestParams: {
      sortBy: string
      order: 'asc' | 'desc'
      tab: ProductListType
      userId?: string
      status?: ProductStatus | ProductStatus[]
      buyerId?: string
    } = {
      sortBy: sortFieldMap[currentSort.value.field],
      order: currentSort.value.direction,
      tab: currentTab.value,
    }

    // 根據不同頁籤設定 status
    switch (currentTab.value) {
      case 'trading':
        requestParams.status = 'reserved' as ProductStatus
        if (userStore.currentUser?.id) {
          requestParams.userId = userStore.currentUser.id
          requestParams.buyerId = userStore.currentUser.id
        }
        break
      case 'completed':
        requestParams.status = 'sold' as ProductStatus
        if (userStore.currentUser?.id) {
          requestParams.tab = 'completed'
          requestParams.userId = userStore.currentUser.id
        }
        break
      case 'my':
        if (!userStore.currentUser?.id) {
          await userStore.fetchCurrentUser()
        }
        if (userStore.currentUser?.id) {
          requestParams.userId = userStore.currentUser.id
          requestParams.status = 'active' as ProductStatus
        } else {
          showNotification('無法取得用戶資訊', 'error')
          products.value = []
          loading.value = false
          return
        }
        break
      case 'admin':
        requestParams.status = ['active', 'reserved', 'sold'] as ProductStatus[]
        break
      default:
        requestParams.status = 'active' as ProductStatus
    }

    const response = await productApi.getProducts(requestParams)
    products.value = response.data.products

    // 在載入商品後，重新檢查評價狀態
    if (currentTab.value === 'completed') {
      ratedTransactions.value.clear() // 清空之前的已評價交易
      for (const product of products.value) {
        if (product.transactionId) {
          const transactionId =
            typeof product.transactionId === 'object'
              ? product.transactionId._id
              : product.transactionId

          const hasRated = await checkRatingStatus(transactionId)
          if (hasRated) {
            ratedTransactions.value.add(transactionId)
          }
        }
      }
    }
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification(
      apiError.response?.data?.message || (apiError.message as string) || '載入商品列表失敗',
      'error',
    )
    products.value = []
  } finally {
    loading.value = false
  }
}

// 添加評價功能
const showRatingModal = ref(false)
const transactionToRate = ref<string | null>(null)
const productToRate = ref<Product | null>(null)
const targetUserId = ref<string | null>(null)

// 打開評價對話框
const handleRate = async (product: Product) => {
  if (!product.transactionId) {
    showNotification('找不到相關交易資訊', 'error')
    return
  }

  const transactionId =
    typeof product.transactionId === 'object' ? product.transactionId._id : product.transactionId

  try {
    // 檢查是否已評價
    const ratingResponse = await ratingApi.checkRatingExists(
      transactionId,
      userStore.currentUser?.id || '',
    )

    if (ratingResponse.exists) {
      // 如果已評價，獲取之前的評價詳情
      const previousRatingResponse = await ratingApi.getTransactionRating(transactionId)
      previousRating.value = previousRatingResponse.data.rating
      showPreviousRatingModal.value = true
      return
    }

    // 儲存交易ID和產品資訊
    transactionToRate.value = transactionId
    productToRate.value = product

    // 獲取評價對象的ID
    if (typeof product.userId === 'object') {
      targetUserId.value = product.userId._id
    } else {
      targetUserId.value = product.userId as string
    }

    // 顯示評價對話框
    showRatingModal.value = true
  } catch (error) {
    console.error('檢查評價狀態失敗:', error)
    showNotification('檢查評價狀態失敗', 'error')
  }
}

// 提交評價
const submitRating = async (rating: { score: number; comment: string }) => {
  try {
    if (!transactionToRate.value || !targetUserId.value) {
      showNotification('評價資訊不完整', 'error')
      return
    }

    await ratingApi.createRating({
      toUserId: targetUserId.value,
      score: rating.score,
      comment: rating.comment,
      transactionId: transactionToRate.value,
    })

    // 更新已評價的交易列表
    ratedTransactions.value.add(transactionToRate.value)

    showRatingModal.value = false
    showNotification('評價成功', 'success')

    // 重新載入交易列表
    await loadProducts()
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification(
      apiError.response?.data?.message || (apiError.message as string) || '評價失敗',
      'error',
    )
  }
}

// 帳號驗證機制
const checkAccountVerification = async (action: () => void) => {
  await userStore.fetchCurrentUser()
  const currentUser = userStore.currentUser

  if (!currentUser?.isPhoneVerified && !currentUser?.discordId) {
    verificationMessage.value = '您需要先驗證手機號碼和綁定 Discord 帳號'
    showAccountVerificationModal.value = true
    return
  }

  if (!currentUser?.isPhoneVerified) {
    verificationMessage.value = '您需要先驗證手機號碼'
    showAccountVerificationModal.value = true
    return
  }

  if (!currentUser?.discordId) {
    verificationMessage.value = '您需要先綁定 Discord 帳號'
    showAccountVerificationModal.value = true
    return
  }

  action()
}

// 切換頁籤的方法
const switchTab = async (tab: ProductListType) => {
  if (tab === 'admin' && userStore.currentUser?.role !== 'admin') {
    showNotification('您沒有權限訪問此頁籤', 'error')
    return
  }
  currentTab.value = tab
  if (tab === 'my' && !userStore.currentUser?.id) {
    try {
      await userStore.fetchCurrentUser()
    } catch (error: unknown) {
      const apiError = error as ApiError
      showNotification((apiError.message as string) || '載入用戶資訊失敗', 'error')
    }
  }

  await loadProducts()
}

// 顯示通知的方法
const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notification.value = {
    show: true,
    message,
    type,
  }

  // 3秒後自動關閉通知
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 格式化價格顯示
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  }).format(price)
}

// 格式化交易方式顯示
const formatPaymentMethods = (methods: string[] | undefined) => {
  if (!methods || methods.length === 0) return '未設定'
  return methods.join(', ')
}

// 計算幣值（每萬遊戲幣的價格）
const calculateValue = (amount: number, price: number) => {
  return (price / amount).toFixed(2)
}

// 處理排序
const handleSort = async (field: keyof typeof sortFieldMap) => {
  if (currentSort.value.field === field) {
    currentSort.value.direction = currentSort.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value.field = field
    currentSort.value.direction = 'desc'
  }

  await loadProducts()
}

// 獲取排序圖標的類別
const getSortIconClass = (field: string) => {
  if (currentSort.value.field !== field) return 'sort-icon'
  return currentSort.value.direction === 'asc' ? 'sort-icon ascending' : 'sort-icon descending'
}

// 在組件掛載時載入商品列表
onMounted(async () => {
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
  }

  const defaultTab = localStorage.getItem('defaultTab')
  if (defaultTab === 'trading') {
    await switchTab('trading')
    localStorage.removeItem('defaultTab')
  }

  if (currentTab.value === 'completed') {
    for (const product of products.value) {
      if (product.transactionId) {
        const transactionId =
          typeof product.transactionId === 'object'
            ? product.transactionId._id
            : product.transactionId

        const hasRated = await checkRatingStatus(transactionId)
        if (hasRated) {
          ratedTransactions.value.add(transactionId)
        }
      }
    }
  }

  // 等待用戶資訊載入完成
  if (!userStore.currentUser?.id) {
    // 可以添加一個簡單的重試機制
    let retries = 3
    while (retries > 0 && !userStore.currentUser?.id) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      retries--
    }
  }
  await loadProducts()
})

// 控制 Modal 的顯示狀態
const isCreateModalOpen = ref(false)

// 處理建立商品的點擊事件
const handleCreateProduct = () => {
  checkAccountVerification(() => {
    isCreateModalOpen.value = true
  })
}

// 處理表單提交
const handleSubmitProduct = async (data: {
  amount: number
  price: number
  paymentMethods: string[]
  characterNickname: string
  currency: string
}) => {
  try {
    await productApi.createProduct(data)
    isCreateModalOpen.value = false
    showNotification('商品建立成功')
    await loadProducts() // 重新載入商品列表
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification((apiError.message as string) || '建立商品失敗，請稍後再試', 'error')
  }
}

// 刪除商品的方法
const handleDeleteProduct = async (product: Product) => {
  checkAccountVerification(async () => {
    try {
      await productApi.deleteProduct(product._id)
      showNotification('商品已成功刪除')
      await loadProducts()
    } catch (error: unknown) {
      const apiError = error as ApiError
      showNotification((apiError.message as string) || '刪除商品失敗，請稍後再試', 'error')
    }
  })
}

// 編輯商品相關狀態和方法
const isEditModalOpen = ref(false)
const currentEditProduct = ref<Product | null>(null)

// 打開編輯商品彈窗
const handleEditProduct = (product: Product) => {
  checkAccountVerification(() => {
    currentEditProduct.value = product
    isEditModalOpen.value = true
  })
}

// 提交編輯商品
const handleSubmitEditProduct = async (data: {
  amount: number
  price: number
  paymentMethods: string[]
  characterNickname: string
  currency: string
}) => {
  if (!currentEditProduct.value) return
  try {
    await productApi.updateProduct(currentEditProduct.value._id, data)
    isEditModalOpen.value = false
    showNotification('商品更新成功')
    await loadProducts() // 重新載入商品列表
  } catch (error: unknown) {
    const apiError = error as ApiError
    showNotification((apiError.message as string) || '更新商品失敗，請稍後再試', 'error')
  }
}

// 確認購買商品頁面
const handleConfirmPurchase = async (purchaseData: {
  amount: number
  totalPrice: number
  paymentMethod: string
}) => {
  if (selectedProduct.value) {
    try {
      const response = await productApi.reserveProduct(
        selectedProduct.value._id,
        purchaseData.amount,
        purchaseData.paymentMethod,
      )

      // 確保我們有收到交易資料
      if (!response.data?.transaction?._id) {
        throw new Error('未收到有效的交易資訊')
      }

      // 關閉購買模態框
      showPurchaseModal.value = false

      // 使用正確的交易 ID 進行跳轉
      router.push(`/transactions/${response.data.transaction._id}`)

      // 顯示成功訊息
      showNotification('購買成功！正在前往交易詳情頁面...', 'success')
    } catch (error: unknown) {
      const apiError = error as ApiError
      // 提供更詳細的錯誤訊息
      const errorMessage = (apiError.message as string) || '購買失敗，請稍後再試'

      showNotification(errorMessage, 'error')
    }
  }
}

const handleViewTransaction = (product: Product) => {
  if (product.transactionId) {
    let transactionId: string | undefined

    if (typeof product.transactionId === 'object') {
      // 優先使用 id，如果沒有再用 _id
      transactionId = product.transactionId._id
    } else {
      transactionId = product.transactionId
    }

    if (!transactionId) {
      showNotification('交易資訊異常', 'error')
      return
    }
    router.push(`/transactions/${transactionId}`)
  } else {
    showNotification('找不到相關交易資訊', 'error')
  }
}

const getStatusDisplay = (status: Product['status']) => {
  return statusMap[status] || `未知狀態(${status})`
}

// 添加狀態標籤的樣式
const getStatusClass = (status: ProductStatus) => {
  const classMap: Record<ProductStatus, string> = {
    active: 'status-active',
    reserved: 'status-reserved',
    sold: 'status-sold',
    deleted: 'status-deleted',
  }
  return classMap[status] || 'status-unknown'
}
</script>

<template>
  <!-- 主要內容區域 -->
  <main class="main-content trade-content">
    <!-- 頁籤和創建商品按鈕 -->
    <div class="table-header">
      <div class="tabs">
        <button :class="['tab', { active: currentTab === 'all' }]" @click="switchTab('all')">
          我要買幣
        </button>
        <button :class="['tab', { active: currentTab === 'my' }]" @click="switchTab('my')">
          我的賣幣
        </button>
        <button
          :class="['tab', { active: currentTab === 'trading' }]"
          @click="switchTab('trading')"
        >
          交易中
        </button>
        <button
          :class="['tab', { active: currentTab === 'completed' }]"
          @click="switchTab('completed')"
        >
          已完成
        </button>
        <button
          v-if="userStore.currentUser?.role === 'admin'"
          :class="['tab', { active: currentTab === 'admin' }]"
          @click="switchTab('admin')"
        >
          管理員
        </button>
      </div>
      <button class="create-button" @click="handleCreateProduct">我要賣幣</button>
    </div>
    <!-- 商品列表區域 -->
    <div class="trade-table">
      <table>
        <thead>
          <tr>
            <th>賣家</th>
            <th>角色暱稱</th>
            <template v-if="currentTab !== 'completed'">
              <th>
                <div class="sort-header" @click="handleSort('amount')">
                  數量
                  <span :class="getSortIconClass('amount')" />
                </div>
              </th>
            </template>
            <th>
              <div class="sort-header" @click="handleSort('price')">
                價格
                <span :class="getSortIconClass('price')" />
              </div>
            </th>
            <th>
              <div class="sort-header" @click="handleSort('value')">
                幣值
                <span :class="getSortIconClass('value')" />
              </div>
            </th>
            <template v-if="currentTab !== 'completed'">
              <th>幣別</th>
              <th>交易方式</th>
            </template>
            <!-- 管理員的狀態欄位 -->
            <th v-if="isAdmin">狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="totalColumns" class="status-message">載入中...</td>
          </tr>
          <tr v-else-if="products.length === 0">
            <td :colspan="totalColumns" class="status-message">暫無商品</td>
          </tr>
          <tr v-else v-for="product in products" :key="product._id">
            <td>{{ typeof product.userId === 'object' ? product.userId.name : '未知賣家' }}</td>
            <td>{{ product.characterNickname || '未設定' }}</td>

            <template v-if="currentTab !== 'completed'">
              <td>{{ product.amount }}</td>
            </template>

            <td>{{ formatPrice(product.price) }}</td>
            <td>{{ calculateValue(product.price, product.amount) }}</td>

            <template v-if="currentTab !== 'completed'">
              <td>{{ product.currency || '台幣' }}</td>
              <td>{{ formatPaymentMethods(product.paymentMethods) }}</td>
            </template>

            <td v-if="isAdmin">
              <span :class="['status-tag', getStatusClass(product.status)]" :title="product.status">
                {{ getStatusDisplay(product.status) }}
              </span>
            </td>
            <td>
              <!-- 交易中頁籤的按鈕邏輯 -->
              <template v-if="currentTab === 'trading'">
                <button
                  class="view-button"
                  @click="handleViewTransaction(product)"
                  :disabled="!product.transactionId"
                >
                  {{ product.transactionId ? '查看交易' : '交易資訊異常' }}
                </button>
              </template>

              <template v-if="currentTab === 'completed'">
                <div class="transaction-actions">
                  <button
                    class="view-button"
                    @click="handleViewTransaction(product)"
                    :disabled="!product.transactionId"
                  >
                    查看交易
                  </button>
                  <!-- 顯示評價按鈕，當是買家且未評價時 -->
                  <button
                    v-if="
                      typeof product.buyerId === 'object' &&
                      product.buyerId._id === userStore.currentUser?.id &&
                      product.transactionId
                    "
                    class="rate-button"
                    @click="handleRate(product)"
                  >
                    {{
                      ratedTransactions.has(
                        typeof product.transactionId === 'object'
                          ? product.transactionId._id
                          : product.transactionId,
                      )
                        ? '已評價'
                        : '評價賣家'
                    }}
                  </button>
                </div>
              </template>

              <!-- 管理員頁籤的按鈕邏輯 -->
              <template v-else-if="currentTab === 'admin'">
                <div class="admin-actions">
                  <button
                    v-if="product.transactionId"
                    class="view-button"
                    @click="handleViewTransaction(product)"
                  >
                    查看交易
                  </button>
                  <button class="delete-button" @click="handleDeleteProduct(product)">刪除</button>
                </div>
              </template>

              <!-- 其他頁籤的按鈕邏輯 -->
              <template v-else>
                <template
                  v-if="
                    typeof product.userId === 'object' &&
                    product.userId._id === userStore.currentUser?.id
                  "
                >
                  <div class="product-actions">
                    <button class="edit-button" @click="handleEditProduct(product)">編輯</button>
                    <button class="delete-button" @click="handleDeleteProduct(product)">
                      刪除
                    </button>
                  </div>
                </template>
                <template v-else>
                  <button class="buy-button" @click="handleBuyProduct(product)">購買</button>
                </template>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>

  <!-- 模態框與通知元件 -->
  <CreateProductModal v-model:isOpen="isCreateModalOpen" @submit="handleSubmitProduct" />
  <EditProductModal
    v-if="currentEditProduct"
    v-model:isOpen="isEditModalOpen"
    :product="currentEditProduct"
    @submit="handleSubmitEditProduct"
  />
  <PurchaseConfirmModal
    v-if="showPurchaseModal && selectedProduct"
    :product="selectedProduct"
    @confirm="handleConfirmPurchase"
    @cancel="showPurchaseModal = false"
  />

  <!-- 帳號驗證 Modal -->
  <div v-if="showAccountVerificationModal" class="verification-modal-overlay">
    <div class="verification-modal">
      <div class="verification-modal-content">
        <h2>帳號未完成驗證</h2>
        <p>{{ verificationMessage }}</p>
        <div class="verification-modal-actions">
          <button class="cancel-button" @click="showAccountVerificationModal = false">取消</button>
          <button
            class="verify-button"
            @click="
              () => {
                showAccountVerificationModal = false
                router.push('/member-info?tab=security')
              }
            "
          >
            前往驗證
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 評價相關模態框 -->
  <div v-if="showRatingModal" class="rating-modal-overlay">
    <div class="rating-modal">
      <h3>評價賣家</h3>
      <div class="rating-stars">
        <div class="stars-label">評分:</div>
        <div class="stars-container">
          <button
            v-for="i in 5"
            :key="i"
            type="button"
            :class="['star-btn', { active: i <= ratingScore }]"
            @click="ratingScore = i"
          >
            <span>★</span>
          </button>
        </div>
        <div class="stars-value">{{ ratingScore }} 顆星</div>
      </div>
      <div class="rating-comment">
        <label for="rating-comment">評價內容:</label>
        <textarea
          id="rating-comment"
          v-model="ratingComment"
          placeholder="請輸入您的評價內容..."
          rows="4"
        ></textarea>
      </div>
      <div class="rating-actions">
        <button class="cancel-btn" @click="showRatingModal = false">取消</button>
        <button
          class="submit-btn"
          @click="submitRating({ score: ratingScore, comment: ratingComment })"
        >
          提交評價
        </button>
      </div>
    </div>
  </div>

  <div v-if="showPreviousRatingModal" class="previous-rating-modal-overlay">
    <div class="previous-rating-modal">
      <h3>已評價的交易</h3>
      <div class="previous-rating-stars">
        <div class="stars-label">評分:</div>
        <div class="stars-container">
          <button
            v-for="i in 5"
            :key="i"
            type="button"
            :class="['star-btn', { active: i <= (previousRating?.score || 0) }]"
            disabled
          >
            <span>★</span>
          </button>
        </div>
        <div class="stars-value">{{ previousRating?.score || 0 }} 顆星</div>
      </div>
      <div class="previous-rating-comment">
        <label>評價內容:</label>
        <p>{{ previousRating?.comment || '無評價內容' }}</p>
        <div class="rating-date">
          評價時間:
          {{
            previousRating?.createdAt
              ? new Date(previousRating.createdAt).toLocaleString('zh-TW', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '未知'
          }}
        </div>
      </div>
      <div class="previous-rating-actions">
        <button @click="showPreviousRatingModal = false">關閉</button>
      </div>
    </div>
  </div>

  <!-- 通知組件 -->
  <div v-if="notification.show" :class="['notification', `notification-${notification.type}`]">
    {{ notification.message }}
  </div>
</template>

<style lang="scss" scoped>
// 基礎變數定義
$primary-color: #b4282d;
$primary-hover: #d4282d;
$background-color: #f5f5f5;
$text-color: #333333;
$error-color: #ff4d4f;
$font-family: 'Microsoft YaHei', '微軟雅黑', sans-serif;
$spacing-unit: 8px;
$box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
$transition: all 0.3s ease;
$admin-color: #2d66b4;
$admin-hover: #3a7bd5;

// 主要內容區域 - 交易頁面特定樣式
.main-content.trade-content {
  max-width: 1200px;
  padding: $spacing-unit * 4;
  background: #ffffff;
  border-radius: $spacing-unit * 1.5;
  box-shadow: $box-shadow;
  border: 1px solid rgba($primary-color, 0.1);
  width: 90%;
  margin: $spacing-unit * 6 auto;
  height: auto;
}

.admin-actions {
  display: flex;
  gap: $spacing-unit * 2;
  align-items: center;
}

.status-tag {
  display: inline-block;
  padding: $spacing-unit ($spacing-unit * 1.5);
  border-radius: $spacing-unit;
  font-size: 14px;
  font-weight: 500;

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

  &.status-sold {
    background-color: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }

  &.status-deleted {
    background-color: #fff1f0;
    color: #f5222d;
    border: 1px solid #ffa39e;
  }

  &.status-unknown {
    background-color: #f5f5f5;
    color: #666666;
    border: 1px solid #d9d9d9;
  }
}

// 添加創建按鈕相關樣式
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-unit * 4; // 增加與表格的間距
  padding: 0 $spacing-unit; // 增加水平內邊距
}

.tabs {
  display: flex;
  gap: $spacing-unit * 2;
  flex-wrap: wrap; // 允許在小屏幕上換行
}

.tab {
  background: transparent;
  border: none;
  color: #666;
  font-weight: 500;
  padding: $spacing-unit * 1.5 $spacing-unit * 2; // 增加按鈕內邊距
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: $transition;

  &.active {
    color: $primary-color;
    border-bottom-color: $primary-color;
    font-weight: 600;
  }

  &:hover {
    color: $primary-color;
  }
}

.create-button {
  padding: $spacing-unit * 1.5 $spacing-unit * 3;
  background: linear-gradient(to right, $primary-color, $primary-hover);
  color: white;
  border: none;
  border-radius: $spacing-unit;
  font-size: 16px;
  cursor: pointer;
  transition: $transition;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: $spacing-unit;
  white-space: nowrap; // 防止按鈕文字換行

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(to right, $primary-hover, #f4282d);
  }
}

// 交易表格相關樣式
.trade-table {
  width: 100%;
  overflow-x: auto; // 確保表格在小螢幕上可以水平滾動
  background: white;
  border-radius: $spacing-unit;
  margin: $spacing-unit * 3 0; // 增加上下邊距
  padding: $spacing-unit * 2; // 為表格添加內邊距
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto; // 自動調整列寬
  min-width: 800px; // 設置最小寬度以確保在小螢幕上可以滾動
  height: auto;
}

thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f8f8f8;
}

th {
  background: #f8f8f8;
  padding: $spacing-unit * 2;
  text-align: left;
  font-weight: 600;
  color: $text-color;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap; // 防止表頭文字換行
}

// 移除固定寬度的設置，讓表格自動調整列寬
th {
  padding: $spacing-unit * 2.5; // 增加表頭內邊距
}

td {
  padding: $spacing-unit * 2;
  border-top: 1px solid #eee;
  color: $text-color;
  word-break: break-word; // 允許長文字在單元格內折行
}

// 排序圖標樣式
.sort-header {
  display: flex;
  align-items: center;
  gap: $spacing-unit;
  cursor: pointer;
  user-select: none;

  &:hover {
    color: $primary-color;
  }
}

.sort-icon {
  width: 0;
  height: 0;
  display: inline-block;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid #ccc;
  border-top: 4px solid #ccc;
  vertical-align: middle;
  margin-left: $spacing-unit;

  &.ascending {
    border-bottom-color: $primary-color;
    border-top-color: #ccc;
  }

  &.descending {
    border-top-color: $primary-color;
    border-bottom-color: #ccc;
  }
}

.delete-button {
  padding: $spacing-unit * 1.5 $spacing-unit * 2;
  background: linear-gradient(to right, #888, #666);
  color: white;
  border: none;
  border-radius: $spacing-unit;
  cursor: pointer;
  transition: $transition;
  font-weight: 600;

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(to right, #777, #555);
  }
}

// 狀態訊息樣式
.status-message {
  text-align: center;
  color: #666;
  padding: $spacing-unit * 4; // 增加狀態消息的內邊距
  font-size: 16px; // 增加文字大小
}

// 購買按鈕樣式
.buy-button {
  padding: $spacing-unit * 1.5 $spacing-unit * 2;
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

.view-button {
  // 正常狀態的樣式
  padding: $spacing-unit * 1.5 $spacing-unit * 2;
  background: linear-gradient(to right, #4a90e2, #4a7de2); // 藍色漸層
  color: white;
  border: none;
  border-radius: $spacing-unit;
  cursor: pointer;
  transition: $transition;
  font-weight: 600;

  // 懸停效果
  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(to right, #4a7de2, #4a5de2); // 略深的藍色漸層
  }

  // 禁用狀態的樣式
  &:disabled {
    background: linear-gradient(to right, #ccc, #999);
    cursor: not-allowed;
    transform: none;
    opacity: 0.7;

    &:hover {
      transform: none;
      background: linear-gradient(to right, #ccc, #999);
    }
  }
}

.product-actions {
  display: flex;
  gap: $spacing-unit * 2;

  .edit-button {
    padding: $spacing-unit * 1.5 $spacing-unit * 2;
    background: linear-gradient(to right, #4caf50, #45a049);
    color: white;
    border: none;
    border-radius: $spacing-unit;
    cursor: pointer;
    transition: $transition;
    font-weight: 600;

    &:hover {
      transform: translateY(-1px);
      background: linear-gradient(to right, #45a049, #3d8b40);
    }
  }
}

.verification-modal-overlay {
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

.verification-modal {
  background: white;
  border-radius: $spacing-unit * 2;
  width: 90%;
  max-width: 500px;
  padding: $spacing-unit * 4;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  .verification-modal-content {
    text-align: center;

    h2 {
      color: $primary-color;
      margin-bottom: $spacing-unit * 3;
    }

    p {
      color: $text-color;
      margin-bottom: $spacing-unit * 4;
      line-height: 1.6;
    }

    .verification-modal-actions {
      display: flex;
      justify-content: center;
      gap: $spacing-unit * 3;

      .cancel-button,
      .verify-button {
        padding: $spacing-unit * 1.5 $spacing-unit * 3;
        border: none;
        border-radius: $spacing-unit;
        cursor: pointer;
        transition: $transition;
        font-weight: 600;
      }

      .cancel-button {
        background: #f5f5f5;
        color: $text-color;

        &:hover {
          background: #e0e0e0;
        }
      }

      .verify-button {
        background: linear-gradient(to right, $primary-color, $primary-hover);
        color: white;

        &:hover {
          transform: translateY(-2px);
        }
      }
    }
  }
}

.transaction-actions {
  display: flex;
  gap: $spacing-unit * 2;
}

.rate-button {
  padding: $spacing-unit * 1.5 $spacing-unit * 2;
  background: linear-gradient(to right, #ffa940, #fa8c16);
  color: white;
  border: none;
  border-radius: $spacing-unit;
  cursor: pointer;
  transition: $transition;
  font-weight: 600;

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(to right, #fa8c16, #d46b08);
  }
}

.rating-modal-overlay {
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

.rating-modal {
  background: white;
  border-radius: $spacing-unit * 2;
  width: 90%;
  max-width: 500px;
  padding: $spacing-unit * 4;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  h3 {
    margin-top: 0;
    margin-bottom: $spacing-unit * 3;
    color: $text-color;
    text-align: center;
    font-size: 18px;
  }

  .rating-stars {
    margin-bottom: $spacing-unit * 3;

    .stars-label {
      margin-bottom: $spacing-unit;
      font-weight: 500;
    }

    .stars-container {
      display: flex;
      gap: $spacing-unit;
      margin-bottom: $spacing-unit;

      .star-btn {
        background: none;
        border: none;
        font-size: 30px;
        cursor: pointer;
        color: #d9d9d9;
        transition: all 0.2s ease;
        padding: 0;

        &.active {
          color: #ffc107;
        }

        &:hover {
          transform: scale(1.1);
        }
      }
    }

    .stars-value {
      font-size: 14px;
      color: #666;
    }
  }

  .rating-comment {
    margin-bottom: $spacing-unit * 3;

    label {
      display: block;
      margin-bottom: $spacing-unit;
      font-weight: 500;
    }

    textarea {
      width: 100%;
      padding: $spacing-unit * 1.5;
      border: 1px solid #d9d9d9;
      border-radius: $spacing-unit;
      font-size: 14px;
      resize: vertical;

      &:focus {
        border-color: $primary-color;
        outline: none;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
      }
    }
  }

  .rating-actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-unit * 2;

    button {
      padding: $spacing-unit * 1.5 $spacing-unit * 3;
      border-radius: $spacing-unit;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .cancel-btn {
      background: white;
      border: 1px solid #d9d9d9;
      color: #666;

      &:hover {
        background: #f5f5f5;
      }
    }

    .submit-btn {
      background: $primary-color;
      border: none;
      color: white;

      &:hover {
        background: $primary-hover;
        transform: translateY(-1px);
      }
    }
  }
}

.previous-rating-modal-overlay {
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

.previous-rating-modal {
  background: white;
  border-radius: $spacing-unit * 2;
  width: 90%;
  max-width: 500px;
  padding: $spacing-unit * 4;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  .previous-rating-stars {
    // 與 rating-modal 的 .rating-stars 類似
    margin-bottom: $spacing-unit * 3;

    .star-btn {
      &.active {
        color: #ffc107;
      }
    }
  }

  .previous-rating-comment {
    margin-bottom: $spacing-unit * 3;

    p {
      background-color: #f5f5f5;
      padding: $spacing-unit * 2;
      border-radius: $spacing-unit;
      min-height: 100px;
    }

    .rating-date {
      text-align: right;
      color: #666;
      font-size: 14px;
      margin-top: $spacing-unit * 2;
    }
  }

  .previous-rating-actions {
    display: flex;
    justify-content: center;

    button {
      padding: $spacing-unit * 1.5 $spacing-unit * 3;
      background-color: $primary-color;
      color: white;
      border: none;
      border-radius: $spacing-unit;
      cursor: pointer;

      &:hover {
        background-color: $primary-hover;
      }
    }
  }
}

// 通知樣式
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
@media (max-width: 768px) {
  .main-content.trade-content {
    width: 100%;
    padding: $spacing-unit * 3;
    border-radius: $spacing-unit; // 減小圓角
    margin: $spacing-unit 0; // 減少頂部和底部邊距
  }

  .table-header {
    flex-direction: column;
    gap: $spacing-unit * 2;

    .tabs {
      overflow-x: auto;
      padding-bottom: $spacing-unit;
      width: 100%;
      justify-content: flex-start;
    }

    .create-button {
      width: 100%;
      justify-content: center;
    }
  }

  .trade-table {
    overflow-x: auto;
    padding: $spacing-unit;
    margin: $spacing-unit * 2 0;
    height: auto;
  }

  th,
  td {
    padding: $spacing-unit;
    font-size: 14px;
  }

  .view-button,
  .buy-button,
  .edit-button,
  .delete-button,
  .rate-button {
    padding: $spacing-unit ($spacing-unit * 1.5);
    font-size: 14px;
  }

  .transaction-actions {
    flex-direction: column;
    gap: $spacing-unit;

    button {
      width: 100%;
    }
  }
}
</style>
