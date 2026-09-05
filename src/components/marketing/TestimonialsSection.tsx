import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Mario P.",
    company: "Mario's AC & Heating",
    industry: "HVAC",
    image: "/images/testimonial-mario.jpg",
    quote: "I used to lose two hours a day chasing paperwork. Now every quote, invoice, and dispatch runs itself.",
    stats: { team: 8, metric: "4.1X", metricLabel: "faster quoting" },
  },
  {
    name: "Kimberly E.",
    company: "Fastlane Coatings",
    industry: "Garage",
    image: "/images/testimonial-kimberly.jpg",
    quote: "In the first 3 years, we were around 50% growth every year — Solutionary HQ scaled right with us.",
    stats: { team: 12, metric: "2.9X", metricLabel: "more jobs completed" },
  },
  {
    name: "Travis M.",
    company: "Heaven's Best",
    industry: "Carpet Cleaning",
    image: "/images/testimonial-travis.jpg",
    quote: "Online booking plus automated reminders cut our no-shows to almost zero. It changed my whole week.",
    stats: { team: 6, metric: "92%", metricLabel: "booking show-rate" },
  },
  {
    name: "Melissa A.",
    company: "Arvizu Commercial Cleaning",
    industry: "Cleaning",
    image: "/images/testimonial-melissa.jpg",
    quote: "My business grew from 3 employees to over 20 in just a few years. Nothing else came close.",
    stats: { team: 15, metric: "3.3X", metricLabel: "revenue growth" },
  },
];

export function TestimonialsSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Hear from Solutionary Pros
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border bg-card overflow-hidden"
            >
              {/* Photo */}
              <div className="h-44 overflow-hidden">
                <img
                  src={t.image}
                  alt={t.company}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5">
                <h4 className="font-bold text-sm">{t.name}</h4>
                <p className="text-xs text-muted-foreground">{t.company}</p>
                <span className="inline-block mt-2 text-xs font-medium bg-secondary px-2 py-0.5 rounded-full">
                  {t.industry}
                </span>

                {t.quote && (
                  <p className="mt-4 text-sm text-foreground leading-relaxed italic">
                    "{t.quote}"
                  </p>
                )}

                {t.stats && (
                  <div className="mt-4 flex gap-4">
                    <div>
                      <div className="text-lg font-bold text-amber">{t.stats.team}</div>
                      <div className="text-[10px] text-muted-foreground">team users</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-amber">{t.stats.metric}</div>
                      <div className="text-[10px] text-muted-foreground">{t.stats.metricLabel}</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
