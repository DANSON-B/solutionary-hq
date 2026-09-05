import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Basic",
    price: 49,
    description: "For solo operators getting started.",
    features: [
      "Scheduling & dispatching",
      "Online booking",
      "Invoicing & estimates",
      "Customer management",
      "Mobile app access",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Essentials",
    price: 129,
    description: "For growing teams that need more.",
    features: [
      "Everything in Basic",
      "QuickBooks integration",
      "Employee GPS tracking",
      "Automated marketing",
      "Review management",
      "Recurring jobs",
      "Custom forms",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "MAX",
    price: 279,
    description: "For large businesses at scale.",
    features: [
      "Everything in Essentials",
      "Advanced reporting",
      "Open API access",
      "Priority support",
      "Multi-location",
      "Custom integrations",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="section-padding bg-cream">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display uppercase text-4xl md:text-5xl lg:text-6xl text-navy leading-[0.95] tracking-tight">
            Top-Rated <span className="text-amber">Software</span> For The Trades
          </h2>
          <p className="mt-4 text-navy/60 text-lg">
            Start free. No credit card required. Upgrade as you grow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.popular
                  ? "border-amber shadow-xl ring-2 ring-amber/20"
                  : "bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber px-4 py-1 text-xs font-bold text-foreground">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-extrabold">${plan.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-amber mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/book">
                <Button
                  className={`w-full font-black uppercase tracking-wide rounded-full h-12 ${
                    plan.popular
                      ? "bg-amber hover:bg-amber/90 text-navy"
                      : "border-2 border-navy text-navy hover:bg-navy hover:text-white"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
