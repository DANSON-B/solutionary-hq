import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function CtaSection() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }
    toast({ title: "You're in! 🎉", description: "Check your email to get started with your free trial." });
    setEmail("");
  };

  return (
    <section className="section-padding bg-primary">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex-1 text-center lg:text-left"
          >
            <h3 className="text-amber text-xs font-black uppercase tracking-[0.25em] mb-4">
              With You Every Step Of The Way
            </h3>
            <h2 className="font-display uppercase text-4xl md:text-5xl lg:text-6xl text-primary-foreground leading-[0.95] tracking-tight mb-8">
              Solutionary <span className="text-amber">Grows</span> With Your Business — At Every Size And Stage.
            </h2>

            <form onSubmit={handleTrial} className="flex flex-col sm:flex-row items-center gap-2 max-w-md mx-auto lg:mx-0">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 px-5 text-sm border-0 rounded-full w-full sm:flex-1 focus:outline-none focus:ring-2 focus:ring-amber/50"
              />
              <Button type="submit" className="h-12 px-7 rounded-full bg-amber hover:bg-amber/90 text-navy font-black text-sm uppercase tracking-wide w-full sm:w-auto whitespace-nowrap">
                Start Free Trial
              </Button>
            </form>
            <p className="mt-3 text-xs text-primary-foreground/50">No credit card required.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex-1 max-w-lg"
          >
            <img
              src="/images/dashboard-mockup.jpg"
              alt="Solutionary dashboard on desktop and mobile"
              className="rounded-2xl shadow-2xl w-full"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
