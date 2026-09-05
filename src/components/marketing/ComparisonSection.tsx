import { motion } from "framer-motion";
import { Phone } from "lucide-react";

export function ComparisonSection() {
  return (
    <section className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-4">
          <Phone className="h-8 w-8 text-amber" />
          <div>
            <p className="text-sm font-medium text-primary-foreground/70">Get in touch</p>
            <p className="font-bold text-lg">Want to learn more? Call now.</p>
          </div>
        </div>
        <a href="tel:33217-4964" className="text-2xl font-extrabold text-amber hover:underline">
          33217-4964
        </a>
      </div>
    </section>
  );
}
