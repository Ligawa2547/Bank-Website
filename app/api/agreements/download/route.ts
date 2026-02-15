import { NextRequest, NextResponse } from 'next/server'
import { generateAgreementHTML, type AgreementData } from '@/lib/pdf/agreement-generator'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    // Fetch user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, account_number')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prepare agreement data
    const agreementData: AgreementData = {
      firstName: userData.first_name || 'Customer',
      lastName: userData.last_name || '',
      email: userData.email || '',
      accountNumber: userData.account_number || 'N/A',
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    }

    // Generate HTML
    const htmlContent = generateAgreementHTML(agreementData)

    // Return HTML that can be printed or converted to PDF
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="AV-Bank-Account-Agreement-${userData.account_number}.html"`,
      },
    })
  } catch (error) {
    console.error('Agreement download error:', error)
    return NextResponse.json({ error: 'Failed to download agreement' }, { status: 500 })
  }
}
