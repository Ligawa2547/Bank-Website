export const PAYPAL_CONFIG = {
  CLIENT_ID: process.env.PAYPAL_CLIENT_ID!,
  CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET!,
  BASE_URL: process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
  WEB_URL: process.env.NODE_ENV === "production" ? "https://www.paypal.com" : "https://www.sandbox.paypal.com",
}

// Validate required environment variables
if (!PAYPAL_CONFIG.CLIENT_ID) {
  console.error("PAYPAL_CLIENT_ID environment variable is required")
}

if (!PAYPAL_CONFIG.CLIENT_SECRET) {
  console.error("PAYPAL_CLIENT_SECRET environment variable is required")
}

export const PAYPAL_SCOPES = "https://uri.paypal.com/services/payments/payment"
