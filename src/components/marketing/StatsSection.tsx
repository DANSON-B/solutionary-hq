import { motion } from "framer-motion";

const stats = [
  { value: "100M+", label: "pro jobs completed" },
  { value: "35%", label: "avg. pro revenue growth" },
  { value: "8+", label: "avg. hours saved per week" },
];

export function StatsSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display uppercase text-4xl md:text-5xl lg:text-6xl text-navy mb-4 leading-[0.95] tracking-tight"
        >
          Trusted By <span className="text-amber">200K+ Pros.</span>{" "}
          <span className="text-navy/50">Built For Teams Of 1 To 100+.</span>
        </motion.h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 mt-12 mb-12">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display text-5xl md:text-6xl text-amber">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-2">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Featured testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto bg-secondary rounded-2xl p-8 text-left"
        >
          <blockquote className="text-xl font-semibold text-foreground leading-relaxed mb-4">
            "We grew from 13 to 42 employees and tripled the income of the company."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              SJ
            </div>
            <div>
              <p className="font-semibold text-sm">Sam J.</p>
              <p className="text-xs text-muted-foreground">Bayshore Plumbing</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
