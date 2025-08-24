export const PAYPAL_CONFIG = {
  // Your PayPal App Credentials
  CLIENT_ID:
    process.env.PAYPAL_CLIENT_ID || "AbX1lIfpj2F5GbIFGrqv7F5wq-q6Sgc0dMr-aB6nQMt6Us76etTJHQZtCgvq9omd63fSdCqnAoPQiFio",
  CLIENT_SECRET:
    process.env.PAYPAL_CLIENT_SECRET ||
    "EFn2M9xLcowxhYjkqGGz-o53ukuF6sNuYsZq5Aj5xSMjvzG2EJK1yu_Hp5SLevefQ78aCpVFfz7onFsZ",

  // Environment URLs - we'll detect which one works
  SANDBOX_BASE_URL: "https://api-m.sandbox.paypal.com",
  PRODUCTION_BASE_URL: "https://api-m.paypal.com",

  // App URLs
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Cache for environment detection
  DETECTED_ENVIRONMENT: null as "sandbox" | "production" | null,
}

// Helper to get the correct base URL
export function getPayPalBaseUrl(): string {
  if (PAYPAL_CONFIG.DETECTED_ENVIRONMENT === "production") {
    return PAYPAL_CONFIG.PRODUCTION_BASE_URL
  }
  // Default to sandbox for initial attempts
  return PAYPAL_CONFIG.SANDBOX_BASE_URL
}

// Helper to set detected environment
export function setDetectedEnvironment(env: "sandbox" | "production") {
  PAYPAL_CONFIG.DETECTED_ENVIRONMENT = env
  console.log(`✅ PayPal environment detected: ${env}`)
}
