// PayPal Configuration
export const PAYPAL_CONFIG = {
  // Your provided credentials as fallbacks
  CLIENT_ID:
    process.env.PAYPAL_CLIENT_ID || "AbX1lIfpj2F5GbIFGrqv7F5wq-q6Sgc0dMr-aB6nQMt6Us76etTJHQZtCgvq9omd63fSdCqnAoPQiFio",
  CLIENT_SECRET:
    process.env.PAYPAL_CLIENT_SECRET ||
    "EFn2M9xLcowxhYjkqGGz-o53ukuF6sNuYsZq5Aj5xSMjvzG2EJK1yu_Hp5SLevefQ78aCpVFfz7onFsZ",

  // Environment URLs
  SANDBOX_BASE_URL: "https://api-m.sandbox.paypal.com",
  PRODUCTION_BASE_URL: "https://api-m.paypal.com",

  // App configuration
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  APP_NAME: "IAE National Bank",

  // Runtime detected environment
  DETECTED_ENVIRONMENT: null as "sandbox" | "production" | null,
}

export function validatePayPalConfig() {
  if (!PAYPAL_CONFIG.CLIENT_ID || !PAYPAL_CONFIG.CLIENT_SECRET) {
    throw new Error("PayPal CLIENT_ID and CLIENT_SECRET are required")
  }

  if (PAYPAL_CONFIG.CLIENT_ID.length < 50) {
    throw new Error("PayPal CLIENT_ID appears to be invalid (too short)")
  }

  if (PAYPAL_CONFIG.CLIENT_SECRET.length < 50) {
    throw new Error("PayPal CLIENT_SECRET appears to be invalid (too short)")
  }
}

export function getPayPalBaseUrl(): string {
  return PAYPAL_CONFIG.DETECTED_ENVIRONMENT === "production"
    ? PAYPAL_CONFIG.PRODUCTION_BASE_URL
    : PAYPAL_CONFIG.SANDBOX_BASE_URL
}

export function setDetectedEnvironment(env: "sandbox" | "production") {
  PAYPAL_CONFIG.DETECTED_ENVIRONMENT = env
}
