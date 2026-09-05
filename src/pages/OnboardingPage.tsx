import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const industries = [
  "Plumbing", "HVAC", "Electrical", "Landscaping", "Cleaning",
  "Handyman", "Pest Control", "Roofing", "Painting", "General Contractor", "Other",
];

export default function OnboardingPage() {
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, business, loading: authLoading, refreshBusiness } = useAuth();

  useEffect(() => {
    if (!authLoading && user && business) {
      // If user already has a business, check subscription before routing
      navigate("/choose-plan", { replace: true });
    }
  }, [authLoading, user?.id, business?.id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !industry) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
      const { data: biz, error } = await supabase
        .from("businesses")
        .insert({ owner_id: user.id, name: businessName, industry, phone, slug })
        .select()
        .single();
      if (error) throw error;

      // Link profile to business
      await supabase.from("profiles").update({ business_id: biz.id }).eq("user_id", user.id);
      await refreshBusiness();
      toast({ title: "Business created!", description: "Now choose your plan to get started." });
      navigate("/choose-plan");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-card rounded-2xl border p-8 shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Set Up Your Business</h1>
        <p className="text-muted-foreground text-sm mb-8">Tell us about your business to get started.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="bizName">Business Name *</Label>
            <Input id="bizName" className="mt-1" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Smith's Plumbing" />
          </div>
          <div>
            <Label>Industry *</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>
                {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Business & Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
