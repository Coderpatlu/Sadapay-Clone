import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmailOtp = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your SadaPay Clone account",
    text: `Your verification code is ${otp}. It expires in 5 minutes. Do not share this code.`,
  });
};

export const sendPhoneOtp = async (phone, otp) => {
  const params = new URLSearchParams({
    api_key: process.env.SENDPK_API_KEY,
    sender: process.env.SENDPK_SENDER,
    mobile: phone,
    template_id: process.env.SENDPK_TEMPLATE_ID,
    message: JSON.stringify({ otp }),
    format: "json",
  });

  const response = await fetch("https://sendpk.com/api/sms.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
    signal: AbortSignal.timeout(10000),
  });

  const result = await response.text();

  if (!response.ok || !result.trim().startsWith("OK")) {
    throw new Error("SMS provider rejected the OTP request");
  }

  return result;
};
