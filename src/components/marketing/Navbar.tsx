import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const featureLinks = [
  { label: "Call Quote Console", href: "/features/call-quote-console" },
  { label: "Estimates & Quoting", href: "/features/estimates" },
  { label: "Invoicing & Payments", href: "/features/invoicing" },
  { label: "Scheduling & Dispatch", href: "/features/scheduling" },
  { label: "Customer Management", href: "/features/crm" },
  { label: "Payments & Financing", href: "/features/payments" },
];

const industryLinks = [
  { label: "Plumbing", href: "/industries/plumbing" },
  { label: "HVAC", href: "/industries/hvac" },
  { label: "Electrical", href: "/industries/electrical" },
  { label: "Cleaning", href: "/industries/cleaning" },
  { label: "Landscaping", href: "/industries/landscaping" },
  { label: "Handyman", href: "/industries/handyman" },
  { label: "General Contractor", href: "/industries/contractor" },
  { label: "Painting", href: "/industries/painting" },
  { label: "Roofing", href: "/industries/roofing" },
  { label: "Pest Control", href: "/industries/pest-control" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [dropdown, setDropdown] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
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
    <>
      <div className="nav-dark text-primary-foreground text-sm py-2 px-4 flex justify-end gap-4">
        <Link to="/contact" className="text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors">
          Contact
        </Link>
        <Link to="/login" className="flex items-center gap-1.5 hover:underline text-xs font-medium">
          Login →
        </Link>
      </div>

      <nav className="sticky top-0 z-50 glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-1.5">
            <span className="font-display text-2xl uppercase tracking-tight text-navy">
              Solutionary
            </span>
            <span className="bg-amber text-navy font-black text-xs uppercase px-1.5 py-0.5 rounded">
              HQ
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Solutions dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setDropdown("features")}
              onMouseLeave={() => setDropdown(null)}
            >
              <button className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
                Solutions <ChevronDown className="h-3 w-3" />
              </button>
              <AnimatePresence>
                {dropdown === "features" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-card border rounded-xl shadow-lg p-2 z-50"
                  >
                    {featureLinks.map((l) => (
                      <Link
                        key={l.href}
                        to={l.href}
                        className="block px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Industries dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setDropdown("industries")}
              onMouseLeave={() => setDropdown(null)}
            >
              <button className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
                Industries <ChevronDown className="h-3 w-3" />
              </button>
              <AnimatePresence>
                {dropdown === "industries" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-card border rounded-xl shadow-lg p-2 z-50"
                  >
                    {industryLinks.map((l) => (
                      <Link
                        key={l.href}
                        to={l.href}
                        className="block px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/pricing" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              About
            </Link>
          </div>

          <form onSubmit={handleTrial} className="hidden lg:flex items-center gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 px-4 text-sm border border-navy/15 rounded-full focus:outline-none focus:ring-2 focus:ring-amber/40 w-48 bg-white"
            />
            <Button type="submit" className="rounded-full bg-amber hover:bg-amber/90 text-navy font-black text-xs uppercase tracking-wide h-11 px-5">
              Start Free Trial
            </Button>
          </form>

          {/* Mobile toggle */}
          <button className="lg:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-t bg-background"
            >
              <div className="container mx-auto flex flex-col gap-1 py-4 px-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">Solutions</p>
                {featureLinks.map((l) => (
                  <Link key={l.href} to={l.href} onClick={() => setOpen(false)} className="text-sm text-foreground font-medium px-3 py-2 hover:bg-secondary rounded-lg">
                    {l.label}
                  </Link>
                ))}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2 mt-2">Industries</p>
                {industryLinks.slice(0, 6).map((l) => (
                  <Link key={l.href} to={l.href} onClick={() => setOpen(false)} className="text-sm text-foreground font-medium px-3 py-2 hover:bg-secondary rounded-lg">
                    {l.label}
                  </Link>
                ))}
                <div className="mt-2 space-y-2">
                  <Link to="/pricing" onClick={() => setOpen(false)} className="block text-sm text-foreground font-medium px-3 py-2 hover:bg-secondary rounded-lg">Pricing</Link>
                  <Link to="/about" onClick={() => setOpen(false)} className="block text-sm text-foreground font-medium px-3 py-2 hover:bg-secondary rounded-lg">About</Link>
                  <Link to="/contact" onClick={() => setOpen(false)} className="block text-sm text-foreground font-medium px-3 py-2 hover:bg-secondary rounded-lg">Contact</Link>
                </div>
                <Link to="/login" onClick={() => setOpen(false)} className="mt-2">
                  <Button className="w-full bg-amber hover:bg-amber/90 text-foreground font-bold">Start Free Trial</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
