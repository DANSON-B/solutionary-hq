import { motion } from "framer-motion";
import { BookOpen, Headphones, Users, FileText, BarChart3, Map } from "lucide-react";

const resources = [
  { icon: BookOpen, label: "Free eBooks" },
  { icon: FileText, label: "Free Templates" },
  { icon: Users, label: "Pro Community" },
  { icon: Headphones, label: "Podcast" },
  { icon: BarChart3, label: "Webinars" },
  { icon: Map, label: "Product Roadmap" },
];

export function HowItWorksSection() {
  return (
    <section id="resources" className="section-padding bg-light-gray">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
            Resources to support your success
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Connect with 30K+ fellow Pros to share advice and insights. Get expert coaching, time-saving templates, and more.
          </p>
          <a href="#" className="text-primary text-sm font-semibold hover:underline mt-4 inline-block">
            Browse Pro Resources →
          </a>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto mt-10">
          {resources.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-3 rounded-xl bg-card border p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <r.icon className="h-7 w-7 text-primary" />
              <span className="text-xs font-semibold text-foreground text-center">{r.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
