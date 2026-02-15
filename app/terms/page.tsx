export const metadata = {
  title: "Terms & Conditions | Banking Platform",
  description:
    "Complete terms and conditions for our banking services including fees, account policies, and legal information",
}

export default function TermsPage() {
  const sections = [
    "Acceptance of Terms",
    "Use License",
    "Account Registration",
    "Security and Passwords",
    "Financial Transactions",
    "Deposits and Withdrawals",
    "KYC Verification",
    "Fees and Charges",
    "Disclaimer of Warranties",
    "Limitations of Liability",
    "Accuracy of Materials",
    "Links",
    "Modifications",
    "Governing Law",
    "Contact Information",
  ]

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4 text-foreground">Terms & Conditions</h1>
            <p className="text-lg text-muted-foreground">
              Last Updated: January 2026 | Effective Date: January 1, 2026
            </p>
            <div className="mt-6 p-6 bg-muted rounded-lg border border-border">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Quick Overview</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ You must be 18+ to use our services</li>
                <li>✓ You are responsible for maintaining account security</li>
                <li>✓ KYC verification required: $15 USD</li>
                <li>✓ All transactions subject to regulatory compliance</li>
                <li>✓ Terms may be modified with 30 days notice</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Table of Contents */}
            <aside className="lg:col-span-1">
              <div className="sticky top-8 bg-muted p-6 rounded-lg">
                <h3 className="font-semibold text-foreground mb-4">Contents</h3>
                <nav className="space-y-2">
                  {sections.map((section, idx) => (
                    <a
                      key={idx}
                      href={`#section-${idx + 1}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
                    >
                      {idx + 1}. {section}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="prose prose-lg max-w-none text-foreground space-y-8">
                <section id="section-1">
                  <h2 className="text-3xl font-semibold mb-4">1. Acceptance of Terms</h2>
                  <p>
                    By accessing and using this banking website and its services, you accept and agree to be bound by
                    the terms and provision of this agreement. If you do not agree to abide by the above, please do not
                    use this service. We reserve the right to refuse service to anyone for any reason at any time.
                  </p>
                  <p className="text-sm text-muted-foreground italic mt-4">
                    This agreement constitutes the entire agreement between you and us regarding the use of our
                    services.
                  </p>
                </section>

                <section id="section-2">
                  <h2 className="text-3xl font-semibold mb-4">2. Use License</h2>
                  <p>
                    Permission is granted to temporarily download one copy of the materials (information or software) on
                    our banking website for personal, non-commercial transitory viewing only. This is the grant of a
                    license, not a transfer of title, and under this license you may not:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Modifying or copying the materials</li>
                    <li>Using the materials for any commercial purpose or for any public display</li>
                    <li>Attempting to decompile or reverse engineer any software contained on the website</li>
                    <li>Removing any copyright or other proprietary notations from the materials</li>
                    <li>
                      Transferring the materials to another person or "mirroring" the materials on any other server
                    </li>
                    <li>Violating any applicable laws or regulations related to access to or use of the website</li>
                  </ul>
                </section>

                <section id="section-3">
                  <h2 className="text-3xl font-semibold mb-4">3. Account Registration</h2>
                  <p>
                    When you register for an account with us, you agree to provide accurate, current, and complete
                    information. You are responsible for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Maintaining the confidentiality of your account password and login credentials</li>
                    <li>Assuming full responsibility and accountability for all activities under your account</li>
                    <li>Notifying us immediately of any unauthorized use of your account</li>
                    <li>Ensuring all information provided is truthful and accurate</li>
                  </ul>
                </section>

                <section id="section-4">
                  <h2 className="text-3xl font-semibold mb-4">4. Security and Passwords</h2>
                  <p>
                    You acknowledge and agree that you are responsible for maintaining the confidentiality of your
                    password and for all activities that occur under your account. You agree to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Never share your password with anyone, including our staff</li>
                    <li>Change your password regularly (at least every 90 days recommended)</li>
                    <li>Log out of your account when using shared devices</li>
                    <li>Immediately report any unauthorized access to your account</li>
                    <li>Use strong, unique passwords (12+ characters recommended)</li>
                  </ul>
                </section>

                <section id="section-5">
                  <h2 className="text-3xl font-semibold mb-4">5. Financial Transactions</h2>
                  <p>All financial transactions conducted through our platform are subject to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Verification and approval by our systems</li>
                    <li>Compliance with applicable banking regulations and AML/KYC requirements</li>
                    <li>Potential processing delays for fraud prevention (typically 24-48 hours)</li>
                    <li>Currency exchange rates as determined by our payment processors</li>
                    <li>Transaction limits based on account status and regulatory requirements</li>
                  </ul>
                  <p className="text-sm text-muted-foreground italic mt-4">
                    We reserve the right to decline any transaction that appears suspicious or violates our policies.
                  </p>
                </section>

                <section id="section-6">
                  <h2 className="text-3xl font-semibold mb-4">6. Deposits and Withdrawals</h2>
                  <p>Deposits and withdrawals are processed according to the following terms:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>
                      Processing times vary: Bank transfers (1-5 business days), Card deposits (instant to 24 hours)
                    </li>
                    <li>Minimum deposit: $10 USD | Maximum deposit: $100,000 USD per transaction</li>
                    <li>Minimum withdrawal: $5 USD | Maximum withdrawal: $50,000 USD per transaction</li>
                    <li>Additional verification may be required for large transactions (over $10,000)</li>
                    <li>We reserve the right to suspend transactions for security or regulatory reasons</li>
                    <li>Withdrawal requests processed within 5 business days</li>
                  </ul>
                </section>

                <section id="section-7">
                  <h2 className="text-3xl font-semibold mb-4">7. KYC Verification</h2>
                  <p>
                    To comply with regulatory requirements, we require Know Your Customer (KYC) verification. This
                    process:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>
                      Requires submission of valid identification documents (passport, national ID, or driver's license)
                    </li>
                    <li>May include address verification (utility bill or official document)</li>
                    <li>Processing typically takes 1-3 business days</li>
                    <li>Verification fee: $15 USD (one-time, non-refundable)</li>
                    <li>Non-compliance may result in account restrictions or suspension</li>
                    <li>Approval is at our sole discretion</li>
                  </ul>
                </section>

                <section id="section-8">
                  <h2 className="text-3xl font-semibold mb-4">8. Fees and Charges</h2>
                  <p>We charge various fees for services provided, including but not limited to:</p>
                  <div className="my-4 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border border-border p-3 text-left">Service</th>
                          <th className="border border-border p-3 text-left">Fee</th>
                          <th className="border border-border p-3 text-left">When Charged</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-border p-3">KYC Verification</td>
                          <td className="border border-border p-3">$15 USD</td>
                          <td className="border border-border p-3">Upon submission</td>
                        </tr>
                        <tr className="bg-muted/50">
                          <td className="border border-border p-3">Wire Transfers</td>
                          <td className="border border-border p-3">$5-$50 USD</td>
                          <td className="border border-border p-3">Per transaction</td>
                        </tr>
                        <tr>
                          <td className="border border-border p-3">Currency Conversion</td>
                          <td className="border border-border p-3">1-2%</td>
                          <td className="border border-border p-3">Per conversion</td>
                        </tr>
                        <tr className="bg-muted/50">
                          <td className="border border-border p-3">Failed Transaction</td>
                          <td className="border border-border p-3">$2 USD</td>
                          <td className="border border-border p-3">Per failed attempt</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4">
                    We reserve the right to modify fees with 30 days notice. Changes will be effective only for
                    transactions after the notice period. You will receive notification via email of any fee changes.
                  </p>
                </section>

                <section id="section-9">
                  <h2 className="text-3xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
                  <p>
                    The materials on our banking website are provided on an 'as is' basis. We make no warranties,
                    expressed or implied, and hereby disclaim and negate all other warranties including, without
                    limitation, implied warranties or conditions of merchantability, fitness for a particular purpose,
                    or non-infringement of intellectual property or other violation of rights. This includes warranties
                    regarding uptime, accessibility, accuracy, or completeness of information.
                  </p>
                </section>

                <section id="section-10">
                  <h2 className="text-3xl font-semibold mb-4">10. Limitations of Liability</h2>
                  <p>
                    In no event shall our company or its suppliers be liable for any damages (including, without
                    limitation, damages for loss of data or profit, or due to business interruption) arising out of the
                    use or inability to use the materials on our website, even if we or our authorized representative
                    has been notified orally or in writing of the possibility of such damage. Some jurisdictions do not
                    allow the exclusion of certain warranties, so some of the above exclusions may not apply to you.
                  </p>
                </section>

                <section id="section-11">
                  <h2 className="text-3xl font-semibold mb-4">11. Accuracy of Materials</h2>
                  <p>
                    The materials appearing on our website could include technical, typographical, or photographic
                    errors. We do not warrant that any of the materials on our website are accurate, complete, or
                    current. We may make changes to the materials contained on our website at any time without notice.
                    However, we do not make any commitment to update the materials.
                  </p>
                </section>

                <section id="section-12">
                  <h2 className="text-3xl font-semibold mb-4">12. Links</h2>
                  <p>
                    We have not reviewed all of the sites linked to our website and are not responsible for the contents
                    of any such linked site. The inclusion of any link does not imply endorsement by us of the site. Use
                    of any such linked website is at the user's own risk. We are not responsible for any loss or damage
                    that may result from your use of linked sites.
                  </p>
                </section>

                <section id="section-13">
                  <h2 className="text-3xl font-semibold mb-4">13. Modifications</h2>
                  <p>
                    We may revise these terms of service for our website at any time without notice. By continuing to
                    use this website after changes are posted, you are agreeing to be bound by the then current version
                    of these terms of service. It is your responsibility to review these terms regularly for changes.
                  </p>
                </section>

                <section id="section-14">
                  <h2 className="text-3xl font-semibold mb-4">14. Governing Law</h2>
                  <p>
                    These terms and conditions are governed by and construed in accordance with the laws of the
                    jurisdiction in which we operate, and you irrevocably submit to the exclusive jurisdiction of the
                    courts in that location. If any provision of these terms is found to be invalid or unenforceable,
                    the remaining provisions shall continue in full force and effect.
                  </p>
                </section>

                <section id="section-15">
                  <h2 className="text-3xl font-semibold mb-4">15. Contact Information</h2>
                  <p>If you have any questions about these Terms & Conditions, please contact us at:</p>
                  <div className="mt-4 p-6 bg-muted rounded-lg border border-border space-y-2">
                    <p>
                      <span className="font-semibold">Email:</span> support@bank.aghq.co.ke
                    </p>
                    <p>
                      <span className="font-semibold">Address:</span> Alghahim Financial Services, Nairobi, Kenya
                    </p>
                    <p>
                      <span className="font-semibold">Phone:</span> +254 (20) 123-4567
                    </p>
                    <p>
                      <span className="font-semibold">Hours:</span> Monday - Friday, 9:00 AM - 5:00 PM EAT
                    </p>
                    <p>
                      <span className="font-semibold">Legal Department:</span> legal@bank.aghq.co.ke
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
