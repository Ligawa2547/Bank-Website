"use server"

/**
 * Internal validator – not exported (allowed in a server-only file).
 */
const validateEnvVar = (name: string, value: string | undefined): string => {
  if (!value) {
    console.warn(`Warning: ${name} environment variable is not set`)
    return ""
  }
  return value
}

const BASE_URL = process.env.NODE_ENV === "production" ? "https://api.wooshpay.com" : "https://api.wooshpay.com"

const ENDPOINTS = {
  initialize: "/transaction/initialize",
  verify: "/transaction/verify",
  refund: "/refund",
  transfer: "/transfer",
}

/**
 * Returns all **sensitive** WooshPay credentials & endpoints.
 * ONLY call this from the server (Route Handlers, Server Actions, etc.).
 */
export async function getWooshPayServerConfig() {
  return {
    baseUrl: BASE_URL,
    publicKey: validateEnvVar("NEXT_PUBLIC_WOOSHPAY_PUBLIC_KEY", process.env.NEXT_PUBLIC_WOOSHPAY_PUBLIC_KEY),
    secretKey: validateEnvVar("WOOSHPAY_SECRET_KEY", process.env.WOOSHPAY_SECRET_KEY),
    webhookSecret: validateEnvVar("WOOSHPAY_WEBHOOK_SECRET", process.env.WOOSHPAY_WEBHOOK_SECRET),
    endpoints: ENDPOINTS,
  }
}

/**
 * Convenience helper for sanity-checking your env.
 */
export async function isWooshPayConfigured(): Promise<boolean> {
  const cfg = await getWooshPayServerConfig()
  return !!(cfg.secretKey && cfg.publicKey)
}
