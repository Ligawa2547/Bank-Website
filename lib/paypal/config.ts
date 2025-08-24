export const PAYPAL_CONFIG = {
  CLIENT_ID: process.env.PAYPAL_CLIENT_ID!,
  CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET!,
  BASE_URL: process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
  WEB_URL: process.env.NODE_ENV === "production" ? "https://www.paypal.com" : "https://www.sandbox.paypal.com",
}

export function validatePayPalConfig() {
  if (!PAYPAL_CONFIG.CLIENT_ID) {
    throw new Error("PAYPAL_CLIENT_ID environment variable is required")
  }

  if (!PAYPAL_CONFIG.CLIENT_SECRET) {
    throw new Error("PAYPAL_CLIENT_SECRET environment variable is required")
  }

  console.log("PayPal Config:", {
    hasClientId: !!PAYPAL_CONFIG.CLIENT_ID,
    hasClientSecret: !!PAYPAL_CONFIG.CLIENT_SECRET,
    baseUrl: PAYPAL_CONFIG.BASE_URL,
    environment: process.env.NODE_ENV,
  })
}
