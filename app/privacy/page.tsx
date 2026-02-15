export const metadata = {
  title: "Privacy Policy | Banking Platform",
  description:
    "Comprehensive privacy policy outlining how we collect, use, and protect your personal and financial data",
}

export default function PrivacyPage() {
  const sections = [
    "Introduction",
    "Information We Collect",
    "How We Use Your Information",
    "KYC and AML Compliance",
    "Data Security",
    "Data Sharing and Third Parties",
    "Cookies and Tracking Technologies",
    "Data Retention",
    "Your Privacy Rights",
    "GDPR and Regional Privacy Laws",
    "Children's Privacy",
    "Changes to This Privacy Policy",
    "Contact Us",
  ]

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4 text-foreground">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground">
              Last Updated: January 2026 | Effective Date: January 1, 2026
            </p>
            <div className="mt-6 p-6 bg-muted rounded-lg border border-border">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Your Privacy Rights</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Right to access your personal data</li>
                <li>✓ Right to correct or update your information</li>
                <li>✓ Right to request deletion of your data</li>
                <li>✓ Right to opt-out of marketing communications</li>
                <li>✓ Right to data portability</li>
                <li>✓ Right to lodge a complaint with regulators</li>
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
                  <h2 className="text-3xl font-semibold mb-4">1. Introduction</h2>
                  <p>
                    We take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and
                    safeguard your information when you use our banking website and services. Please read this privacy
                    policy carefully. If you do not agree with our policies and practices, please do not use our
                    website.
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    We comply with all applicable data protection laws including GDPR, CCPA, and local banking
                    regulations.
                  </p>
                </section>

                <section id="section-2">
                  <h2 className="text-3xl font-semibold mb-4">2. Information We Collect</h2>
                  <p>We collect information in various ways:</p>

                  <h3 className="text-2xl font-semibold mt-6 mb-3">Personal Information</h3>
                  <p className="text-sm text-muted-foreground mb-2">Information you provide directly:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Name, email address, and phone number</li>
                    <li>Date of birth and national identification number</li>
                    <li>Address and country of residence</li>
                    <li>Bank account details and financial information</li>
                    <li>Payment information and transaction history</li>
                    <li>Occupation and employment information</li>
                    <li>Emergency contact information</li>
                  </ul>

                  <h3 className="text-2xl font-semibold mt-6 mb-3">Automatic Information</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Information collected automatically when you visit:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>IP address and browser type</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Referring/exit pages</li>
                    <li>Device information and operating system</li>
                    <li>Cookies and similar tracking technologies</li>
                    <li>Login and account access patterns</li>
                    <li>Location data (approximate, based on IP address)</li>
                  </ul>

                  <h3 className="text-2xl font-semibold mt-6 mb-3">Identity Verification Information</h3>
                  <p className="text-sm text-muted-foreground mb-2">Information collected for KYC/AML compliance:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Government-issued ID documents (scanned or photographed)</li>
                    <li>Facial recognition data (selfies for verification)</li>
                    <li>Address verification documents</li>
                    <li>Proof of income documents (if required)</li>
                    <li>Source of funds information</li>
                  </ul>
                </section>

                <section id="section-3">
                  <h2 className="text-3xl font-semibold mb-4">3. How We Use Your Information</h2>
                  <p>We use the information we collect for:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Providing and improving our banking services</li>
                    <li>Processing transactions and account management</li>
                    <li>Verifying your identity and preventing fraud</li>
                    <li>Complying with legal and regulatory requirements</li>
                    <li>Communicating with you about your account and services</li>
                    <li>Sending promotional materials and updates (only with your consent)</li>
                    <li>Analyzing usage patterns to improve our website</li>
                    <li>Enforcing our terms of service</li>
                    <li>Investigating and resolving disputes</li>
                    <li>Detecting and preventing illegal activities</li>
                  </ul>
                </section>

                <section id="section-4">
                  <h2 className="text-3xl font-semibold mb-4">4. KYC and AML Compliance</h2>
                  <p>
                    To comply with banking regulations, we collect and process Know Your Customer (KYC) and Anti-Money
                    Laundering (AML) information. This process includes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Verification of your identity through government-issued documents</li>
                    <li>Assessment of your source of funds</li>
                    <li>Monitoring of transaction patterns for suspicious activity</li>
                    <li>Reporting to regulatory authorities as required by law</li>
                    <li>Enhanced due diligence for high-risk transactions or customers</li>
                  </ul>
                  <p className="mt-4 text-sm text-muted-foreground">
                    We may be required to report suspicious transactions to relevant authorities without your consent.
                  </p>
                </section>

                <section id="section-5">
                  <h2 className="text-3xl font-semibold mb-4">5. Data Security</h2>
                  <p>We implement comprehensive security measures to protect your information:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>SSL/TLS encryption (256-bit) for all data transmission</li>
                    <li>AES-256 encryption for stored data</li>
                    <li>Regular security audits and penetration testing (quarterly minimum)</li>
                    <li>Multi-factor authentication for account access</li>
                    <li>Restricted access to sensitive information (role-based access control)</li>
                    <li>Regular staff training on data security and privacy</li>
                    <li>Secure data destruction procedures</li>
                    <li>Intrusion detection and prevention systems</li>
                    <li>Regular backup and disaster recovery procedures</li>
                  </ul>
                  <p className="mt-4 text-sm text-muted-foreground">
                    While we implement strong security measures, no system is completely secure. We cannot guarantee
                    absolute security.
                  </p>
                </section>

                <section id="section-6">
                  <h2 className="text-3xl font-semibold mb-4">6. Data Sharing and Third Parties</h2>
                  <p>We may share your information with:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Payment processors and financial institutions (for transactions)</li>
                    <li>Identity verification service providers</li>
                    <li>Law enforcement and regulatory authorities (when required)</li>
                    <li>Service providers who assist us in operating our website</li>
                    <li>Credit reference agencies (with your consent)</li>
                    <li>Accountants, auditors, and legal advisors</li>
                  </ul>
                  <p className="mt-4">
                    <strong>We do not sell your personal information to third parties for marketing purposes.</strong>{" "}
                    Any third-party processors are contractually obligated to maintain confidentiality and use your
                    information only for specified purposes.
                  </p>
                </section>

                <section id="section-7">
                  <h2 className="text-3xl font-semibold mb-4">7. Cookies and Tracking Technologies</h2>
                  <p>We use cookies and similar technologies to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Remember your login information and preferences</li>
                    <li>Understand how you use our website</li>
                    <li>Personalize your experience</li>
                    <li>Improve our services</li>
                    <li>Analyze traffic and user behavior</li>
                    <li>Detect and prevent fraud</li>
                  </ul>
                  <p className="mt-4">
                    You can control cookie preferences through your browser settings. Disabling cookies may limit your
                    ability to use certain features of our website.
                  </p>
                </section>

                <section id="section-8">
                  <h2 className="text-3xl font-semibold mb-4">8. Data Retention</h2>
                  <p>We retain your information for:</p>
                  <div className="my-4 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border border-border p-3 text-left">Data Type</th>
                          <th className="border border-border p-3 text-left">Retention Period</th>
                          <th className="border border-border p-3 text-left">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-border p-3">Account Data</td>
                          <td className="border border-border p-3">Duration + 1 year</td>
                          <td className="border border-border p-3">Service provision & closure</td>
                        </tr>
                        <tr className="bg-muted/50">
                          <td className="border border-border p-3">Financial Records</td>
                          <td className="border border-border p-3">7 years</td>
                          <td className="border border-border p-3">Regulatory requirements</td>
                        </tr>
                        <tr>
                          <td className="border border-border p-3">KYC Documents</td>
                          <td className="border border-border p-3">Duration + 5 years</td>
                          <td className="border border-border p-3">AML/KYC compliance</td>
                        </tr>
                        <tr className="bg-muted/50">
                          <td className="border border-border p-3">Transactions</td>
                          <td className="border border-border p-3">Indefinite</td>
                          <td className="border border-border p-3">Audit trail & compliance</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section id="section-9">
                  <h2 className="text-3xl font-semibold mb-4">9. Your Privacy Rights</h2>
                  <p>You have the right to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>
                      <strong>Access:</strong> Request a copy of your personal information
                    </li>
                    <li>
                      <strong>Correction:</strong> Correct inaccurate or incomplete information
                    </li>
                    <li>
                      <strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)
                    </li>
                    <li>
                      <strong>Opt-out:</strong> Unsubscribe from marketing communications
                    </li>
                    <li>
                      <strong>Portability:</strong> Receive your data in a standard format
                    </li>
                    <li>
                      <strong>Restriction:</strong> Restrict processing of your data
                    </li>
                    <li>
                      <strong>Complaint:</strong> Lodge a complaint with regulatory authorities
                    </li>
                  </ul>
                  <p className="mt-4 text-sm text-muted-foreground">
                    To exercise these rights, contact us using the information in the Contact Us section. We will
                    respond within 30 days.
                  </p>
                </section>

                <section id="section-10">
                  <h2 className="text-3xl font-semibold mb-4">10. GDPR and Regional Privacy Laws</h2>
                  <p>
                    If you are located in the European Union or other jurisdictions with data protection regulations,
                    additional rights and protections apply under those laws. We comply with:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>
                      <strong>GDPR (General Data Protection Regulation):</strong> EU data protection law
                    </li>
                    <li>
                      <strong>CCPA (California Consumer Privacy Act):</strong> California consumer privacy rights
                    </li>
                    <li>
                      <strong>LGPD (Lei Geral de Proteção de Dados):</strong> Brazilian data protection law
                    </li>
                    <li>
                      <strong>Local data protection regulations:</strong> In your jurisdiction
                    </li>
                  </ul>
                </section>

                <section id="section-11">
                  <h2 className="text-3xl font-semibold mb-4">11. Children's Privacy</h2>
                  <p>
                    Our website is not intended for children under the age of 18. We do not knowingly collect personal
                    information from children. If we become aware that we have collected information from a child, we
                    will promptly delete such information and terminate the child's account. If you believe we have
                    collected information from a child, please contact us immediately.
                  </p>
                </section>

                <section id="section-12">
                  <h2 className="text-3xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of significant changes by
                    posting the new Privacy Policy on our website and updating the "Last Updated" date. Your continued
                    use of our website following the posting of revised Privacy Policy means that you accept and agree
                    to the changes. For material changes, we will provide notice via email.
                  </p>
                </section>

                <section id="section-13">
                  <h2 className="text-3xl font-semibold mb-4">13. Contact Us</h2>
                  <p>If you have questions about this Privacy Policy or our privacy practices, please contact us at:</p>
                  <div className="mt-4 p-6 bg-muted rounded-lg border border-border space-y-2">
                    <p>
                      <span className="font-semibold">Email:</span> privacy@bank.aghq.co.ke
                    </p>
                    <p>
                      <span className="font-semibold">Address:</span> Alghahim Financial Services, Nairobi, Kenya
                    </p>
                    <p>
                      <span className="font-semibold">Phone:</span> +254 (20) 123-4567
                    </p>
                    <p>
                      <span className="font-semibold">Data Protection Officer:</span> dpo@bank.aghq.co.ke
                    </p>
                    <p>
                      <span className="font-semibold">Response Time:</span> Within 30 days
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
