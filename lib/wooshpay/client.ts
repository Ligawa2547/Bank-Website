/** Simple runtime check so UIs can conditionally show WooshPay flows */
export function isWooshPayConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_WOOSHPAY_PUBLIC_KEY && process.env.WOOSHPAY_SECRET_KEY)
}
