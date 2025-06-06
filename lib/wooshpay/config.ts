export const WOOSHPAY_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_WOOSHPAY_PUBLIC_KEY!,
  secretKey: process.env.WOOSHPAY_SECRET_KEY!,
  webhookSecret: process.env.WOOSHPAY_WEBHOOK_SECRET,
  baseUrl: process.env.NODE_ENV === "production" ? "https://api.wooshpay.com" : "https://api.wooshpay.com", // WooshPay uses same URL for test/live, differentiated by keys
}

export const WOOSHPAY_ENDPOINTS = {
  initialize: "/transaction/initialize",
  verify: "/transaction/verify",
  refund: "/refund",
  transfer: "/transfer",
}
