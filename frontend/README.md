# JX3 交易平台前端應用程式

## 專案概述

本前端應用程式是《劍網 3》遊戲交易媒合平台的使用者介面，採用現代化的前端技術棧，提供直觀、高效的使用者體驗。

## 技術棧

### 主要框架與函式庫

- Vue.js (3.x)：響應式使用者介面框架
- TypeScript：提供靜態型別檢查
- Vite：快速的建置工具
- Vue Query：高效的資料同步與狀態管理
- Tailwind CSS：高度客製化的 CSS 框架

### 開發輔助工具

- ESLint：程式碼品質檢查
- Prettier：程式碼格式化
- Vue DevTools：開發除錯工具

## 專案結構

```
frontend/
├── src/
│   ├── assets/        # 靜態資源
│   ├── components/    # Vue 元件
│   ├── composables/   # Vue Composition API 函式
│   ├── layouts/       # 頁面佈局
│   ├── pages/         # 頁面元件
│   ├── services/      # API 服務
│   ├── stores/        # 狀態管理
│   ├── types/         # TypeScript 型別定義
│   ├── utils/         # 工具函式
│   ├── App.vue        # 主應用元件
│   └── main.ts        # 應用程式入口
├── public/            # 公開靜態檔案
├── .env.example       # 環境變數範本
├── vite.config.ts     # Vite 配置
└── tsconfig.json      # TypeScript 配置
```

## 環境需求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

## 本地開發設定

1. 複製環境變數範本

```bash
cp .env.example .env
```

2. 安裝依賴套件

```bash
npm install
# 或
yarn install
```

3. 啟動開發伺服器

```bash
npm run dev
# 或
yarn dev
```

## 建置與部署

### 生產環境建置

```bash
npm run build
# 或
yarn build
```

### 預覽生產版本

```bash
npm run preview
# 或
yarn preview
```

## 程式碼品質檢查

### 型別檢查

```bash
npm run typecheck
# 或
yarn typecheck
```

### 程式碼風格檢查

```bash
npm run lint
# 或
yarn lint
```

## 測試

### 單元測試

```bash
npm run test:unit
# 或
yarn test:unit
```

### 端對端測試

```bash
npm run test:e2e
# 或
yarn test:e2e
```

## 環境變數

請在 `.env` 檔案中配置以下變數：

- `VITE_API_BASE_URL`：後端 API 基礎網址
- `VITE_FIREBASE_*`：Firebase 相關配置

## 貢獻指南

1. Fork 專案
2. 建立特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](../LICENSE) 文件
