// Client-side configuration (non-sensitive only)
export const WOOSHPAY_CLIENT_CONFIG = {
  baseUrl: process.env.NODE_ENV === "production" ? "https://api.wooshpay.com" : "https://api.wooshpay.com",
}

// Server-side configuration (sensitive data)
export const WOOSHPAY_SERVER_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_WOOSHPAY_PUBLIC_KEY!,
  secretKey: process.env.WOOSHPAY_SECRET_KEY!,
  webhookSecret: process.env.WOOSHPAY_WEBHOOK_SECRET,
  baseUrl: process.env.NODE_ENV === "production" ? "https://api.wooshpay.com" : "https://api.wooshpay.com",
}

export const WOOSHPAY_ENDPOINTS = {
  initialize: "/transaction/initialize",
  verify: "/transaction/verify",
  refund: "/refund",
  transfer: "/transfer",
}

// Add this export for the client
export const WOOSHPAY_CONFIG = {
  baseUrl: WOOSHPAY_SERVER_CONFIG.baseUrl,
  secretKey: WOOSHPAY_SERVER_CONFIG.secretKey,
}
