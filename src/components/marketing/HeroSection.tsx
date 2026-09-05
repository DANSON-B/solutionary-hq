import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Calendar, ArrowRight, Star } from "lucide-react";
import heroImg from "@/assets/hero-technician.jpg";

const trades = ["Cleaning", "HVAC", "Plumbing", "Electrical", "Landscaping", "Handyman", "Roofing", "Painting"];

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative bg-cream overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-70" aria-hidden />

      <div className="container mx-auto relative z-10 px-4 pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Copy column */}
          <div className="lg:col-span-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase text-navy"
            >
              <span className="flex text-amber">
                <Star className="w-3 h-3 fill-current" />
                <Star className="w-3 h-3 fill-current" />
                <Star className="w-3 h-3 fill-current" />
                <Star className="w-3 h-3 fill-current" />
                <Star className="w-3 h-3 fill-current" />
              </span>
              4.9 · 2k+ verified reviews
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl uppercase text-navy leading-[0.9] tracking-tight mt-6"
            >
              The <span className="text-amber">#1 Software</span> Built For Modern Service Pros.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-6 text-base md:text-lg text-navy/70 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Estimates, invoicing, scheduling, and payments — one simple platform for growth-minded pros.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start"
            >
              <Button
                onClick={() => navigate("/contact")}
                className="h-14 px-7 rounded-full bg-amber hover:bg-amber/90 text-navy font-black uppercase tracking-wide text-sm shadow-lg shadow-amber/20 flex items-center gap-3"
              >
                Book a Demo
                <span className="bg-navy text-amber rounded-full p-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                </span>
              </Button>
              <Button
                onClick={() => navigate("/login?signup=true")}
                variant="outline"
                className="h-14 px-7 rounded-full bg-white border-2 border-navy text-navy hover:bg-navy hover:text-white font-black uppercase tracking-wide text-sm flex items-center gap-2 transition-colors"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-col items-center lg:items-start gap-3"
            >
              <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.25em]">
                Trusted Across 100+ Trades
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {trades.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-bold uppercase tracking-wider text-navy/60 border border-navy/15 rounded-full px-3 py-1 bg-white/50"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Arched hero image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-6"
          >
            <div className="relative w-full max-w-md mx-auto lg:max-w-none">
              <div className="relative w-full aspect-[4/5] bg-navy rounded-t-[180px] rounded-b-2xl overflow-hidden shadow-2xl">
                <img
                  src={heroImg}
                  alt="Service professional at work"
                  width={1024}
                  height={1280}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />

                {/* Floating stat card */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur rounded-2xl p-4 flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-navy/50">This month</p>
                    <p className="font-display text-3xl text-navy">$248K</p>
                    <p className="text-[11px] font-semibold text-navy/60">invoiced by pros on Solutionary HQ</p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-amber flex items-center justify-center shrink-0">
                    <ArrowRight className="w-6 h-6 text-navy" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
