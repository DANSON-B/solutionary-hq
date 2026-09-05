import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { getIndustryBySlug } from "@/data/industries";
import { CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function IndustryPage() {
  const { slug } = useParams<{ slug: string }>();
  const industry = getIndustryBySlug(slug || "");

  if (!industry) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold mb-4">Industry Not Found</h1>
          <p className="text-muted-foreground mb-8">We couldn't find that industry page.</p>
          <Link to="/"><Button>Back to Home</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={`${industry.name} Business Software | Solutionary HQ`}
        description={industry.description}
        path={`/industries/${slug}`}
      />
      <Navbar />

      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground section-padding overflow-hidden">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-block bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-semibold mb-4">
                {industry.name} Software
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">{industry.headline}</h1>
              <p className="text-lg text-primary-foreground/70 mb-8 max-w-lg">{industry.description}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/login">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/book">
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent">
                    Book a Demo
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <img
                src={industry.image}
                alt={industry.name}
                className="rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-padding bg-secondary">
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {industry.stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl md:text-5xl font-extrabold text-accent mb-2">{stat.value}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Built for {industry.name} Professionals
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every feature designed to help {industry.name.toLowerCase()} businesses save time and make more money.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {industry.features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border rounded-xl p-6 bg-card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-accent shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Ready to Grow Your {industry.name} Business?
          </h2>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">
            Join thousands of {industry.name.toLowerCase()} professionals Join thousands of {industry.name.toLowerCase()} professionals who use Solutionary to run and grow their business. and grow their business.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
              Start Your Free 14-Day Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
