import { useState, useCallback } from "react";
import { useBrandFavicon } from "@/hooks/useBrandFavicon";
import { BusinessLogo } from "@/components/BusinessLogo";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/marketing/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Search, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BookingCategorySelect, type BookingCategory } from "@/components/booking/BookingCategorySelect";
import { BookingServiceSelect, getServicesForCategory } from "@/components/booking/BookingServiceSelect";
import { BookingPropertyDetails } from "@/components/booking/BookingPropertyDetails";
import { BookingSchedule } from "@/components/booking/BookingSchedule";
import { BookingExtras, getExtrasForCategory } from "@/components/booking/BookingExtras";
import { BookingContactForm } from "@/components/booking/BookingContactForm";
import { BookingGiftCard, defaultPackages, type GiftCardData } from "@/components/booking/BookingGiftCard";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import CleaningBookingWizard from "@/components/booking/cleaning-wizard/CleaningBookingWizard";
import { Navbar as MarketingNavbar } from "@/components/marketing/Navbar";

function getSteps(category: BookingCategory | ""): string[] {
  if (category === "gift_card") {
    return ["Category", "Gift Card", "Confirm"];
  }
  return ["Category", "Service", "Details", "Schedule", "Extras", "Contact", "Confirm"];
}

export default function BookingPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { business: authBusiness } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  // Resolve business from slug
  const { data: slugBusiness } = useQuery({
    queryKey: ["business-by-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_business_by_slug", { p_slug: slug! });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row ? { id: row.id, name: row.name, slug: row.slug, industry: row.industry } : null;
    },
    enabled: !!slug,
  });

  // Search businesses when no slug and no auth business
  const { data: searchResults } = useQuery({
    queryKey: ["business-search", searchQuery],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_public_businesses", { p_query: searchQuery });
      if (error) throw error;
      return data || [];
    },
    enabled: !slug && !authBusiness && searchQuery.length >= 2,
  });

  // Selected business from search
  const { data: selectedBusiness } = useQuery({
    queryKey: ["business-by-id", selectedBusinessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_business_by_id", { p_id: selectedBusinessId! });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row ? { id: row.id, name: row.name, slug: row.slug, industry: row.industry } : null;
    },
    enabled: !!selectedBusinessId,
  });

  // Resolve business: slug > auth > search-selected
  const business = slugBusiness || (authBusiness ? { id: authBusiness.id, name: authBusiness.name, slug: authBusiness.slug, industry: (authBusiness as any).industry } : null) || selectedBusiness;
  const needsBusinessSelection = !slug && !authBusiness && !selectedBusinessId;
  useBrandFavicon((business as any)?.logo_url, (business as any)?.name);
  const businessIndustry: string | undefined = (business as any)?.industry;
  const isCleaningBusiness = !!businessIndustry && /clean|janitorial|maid|housekeeping/i.test(businessIndustry);

  const [category, setCategory] = useState<BookingCategory | "">("");
  const [serviceId, setServiceId] = useState("");
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("1");
  const [sqft, setSqft] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [contact, setContact] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", zip: "", notes: "", promo: "",
  });
  const [giftCard, setGiftCard] = useState<GiftCardData>({
    packageId: "", recipientName: "", recipientEmail: "", personalMessage: "",
    buyerName: "", buyerEmail: "", buyerPhone: "", sqft: "", roomCount: "",
  });

  const steps = getSteps(category);
  const currentStepName = steps[step] || "";

  const services = category && category !== "gift_card" ? getServicesForCategory(category) : [];
  const activeService = services.find((s) => s.id === serviceId);
  const extras = category && category !== "gift_card" ? getExtrasForCategory(category) : [];
  const selectedExtraObjects = extras.filter((e) => selectedExtras.includes(e.id));
  const extrasTotal = selectedExtraObjects.reduce((sum, e) => sum + e.price, 0);

  const selectedGiftPkg = defaultPackages.find((p) => p.id === giftCard.packageId);
  const total = category === "gift_card"
    ? (selectedGiftPkg?.price || 0)
    : (activeService?.price || 0) + extrasTotal;

  const businessId = business?.id;

  const toggleExtra = (id: string) =>
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const updateContact = (field: string, value: string) =>
    setContact((prev) => ({ ...prev, [field]: value }));

  const updateGiftCard = (field: string, value: string) =>
    setGiftCard((prev) => ({ ...prev, [field]: value }));

  const updateProperty = (field: string, value: string) => {
    if (field === "bedrooms") setBedrooms(value);
    else if (field === "bathrooms") setBathrooms(value);
    else if (field === "sqft") setSqft(value);
  };

  const updateSchedule = (field: string, value: string) => {
    if (field === "date") setDate(value);
    else if (field === "time") setTime(value);
  };

  const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const phoneOk = (v: string) => !v || v.replace(/\D/g, "").length >= 10;
  const zipOk = (v: string) => !v || /^\d{5}(-\d{4})?$/.test(v.trim());

  const validateStep = (): { ok: boolean; message?: string } => {
    switch (currentStepName) {
      case "Category":
        return category ? { ok: true } : { ok: false, message: "Choose a service category to continue." };
      case "Service":
        return serviceId ? { ok: true } : { ok: false, message: "Pick a service option." };
      case "Details":
        return { ok: true };
      case "Schedule":
        if (!date) return { ok: false, message: "Pick a preferred date." };
        if (!time) return { ok: false, message: "Pick a time slot." };
        return { ok: true };
      case "Extras":
        return { ok: true };
      case "Contact":
        if (!contact.name.trim()) return { ok: false, message: "Please enter your name." };
        if (!emailOk(contact.email)) return { ok: false, message: "Enter a valid email address." };
        if (!phoneOk(contact.phone)) return { ok: false, message: "Enter a valid phone number (10+ digits)." };
        if (!contact.address.trim()) return { ok: false, message: "Please enter your address." };
        if (!zipOk(contact.zip)) return { ok: false, message: "ZIP code looks invalid." };
        return { ok: true };
      case "Gift Card":
        if (!giftCard.packageId) return { ok: false, message: "Choose a gift card package." };
        if (!giftCard.recipientName.trim()) return { ok: false, message: "Add the recipient's name." };
        if (!emailOk(giftCard.recipientEmail)) return { ok: false, message: "Recipient email is invalid." };
        if (!giftCard.buyerName.trim()) return { ok: false, message: "Add your name." };
        if (!emailOk(giftCard.buyerEmail)) return { ok: false, message: "Your email is invalid." };
        return { ok: true };
      default:
        return { ok: true };
    }
  };

  const canNext = (): boolean => validateStep().ok;

  const handleNext = () => {
    const v = validateStep();
    if (!v.ok) {
      toast({ title: "Almost there", description: v.message, variant: "destructive" });
      return;
    }
    setSwipeDirection(1);
    setStep((s) => s + 1);
  };

  const [swipeDirection, setSwipeDirection] = useState<number>(1);

  const handleSwipe = useCallback(
    (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
      const swipeThreshold = 50;
      const velocityThreshold = 200;
      if (
        (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) &&
        canNext() &&
        currentStepName !== "Confirm"
      ) {
        setSwipeDirection(1);
        setStep((s) => s + 1);
      } else if (
        (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) &&
        step > 0
      ) {
        setSwipeDirection(-1);
        setStep((s) => s - 1);
      }
    },
    [canNext, currentStepName, step]
  );

  const sendEmail = async (templateName: string, recipientEmail: string, templateData: Record<string, unknown>) => {
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName,
          recipientEmail,
          templateData: { ...templateData, businessName: business?.name || "Solutionary" },
        },
      });
    } catch (err) {
      console.error("Email send error:", err);
    }
  };

  const handleConfirm = async () => {
    if (!businessId) {
      toast({ title: "Error", description: "Business not found. Please use a valid booking link.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      if (category === "gift_card" && selectedGiftPkg) {
        // Gift card creation is server-validated (price + status derived server-side)
        const { data: newGiftCardId, error: gcError } = await supabase.rpc("request_public_gift_card", {
          p_business_id: businessId,
          p_payload: {
            buyer_name: giftCard.buyerName,
            buyer_email: giftCard.buyerEmail,
            buyer_phone: giftCard.buyerPhone || null,
            recipient_name: giftCard.recipientName,
            recipient_email: giftCard.recipientEmail,
            recipient_message: giftCard.personalMessage || null,
            cleaning_type: selectedGiftPkg.id,
          },
        });

        if (gcError) throw gcError;

        // Fetch the generated code/expiry via secure RPC
        const { data: gcRows } = await supabase.rpc("get_just_purchased_gift_card", { p_id: newGiftCardId as string, p_buyer_email: giftCard.buyerEmail });
        const giftCardRecord = (Array.isArray(gcRows) ? gcRows[0] : gcRows) as { code: string; expires_at: string } | null;
        if (!giftCardRecord) throw new Error("Could not retrieve gift card details");

        // Send gift card email to recipient
        await sendEmail("gift-card-delivered", giftCard.recipientEmail, {
          recipientName: giftCard.recipientName,
          buyerName: giftCard.buyerName,
          packageName: selectedGiftPkg.name,
          packageDescription: selectedGiftPkg.description,
          giftCardCode: giftCardRecord.code,
          amount: String(selectedGiftPkg.price),
          personalMessage: giftCard.personalMessage,
          expiresAt: new Date(giftCardRecord.expires_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        });

        toast({
          title: "Gift Card Purchased! 🎁",
          description: `A digital gift card (code: ${giftCardRecord.code.toUpperCase()}) has been sent to ${giftCard.recipientEmail}.`,
        });
      } else {
        // Save booking request
        const isHighValue = category === "commercial" && total >= 10000;
        const leadScore = category === "commercial" ? (total >= 10000 ? 90 : 60) : (category === "post_construction" ? 70 : 50);

        const { error: brError } = await supabase.rpc("submit_public_booking_request", {
          p_business_id: businessId,
          p_payload: {
            category: category as string,
            name: contact.name,
            email: contact.email,
            phone: contact.phone || null,
            address: contact.address,
            city: contact.city || null,
            state: contact.state || null,
            zip: contact.zip || null,
            property_sqft: sqft || null,
            bedrooms: bedrooms || null,
            bathrooms: bathrooms || null,
            cleaning_type: serviceId || null,
            preferred_date: date || null,
            preferred_time: time || null,
            extras: selectedExtras,
            notes: contact.notes || null,
            estimated_total: total,
            lead_score: leadScore,
            is_high_value: isHighValue,
          },
        });

        if (brError) throw brError;


        // Send confirmation email to customer
        await sendEmail("booking-received", contact.email, {
          customerName: contact.name,
          category,
          serviceName: activeService?.label,
          scheduledDate: date,
          scheduledTime: time,
          address: [contact.address, contact.city, contact.state, contact.zip].filter(Boolean).join(", "),
          total: String(total),
        });

        toast({
          title: "Booking Confirmed! ✅",
          description: `Your ${activeService?.label} has been booked for ${date} at ${time}.`,
        });
      }

      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error("Booking error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySelect = (cat: BookingCategory) => {
    setCategory(cat);
    setServiceId("");
    setSelectedExtras([]);
  };

  const renderStep = () => {
    switch (currentStepName) {
      case "Category":
        return <BookingCategorySelect selected={category} onSelect={handleCategorySelect} />;
      case "Service":
        return <BookingServiceSelect category={category as BookingCategory} selected={serviceId} onSelect={setServiceId} />;
      case "Details":
        return <BookingPropertyDetails category={category as BookingCategory} bedrooms={bedrooms} bathrooms={bathrooms} sqft={sqft} onUpdate={updateProperty} />;
      case "Schedule":
        return <BookingSchedule date={date} time={time} onUpdate={updateSchedule} businessId={businessId} />;
      case "Extras":
        return <BookingExtras category={category as BookingCategory} selected={selectedExtras} onToggle={toggleExtra} />;
      case "Contact":
        return <BookingContactForm category={category as BookingCategory} data={contact} onUpdate={updateContact} />;
      case "Gift Card":
        return <BookingGiftCard data={giftCard} onUpdate={updateGiftCard} />;
      case "Confirm":
        return (
          <BookingSummary
            category={category as BookingCategory}
            service={activeService}
            extras={selectedExtraObjects}
            total={total}
            propertyDetails={{ bedrooms, bathrooms, sqft }}
            schedule={{ date, time }}
            contact={contact}
            giftCard={category === "gift_card" ? { pkg: selectedGiftPkg, recipientName: giftCard.recipientName, recipientEmail: giftCard.recipientEmail, buyerName: giftCard.buyerName } : undefined}
            onConfirm={handleConfirm}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  // Business search screen
  if (needsBusinessSelection) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-lg px-4 pt-20 sm:pt-24 pb-16">
          <div className="text-center mb-6 sm:mb-8">
            <Building2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-primary mb-3 sm:mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Find Your Service Provider</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">Search for a business to book with</p>
          </div>

          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by business name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 sm:h-10 text-base sm:text-sm"
            />
          </div>

          <div className="space-y-2">
            {searchResults?.map((biz) => (
              <Card
                key={biz.id}
                className="p-4 sm:p-4 cursor-pointer hover:border-primary active:scale-[0.98] active:bg-accent/50 transition-all"
                onClick={() => {
                  if (biz.slug) {
                    navigate(`/book/${biz.slug}`);
                  } else {
                    setSelectedBusinessId(biz.id);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <BusinessLogo name={biz.name} logoUrl={(biz as any).logo_url} rounded="full" className="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-foreground truncate">{biz.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {[biz.city, biz.state].filter(Boolean).join(", ")}
                      {biz.industry && ` · ${biz.industry}`}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            {searchQuery.length >= 2 && searchResults?.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">No businesses found</p>
            )}
            {searchQuery.length < 2 && (
              <p className="text-center text-muted-foreground py-8 text-xs sm:text-sm">Type at least 2 characters to search</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Cleaning industry → use the new 7-step wizard
  if (isCleaningBusiness && business) {
    return (
      <>
        {!isEmbed && <MarketingNavbar />}
        <div className={isEmbed ? "" : "pt-16"}>
          <CleaningBookingWizard
            business={{ id: business.id, name: business.name, slug: business.slug, logo_url: (business as any).logo_url }}
            isEmbed={isEmbed}
          />
        </div>
      </>
    );
  }

  const progressPct = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div className={`min-h-screen ${isEmbed ? "bg-transparent" : "bg-background"}`}>
      {!isEmbed && <Navbar />}
      <div className={`container mx-auto max-w-2xl px-4 ${isEmbed ? "pt-4 pb-28" : "pt-20 sm:pt-24 pb-28"}`}>
        {/* Premium progress stepper */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm font-semibold text-foreground">
              Step {step + 1} of {steps.length}
              <span className="ml-2 text-muted-foreground font-normal">· {currentStepName}</span>
            </p>
            <p className="text-xs text-muted-foreground">{progressPct}% complete</p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <div className="hidden sm:flex items-center justify-between mt-3">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span
                  className={`text-[11px] font-medium truncate ${
                    i <= step ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" custom={swipeDirection}>
          <motion.div
            key={`${step}-${category}`}
            custom={swipeDirection}
            initial={{ opacity: 0, x: swipeDirection * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: swipeDirection * -60 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleSwipe}
            style={{ touchAction: "pan-y" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Swipe hint on first step - mobile only */}
        <AnimatePresence>
          {step === 0 && category === "" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.5, duration: 0.4 }}
              className="flex items-center justify-center mt-4 sm:hidden"
            >
              <motion.div
                animate={{ x: [0, -10, 0] }}
                transition={{ duration: 1.2, repeat: 2, repeatDelay: 0.6, ease: "easeInOut" }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Swipe to navigate</span>
                <ArrowRight className="h-3 w-3" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky action bar - visible on both mobile and desktop */}
        {currentStepName !== "Confirm" && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t p-3 sm:p-4 z-40 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center max-w-2xl mx-auto gap-3">
              <Button
                variant="ghost"
                disabled={step === 0}
                onClick={() => { setSwipeDirection(-1); setStep((s) => s - 1); }}
              >
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" /> Back
              </Button>
              <div className="flex items-center gap-3 sm:gap-4">
                {total > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">Total</p>
                    <p className="text-base sm:text-lg font-bold text-foreground leading-tight">${total}</p>
                  </div>
                )}
                <Button
                  disabled={!canNext()}
                  onClick={handleNext}
                  className="min-w-[120px] shadow-md"
                >
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
