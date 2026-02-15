import { NextRequest, NextResponse } from 'next/server'
import { generateAgreementHTML, type AgreementData } from '@/lib/pdf/agreement-generator'

/**
 * POST /api/agreements/generate
 * Generates a PDF agreement document for a user
 * Returns the PDF as a blob for download or email attachment
 */
export async function POST(request: NextRequest) {
  try {
    const data: AgreementData = await request.json()

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.accountNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate HTML
    const htmlContent = generateAgreementHTML(data)

    // In a production environment, you would use a tool like:
    // - Puppeteer (requires browser)
    // - wkhtmltopdf
    // - Vercel's html2pdf or similar serverless solution
    // For now, we'll return the HTML which can be converted to PDF on the client side
    // Or use a service like html2pdf.com or similar

    return NextResponse.json(
      {
        success: true,
        html: htmlContent,
        message: 'Agreement generated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate agreement' }, { status: 500 })
  }
}
