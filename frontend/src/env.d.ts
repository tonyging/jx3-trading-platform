interface ImportMetaEnv {
  // 定義您的環境變數類型
  readonly VITE_API_BASE_URL: string
  // 如果您有其他環境變數，也可以在這裡定義
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
