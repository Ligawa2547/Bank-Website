import Link from "next/link"
import {
  Shield,
  CreditCard,
  PiggyBank,
  BarChart3,
  ArrowRight,
  Menu,
  CheckCircle,
  Globe,
  Lock,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img src="/images/iae-logo.png" alt="I&E National Bank" className="h-10 w-auto" />
              <span className="font-bold text-2xl text-[#0A3D62]">I&E National Bank</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="#features" className="text-sm font-medium hover:text-[#0A3D62]">
                Features
              </Link>
              <Link href="#savings" className="text-sm font-medium hover:text-[#0A3D62]">
                Savings
              </Link>
              <Link href="#security" className="text-sm font-medium hover:text-[#0A3D62]">
                Security
              </Link>
              <Link href="#support" className="text-sm font-medium hover:text-[#0A3D62]">
                Support
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="hidden md:inline-flex" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button className="hidden md:inline-flex bg-[#8CC63F] hover:bg-[#7AB62F] text-white" asChild>
              <Link href="/signup">Open Account</Link>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="bg-gradient-to-r from-[#0A5483] to-[#0F7AB3] text-white py-16 md:py-24">
          <div className="container grid gap-8 md:grid-cols-2 md:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="inline-block bg-[#8CC63F]/20 text-[#8CC63F] px-4 py-1 rounded-full text-sm font-medium mb-2">
                Banking Anywhere, Anytime
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Financial Freedom at Your Fingertips
              </h1>
              <p className="text-lg text-blue-100 md:text-xl">
                Experience seamless banking with I&E National Bank's innovative digital solutions designed for your
                lifestyle.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="bg-[#8CC63F] text-white hover:bg-[#7AB62F]" asChild>
                  <Link href="/signup">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-800" asChild>
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#8CC63F]" />
                  <span className="text-sm">No Hidden Fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#8CC63F]" />
                  <span className="text-sm">24/7 Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#8CC63F]" />
                  <span className="text-sm">Secure Banking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#8CC63F]" />
                  <span className="text-sm">Mobile Banking</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#8CC63F]/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#0A5483]/30 rounded-full blur-3xl"></div>
              <div className="relative bg-white/10 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md">
                <img src="/images/iae-logo.png" alt="I&E National Bank" className="h-12 w-auto mb-4" />
                <div className="bg-gradient-to-r from-[#0A5483] to-[#0F7AB3] h-40 rounded-lg mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-4 right-4 w-12 h-8 border border-white/40 rounded"></div>
                    <div className="absolute bottom-4 left-4 w-10 h-10 rounded-full border border-white/40"></div>
                  </div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="text-xs opacity-70">Card Number</div>
                    <div className="font-mono">**** **** **** 4589</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-white/70">Balance</div>
                      <div className="text-xl font-bold">$12,456.78</div>
                    </div>
                    <Button size="sm" className="bg-[#8CC63F] hover:bg-[#7AB62F]">
                      Transfer
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Recent Transaction</span>
                      <span>-$24.99</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Coffee Shop</span>
                      <span className="text-xs">Today, 9:45 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0A5483] mb-4">Why Choose I&E National Bank?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We combine cutting-edge technology with personalized service to provide you with the best banking
              experience.
            </p>
          </div>
          <div className="container grid gap-8 md:grid-cols-3">
            <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-xl shadow-md border border-blue-100 text-center">
              <div className="bg-[#8CC63F]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-[#8CC63F]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#0A5483]">Global Access</h3>
              <p className="text-gray-600">
                Bank from anywhere in the world with our secure online platform and mobile app.
              </p>
            </div>
            <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-xl shadow-md border border-blue-100 text-center">
              <div className="bg-[#8CC63F]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-[#8CC63F]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#0A5483]">Enhanced Security</h3>
              <p className="text-gray-600">
                Your money and data are protected with state-of-the-art encryption and security protocols.
              </p>
            </div>
            <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-xl shadow-md border border-blue-100 text-center">
              <div className="bg-[#8CC63F]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-[#8CC63F]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#0A5483]">24/7 Support</h3>
              <p className="text-gray-600">
                Our dedicated customer service team is available around the clock to assist you.
              </p>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 bg-blue-50">
          <div className="container">
            <h2 className="text-3xl font-bold text-center text-[#0A5483] mb-12">Our Banking Features</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <CreditCard className="h-10 w-10 text-[#8CC63F] mb-4" />
                <h3 className="text-xl font-bold mb-2">Easy Transfers</h3>
                <p className="text-gray-600">Send and receive money instantly with zero fees on internal transfers.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <PiggyBank className="h-10 w-10 text-[#8CC63F] mb-4" />
                <h3 className="text-xl font-bold mb-2">Smart Savings</h3>
                <p className="text-gray-600">
                  Create savings goals and watch your money grow with our high-yield accounts.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <BarChart3 className="h-10 w-10 text-[#8CC63F] mb-4" />
                <h3 className="text-xl font-bold mb-2">Transaction History</h3>
                <p className="text-gray-600">Track your spending with detailed transaction insights and reports.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <Shield className="h-10 w-10 text-[#8CC63F] mb-4" />
                <h3 className="text-xl font-bold mb-2">Bank-Grade Security</h3>
                <p className="text-gray-600">Your money is protected with advanced encryption and security measures.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="savings" className="py-16">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-3xl font-bold text-[#0A5483] mb-4">Save Smart, Achieve Goals</h2>
                <p className="text-gray-600 mb-6">
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
                      <div className="mr-2 mt-1 h-5 w-5 flex-shrink-0 rounded-full bg-[#8CC63F] text-white flex items-center justify-center text-xs">
                        ✓
                      </div>
                      <span>{feature}</span>
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
                  className="rounded-lg shadow-lg object-cover h-[400px] w-[500px]"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="py-16 bg-[#0A5483] text-white">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-6">Bank-Grade Security for Your Peace of Mind</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              We take your security seriously with multiple layers of protection for your account and personal
              information.
            </p>
            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-3">Advanced Encryption</h3>
                <p className="text-blue-100">
                  Your data is protected with the same encryption technology used by major banks.
                </p>
              </div>
              <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-3">KYC Verification</h3>
                <p className="text-blue-100">
                  We verify all users to ensure the highest standards of account security.
                </p>
              </div>
              <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-3">Transaction PIN</h3>
                <p className="text-blue-100">
                  Every transfer requires your secure PIN for an additional layer of protection.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="support" className="py-16">
          <div className="container">
            <h2 className="text-3xl font-bold text-center text-[#0A5483] mb-12">Dedicated Customer Support</h2>
            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
                <h3 className="text-xl font-bold mb-4">Have Questions?</h3>
                <p className="mb-6">
                  Our support team is available to help you with any questions or issues you may have.
                </p>
                <Button className="w-full bg-[#8CC63F] hover:bg-[#7AB62F] text-white" asChild>
                  <Link href="/signup">Get Support</Link>
                </Button>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
                <h3 className="text-xl font-bold mb-4">Join Our Community</h3>
                <p className="mb-6">Join thousands of satisfied customers who trust us with their banking needs.</p>
                <Button className="w-full bg-[#8CC63F] hover:bg-[#7AB62F] text-white" asChild>
                  <Link href="/signup">Open an Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-blue-50">
          <div className="container">
            <h2 className="text-3xl font-bold text-center text-[#0A5483] mb-12">What Our Customers Say</h2>
            <div className="grid gap-8 md:grid-cols-3">
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
                <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                  <div className="mb-4 text-[#8CC63F]">{"★".repeat(5)}</div>
                  <p className="italic mb-4 text-gray-600">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-bold">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="/images/bank-building.jpeg"
              alt="I&E National Bank Building"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A5483]/90 to-[#0F7AB3]/90"></div>
          </div>
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-4xl font-bold mb-6">Ready to Experience Modern Banking?</h2>
              <p className="text-xl mb-8">
                Join thousands of satisfied customers who have transformed their financial journey with I&E National
                Bank.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-[#8CC63F] hover:bg-[#7AB62F] text-white" asChild>
                  <Link href="/signup">Open an Account</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-gray-900 text-white py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <img src="/images/iae-logo.png" alt="I&E National Bank" className="h-8 w-auto" />
                <span>I&E National Bank</span>
              </div>
              <p className="text-gray-400 text-sm">Banking Anywhere since 2024. FDIC Insured.</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Banking
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Transfers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Savings
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Press
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Cookies
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-400">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <p>© 2024 I&E National Bank. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
