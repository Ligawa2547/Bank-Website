'use server'

const BASE_URL = 'https://wallet.xprizo.com'
const XPRIZO_API_KEY = process.env.XPRIZO_API_KEY

export async function initiateM2mDeposit(payload: {
  mobileNumber: string
  accountId: string
  amount: number
  reference: string
}) {
  try {
    if (!XPRIZO_API_KEY) {
      throw new Error('Xprizo API key is not configured. Please contact support.')
    }

    if (!payload.accountId) {
      throw new Error('Merchant wallet ID is not configured. Please contact support.')
    }

    const response = await fetch(`${BASE_URL}/api/Transaction/MPesaDeposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XPRIZO_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.text()
      const errorMsg = error ? `${response.status}: ${error}` : `HTTP ${response.status}`
      throw new Error(`M-Pesa deposit failed: ${errorMsg}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Xprizo M2m] Error:', message)
    throw error
  }
}

export async function verifyWalletRecipient(accountNumber: string) {
  try {
    if (!XPRIZO_API_KEY) {
      throw new Error('XPRIZO_API_KEY is not configured')
    }

    const response = await fetch(`${BASE_URL}/api/Wallet/Info?accountNumber=${accountNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${XPRIZO_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Recipient account not found')
    }

    return await response.json()
  } catch (error) {
    console.error('[Xprizo Wallet] Verification error:', error)
    throw error
  }
}

export async function requestWalletTransfer(payload: {
  recipientAccountNumber: string
  amount: number
  reference: string
  description: string
}) {
  try {
    if (!XPRIZO_API_KEY) {
      throw new Error('XPRIZO_API_KEY is not configured')
    }

    const response = await fetch(`${BASE_URL}/api/Transaction/RequestPayment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XPRIZO_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Transfer request failed: ${error}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[Xprizo Transfer] Error:', error)
    throw error
  }
}

export async function checkTransactionStatus(reference: string) {
  try {
    if (!XPRIZO_API_KEY) {
      throw new Error('XPRIZO_API_KEY is not configured')
    }

    const response = await fetch(`${BASE_URL}/api/Transaction/Status?reference=${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${XPRIZO_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to check transaction status')
    }

    return await response.json()
  } catch (error) {
    console.error('[Xprizo Status] Error:', error)
    throw error
  }
}
