# JX3 交易平台後端服務

## 專案概述

本後端服務是《劍網 3》遊戲交易媒合平台的核心伺服器應用程式，提供安全、高效的 API 服務，支持使用者認證、商品管理、交易媒合等核心功能。

## 技術棧

### 主要框架與函式庫

- Node.js：伺服器端 JavaScript 運行環境
- Express.js：靈活的 Web 應用程式框架
- TypeScript：提供靜態型別檢查
- MongoDB：NoSQL 文件型資料庫
- Mongoose：MongoDB 物件建模工具

### 身份驗證與安全

- JSON Web Token (JWT)：使用者會話管理
- Passport.js：OAuth 驗證策略
- bcrypt：密碼雜湊
- Google OAuth：社交登入

### 其他重要依賴

- socket.io：即時通訊
- Winston：日誌管理
- Joi：資料驗證
- Cors：跨域資源共享

## 專案結構

```
backend/
├── src/
│   ├── config/        # 配置檔案
│   ├── controllers/   # 控制器邏輯
│   ├── middleware/    # 中介軟體
│   ├── models/        # 資料模型
│   ├── routes/        # API 路由
│   ├── services/      # 商業邏輯服務
│   ├── types/         # TypeScript 型別定義
│   ├── utils/         # 工具函式
│   └── app.ts         # 主應用程式
├── tests/             # 測試目錄
│   ├── unit/          # 單元測試
│   └── integration/   # 整合測試
├── .env.example       # 環境變數範本
└── tsconfig.json      # TypeScript 配置
```

## 環境需求

- Node.js >= 16.0.0
- MongoDB >= 4.4
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

## 資料庫設定

- 使用 MongoDB Atlas 或本地 MongoDB 實例
- 在 `.env` 檔案中配置 `MONGODB_URI`

## 環境變數配置

必要的環境變數：

- `PORT`：伺服器監聽埠
- `MONGODB_URI`：資料庫連接字串
- `JWT_SECRET`：JWT 簽署密鑰
- `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`：OAuth 憑證
- `FIREBASE_*`：Firebase 服務配置

## API 文件

- Swagger/OpenAPI 文件：`/api-docs`
- Postman 集合：`/docs/postman`

## 測試

### 運行單元測試

```bash
npm run test:unit
# 或
yarn test:unit
```

### 運行整合測試

```bash
npm run test:integration
# 或
yarn test:integration
```

### 測試覆蓋率

```bash
npm run test:coverage
# 或
yarn test:coverage
```

## 程式碼品質

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

## 生產部署

### 建置專案

```bash
npm run build
# 或
yarn build
```

### 啟動生產伺服器

```bash
npm start
# 或
yarn start
```

## Docker 容器化

### 建置 Docker 映像

```bash
docker build -t jx3-trading-backend .
```

### 運行 Docker 容器

```bash
docker run -p 3000:3000 jx3-trading-backend
```

## 貢獻指南

1. Fork 專案
2. 建立特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 效能監控

- 使用 PM2 進程管理
- 整合 Prometheus 與 Grafana 監控

## 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](../LICENSE) 文件
