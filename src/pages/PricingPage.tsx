import { Link } from "react-router-dom";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    description: "For solo operators just getting started.",
    features: [
      "1 User",
      "Estimates & Invoicing",
      "Online Booking Page",
      "Customer Management",
      "Mobile App Access",
      "Email Support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$99",
    period: "/mo",
    description: "For growing teams that need more power.",
    features: [
      "Up to 5 Users",
      "Everything in Starter",
      "Scheduling & Dispatch",
      "Route Optimization",
      "Online Payments",
      "Automated Reminders",
      "QuickBooks Integration",
      "Priority Support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Business",
    price: "$199",
    period: "/mo",
    description: "For established businesses ready to scale.",
    features: [
      "Unlimited Users",
      "Everything in Professional",
      "Customer Financing",
      "Advanced Reporting",
      "Custom Branding",
      "API Access",
      "Dedicated Account Manager",
      "Phone Support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
];

const faqs = [
  { q: "Is there a free trial?", a: "Yes! Every plan comes with a 14-day free trial. No credit card required to start." },
  { q: "Can I change plans later?", a: "Absolutely. You can upgrade or downgrade your plan at any time from your account settings." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, debit cards, and ACH bank transfers." },
  { q: "Is there a setup fee?", a: "No setup fees, no hidden costs. You only pay your monthly subscription." },
  { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees." },
  { q: "Do you offer a discount for annual billing?", a: "Yes! Save 20% when you choose annual billing on any plan." },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Pricing — Solutionary HQ"
        description="Simple, transparent pricing for service businesses. Start with a 14-day free trial — no credit card required."
        path="/pricing"
      />
      <Navbar />

      {/* Hero */}
      <section className="section-padding bg-primary text-primary-foreground text-center">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg text-primary-foreground/70 mb-8">
              Start free for 14 days. No credit card required. Pick the plan that fits your business.
            </p>
            <div className="inline-flex items-center gap-3 bg-primary-foreground/10 rounded-full p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!annual ? "bg-accent text-accent-foreground" : "text-primary-foreground/70"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${annual ? "bg-accent text-accent-foreground" : "text-primary-foreground/70"}`}
              >
                Annual (Save 20%)
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="section-padding -mt-8">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const price = annual ? `$${Math.round(parseInt(plan.price.replace("$", "")) * 0.8)}` : plan.price;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-2xl border p-6 bg-card relative ${plan.popular ? "border-accent shadow-xl ring-2 ring-accent" : ""}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold">{price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <Link to="/login">
                    <Button className={`w-full mb-6 font-bold ${plan.popular ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}>
                      {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-secondary">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg bg-card px-4">
                <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
}
