// src/views/AccountTradeUnderConstruction.vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const progress = ref(10) // 假設目前完成度為35%
const releaseDate = ref('2025年5月') // 預計上線日期

// 返回首頁
const navigateToHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="under-construction-container">
    <div class="content-container">
      <div class="construction-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
          <line x1="12" y1="22" x2="12" y2="15.5"></line>
          <polyline points="22 8.5 12 15.5 2 8.5"></polyline>
          <polyline points="2 15.5 12 8.5 22 15.5"></polyline>
          <line x1="12" y1="2" x2="12" y2="8.5"></line>
        </svg>
      </div>

      <h1 class="page-title">帳號交易功能建設中</h1>

      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="progress-text">開發進度: {{ progress }}%</div>
      </div>

      <p class="description">
        我們正在努力開發帳號交易功能，為您提供更安全、更便捷的劍三帳號交易平台。該功能預計將於{{
          releaseDate
        }}上線。
      </p>

      <div class="features-preview">
        <h2>即將推出的功能：</h2>
        <ul>
          <li>
            <span class="feature-icon">✓</span>
            <span class="feature-text">帳號交易系統</span>
          </li>
          <li>
            <span class="feature-icon">✓</span>
            <span class="feature-text">帳號價值評估工具</span>
          </li>
          <li>
            <span class="feature-icon">✓</span>
            <span class="feature-text">詳細的帳號資訊展示</span>
          </li>
        </ul>
      </div>

      <div class="notification">
        <div class="notification-icon">📬</div>
        <div class="notification-content">
          <p>想要在功能上線時獲得通知嗎？</p>
          <p>
            加入我們的
            <a href="https://discord.gg/wzr3r9ByvQ" target="_blank" class="discord-link"
              >Discord 社群</a
            >，第一時間獲取上線資訊及最新更新。
          </p>
        </div>
      </div>

      <div class="actions">
        <button class="primary-button" @click="navigateToHome">返回首頁</button>
        <button class="secondary-button" @click="router.go(-1)">返回上一頁</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 基礎變數定義
$primary-color: #b4282d;
$primary-hover: #a3181d; // 預定義深色而不是使用darken
$background-color: #f5f5f5;
$text-color: #333333;
$border-color: #e0e0e0;
$card-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
$transition: all 0.3s ease;

.under-construction-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  background-color: $background-color;
}

.content-container {
  max-width: 800px;
  width: 100%;
  background-color: white;
  border-radius: 12px;
  box-shadow: $card-shadow;
  padding: 40px;
  text-align: center;
}

.construction-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  color: $primary-color;

  svg {
    width: 100%;
    height: 100%;
  }
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
  color: $primary-color;
}

.progress-container {
  margin-bottom: 32px;

  .progress-bar {
    height: 16px;
    background-color: $border-color;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 8px;

    .progress-fill {
      height: 100%;
      background: linear-gradient(to right, $primary-color, $primary-hover);
      border-radius: 8px;
      transition: width 1s ease-in-out;
    }
  }

  .progress-text {
    font-size: 14px;
    color: $text-color;
  }
}

.description {
  font-size: 16px;
  line-height: 1.6;
  color: $text-color;
  margin-bottom: 32px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.features-preview {
  margin-bottom: 32px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 24px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  text-align: left;

  h2 {
    font-size: 18px;
    margin-bottom: 16px;
    color: $text-color;
    text-align: center;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      font-size: 15px;

      &:last-child {
        margin-bottom: 0;
      }

      .feature-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba($primary-color, 0.1);
        color: $primary-color;
        border-radius: 50%;
        margin-right: 12px;
        font-weight: bold;
        flex-shrink: 0;
      }

      .feature-text {
        color: $text-color;
      }
    }
  }
}

.notification {
  display: flex;
  align-items: flex-start;
  background-color: rgba($primary-color, 0.05);
  border-left: 4px solid $primary-color;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 32px;
  text-align: left;

  .notification-icon {
    font-size: 24px;
    margin-right: 16px;
    margin-top: 2px;
  }

  .notification-content {
    p {
      margin: 0 0 8px;
      font-size: 14px;
      line-height: 1.5;
      color: $text-color;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;

  button {
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: $transition;
    border: none;

    &.primary-button {
      background: linear-gradient(to right, $primary-color, $primary-hover);
      color: white;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba($primary-color, 0.3);
      }
    }

    &.secondary-button {
      background-color: white;
      border: 1px solid $border-color;
      color: $text-color;

      &:hover {
        background-color: #f5f5f5;
      }
    }
  }
}

.discord-link {
  color: #5865f2; // Discord 品牌色
  text-decoration: none;
  font-weight: 500;
  transition: $transition;

  &:hover {
    text-decoration: underline;
    color: #4752c4; // 深一點的 Discord 色調
  }
}

// 響應式調整
@media (max-width: 768px) {
  .content-container {
    padding: 30px 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .construction-icon {
    width: 80px;
    height: 80px;
  }
}

@media (max-width: 480px) {
  .content-container {
    padding: 24px 16px;
  }

  .features-preview {
    padding: 16px;
  }

  .actions {
    flex-direction: column;
    gap: 12px;

    button {
      width: 100%;
    }
  }
}
</style>
