export const PAYPAL_CONFIG = {
  CLIENT_ID:
    process.env.PAYPAL_CLIENT_ID || "AbX1lIfpj2F5GbIFGrqv7F5wq-q6Sgc0dMr-aB6nQMt6Us76etTJHQZtCgvq9omd63fSdCqnAoPQiFio",
  CLIENT_SECRET:
    process.env.PAYPAL_CLIENT_SECRET ||
    "EFn2M9xLcowxhYjkqGGz-o53ukuF6sNuYsZq5Aj5xSMjvzG2EJK1yu_Hp5SLevefQ78aCpVFfz7onFsZ",
  APP_NAME: "Alghahim",
  // We'll try both sandbox and production to see which works
  SANDBOX_BASE_URL: "https://api-m.sandbox.paypal.com",
  PRODUCTION_BASE_URL: "https://api-m.paypal.com",
  SANDBOX_WEB_URL: "https://www.sandbox.paypal.com",
  PRODUCTION_WEB_URL: "https://www.paypal.com",
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

  // Validate credential format
  if (PAYPAL_CONFIG.CLIENT_ID && !PAYPAL_CONFIG.CLIENT_ID.match(/^[A-Za-z0-9_-]+$/)) {
    errors.push("PAYPAL_CLIENT_ID format appears invalid")
  }

  if (PAYPAL_CONFIG.CLIENT_SECRET && !PAYPAL_CONFIG.CLIENT_SECRET.match(/^[A-Za-z0-9_-]+$/)) {
    errors.push("PAYPAL_CLIENT_SECRET format appears invalid")
  }

  if (errors.length > 0) {
    throw new Error(`PayPal configuration errors: ${errors.join(", ")}`)
  }

  console.log("PayPal Config Validation:", {
    appName: PAYPAL_CONFIG.APP_NAME,
    appUrl: PAYPAL_CONFIG.APP_URL,
    clientIdLength: PAYPAL_CONFIG.CLIENT_ID?.length || 0,
    clientSecretLength: PAYPAL_CONFIG.CLIENT_SECRET?.length || 0,
    clientIdPrefix: PAYPAL_CONFIG.CLIENT_ID?.substring(0, 10) || "none",
    clientSecretPrefix: PAYPAL_CONFIG.CLIENT_SECRET?.substring(0, 10) || "none",
    hasClientId: !!PAYPAL_CONFIG.CLIENT_ID,
    hasClientSecret: !!PAYPAL_CONFIG.CLIENT_SECRET,
  })
}
