import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const industries = [
  { name: "HVAC", image: "/images/industry-hvac.jpg" },
  { name: "Plumbing", image: "/images/industry-plumbing.jpg" },
  { name: "Electrical", image: "/images/industry-electrical.jpg" },
  { name: "Contractor", image: "/images/industry-contractor.jpg" },
  { name: "Handyman", image: "/images/industry-handyman.jpg" },
  { name: "Cleaning", image: "/images/industry-cleaning.jpg" },
];

export function IndustriesSection() {
  return (
    <section id="industries" className="section-padding bg-secondary">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Customized solutions for 50+ industries
          </h3>
          <a href="#" className="text-primary text-sm font-semibold hover:underline">
            View all industries →
          </a>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto mt-10">
          {industries.map((ind, i) => (
            <motion.a
              key={ind.name}
              href="#"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center rounded-xl bg-card border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group"
            >
              <div className="w-full h-28 overflow-hidden">
                <img
                  src={ind.image}
                  alt={ind.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">{ind.name}</span>
                <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
