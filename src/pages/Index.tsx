import { Navbar } from "@/components/marketing/Navbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { StatsSection } from "@/components/marketing/StatsSection";
import { ComparisonSection } from "@/components/marketing/ComparisonSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { IndustriesSection } from "@/components/marketing/IndustriesSection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { CtaSection } from "@/components/marketing/CtaSection";
import { Footer } from "@/components/marketing/Footer";
import { Seo } from "@/components/Seo";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Solutionary HQ — Run & Grow Your Service Business"
        description="All-in-one platform to send quotes, schedule jobs, invoice customers, get paid, and collect reviews — built for cleaning, HVAC, plumbing, and more."
        path="/"
      />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <ComparisonSection />
      <PricingSection />
      <IndustriesSection />
      <TestimonialsSection />
      <HowItWorksSection />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Index;
