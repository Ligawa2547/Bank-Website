import { NextResponse } from "next/server"
import { getWooshPayServerConfig } from "@/lib/wooshpay/config"

/**
 * GET /api/wooshpay/public-key → { publicKey: "pk_live_…" }
 */
export async function GET() {
  const { publicKey } = await getWooshPayServerConfig()
  return NextResponse.json({ publicKey })
}
