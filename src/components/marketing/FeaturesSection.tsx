import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, CalendarCheck, CreditCard, PhoneCall } from "lucide-react";

const tabs = [
  {
    id: "revenue",
    icon: TrendingUp,
    title: "Grow revenue",
    description: "Win more jobs with automated marketing and communication",
    color: "text-teal",
    details: [
      "Automated review requests after every job",
      "Email & SMS marketing campaigns",
      "Online booking for customers",
      "Referral tracking and management",
    ],
  },
  {
    id: "jobs",
    icon: CalendarCheck,
    title: "Manage jobs",
    description: "Price right, schedule efficiently, and impress your customers",
    color: "text-amber",
    details: [
      "Drag-and-drop scheduling calendar",
      "Real-time dispatching & GPS tracking",
      "Automated customer notifications",
      "Job costing and estimates",
    ],
  },
  {
    id: "paid",
    icon: CreditCard,
    title: "Get paid",
    description: "Take any payment, anywhere, plus control your cash flow",
    color: "text-primary",
    details: [
      "Accept cards, bank transfers, & financing",
      "Instant invoicing from the field",
      "Automated payment reminders",
      "QuickBooks & accounting sync",
    ],
  },
  {
    id: "phone-quotes",
    icon: PhoneCall,
    title: "Quote by phone",
    description: "Turn live service calls into priced quotes and checkout links",
    color: "text-destructive",
    details: [
      "Call-Time Quote Console",
      "Customer and service intake while talking",
      "Text or email quote links instantly",
      "Move approved quotes toward checkout",
    ],
  },
];

export function FeaturesSection() {
  const [active, setActive] = useState("revenue");
  const activeTab = tabs.find((t) => t.id === active)!;

  return (
    <section id="features" className="section-padding bg-cream relative">
      <div className="absolute inset-0 bg-grid-sm opacity-40 pointer-events-none" aria-hidden />
      <div className="container mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-display uppercase text-4xl md:text-5xl lg:text-6xl text-navy leading-[0.95] tracking-tight">
            Grow Your Business, <span className="text-amber">Not Your To-Do List.</span>
          </h2>
        </motion.div>

        {/* Tab cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`text-left rounded-xl p-6 border-2 transition-all ${
                active === tab.id
                  ? "border-primary bg-card shadow-lg"
                  : "border-transparent bg-card hover:border-border"
              }`}
            >
              <tab.icon className={`h-6 w-6 mb-3 ${tab.color}`} />
              <h3 className={`font-bold text-lg mb-1 ${tab.color}`}>{tab.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{tab.description}</p>
            </button>
          ))}
        </div>

        {/* Active tab detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto bg-card rounded-2xl border p-8 md:p-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <activeTab.icon className={`h-8 w-8 ${activeTab.color}`} />
              <h3 className="text-2xl font-bold">{activeTab.title}</h3>
            </div>
            <p className="text-muted-foreground mb-6 text-lg">{activeTab.description}</p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {activeTab.details.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm">
                  <span className="text-amber mt-0.5">✓</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
