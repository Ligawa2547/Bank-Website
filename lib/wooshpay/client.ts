import { WOOSHPAY_SERVER_CONFIG, WOOSHPAY_ENDPOINTS, isWooshPayConfigured } from "./config"

export interface WooshPayInitializeRequest {
  email: string
  amount: number
  currency?: string
  reference: string
  callback_url: string
  metadata?: Record<string, any>
  customer?: {
    name?: string
    phone?: string
  }
}

export interface WooshPayInitializeResponse {
  status: boolean
  message: string
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface WooshPayVerifyResponse {
  status: boolean
  message: string
  data?: {
    id: string
    reference: string
    amount: number
    currency: string
    status: "success" | "failed" | "pending"
    gateway_response: string
    paid_at: string
    created_at: string
    customer: {
      email: string
      name?: string
      phone?: string
    }
    metadata?: Record<string, any>
  }
}

class WooshPayClient {
  private baseUrl: string
  private secretKey: string
  private isConfigured: boolean

  constructor() {
    this.baseUrl = WOOSHPAY_SERVER_CONFIG.baseUrl || "https://api.wooshpay.com"
    this.secretKey = WOOSHPAY_SERVER_CONFIG.secretKey || ""
    this.isConfigured = isWooshPayConfigured()

    if (!this.isConfigured) {
      console.warn("WooshPay is not properly configured. Payment functionality will be disabled.")
    }
  }

  private checkConfiguration(): void {
    if (!this.isConfigured) {
      throw new Error("WooshPay is not properly configured. Please check your environment variables.")
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    this.checkConfiguration()

    const url = `${this.baseUrl}${endpoint}`

    console.log(`Making WooshPay request to: ${url}`)
    console.log(`Request options:`, {
      method: options.method,
      headers: options.headers,
      body: options.body ? JSON.parse(options.body as string) : undefined,
    })

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options.headers,
        },
      })

      const responseData = await response.json()

      console.log(`WooshPay response status: ${response.status}`)
      console.log(`WooshPay response data:`, responseData)

      if (!response.ok) {
        throw new Error(`WooshPay API error: ${response.status} - ${responseData.message || response.statusText}`)
      }

      return responseData
    } catch (error) {
      console.error(`WooshPay request failed:`, error)
      throw error
    }
  }

  async initializePayment(data: WooshPayInitializeRequest): Promise<WooshPayInitializeResponse> {
    const payload = {
      email: data.email,
      amount: data.amount, // WooshPay expects amount in major currency unit (dollars, not cents)
      currency: data.currency || "USD",
      reference: data.reference,
      callback_url: data.callback_url,
      metadata: data.metadata || {},
      customer: data.customer || {},
    }

    return this.makeRequest(WOOSHPAY_ENDPOINTS.initialize, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async verifyPayment(reference: string): Promise<WooshPayVerifyResponse> {
    return this.makeRequest(`${WOOSHPAY_ENDPOINTS.verify}/${reference}`, {
      method: "GET",
    })
  }

  async refundPayment(reference: string, amount?: number): Promise<any> {
    return this.makeRequest(WOOSHPAY_ENDPOINTS.refund, {
      method: "POST",
      body: JSON.stringify({
        reference,
        amount,
      }),
    })
  }

  // Helper method to check if client is configured
  isReady(): boolean {
    return this.isConfigured
  }
}

export const wooshPayClient = new WooshPayClient()

// Re-export helper so callers can import from "@/lib/wooshpay/client"
export { isWooshPayConfigured } from "./config"
