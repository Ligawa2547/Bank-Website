import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Paystack is no longer supported. Please use PayPal for payments.",
      deprecated: true,
    },
    { status: 410 },
  )
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Paystack is no longer supported. Please use PayPal for payments.",
      deprecated: true,
    },
    { status: 410 },
  )
}
