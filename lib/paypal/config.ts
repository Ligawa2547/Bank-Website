export const PAYPAL_CONFIG = {
  CLIENT_ID: process.env.PAYPAL_CLIENT_ID!,
  CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET!,
  BASE_URL: process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
  WEB_URL: process.env.NODE_ENV === "production" ? "https://www.paypal.com" : "https://www.sandbox.paypal.com",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://ebanking.iaenb.com",
}

export function validatePayPalConfig() {
  const errors: string[] = []

  if (!PAYPAL_CONFIG.CLIENT_ID) {
    errors.push("PAYPAL_CLIENT_ID is required")
  }

  if (!PAYPAL_CONFIG.CLIENT_SECRET) {
    errors.push("PAYPAL_CLIENT_SECRET is required")
  }

  if (!PAYPAL_CONFIG.APP_URL) {
    errors.push("NEXT_PUBLIC_APP_URL is required")
  }

  if (errors.length > 0) {
    throw new Error(`PayPal configuration errors: ${errors.join(", ")}`)
  }

  console.log("PayPal Config:", {
    baseUrl: PAYPAL_CONFIG.BASE_URL,
    appUrl: PAYPAL_CONFIG.APP_URL,
    hasClientId: !!PAYPAL_CONFIG.CLIENT_ID,
    hasClientSecret: !!PAYPAL_CONFIG.CLIENT_SECRET,
  })
}
