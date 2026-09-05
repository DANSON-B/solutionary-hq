import { BusinessLogo } from "@/components/BusinessLogo";
import { useBrandFavicon } from "@/hooks/useBrandFavicon";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, Send } from "lucide-react";
import PublicPaymentStep from "@/components/public/PublicPaymentStep";

interface Service {
  id: string;
  name: string;
  description: string | null;
  default_price: number | null;
  duration_minutes: number | null;
}

interface Business {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
}

const steps = ["Services", "Property", "Contact", "Review"];

export default function InstaQuotePage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  useBrandFavicon(business?.logo_url, business?.name);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [step, setStep] = useState(0);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [property, setProperty] = useState({ bedrooms: "2", bathrooms: "1", sqft: "", notes: "" });
  const [contact, setContact] = useState({ firstName: "", lastName: "", email: "", phone: "", address: "" });

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data: bizRows } = await supabase.rpc("get_public_business_by_slug", { p_slug: slug });
      const biz = Array.isArray(bizRows) ? bizRows[0] : bizRows;
      if (!biz) {
        setLoading(false);
        return;
      }
      setBusiness(biz);
      const { data: svcs } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", biz.id)
        .eq("is_active", true)
        .order("name");
      setServices(svcs || []);
      setLoading(false);
    };
    load();
  }, [slug]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
    if (!quantities[id]) setQuantities((q) => ({ ...q, [id]: 1 }));
  };

  const selectedItems = services.filter((s) => selectedServices.includes(s.id));
  const subtotal = selectedItems.reduce((sum, s) => sum + (s.default_price || 0) * (quantities[s.id] || 1), 0);
  const total = subtotal;

  const canNext = () => {
    if (step === 0) return selectedServices.length > 0;
    if (step === 2) return contact.firstName && contact.lastName && contact.email && contact.address;
    return true;
  };

  const handleSubmit = async () => {
    if (!business) return;
    setSubmitting(true);
    const body = {
      slug,
      customer: contact,
      property,
      items: selectedItems.map((service) => ({
        serviceId: service.id,
        quantity: quantities[service.id] || 1,
      })),
    };

    // Offline (or no network): queue immediately and reassure the user.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      try {
        const { queueSubmission } = await import("@/lib/offline/queue");
        await queueSubmission({ fn: "public-submit-instaquote", body, label: "Quote request" });
        setSubmitted(true);
        toast({
          title: "Saved offline ✅",
          description: "We'll send your quote request as soon as you're back online.",
        });
      } catch (err: any) {
        toast({ title: "Couldn't save offline", description: err.message, variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("public-submit-instaquote", {
        body,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.quoteId) setCreatedQuoteId(data.quoteId);
      setSubmitted(true);
      toast({ title: "Quote submitted! ✅", description: "Reserve your spot with a deposit below." });
    } catch (err: any) {
      // Network-ish failure → queue and let the user know it will retry.
      const msg = String(err?.message || "");
      const looksNetworky = /network|fetch|failed to fetch|timeout|offline/i.test(msg);
      if (looksNetworky) {
        try {
          const { queueSubmission } = await import("@/lib/offline/queue");
          await queueSubmission({ fn: "public-submit-instaquote", body, label: "Quote request" });
          setSubmitted(true);
          toast({
            title: "Saved — will retry",
            description: "Your quote request is queued and will send automatically.",
          });
          return;
        } catch {
          // fall through to error toast
        }
      }
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Business not found</h1>
          <p className="text-muted-foreground">This InstaQuote link may be invalid.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={`min-h-screen ${isEmbed ? "bg-transparent" : "bg-background"} flex items-center justify-center py-10 px-4`}>
        {createdQuoteId && !paymentDone ? (
          <PublicPaymentStep
            kind="quote"
            id={createdQuoteId}
            total={total}
            businessName={business.name}
            onSkip={() => setPaymentDone(true)}
          />
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Quote Submitted!</h1>
            <p className="text-muted-foreground mb-2">
              Your estimated total is <span className="font-bold text-foreground">${total.toFixed(2)}</span>
            </p>
            <p className="text-sm text-muted-foreground">{business.name} will review and get back to you shortly.</p>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isEmbed ? "bg-transparent" : "bg-background"}`}>
      {/* Header - hidden in embed mode */}
      {!isEmbed && (
        <div className="border-b bg-card">
          <div className="container mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
            <BusinessLogo name={business.name} logoUrl={business.logo_url} className="h-9 w-9" />
            <div>
              <h1 className="font-bold text-lg" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                InstaQuote
              </h1>
              <p className="text-xs text-muted-foreground">by {business.name}</p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Progress */}
        <div className="flex items-center justify-between mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`hidden sm:block w-8 md:w-16 h-0.5 ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step 0: Services */}
            {step === 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Select Services</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose what you need and we'll calculate your price instantly.
                </p>
                {services.length === 0 ? (
                  <p className="text-muted-foreground p-8 text-center border rounded-xl">No services available yet.</p>
                ) : (
                  <div className="space-y-3">
                    {services.map((s) => {
                      const isSelected = selectedServices.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleService(s.id)}
                          className={`rounded-xl border p-4 cursor-pointer transition-all ${isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "hover:border-primary/40"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox checked={isSelected} />
                              <div>
                                <div className="font-semibold">{s.name}</div>
                                {s.description && <div className="text-sm text-muted-foreground">{s.description}</div>}
                              </div>
                            </div>
                            <div className="text-right">
                              {s.default_price && <div className="font-bold">${s.default_price}</div>}
                              {s.duration_minutes && (
                                <div className="text-xs text-muted-foreground">{s.duration_minutes} min</div>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="mt-3 flex items-center gap-2 ml-8">
                              <Label className="text-xs">Qty:</Label>
                              <Input
                                type="number"
                                min="1"
                                className="w-20 h-11 text-base"
                                value={quantities[s.id] || 1}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setQuantities((q) => ({ ...q, [s.id]: parseInt(e.target.value) || 1 }));
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Property */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Property Details</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Bedrooms</Label>
                    <div className="flex gap-2 mt-2">
                      {["1", "2", "3", "4", "5+"].map((n) => (
                        <button
                          key={n}
                          onClick={() => setProperty((p) => ({ ...p, bedrooms: n }))}
                          className={`h-10 w-14 rounded-lg border text-sm font-medium transition-colors ${property.bedrooms === n ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Bathrooms</Label>
                    <div className="flex gap-2 mt-2">
                      {["1", "2", "3", "4+"].map((n) => (
                        <button
                          key={n}
                          onClick={() => setProperty((p) => ({ ...p, bathrooms: n }))}
                          className={`h-10 w-14 rounded-lg border text-sm font-medium transition-colors ${property.bathrooms === n ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Approximate Square Footage</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      placeholder="e.g. 1500"
                      value={property.sqft}
                      onChange={(e) => setProperty((p) => ({ ...p, sqft: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Additional Notes</Label>
                    <Textarea
                      className="mt-1"
                      placeholder="Any special requests or details..."
                      value={property.notes}
                      onChange={(e) => setProperty((p) => ({ ...p, notes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Your Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        className="mt-1"
                        value={contact.firstName}
                        onChange={(e) => setContact((c) => ({ ...c, firstName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input
                        className="mt-1"
                        value={contact.lastName}
                        onChange={(e) => setContact((c) => ({ ...c, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      className="mt-1"
                      value={contact.email}
                      onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      className="mt-1"
                      value={contact.phone}
                      onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Address *</Label>
                    <Input
                      className="mt-1"
                      placeholder="Full service address"
                      value={contact.address}
                      onChange={(e) => setContact((c) => ({ ...c, address: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Review Your Quote</h2>
                <div className="rounded-xl border bg-card p-6 space-y-4">
                  <div className="space-y-2">
                    {selectedItems.map((s) => (
                      <div key={s.id} className="flex justify-between text-sm">
                        <span>
                          {s.name} × {quantities[s.id] || 1}
                        </span>
                        <span className="font-medium">
                          ${((s.default_price || 0) * (quantities[s.id] || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Estimated Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 text-sm space-y-1 text-muted-foreground">
                    <div>
                      {contact.firstName} {contact.lastName}
                    </div>
                    <div>{contact.email}</div>
                    <div>{contact.address}</div>
                    <div>
                      {property.bedrooms} bed / {property.bathrooms} bath
                      {property.sqft ? `, ${property.sqft} sqft` : ""}
                    </div>
                  </div>
                </div>
                <Button className="w-full mt-6" size="lg" disabled={submitting} onClick={handleSubmit}>
                  <Send className="h-4 w-4 mr-2" /> {submitting ? "Submitting..." : "Submit Quote Request"}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  This is an estimate. Final pricing may vary based on inspection.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step < 3 && (
          <div className="flex justify-between mt-10">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div className="flex items-center gap-4">
              {selectedServices.length > 0 && (
                <span className="text-sm text-muted-foreground font-medium">Est: ${total.toFixed(2)}</span>
              )}
              <Button disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
