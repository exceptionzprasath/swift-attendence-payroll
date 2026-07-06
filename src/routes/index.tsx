import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Fingerprint,
  MapPin,
  Calculator,
  FileText,
  Users,
  ShieldCheck,
  ArrowRight,
  Clock,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { SwiftLogo } from "@/components/swift-logo";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SWIFT — People. Performance. Progress." },
      { name: "description", content: "Enterprise HRMS with geo-fenced attendance, face check-in, and configurable payroll for any industry." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Fingerprint, title: "Face Check-In", desc: "AWS Rekognition-ready biometric attendance with liveness detection." },
  { icon: MapPin, title: "Geo-Fenced Login", desc: "Restrict punches to office locations you draw on the map." },
  { icon: Calculator, title: "Payroll Engine", desc: "Configurable Basic/HRA/PF/ESI/OT/Shift with instant CTC breakdown." },
  { icon: FileText, title: "Auto Documents", desc: "One-click appointment letters and salary slips as branded PDFs." },
  { icon: Users, title: "Roles & Portals", desc: "Company admin, HR, and employee portals with granular controls." },
  { icon: ShieldCheck, title: "Compliance", desc: "PF, ESI, PT, gratuity — all editable per company policy." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <SwiftLogo />
          <nav className="hidden gap-8 text-sm md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#payroll" className="text-muted-foreground hover:text-foreground transition-colors">Payroll</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-gradient-brand text-white shadow-glow hover:opacity-90">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-brand opacity-10" />
        <div className="absolute right-[-10%] top-[-20%] -z-10 h-[500px] w-[500px] rounded-full bg-gradient-brand opacity-20 blur-3xl" />
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              People. Performance. Progress.
            </div>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] md:text-7xl">
              HR software for the <span className="text-gradient-brand">modern workplace.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              SWIFT unifies attendance, geo-fenced check-in, biometric verification, and enterprise-grade payroll —
              configurable for any industry, ready for any company size.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/login">
                <Button size="lg" className="bg-gradient-brand text-white shadow-glow hover:opacity-90">
                  Launch Admin Portal <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">Employee Login</Button>
              </Link>
            </div>
            <div className="mt-14 grid max-w-2xl grid-cols-3 gap-6">
              {[
                { n: "26", l: "Working days configurable" },
                { n: "12%", l: "Employee PF (editable)" },
                { n: "₹21K", l: "ESI threshold" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-3xl font-semibold text-gradient-brand">{s.n}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-14 max-w-2xl">
          <div className="text-xs font-medium uppercase tracking-widest text-primary">Platform</div>
          <h2 className="mt-2 font-display text-4xl font-semibold">Everything HR, in one workspace.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-soft hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-glow">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Payroll showcase */}
      <section id="payroll" className="bg-gradient-brand/5 border-y border-border">
        <div className="mx-auto max-w-7xl px-6 py-20 grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-primary">Payroll Engine</div>
            <h2 className="mt-2 font-display text-4xl font-semibold">
              Every formula from your salary register — now configurable.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Basic, HRA, Special, Medical, Conveyance, Washing, Other, Bonus, Incentive, Overtime and Shift
              Allowance. PF, ESI, PT, Gratuity — all with your rates. Instantly generate salary slips and
              appointment letters.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Hourly = Monthly Basic ÷ (Working Days × Hours/Day)",
                "OT Pay = Hourly × OT Hours × Company Multiplier",
                "ESI applied when Gross ≤ ₹21,000",
                "Gratuity = (HRA + Special) × 15 ÷ 26",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 text-primary" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-border bg-card p-6 shadow-soft"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="font-display font-semibold">Payslip Preview</div>
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Basic", "₹25,000"],
                ["HRA", "₹7,500"],
                ["Special", "₹2,500"],
                ["Conveyance", "₹5,000"],
                ["Employee PF", "-₹1,200"],
                ["Employee ESI", "-₹300"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between rounded-xl bg-gradient-brand px-4 py-3 text-white">
              <span>Net Salary</span>
              <span className="font-display font-semibold">₹38,500</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="font-display text-4xl font-semibold">Ready to modernize your HR?</h2>
        <p className="mt-4 text-muted-foreground">
          Set up your company, add employees, run payroll, and download slips — in minutes.
        </p>
        <Link to="/login" className="mt-8 inline-block">
          <Button size="lg" className="bg-gradient-brand text-white shadow-glow hover:opacity-90">
            Open SWIFT Portal <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 text-sm text-muted-foreground">
          <SwiftLogo size={24} />
          <div>© {new Date().getFullYear()} SWIFT. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
