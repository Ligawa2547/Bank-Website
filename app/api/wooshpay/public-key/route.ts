import { NextResponse } from "next/server"
import { getWooshPayPublicKey } from "@/lib/wooshpay/config"

export async function GET() {
  try {
    const publicKey = await getWooshPayPublicKey()
    return NextResponse.json({ success: true, publicKey })
  } catch (error) {
    console.error("Error fetching WooshPay public key:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch public key" }, { status: 500 })
  }
}
