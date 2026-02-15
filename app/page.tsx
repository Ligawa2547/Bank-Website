/**
 * Public landing page – `/`
 * Pure Server Component (no `"use client"` needed).
 */
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Shield, CreditCard, PiggyBank, BarChart3, ArrowRight, CheckCircle, Globe, Lock, Clock } from "lucide-react"
import { HomepageHeader } from "@/components/homepage/header"
import { HomepageFooter } from "@/components/homepage/footer"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <HomepageHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 pb-24 pt-32 text-center md:pt-48">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/5 px-4 py-1.5 text-sm font-medium text-secondary">
            <span className="flex h-2 w-2 rounded-full bg-secondary"></span>
            Trusted by thousands of users
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl text-balance">
            Banking that works <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">for&nbsp;you</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            Open an account in minutes, send money instantly, and manage your finances with Alghahim Virtual Bank's secure and intuitive platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="rounded-full px-8 font-semibold shadow-lg hover:shadow-xl transition-all">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 font-semibold border-2 hover:bg-muted bg-transparent" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </section>

        {/* Keep all the existing sections from the original file */}
        {/* Features */}
        <section className="w-full py-24 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-16 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Why choose Alghahim Virtual Bank?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Experience banking reimagined with cutting-edge security, speed, and simplicity.</p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Feature 1: Instant Transfers */}
              <div className="group relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-8 hover:shadow-lg transition-all duration-300">
                <div className="mb-6 inline-flex rounded-xl bg-blue-500 text-white p-3">
                  <i data-lucide="send" className="h-6 w-6"></i>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Instant Transfers</h3>
                <p className="text-gray-700 leading-relaxed font-medium">Move money securely in seconds using our real-time payment rails. No delays, no complications.</p>
              </div>

              {/* Feature 2: Bank-Grade Security */}
              <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 hover:shadow-lg transition-all duration-300">
                <div className="mb-6 inline-flex rounded-xl bg-emerald-500 text-white p-3">
                  <i data-lucide="shield-check" className="h-6 w-6"></i>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Bank-Grade Security</h3>
                <p className="text-gray-700 leading-relaxed font-medium">Military-grade encryption protects your data 24/7. Two-factor authentication keeps your account secure.</p>
              </div>

              {/* Feature 3: 24/7 Support */}
              <div className="group relative overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-8 hover:shadow-lg transition-all duration-300">
                <div className="mb-6 inline-flex rounded-xl bg-purple-500 text-white p-3">
                  <i data-lucide="headset" className="h-6 w-6"></i>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">24/7 Support</h3>
                <p className="text-gray-700 leading-relaxed font-medium">Our dedicated support team is always available to help you with any questions or concerns.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Illustration */}
        <section className="relative w-full">
          <Image
            src="/images/mobile-banking.jpeg"
            alt="Mobile banking illustration"
            className="h-[400px] w-full object-cover"
            width={1920}
            height={400}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-gray-900/0" />
        </section>

        {/* Additional sections from the original code */}
        <section className="bg-gradient-to-r from-[#0A5483] to-[#0F7AB3] text-white py-12 sm:py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 md:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4 text-center md:text-left">
                <div className="inline-block bg-[#8CC63F]/20 text-[#8CC63F] px-4 py-1 rounded-full text-sm font-medium mb-2 self-center md:self-start">
                  Banking Anywhere, Anytime
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Financial Freedom at Your Fingertips
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-blue-100">
                  Experience seamless banking with Alghahim Virtual Bank's innovative digital solutions designed for
                  your lifestyle.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" className="bg-[#8CC63F] text-white hover:bg-[#7AB62F]" asChild>
                    <Link href="/signup">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-blue-800 bg-transparent"
                    asChild
                  >
                    <Link href="#features">Learn More</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#8CC63F] flex-shrink-0" />
                    <span className="text-xs sm:text-sm">No Hidden Fees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#8CC63F] flex-shrink-0" />
                    <span className="text-xs sm:text-sm">24/7 Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#8CC63F] flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Secure Banking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#8CC63F] flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Mobile Banking</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center relative order-first md:order-last">
                <div className="absolute -top-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 bg-[#8CC63F]/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 sm:w-40 sm:h-40 bg-[#0A5483]/30 rounded-full blur-3xl"></div>
                <div className="relative bg-white/10 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-2xl border border-white/20 w-full max-w-sm">
                  <img src="/images/iae-logo.png" alt="Alghahim Virtual Bank" className="h-8 sm:h-12 w-auto mb-4" />
                  <div className="bg-gradient-to-r from-[#0A5483] to-[#0F7AB3] h-32 sm:h-40 rounded-lg mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-4 right-4 w-8 sm:w-12 h-6 sm:h-8 border border-white/40 rounded"></div>
                      <div className="absolute bottom-4 left-4 w-8 sm:w-10 h-8 sm:h-10 rounded-full border border-white/40"></div>
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="text-xs opacity-70">Card Number</div>
                      <div className="font-mono text-sm sm:text-base">**** **** **** 4589</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-white/70">Balance</div>
                        <div className="text-lg sm:text-xl font-bold">$12,456.78</div>
                      </div>
                      <Button size="sm" className="bg-[#8CC63F] hover:bg-[#7AB62F] text-xs sm:text-sm">
                        Transfer
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-white/70">Recent Transaction</span>
                        <span>-$24.99</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">Coffee Shop</span>
                        <span className="text-xs">Today, 9:45 AM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0A5483] mb-4">Why Choose Alghahim Virtual Bank?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
              We combine cutting-edge technology with personalized service to provide you with the best banking
              experience.
            </p>
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 sm:gap-8 md:grid-cols-3">
            <div className="bg-gradient-to-br from-white to-blue-50 p-6 sm:p-8 rounded-xl shadow-md border border-blue-100 text-center">
              <div className="bg-[#8CC63F]/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-[#8CC63F]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#0A5483]">Global Access</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Bank from anywhere in the world with our secure online platform and mobile app.
              </p>
            </div>
            <div className="bg-gradient-to-br from-white to-blue-50 p-6 sm:p-8 rounded-xl shadow-md border border-blue-100 text-center">
              <div className="bg-[#8CC63F]/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-[#8CC63F]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#0A5483]">Enhanced Security</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Your money and data are protected with state-of-the-art encryption and security protocols.
              </p>
            </div>
            <div className="bg-gradient-to-br from-white to-blue-50 p-6 sm:p-8 rounded-xl shadow-md border border-blue-100 text-center">
              <div className="bg-[#8CC63F]/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-[#8CC63F]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#0A5483]">24/7 Support</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Our dedicated customer service team is available around the clock to assist you.
              </p>
            </div>
          </div>
        </section>

        <section id="features" className="py-12 sm:py-16 bg-blue-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#0A5483] mb-8 sm:mb-12">
              Our Banking Features
            </h2>
            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <CreditCard className="h-8 w-8 sm:h-10 sm:w-10 text-[#8CC63F] mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-2">Easy Transfers</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Send and receive money instantly with zero fees on internal transfers.
                </p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <PiggyBank className="h-8 w-8 sm:h-10 sm:w-10 text-[#8CC63F] mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-2">Smart Savings</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Create savings goals and watch your money grow with our high-yield accounts.
                </p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-[#8CC63F] mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-2">Transaction History</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Track your spending with detailed transaction insights and reports.
                </p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-[#8CC63F] mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-2">Bank-Grade Security</h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  Your money is protected with advanced encryption and security measures.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="savings" className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0A5483] mb-4">Save Smart, Achieve Goals</h2>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                  Our smart savings feature helps you set and achieve your financial goals with automated saving plans.
                </p>
                <ul className="space-y-3">
                  {[
                    "Create customized savings goals",
                    "Track progress with visual indicators",
                    "Lock your savings for better discipline",
                    "Earn competitive interest rates",
                    "Withdraw when you reach your goal",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="mr-2 mt-1 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 rounded-full bg-[#8CC63F] text-white flex items-center justify-center text-xs">
                        ✓
                      </div>
                      <span className="text-sm sm:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 bg-[#0A5483] hover:bg-[#0F7AB3]" asChild>
                  <Link href="/signup">Start Saving Today</Link>
                </Button>
              </div>
              <div className="flex justify-center order-1 md:order-2">
                <img
                  src="/images/card-payment.jpeg"
                  alt="Smart payment solutions"
                  className="rounded-lg shadow-lg object-cover h-64 w-full sm:h-80 md:h-[400px] md:w-[500px]"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="py-12 sm:py-16 bg-[#0A5483] text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Bank-Grade Security for Your Peace of Mind</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-sm sm:text-base">
              We take your security seriously with multiple layers of protection for your account and personal
              information.
            </p>
            <div className="grid gap-6 sm:gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              <div className="bg-white/10 p-4 sm:p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-lg sm:text-xl font-bold mb-3">Advanced Encryption</h3>
                <p className="text-blue-100 text-sm sm:text-base">
                  Your data is protected with the same encryption technology used by major banks.
                </p>
              </div>
              <div className="bg-white/10 p-4 sm:p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-lg sm:text-xl font-bold mb-3">KYC Verification</h3>
                <p className="text-blue-100 text-sm sm:text-base">
                  We verify all users to ensure the highest standards of account security.
                </p>
              </div>
              <div className="bg-white/10 p-4 sm:p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-lg sm:text-xl font-bold mb-3">Transaction PIN</h3>
                <p className="text-blue-100 text-sm sm:text-base">
                  Every transfer requires your secure PIN for an additional layer of protection.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="support" className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#0A5483] mb-8 sm:mb-12">
              Dedicated Customer Support
            </h2>
            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-100">
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-[#0A5483]">Have Questions?</h3>
                <p className="mb-6 text-sm sm:text-base text-gray-600">
                  Our support team is available to help you with any questions or issues you may have.
                </p>
                <Button className="w-full bg-[#8CC63F] hover:bg-[#7AB62F] text-white" asChild>
                  <Link href="/signup">Get Support</Link>
                </Button>
              </div>
              <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-100">
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-[#0A5483]">Join Our Community</h3>
                <p className="mb-6 text-sm sm:text-base text-gray-600">
                  Join thousands of satisfied customers who trust us with their banking needs.
                </p>
                <Button className="w-full bg-[#8CC63F] hover:bg-[#7AB62F] text-white" asChild>
                  <Link href="/signup">Open an Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 bg-blue-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#0A5483] mb-8 sm:mb-12">
              What Our Customers Say
            </h2>
            <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
              {[
                {
                  quote:
                    "Alghahim Virtual Bank has transformed how I manage my finances. Their savings goals feature helped me save for my dream vacation.",
                  author: "Sarah Johnson",
                  title: "Small Business Owner",
                },
                {
                  quote:
                    "The security features at Alghahim Virtual Bank give me peace of mind. I know my money and personal information are protected.",
                  author: "Michael Chen",
                  title: "Software Engineer",
                },
                {
                  quote:
                    "I love how easy it is to transfer money to friends and family. The app interface is intuitive and user-friendly.",
                  author: "Emily Rodriguez",
                  title: "Marketing Professional",
                },
              ].map((testimonial, index) => (
                <div key={index} className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-100">
                  <div className="mb-4 text-[#8CC63F]">{"★".repeat(5)}</div>
                  <p className="italic mb-4 text-gray-600 text-sm sm:text-base">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-bold text-sm sm:text-base">{testimonial.author}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{testimonial.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-16 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="/images/bank-building.jpeg"
              alt="Alghahim Virtual Bank Building"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A5483]/90 to-[#0F7AB3]/90"></div>
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Experience Modern Banking?</h2>
              <p className="text-lg sm:text-xl mb-8">
                Join thousands of satisfied customers who have transformed their financial journey with Alghahim Virtual
                Bank.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-[#8CC63F] hover:bg-[#7AB62F] text-white" asChild>
                  <Link href="/signup">Open an Account</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 bg-transparent"
                  asChild
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <HomepageFooter />
    </div>
  )
}
