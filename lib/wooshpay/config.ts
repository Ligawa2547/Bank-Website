"use server"

export async function getWooshPayPublicKey(): Promise<string> {
  return process.env.NEXT_PUBLIC_WOOSHPAY_PUBLIC_KEY || ""
}

export async function getWooshPaySecretKey(): Promise<string> {
  return process.env.WOOSHPAY_SECRET_KEY || ""
}

export async function getWooshPayWebhookSecret(): Promise<string> {
  return process.env.WOOSHPAY_WEBHOOK_SECRET || ""
}

export async function getWooshPayServerConfig() {
  return {
    publicKey: await getWooshPayPublicKey(),
    secretKey: await getWooshPaySecretKey(),
    webhookSecret: await getWooshPayWebhookSecret(),
    baseUrl: "https://api.wooshpay.com",
  }
}
