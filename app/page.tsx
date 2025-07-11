/**
 * Public landing page – `/`
 * Pure Server Component (no `"use client"` needed).
 */
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, CreditCard, Smartphone, Globe } from "lucide-react"
import { HomepageHeader } from "@/components/homepage/header"
import { HomepageFooter } from "@/components/homepage/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-[#0A3D62]" />
            <span className="text-2xl font-bold text-[#0A3D62]">I&E National Bank</span>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-[#0A3D62] hover:bg-[#0F5585]">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen flex-col">
        <HomepageHeader />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Banking Made <span className="text-[#0A3D62]">Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Experience modern banking with I&E National Bank. Secure, fast, and designed for your financial success.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild className="bg-[#0A3D62] hover:bg-[#0F5585]">
                <Link href="/signup">Open Account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </section>

          {/* Features */}
          <section className="container mx-auto px-4 py-20">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose I&E National Bank?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Shield className="h-12 w-12 text-[#0A3D62] mb-4" />
                  <CardTitle>Secure Banking</CardTitle>
                  <CardDescription>
                    Bank-grade security with advanced encryption to protect your financial data.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CreditCard className="h-12 w-12 text-[#0A3D62] mb-4" />
                  <CardTitle>Easy Transfers</CardTitle>
                  <CardDescription>
                    Send money instantly to anyone, anywhere with our fast transfer system.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Smartphone className="h-12 w-12 text-[#0A3D62] mb-4" />
                  <CardTitle>Mobile First</CardTitle>
                  <CardDescription>
                    Access your account anytime, anywhere with our mobile-optimized platform.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          {/* Keep all the existing sections from the original file */}
          {/* Features */}
          <section className="w-full bg-gray-50 py-16">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 md:grid-cols-3">
              {[
                {
                  title: "Instant transfers",
                  desc: "Move money in seconds using our real-time payment rails.",
                  icon: "arrows-up-down",
                },
                {
                  title: "Dark-mode ready",
                  desc: "Keep your eyes fresh with a beautiful light & dark UI.",
                  icon: "moon",
                },
                {
                  title: "Secure by design",
                  desc: "All data encrypted in transit and at rest, 2-factor ready.",
                  icon: "shield-check",
                },
              ].map(({ title, desc, icon }) => (
                <div key={title} className="flex flex-col items-center text-center md:items-start md:text-left">
                  <div className="mb-4 rounded-md bg-green-100 p-3 text-green-700">
                    <i data-lucide={icon} className="h-6 w-6"></i>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{title}</h3>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              ))}
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
                  <Smartphone className="h-8 w-8 sm:h-10 sm:w-10 text-[#8CC63F] mb-4" />
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Mobile First</h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Access your account anytime, anywhere with our mobile-optimized platform.
                  </p>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                  <Globe className="h-8 w-8 sm:h-10 sm:w-10 text-[#8CC63F] mb-4" />
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Global Access</h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Bank from anywhere in the world with our secure online platform and mobile app.
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
                    Our smart savings feature helps you set and achieve your financial goals with automated saving
                    plans.
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
                  <h3 className="text-lg sm:text-xl font-bold mb-4">Have Questions?</h3>
                  <p className="mb-6 text-sm sm:text-base">
                    Our support team is available to help you with any questions or issues you may have.
                  </p>
                  <Button className="w-full bg-[#8CC63F] hover:bg-[#7AB62F] text-white" asChild>
                    <Link href="/signup">Get Support</Link>
                  </Button>
                </div>
                <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-100">
                  <h3 className="text-lg sm:text-xl font-bold mb-4">Join Our Community</h3>
                  <p className="mb-6 text-sm sm:text-base">
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
                      "I&E National Bank has transformed how I manage my finances. Their savings goals feature helped me save for my dream vacation.",
                    author: "Sarah Johnson",
                    title: "Small Business Owner",
                  },
                  {
                    quote:
                      "The security features at I&E National Bank give me peace of mind. I know my money and personal information are protected.",
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
                alt="I&E National Bank Building"
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A5483]/90 to-[#0F7AB3]/90"></div>
            </div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl mx-auto text-center text-white">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Experience Modern Banking?</h2>
                <p className="text-lg sm:text-xl mb-8">
                  Join thousands of satisfied customers who have transformed their financial journey with I&E National
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
    </div>
  )
}
