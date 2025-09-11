import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Since we're only using PayPal now, this endpoint should not be used
    return NextResponse.json({ error: "WooshPay is no longer supported. Please use PayPal." }, { status: 400 })
  } catch (error) {
    console.error("Error in deprecated WooshPay endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
