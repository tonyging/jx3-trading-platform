# JX3 Trading Platform (劍俠情緣叁交易媒合平台)

## 專案簡介

這是一個專門為《劍網 3》遊戲玩家打造的交易媒合平台，提供玩家一個安全、便利的交易環境。平台支援遊戲幣、遊戲帳號和遊戲外觀的交易媒合，致力於建立一個透明、可信賴的遊戲物品交易社群。

## 功能特色

- 🔐 完整的會員系統

  - 本地註冊與登入
  - Google OAuth 社交登入
  - 會員評價與信用機制

- 💰 商品管理系統

  - 遊戲幣交易刊登
  - 帳號與外觀商品上架
  - 商品狀態追蹤
  - 靈活的價格設定

- 🤝 交易媒合機制

  - 智能配對系統
  - 交易狀態追蹤
  - 安全的交易流程
  - 交易雙方確認機制

- 💬 即時通訊功能

  - 買賣雙方即時溝通
  - 交易細節協商
  - 訊息歷史記錄

- 📊 數據分析功能
  - 用戶行為追蹤
  - 交易數據統計
  - 市場趨勢分析

## 技術架構

### 前端技術

- Vue.js
- TypeScript
- Tailwind CSS
- Vite
- Vue Query

### 後端技術

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose

### 基礎設施

- Docker 容器化
- Google Cloud Platform 雲端服務
- Firebase Authentication 身份驗證
- MongoDB Atlas 數據庫服務

## 專案結構

```
/jx3-trading-platform
├── backend/          # Express + TypeScript 後端服務
│   ├── src/         # 源代碼
│   ├── tests/       # 測試文件
│   └── README.md    # 後端文檔
│
├── frontend/         # Vue.js + TypeScript 前端應用
│   ├── src/         # 源代碼
│   ├── public/      # 靜態資源
│   └── README.md    # 前端文檔
│
└── docs/            # 項目文檔
    ├── api/         # API 文檔
    └── setup/       # 部署指南
```

## 開發環境要求

- Node.js >= 16
- MongoDB >= 4.4
- npm 或 yarn 套件管理器

## 快速開始

### 後端服務啟動

```bash
# 進入後端目錄
cd backend

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

### 前端開發服務器啟動

```bash
# 進入前端目錄
cd frontend

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

## 環境變數設置

請參考各目錄下的 `.env.example` 文件進行環境變數配置。

## API 文檔

完整的 API 文檔請參考 [docs/api/README.md](docs/api/README.md)

# JX3 Trading Platform (劍俠情緣叁交易媒合平台)

[前面的內容保持不變...]

## 關於開發者

- 獨立開發者：akin
- 負責範圍：系統架構設計、前後端開發、資料庫設計、UI/UX 設計
- 技術專長：
  - 前端：Vue.js, TypeScript, Tailwind CSS
  - 後端：Node.js, Express, MongoDB
  - 開發工具：Docker, Git, Cloud Platform

## 聯絡方式

- 📧 Email：[akinteck.dev@gmail.com](mailto:akinteck.dev@gmail.com)
- 💻 GitHub：[tonyging](https://github.com/tonyging)

## 授權協議

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件
