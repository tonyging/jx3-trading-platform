// services/emailService.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// 確保我們能讀取環境變數
dotenv.config();

// 定義郵件傳輸的設定介面，讓 TypeScript 能夠協助我們確保設定的正確性
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// 通用的郵件選項介面
interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

// 建立郵件傳輸器的設定
const emailConfig: EmailConfig = {
  host: "smtp.gmail.com", // Gmail 的 SMTP 伺服器
  port: 587, // Gmail 的 SMTP 端口
  secure: false, // 使用 TLS
  auth: {
    user: process.env.EMAIL_USER as string, // 您的 Gmail 帳號
    pass: process.env.EMAIL_PASSWORD as string, // 您的 Gmail 應用程式密碼
  },
};

// 建立郵件傳輸器
const transporter = nodemailer.createTransport(emailConfig);

/**
 * 發送密碼重設郵件的函數
 * @param to 收件者的電子郵件地址
 * @param resetUrl 密碼重設的連結
 */
export const sendResetPasswordEmail = async (
  to: string,
  verificationCode: string
): Promise<void> => {
  console.log("準備發送重設密碼驗證碼郵件:", {
    to,
    hasCode: !!verificationCode,
  });

  const mailOptions = {
    from: `"劍三交易平台" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "重設密碼驗證碼 - 劍三交易平台",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #b4282d;">重設密碼驗證</h2>
        <p>親愛的會員您好：</p>
        <p>我們收到了重設您帳戶密碼的請求。您的驗證碼為：</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; color: #b4282d; letter-spacing: 5px; background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            ${verificationCode}
          </div>
        </div>
        <p style="color: #666; font-size: 14px;">請注意：</p>
        <ul style="color: #666; font-size: 14px;">
          <li>驗證碼將在10分鐘後失效</li>
          <li>如果這不是您發起的請求，請忽略此郵件</li>
          <li>為了帳戶安全，請勿將驗證碼轉發給他人</li>
        </ul>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          此為系統自動發送的郵件，請勿直接回覆
        </p>
      </div>
    `,
  };

  try {
    console.log("開始發送郵件");
    console.log("發送人:", process.env.EMAIL_USER);
    await transporter.sendMail(mailOptions);
    console.log("郵件發送成功");
  } catch (error) {
    console.error("發送郵件時發生錯誤:", error);
    throw new Error("發送重設密碼驗證碼郵件時發生錯誤");
  }
};

/**
 * 發送電子郵件驗證信的函數
 * @param to 收件者的電子郵件地址
 * @param verificationToken 驗證token
 */
export const sendVerificationEmail = async (
  to: string,
  verificationCode: string
): Promise<void> => {
  const mailOptions: MailOptions = {
    from: `"劍三交易平台" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "電子郵件驗證碼 - 劍三交易平台",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #b4282d;">歡迎加入劍三交易平台</h2>
        <p>親愛的會員您好：</p>
        <p>您的註冊驗證碼為：</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; color: #b4282d; letter-spacing: 5px;">
            ${verificationCode}
          </div>
        </div>
        <p style="color: #666; font-size: 14px;">請注意：</p>
        <ul style="color: #666; font-size: 14px;">
          <li>驗證碼將在10分鐘後失效</li>
          <li>如果您沒有註冊帳號，請忽略此郵件</li>
          <li>為了帳戶安全，請勿將驗證碼轉發給他人</li>
        </ul>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          此為系統自動發送的郵件，請勿直接回覆
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("發送驗證郵件時發生錯誤:", error);
    throw new Error("發送驗證郵件時發生錯誤");
  }
};

const sendEmail = async (options: MailOptions): Promise<void> => {
  try {
    await transporter.sendMail(options);
  } catch (error) {
    console.error("發送郵件時發生錯誤:", error);
    throw new Error("發送郵件時發生錯誤");
  }
};

export { sendEmail };
