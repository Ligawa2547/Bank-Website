export const metadata = {
  title: "Accessibility Statement | Banking Platform",
  description: "Our commitment to digital accessibility and compliance with WCAG 2.1 Level AA standards",
}

export default function AccessibilityPage() {
  const sections = [
    "Our Commitment",
    "Accessibility Standards",
    "Features for Users with Disabilities",
    "Assistive Technology Compatibility",
    "Known Issues",
    "Tools and Resources",
    "User Customization",
    "Training and Support",
    "Third-Party Content",
    "Report Issues",
  ]

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4 text-foreground">Accessibility Statement</h1>
            <p className="text-lg text-muted-foreground">Last Updated: January 2026 | WCAG 2.1 Level AA Compliant</p>
            <div className="mt-6 p-6 bg-muted rounded-lg border border-border">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Our Accessibility Commitment</h2>
              <p className="text-sm text-muted-foreground">
                We are committed to ensuring that our banking website is accessible to everyone, including people with
                disabilities. Digital accessibility is a fundamental right and a key part of providing excellent
                customer service. We continuously work to improve accessibility and welcome your feedback.
              </p>
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
                      {section}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="prose prose-lg max-w-none text-foreground space-y-8">
                <section id="section-1">
                  <h2 className="text-3xl font-semibold mb-4">Our Commitment to Accessibility</h2>
                  <p>
                    We are committed to ensuring that our banking website is accessible to everyone, including people
                    with disabilities. We believe that digital accessibility is a fundamental right and a key part of
                    providing excellent customer service.
                  </p>
                  <p className="mt-4">
                    Accessibility is not just about compliance—it's about creating an inclusive experience that works
                    for everyone. We continuously evaluate and improve our accessibility features based on user feedback
                    and emerging best practices.
                  </p>
                </section>

                <section id="section-2">
                  <h2 className="text-3xl font-semibold mb-4">Accessibility Standards</h2>
                  <p>
                    Our website has been designed and tested to meet the World Wide Web Consortium (W3C) Web Content
                    Accessibility Guidelines (WCAG) 2.1 at Level AA. This ensures that our website is:
                  </p>
                  <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-border rounded-lg">
                      <h3 className="font-semibold mb-2">Perceivable</h3>
                      <p className="text-sm text-muted-foreground">
                        Information presented in multiple ways so all users can perceive it
                      </p>
                    </div>
                    <div className="p-4 border border-border rounded-lg">
                      <h3 className="font-semibold mb-2">Operable</h3>
                      <p className="text-sm text-muted-foreground">
                        Functions available via keyboard and other input methods
                      </p>
                    </div>
                    <div className="p-4 border border-border rounded-lg">
                      <h3 className="font-semibold mb-2">Understandable</h3>
                      <p className="text-sm text-muted-foreground">
                        Clear and straightforward content that's easy to comprehend
                      </p>
                    </div>
                    <div className="p-4 border border-border rounded-lg">
                      <h3 className="font-semibold mb-2">Robust</h3>
                      <p className="text-sm text-muted-foreground">
                        Compatible with assistive technologies and future browsers
                      </p>
                    </div>
                  </div>
                </section>

                <section id="section-3">
                  <h2 className="text-3xl font-semibold mb-4">Features for Users with Disabilities</h2>
                  <p>Our website includes the following accessibility features:</p>

                  <h3 className="text-2xl font-semibold mt-6 mb-3">Visual Accessibility</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>High contrast text options (up to 7:1 ratio)</li>
                    <li>Scalable fonts (up to 200% zoom supported)</li>
                    <li>Descriptive alt text for all images and icons</li>
                    <li>Readable color combinations (no color blindness issues)</li>
                    <li>No reliance on color alone to convey information</li>
                    <li>Clear focus indicators for keyboard navigation</li>
                    <li>Adjustable text spacing and line height</li>
                  </ul>

                  <h3 className="text-2xl font-semibold mt-6 mb-3">Navigation and Input</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Full keyboard navigation support (Tab, Enter, Escape keys)</li>
                    <li>Visible focus indicators on all interactive elements</li>
                    <li>"Skip to main content" links on every page</li>
                    <li>Logical and intuitive tab order</li>
                    <li>Clear form labels and error messages</li>
                    <li>Form validation with helpful error guidance</li>
                    <li>No time limits on forms (or adjustable limits)</li>
                  </ul>

                  <h3 className="text-2xl font-semibold mt-6 mb-3">Screen Reader Support</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Semantic HTML5 structure for proper content hierarchy</li>
                    <li>ARIA labels and descriptions for complex components</li>
                    <li>Page landmarks (header, nav, main, footer) for navigation</li>
                    <li>Proper heading hierarchy (h1, h2, h3, etc.)</li>
                    <li>List markers and table headers for data organization</li>
                    <li>Form field associations and descriptions</li>
                  </ul>

                  <h3 className="text-2xl font-semibold mt-6 mb-3">Audio and Video</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Captions (closed captions) for all video content</li>
                    <li>Transcripts for audio content and videos</li>
                    <li>Audio descriptions for important visual content</li>
                    <li>Controls for media playback (play, pause, volume)</li>
                  </ul>
                </section>

                <section id="section-4">
                  <h2 className="text-3xl font-semibold mb-4">Assistive Technology Compatibility</h2>
                  <p>Our website has been tested with popular assistive technologies including:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="p-4 border border-border rounded">
                      <p className="font-semibold">Windows</p>
                      <ul className="text-sm space-y-1 mt-2">
                        <li>• NVDA (NonVisual Desktop Access)</li>
                        <li>• JAWS (Job Access With Speech)</li>
                        <li>• Windows Narrator</li>
                        <li>• ZoomText Magnifier/Reader</li>
                      </ul>
                    </div>
                    <div className="p-4 border border-border rounded">
                      <p className="font-semibold">Mac/iOS</p>
                      <ul className="text-sm space-y-1 mt-2">
                        <li>• VoiceOver (macOS and iOS)</li>
                        <li>• Safari Accessibility Features</li>
                        <li>• Zoom and Magnification Tools</li>
                      </ul>
                    </div>
                    <div className="p-4 border border-border rounded">
                      <p className="font-semibold">Mobile</p>
                      <ul className="text-sm space-y-1 mt-2">
                        <li>• TalkBack (Android)</li>
                        <li>• Voice Control (iOS)</li>
                        <li>• Mobile Magnifier</li>
                      </ul>
                    </div>
                    <div className="p-4 border border-border rounded">
                      <p className="font-semibold">Browser Extensions</p>
                      <ul className="text-sm space-y-1 mt-2">
                        <li>• LastPass</li>
                        <li>• Password managers</li>
                        <li>• Font/color editors</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section id="section-5">
                  <h2 className="text-3xl font-semibold mb-4">Known Accessibility Issues</h2>
                  <p>
                    We continually work to improve accessibility. If you encounter any barriers or issues, please report
                    them using the contact information at the bottom of this page. Currently, we are aware of the
                    following limitations:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Some PDF documents may not be fully accessible (we're converting to HTML)</li>
                    <li>Certain embedded third-party payment widgets may have limited accessibility</li>
                    <li>Some charts and graphs may require textual alternatives in future updates</li>
                  </ul>
                  <p className="mt-4 text-sm text-muted-foreground">
                    We are actively working to address these issues and appreciate your patience and feedback. If you
                    experience any of these limitations, please contact us for assistance.
                  </p>
                </section>

                <section id="section-6">
                  <h2 className="text-3xl font-semibold mb-4">Accessibility Tools and Resources</h2>
                  <p>We recommend the following tools and resources for improving your web browsing experience:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>
                      <strong>Browser zoom:</strong> Ctrl/Cmd + Plus or Minus to adjust page size
                    </li>
                    <li>
                      <strong>Operating system settings:</strong> Accessibility features in Windows, macOS, iOS, Android
                    </li>
                    <li>
                      <strong>Browser extensions:</strong> Tools like High Contrast, Dark Reader, Font Resizer
                    </li>
                    <li>
                      <strong>Screen readers:</strong> NVDA (free), JAWS, VoiceOver (built-in)
                    </li>
                    <li>
                      <strong>Magnification software:</strong> ZoomText, Windows Magnifier, built-in OS tools
                    </li>
                  </ul>
                </section>

                <section id="section-7">
                  <h2 className="text-3xl font-semibold mb-4">User Preferences and Customization</h2>
                  <p>To customize your experience on our website, you can:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Adjust text size and font preferences using browser zoom</li>
                    <li>Enable high contrast mode for better visibility</li>
                    <li>Modify color schemes using browser extensions or OS settings</li>
                    <li>Control animation and motion preferences (respects prefers-reduced-motion)</li>
                    <li>Enable dark mode for reduced eye strain</li>
                    <li>Use browser developer tools to modify styling as needed</li>
                  </ul>
                </section>

                <section id="section-8">
                  <h2 className="text-3xl font-semibold mb-4">Accessibility Training</h2>
                  <p>Our team members receive regular training on:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4 my-4">
                    <li>Web accessibility best practices and WCAG 2.1 guidelines</li>
                    <li>Assistive technology use and screen reader navigation</li>
                    <li>Inclusive customer service and communication</li>
                    <li>Accessible design and development practices</li>
                  </ul>
                </section>

                <section id="section-9">
                  <h2 className="text-3xl font-semibold mb-4">Third-Party Content</h2>
                  <p>
                    While we strive to make all content accessible, some embedded third-party content (such as payment
                    widgets or external services) may have limited accessibility. If you experience issues with
                    third-party content, please contact us, and we will work with the provider to improve accessibility
                    or provide an alternative.
                  </p>
                </section>

                <section id="section-10">
                  <h2 className="text-3xl font-semibold mb-4">Report Accessibility Issues</h2>
                  <p>
                    If you experience accessibility barriers or have suggestions for improvement, we want to hear from
                    you. Please contact us using any of the methods below:
                  </p>
                  <div className="mt-4 p-6 bg-muted rounded-lg border border-border space-y-3">
                    <div>
                      <p className="font-semibold">Email (preferred)</p>
                      <p className="text-sm text-muted-foreground">accessibility@bank.com</p>
                    </div>
                    <div>
                      <p className="font-semibold">Phone</p>
                      <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                    </div>
                    <div>
                      <p className="font-semibold">TTY/TDD (Text Telephone)</p>
                      <p className="text-sm text-muted-foreground">+1 (555) 123-4568</p>
                    </div>
                    <div>
                      <p className="font-semibold">Mailing Address</p>
                      <p className="text-sm text-muted-foreground">123 Banking Street, Finance City, FC 12345</p>
                    </div>
                    <div>
                      <p className="font-semibold">Hours</p>
                      <p className="text-sm text-muted-foreground">Monday - Friday, 9:00 AM - 6:00 PM EST</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    We typically respond to accessibility requests within 2 business days. If you need immediate
                    assistance, please call our accessibility hotline. Your feedback is valuable and helps us serve all
                    users better.
                  </p>
                </section>

                <section className="mt-8 p-6 bg-muted rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Last Updated:</strong> January 2026
                    <br />
                    <strong>Compliance Level:</strong> WCAG 2.1 Level AA
                    <br />
                    <strong>Next Review:</strong> June 2026
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
