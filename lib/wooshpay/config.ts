// Environment variable validation
const validateEnvVar = (name: string, value: string | undefined): string => {
  if (!value) {
    console.warn(`Warning: ${name} environment variable is not set`)
    return ""
  }
  return value
}

// Client-side configuration (non-sensitive only)
export const WOOSHPAY_CLIENT_CONFIG = {
  baseUrl: process.env.NODE_ENV === "production" ? "https://api.wooshpay.com" : "https://api.wooshpay.com",
}

// Server-side configuration (sensitive data)
export const WOOSHPAY_SERVER_CONFIG = {
  publicKey: validateEnvVar("NEXT_PUBLIC_WOOSHPAY_PUBLIC_KEY", process.env.NEXT_PUBLIC_WOOSHPAY_PUBLIC_KEY),
  secretKey: validateEnvVar("WOOSHPAY_SECRET_KEY", process.env.WOOSHPAY_SECRET_KEY),
  webhookSecret: validateEnvVar("WOOSHPAY_WEBHOOK_SECRET", process.env.WOOSHPAY_WEBHOOK_SECRET),
  baseUrl: process.env.NODE_ENV === "production" ? "https://api.wooshpay.com" : "https://api.wooshpay.com",
}

export const WOOSHPAY_ENDPOINTS = {
  initialize: "/transaction/initialize",
  verify: "/transaction/verify",
  refund: "/refund",
  transfer: "/transfer",
}

// Legacy export for backward compatibility
export const WOOSHPAY_CONFIG = {
  baseUrl: WOOSHPAY_SERVER_CONFIG.baseUrl,
  secretKey: WOOSHPAY_SERVER_CONFIG.secretKey,
}

// Helper function to check if WooshPay is properly configured
export const isWooshPayConfigured = (): boolean => {
  return !!(WOOSHPAY_SERVER_CONFIG.secretKey && WOOSHPAY_SERVER_CONFIG.publicKey)
}
