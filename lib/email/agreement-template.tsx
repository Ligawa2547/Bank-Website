export interface AgreementEmailData {
  firstName: string
  lastName: string
  accountNumber: string
  dashboardUrl: string
}

export function getAgreementEmailTemplate(data: AgreementEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Account Agreement - AV Bank</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">AV Bank</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Alghahim Financial Services</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin: 0; font-size: 24px;">Welcome to AV Bank!</h2>
          </div>
          
          <!-- Message -->
          <div style="margin-bottom: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Dear ${data.firstName} ${data.lastName},
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Thank you for opening an account with AV Bank! We're delighted to welcome you to our financial family.
            </p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              As part of your account registration, we've prepared a comprehensive <strong>Account Agreement</strong> document that outlines the terms, conditions, and your rights and responsibilities as an AV Bank customer.
            </p>
          </div>
          
          <!-- Account Details -->
          <div style="background-color: #f9fafb; border-left: 4px solid #7c3aed; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #0f172a; margin: 0 0 15px 0; font-size: 14px; font-weight: 600;">Your Account Information</h3>
            <table style="width: 100%; font-size: 14px; color: #374151;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Name:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${data.firstName} ${data.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Account Number:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${data.accountNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Date Created:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${new Date().toLocaleDateString()}</td>
              </tr>
            </table>
          </div>
          
          <!-- What's Included -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #0f172a; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Your Agreement Includes:</h3>
            <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Account opening and eligibility terms</li>
              <li>Account security and password requirements</li>
              <li>Financial transaction policies</li>
              <li>KYC verification process and requirements</li>
              <li>Data privacy and protection measures</li>
              <li>Fees and charges schedule</li>
              <li>Liability limitations and dispute resolution</li>
              <li>Full legal terms and conditions</li>
            </ul>
          </div>
          
          <!-- Important Note -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px;">
            <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">
              Important: Please review this document carefully and keep it for your records.
            </p>
            <p style="color: #92400e; font-size: 13px; margin: 10px 0 0 0;">
              By opening and using your account, you acknowledge that you have read and accept all terms outlined in this agreement.
            </p>
          </div>
          
          <!-- Action Buttons -->
          <div style="text-align: center; margin-bottom: 30px;">
            <table style="width: 100%; margin-bottom: 15px;">
              <tr>
                <td style="text-align: center;">
                  <a href="${data.dashboardUrl}" 
                     style="background-color: #7c3aed; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 14px;">
                    View in Dashboard
                  </a>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Next Steps -->
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Next Steps:</h3>
            <ol style="color: #1e40af; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Download and save this agreement for your records</li>
              <li>Complete KYC verification within 30 days</li>
              <li>Set up strong security with two-factor authentication</li>
              <li>Explore our banking services in your dashboard</li>
            </ol>
          </div>
          
          <!-- Support -->
          <div style="margin-bottom: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions about this agreement or your account, please don't hesitate to contact us.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f3f4f6; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
            AV Bank | Alghahim Financial Services
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
            Email: support@bank.aghq.co.ke | Phone: +254 (20) 123-4567
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            © ${new Date().getFullYear()} Alghahim Financial Services. All rights reserved.
          </p>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1d5db;">
            <p style="color: #9ca3af; font-size: 10px; margin: 0;">
              This is an automated email. Please do not reply to this address. For support, visit our website or contact us directly.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}
