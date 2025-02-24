import app from "./app";

const PORT = process.env.PORT || 3000;

try {
  app.listen(PORT, () => {
    console.log(`伺服器正在監聽 port ${PORT}`);
  });
} catch (error) {
  console.error("伺服器啟動失敗:", error);
}
