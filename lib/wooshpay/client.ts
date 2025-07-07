// Add this export at the end of the file
export function isWooshPayConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_WOOSHPAY_PUBLIC_KEY && process.env.WOOSHPAY_SECRET_KEY)
}
