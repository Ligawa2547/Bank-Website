import { renderToString } from 'react-dom/server'
import AgreementTemplate from './agreement-template'

export interface AgreementData {
  firstName: string
  lastName: string
  email: string
  accountNumber: string
  date: string
}

/**
 * Generates an account agreement as HTML that can be converted to PDF
 * This function creates a professional legal document with company letterhead
 */
export function generateAgreementHTML(data: AgreementData): string {
  const currentYear = new Date().getFullYear()

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Agreement</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1f2937;
          line-height: 1.6;
          background: white;
          padding: 0;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 60px 40px;
          background: white;
        }
        
        /* Letterhead */
        .letterhead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 60px;
          padding-bottom: 20px;
          border-bottom: 3px solid #7c3aed;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 20px;
        }
        
        .company-info {
          text-align: left;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }
        
        .company-tagline {
          font-size: 12px;
          color: #7c3aed;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        
        .contact-info {
          text-align: right;
          font-size: 11px;
          color: #6b7280;
        }
        
        .contact-info p {
          margin: 4px 0;
        }
        
        /* Document Title */
        .title {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .title h1 {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 10px;
        }
        
        .title p {
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
        }
        
        /* Document Metadata */
        .metadata {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 40px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #7c3aed;
        }
        
        .metadata-item {
          font-size: 12px;
        }
        
        .metadata-label {
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .metadata-value {
          color: #0f172a;
          font-weight: 500;
        }
        
        /* Content */
        .content {
          margin-bottom: 40px;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .section-content {
          font-size: 11px;
          color: #374151;
          line-height: 1.8;
        }
        
        .section-content p {
          margin-bottom: 10px;
          text-align: justify;
        }
        
        .section-content ul {
          margin-left: 20px;
          margin-bottom: 10px;
        }
        
        .section-content li {
          margin-bottom: 6px;
        }
        
        /* Signature Section */
        .signature-section {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 2px solid #e5e7eb;
        }
        
        .signature {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 40px;
        }
        
        .signature-block {
          text-align: center;
        }
        
        .signature-line {
          border-top: 1px solid #0f172a;
          margin-top: 50px;
          padding-top: 10px;
          font-size: 11px;
          font-weight: 600;
          color: #0f172a;
        }
        
        .signature-date {
          font-size: 11px;
          color: #6b7280;
          margin-top: 5px;
        }
        
        /* Footer */
        .footer {
          text-align: center;
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 10px;
          color: #9ca3af;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .container {
            padding: 0;
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Letterhead -->
        <div class="letterhead">
          <div class="logo-section">
            <div class="logo">AV</div>
            <div class="company-info">
              <div class="company-name">AV Bank</div>
              <div class="company-tagline">ALGHAHIM FINANCIAL SERVICES</div>
            </div>
          </div>
          <div class="contact-info">
            <p>bank.aghq.co.ke</p>
            <p>support@bank.aghq.co.ke</p>
            <p>+254 (20) 123-4567</p>
            <p>Nairobi, Kenya</p>
          </div>
        </div>
        
        <!-- Title -->
        <div class="title">
          <h1>ACCOUNT AGREEMENT</h1>
          <p>Customer Agreement and Legal Terms</p>
        </div>
        
        <!-- Metadata -->
        <div class="metadata">
          <div class="metadata-item">
            <div class="metadata-label">Account Holder</div>
            <div class="metadata-value">${data.firstName} ${data.lastName}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Account Number</div>
            <div class="metadata-value">${data.accountNumber}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Email</div>
            <div class="metadata-value">${data.email}</div>
          </div>
          <div class="metadata-item">
            <div class="metadata-label">Agreement Date</div>
            <div class="metadata-value">${data.date}</div>
          </div>
        </div>
        
        <!-- Content -->
        <div class="content">
          <div class="section">
            <h2 class="section-title">1. INTRODUCTION</h2>
            <div class="section-content">
              <p>This Account Agreement ("Agreement") is entered into on ${data.date} between AV Bank, a financial services provider operating under Alghahim Financial Services ("Company," "us," "our," or "we"), and ${data.firstName} ${data.lastName} ("Customer," "you," or "your").</p>
              <p>By signing this Agreement or using our services, you acknowledge that you have read, understood, and agree to be bound by all the terms and conditions set forth herein.</p>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">2. ACCOUNT OPENING AND ELIGIBILITY</h2>
            <div class="section-content">
              <p>You represent and warrant that:</p>
              <ul>
                <li>You are at least 18 years of age and have full legal capacity to enter into this Agreement</li>
                <li>All information provided during account registration is accurate, current, and complete</li>
                <li>You are not restricted from opening a financial account by any law or regulation</li>
                <li>Your account will not be used for unlawful purposes or in violation of any applicable laws</li>
              </ul>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">3. ACCOUNT SECURITY AND PASSWORDS</h2>
            <div class="section-content">
              <p>You are solely responsible for maintaining the confidentiality of your account credentials, including your username, password, and any authentication tokens. You agree to:</p>
              <ul>
                <li>Use a strong password consisting of at least 8 characters including uppercase, lowercase, numbers, and special characters</li>
                <li>Change your password regularly (at least every 90 days)</li>
                <li>Never share your credentials with anyone, including Company staff</li>
                <li>Immediately notify us of any unauthorized access or suspected security breach</li>
                <li>Ensure you log out from shared devices after each session</li>
              </ul>
              <p>You acknowledge that you are liable for all activities conducted under your account credentials, whether authorized or unauthorized. The Company is not responsible for any unauthorized access resulting from your negligence in protecting your credentials.</p>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">4. FINANCIAL TRANSACTIONS</h2>
            <div class="section-content">
              <p>All financial transactions conducted through your account are subject to:</p>
              <ul>
                <li>Verification and approval by our automated systems and fraud detection mechanisms</li>
                <li>Compliance with applicable banking regulations, AML/KYC requirements, and international financial standards</li>
                <li>Potential processing delays of 24-48 hours for fraud prevention and verification purposes</li>
                <li>Transaction limits based on your account status, verification level, and regulatory requirements</li>
                <li>Applicable fees as outlined in our Fee Schedule</li>
              </ul>
              <p>We reserve the right to decline, reverse, or hold any transaction that appears suspicious, potentially fraudulent, or in violation of our policies without prior notice.</p>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">5. KNOW YOUR CUSTOMER (KYC) VERIFICATION</h2>
            <div class="section-content">
              <p>To comply with banking regulations and anti-money laundering laws, we require Know Your Customer (KYC) verification. This process includes:</p>
              <ul>
                <li>Submission of valid government-issued identification documents (passport, national ID, or driver's license)</li>
                <li>Address verification through utility bills or official documents</li>
                <li>Facial recognition verification through self-verification (selfie)</li>
                <li>Source of funds information and beneficial ownership disclosure where applicable</li>
              </ul>
              <p>KYC verification typically takes 1-3 business days. A one-time verification fee of $15 USD applies. Failure to complete KYC verification within 30 days may result in account restrictions or suspension.</p>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">6. DATA PRIVACY AND PROTECTION</h2>
            <div class="section-content">
              <p>We collect, process, and protect your personal and financial information in accordance with our Privacy Policy and applicable data protection laws, including GDPR and local banking regulations. Your data is protected using:</p>
              <ul>
                <li>End-to-end encryption (TLS 1.3) for all data transmission</li>
                <li>AES-256 encryption for stored sensitive data</li>
                <li>Multi-factor authentication for account access</li>
                <li>Role-based access controls restricting employee access</li>
              </ul>
              <p>You acknowledge receipt of our Privacy Policy and consent to the collection and processing of your information as described therein.</p>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">7. FEES AND CHARGES</h2>
            <div class="section-content">
              <p>We may charge various fees for services provided, including but not limited to:</p>
              <ul>
                <li>KYC Verification Fee: $15 USD (one-time, non-refundable)</li>
                <li>Wire Transfer Fees: $5-$50 USD per transaction</li>
                <li>Currency Conversion: 1-2% per transaction</li>
                <li>Failed Transaction Fee: $2 USD per failed attempt</li>
              </ul>
              <p>We reserve the right to modify fees with 30 days' written notice. Fee changes will be effective only for transactions initiated after the notice period expires.</p>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">8. LIMITATION OF LIABILITY</h2>
            <div class="section-content">
              <p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to this Agreement or our services, including but not limited to loss of profits, data loss, or business interruption, even if advised of the possibility of such damages.</p>
              <p>Our total liability for any claim arising out of or related to this Agreement shall not exceed the fees paid by you in the 12 months preceding the claim.</p>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">9. GOVERNING LAW AND DISPUTE RESOLUTION</h2>
            <div class="section-content">
              <p>This Agreement shall be governed by and construed in accordance with the laws of the Republic of Kenya, without regard to its conflict of law principles.</p>
              <p>Any disputes arising out of or relating to this Agreement shall first be resolved through good-faith negotiation. If negotiation fails, disputes shall be subject to arbitration in Nairobi, Kenya, in accordance with the Kenyan Arbitration Act.</p>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">10. ACKNOWLEDGMENT AND ACCEPTANCE</h2>
            <div class="section-content">
              <p>By signing below or electronically confirming your acceptance, you acknowledge that:</p>
              <ul>
                <li>You have carefully read and understood this entire Agreement</li>
                <li>You agree to comply with all terms and conditions set forth herein</li>
                <li>You have received a copy of this Agreement for your records</li>
                <li>You understand your rights and responsibilities as outlined in this Agreement</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Signature Section -->
        <div class="signature-section">
          <h2 class="section-title">SIGNATURES</h2>
          
          <div class="signature">
            <div class="signature-block">
              <div style="font-size: 11px; margin-bottom: 40px; font-weight: 600;">CUSTOMER</div>
              <div class="signature-line">
                ${data.firstName} ${data.lastName}
              </div>
              <div class="signature-date">Signature Date: ${data.date}</div>
            </div>
            
            <div class="signature-block">
              <div style="font-size: 11px; margin-bottom: 40px; font-weight: 600;">AUTHORIZED REPRESENTATIVE</div>
              <div class="signature-line">
                AV Bank / Alghahim Financial Services
              </div>
              <div class="signature-date">Date: ${data.date}</div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>This is an electronically generated document. This document is legally binding and has the same force and effect as a manually signed document.</p>
          <p>AV Bank | Alghahim Financial Services | bank.aghq.co.ke | support@bank.aghq.co.ke</p>
          <p>© ${currentYear} Alghahim Financial Services. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
