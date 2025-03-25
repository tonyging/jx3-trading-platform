<!-- src/components/AppearancePagination.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  maxVisiblePages?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisiblePages: 5,
})

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

// 計算分頁數字
const pageNumbers = computed(() => {
  const { currentPage, totalPages, maxVisiblePages } = props
  const halfVisiblePages = Math.floor(maxVisiblePages / 2)

  let startPage = Math.max(1, currentPage - halfVisiblePages)
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  // 調整開始和結束頁面
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  const pages = []
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return pages
})

// 是否顯示第一頁省略號
const showFirstEllipsis = computed(
  () => props.currentPage > Math.floor(props.maxVisiblePages / 2) + 1,
)

// 是否顯示最後一頁省略號
const showLastEllipsis = computed(
  () => props.currentPage < props.totalPages - Math.floor(props.maxVisiblePages / 2),
)

// 變更頁面
const changePage = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('page-change', page)
  }
}
</script>

<template>
  <div class="pagination-container">
    <!-- 上一頁按鈕 -->
    <button
      class="pagination-button prev-button"
      :disabled="currentPage === 1"
      @click="changePage(currentPage - 1)"
    >
      &lt;
    </button>

    <!-- 第一頁 -->
    <button v-if="showFirstEllipsis" class="pagination-button" @click="changePage(1)">1</button>

    <!-- 第一頁省略號 -->
    <span v-if="showFirstEllipsis" class="ellipsis">...</span>

    <!-- 分頁數字 -->
    <button
      v-for="page in pageNumbers"
      :key="page"
      class="pagination-button"
      :class="{ active: page === currentPage }"
      @click="changePage(page)"
    >
      {{ page }}
    </button>

    <!-- 最後一頁省略號 -->
    <span v-if="showLastEllipsis" class="ellipsis">...</span>

    <!-- 最後一頁 -->
    <button v-if="showLastEllipsis" class="pagination-button" @click="changePage(totalPages)">
      {{ totalPages }}
    </button>

    <!-- 下一頁按鈕 -->
    <button
      class="pagination-button next-button"
      :disabled="currentPage === totalPages"
      @click="changePage(currentPage + 1)"
    >
      &gt;
    </button>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #b4282d;
$background-color: #f5f5f5;
$text-color: #333;
$border-color: #e0e0e0;

.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;

  .pagination-button {
    width: 40px;
    height: 40px;
    background-color: white;
    border: 1px solid $border-color;
    border-radius: 4px;
    color: $text-color;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover:not(:disabled) {
      background-color: $background-color;
      border-color: $primary-color;
    }

    &.active {
      background-color: $primary-color;
      color: white;
      border-color: $primary-color;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  .ellipsis {
    color: $text-color;
    margin: 0 5px;
  }

  .prev-button,
  .next-button {
    width: 50px;
  }
}
</style>
