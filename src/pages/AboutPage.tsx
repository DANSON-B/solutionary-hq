import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

const values = [
  { icon: Users, title: "Customer First", description: "Every feature we build starts with a real problem from a real service business owner." },
  { icon: Target, title: "Simplicity", description: "Powerful software shouldn't be complicated. We obsess over making things easy to use." },
  { icon: Zap, title: "Speed", description: "Your time is money. We build tools that help you move faster, not slower." },
];

const team = [
  { name: "Owen Simpson", role: "CEO", bio: "Founder and visionary behind Solutionary HQ. Drives the company's mission to simplify operations for service businesses everywhere." },
  { name: "Paul Bell", role: "CTO", bio: "Leads engineering and product architecture. Focused on building reliable, mobile-first tooling that scales with growing service businesses." },
  { name: "Morgan Smith", role: "VP", bio: "Oversees strategy and operations. Passionate about creating exceptional experiences for both teams and their customers." },
  { name: "Robyn Simpson", role: "Head of Customer Service", bio: "Dedicated to helping every customer succeed. Champions the voice of the customer across the entire Solutionary HQ experience." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="About Solutionary HQ — Built by Service Pros"
        description="Learn about Solutionary HQ — the team building modern software for cleaning, HVAC, plumbing, and other service businesses."
        path="/about"
      />
      <Navbar />

      {/* Hero */}
      <section className="section-padding bg-primary text-primary-foreground text-center">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Built by Service Pros, for Service Pros</h1>
            <p className="text-lg text-primary-foreground/70">
              We started Solutionary HQ because we lived the chaos of running a service business — pen-and-paper estimates, missed calls, late payments. We knew there had to be a better way.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding">
        <div className="container mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-secondary">
        <div className="container mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">Meet the Team</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border rounded-xl p-6 bg-card text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary font-bold text-xl">
                  {member.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <h3 className="font-bold">{member.name}</h3>
                <p className="text-accent text-sm font-medium mb-3">{member.role}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary text-primary-foreground text-center">
        <div className="container mx-auto">
          <h2 className="text-3xl font-extrabold mb-4">Join 10,000+ Service Professionals</h2>
          <p className="text-primary-foreground/70 mb-8">Start your free trial today — no credit card required.</p>
          <Link to="/login">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
