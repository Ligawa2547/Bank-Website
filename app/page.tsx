import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle, Clock, Lock, Send, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HomepageFooter } from "@/components/homepage/footer"
import { HomepageHeader } from "@/components/homepage/header"

const benefits = [
  { title: "Fast transfers", description: "Move money securely in seconds with clear, reliable payment tracking.", icon: Send },
  { title: "Built for security", description: "Account controls, protected sessions, and careful handling of your data.", icon: ShieldCheck },
  { title: "Support when needed", description: "Get help through the channels available in your account, day or night.", icon: Clock },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HomepageHeader />
      <main className="flex-1">
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-28">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              <span aria-hidden="true" className="size-2 rounded-full bg-secondary" />
              Digital banking, made clearer
            </p>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Banking that works for you.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Open an account, manage your money, and make everyday transfers with a secure banking experience designed around you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link href="/signup">Open an account <ArrowRight data-icon="inline-end" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-7">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {["Secure account access", "Transparent activity", "Mobile-friendly"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2"><CheckCircle className="size-4 text-secondary" aria-hidden="true" />{item}</span>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border bg-muted shadow-xl">
            <Image src="/images/mobile-banking.jpeg" alt="Customer using mobile banking" width={1200} height={900} priority className="aspect-[4/3] w-full object-cover" />
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/20 bg-background/90 p-4 shadow-lg backdrop-blur sm:inset-x-6 sm:bottom-6 sm:p-5">
              <div className="flex items-center gap-3"><div className="rounded-full bg-secondary/15 p-2"><Lock className="size-5 text-secondary" aria-hidden="true" /></div><div><p className="font-semibold">Your money, clearly managed</p><p className="text-sm text-muted-foreground">Review balances and activity in one place.</p></div></div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y bg-muted/30 py-20" aria-labelledby="benefits-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl"><h2 id="benefits-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need for everyday banking.</h2><p className="mt-4 text-lg text-muted-foreground">Simple tools, dependable access, and support that helps you stay in control.</p></div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">{benefits.map(({ title, description, icon: Icon }) => <article key={title} className="rounded-2xl border bg-background p-6"><div className="mb-5 inline-flex rounded-xl bg-primary/10 p-3 text-primary"><Icon className="size-6" aria-hidden="true" /></div><h3 className="text-xl font-semibold">{title}</h3><p className="mt-2 leading-7 text-muted-foreground">{description}</p></article>)}</div>
          </div>
        </section>
      </main>
      <HomepageFooter />
    </div>
  )
}
