import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SUBSCRIPTION_TIERS } from "@/lib/subscriptionTiers";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function ChoosePlanPage() {
  const { user, business, loading, subscription } = useAuth();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!business) return <Navigate to="/onboarding" replace />;
  if (subscription?.subscribed) return <Navigate to="/dashboard" replace />;

  const handleSelectPlan = async (priceId: string, tierKey: string) => {
    setLoadingPlan(tierKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to start checkout",
        variant: "destructive",
      });
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            14-day free trial on all plans
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Select a plan to get started. You won't be charged during your 14-day trial.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier], i) => {
            const isPopular = "popular" in tier && tier.popular;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border p-6 bg-card relative flex flex-col ${
                  isPopular ? "border-accent shadow-xl ring-2 ring-accent" : ""
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-extrabold">${tier.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  14-day free trial included
                </p>

                <ul className="space-y-3 mb-6 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full font-bold ${
                    isPopular ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""
                  }`}
                  onClick={() => handleSelectPlan(tier.price_id, key)}
                  disabled={!!loadingPlan}
                >
                  {loadingPlan === key ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Start Free Trial
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
