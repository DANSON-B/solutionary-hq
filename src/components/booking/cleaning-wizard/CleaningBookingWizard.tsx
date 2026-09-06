import { BusinessLogo } from "@/components/BusinessLogo";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Home,
  Sparkles,
  Truck,
  Building2,
  HardHat,
  CalendarDays,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PublicPaymentStep from "@/components/public/PublicPaymentStep";
import {
  DEFAULT_CONFIG,
  SERVICE_LABELS,
  FREQUENCY_LABELS,
  ADDON_CATEGORY_LABELS,
  type WizardConfig,
  type ServiceType,
  type Frequency,
  type Condition,
  type SelectedAddOn,
  type AddOn,
} from "./types";
import { computePrice } from "./pricing";
import {
  computePostConstruction,
  PC_PHASES,
  type PCCeiling,
  type PCEnvironment,
  type PCPhaseId,
} from "./postConstruction";
import { PCStepProject, PCStepMetrics, PCStepPhases, PCStepTimeline, PCSummary } from "./PostConstructionSteps";

interface Props {
  business: { id: string; name: string; slug?: string | null; logo_url?: string | null };
  isEmbed?: boolean;
}

const STEPS = ["Service", "Frequency", "Property", "Condition", "Add-Ons", "Schedule", "Contact", "Review"] as const;
const PC_STEPS = ["Service", "Project", "Metrics", "Phases", "Timeline", "Contact", "Review"] as const;
type StepName = (typeof STEPS)[number] | (typeof PC_STEPS)[number];

const TIME_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

const SERVICE_ICONS: Record<ServiceType, typeof Home> = {
  residential: Home,
  deep: Sparkles,
  move: Truck,
  commercial: Building2,
  post_construction: HardHat,
};

const COMMERCIAL_PROPERTY_TYPES = ["Office", "Retail", "Salon", "Medical"] as const;
const POST_CONSTRUCTION_PROPERTY_TYPES = ["Residential", "Commercial"] as const;

const SERVICE_DESCRIPTIONS: Record<ServiceType, string> = {
  residential: "Routine cleaning to keep your home fresh and tidy.",
  deep: "Detailed top-to-bottom clean for built-up dirt and grime.",
  move: "Thorough cleaning for a smooth move or final inspection.",
  commercial: "Reliable cleaning for offices and small businesses.",
  post_construction: "Dust and debris removal to make your space move-in ready.",
};

export default function CleaningBookingWizard({ business, isEmbed }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState<WizardConfig | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [bookingTotal, setBookingTotal] = useState<number>(0);
  const [paymentDone, setPaymentDone] = useState(false);

  // Selections
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [frequency, setFrequency] = useState<Frequency | "">("");
  const [sqft, setSqft] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [propertyType, setPropertyType] = useState<string>("");
  const [condition, setCondition] = useState<Condition | "">("");
  const [addOnSelections, setAddOnSelections] = useState<Record<string, number>>({});
  const [openAddOnCats, setOpenAddOnCats] = useState<Record<string, boolean>>({});
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [recurringDay, setRecurringDay] = useState<string>("");

  // Post-construction multi-phase state
  const [pcEnvironment, setPcEnvironment] = useState<PCEnvironment | "">("");
  const [pcContractor, setPcContractor] = useState({ company: "", siteContact: "", permitRef: "" });
  const [pcCeiling, setPcCeiling] = useState<PCCeiling>("standard");
  const [pcRooms, setPcRooms] = useState("0");
  const [pcPhases, setPcPhases] = useState<PCPhaseId[]>(["final"]);
  const [pcSchedule, setPcSchedule] = useState<Record<string, { date: string; time: string }>>({});
  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
  });

  // Custom services now live in their own table
  const [customServices, setCustomServices] = useState<
    { id: string; label: string; price: number }[]
  >([]);

  const loadCustomServices = useCallback(async () => {
    const { data } = await supabase.rpc("get_cleaning_custom_services", {
      p_business_id: business.id,
    });
    setCustomServices(
      ((data as any[]) ?? []).map((s) => ({
        id: String(s.id),
        label: String(s.label),
        price: Number(s.price) || 0,
      }))
    );
  }, [business.id]);

  // Load Supabase config
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .rpc("get_cleaning_wizard_config", { p_business_id: business.id });
      if (cancelled) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setConfig({ ...(row as any) } as WizardConfig);
      } else {
        setConfig({ business_id: business.id, ...DEFAULT_CONFIG });
      }
    })();
    void loadCustomServices();
    return () => {
      cancelled = true;
    };
  }, [business.id, loadCustomServices]);

  const isPostConstruction = serviceType === "post_construction";
  const steps: readonly StepName[] = isPostConstruction ? PC_STEPS : STEPS;
  const currentStep = steps[Math.min(step, steps.length - 1)] as StepName;

  const pcQuote = useMemo(() => {
    if (!isPostConstruction || !pcEnvironment) return null;
    const sqftNum = parseInt(sqft) || 0;
    if (sqftNum <= 0 || pcPhases.length === 0) return null;
    return computePostConstruction({
      environment: pcEnvironment as PCEnvironment,
      sqft: sqftNum,
      ceiling: pcCeiling,
      roughInRooms: parseInt(pcRooms) || 0,
      phases: pcPhases,
    });
  }, [isPostConstruction, pcEnvironment, sqft, pcCeiling, pcRooms, pcPhases]);

  const togglePhase = (id: PCPhaseId) =>
    setPcPhases((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const availableAddOns: AddOn[] = useMemo(() => {
    if (!config || !serviceType) return [];
    const list =
      serviceType === "commercial" || serviceType === "post_construction"
        ? config.commercial_addons
        : config.residential_addons;
    const customs: AddOn[] = customServices.map((s) => ({
      id: `custom_${s.id}`,
      label: s.label,
      price: Number(s.price) || 0,
      category: "custom",
      enabled: true,
    }));
    return [...list.filter((a) => a.enabled), ...customs];
  }, [config, serviceType, customServices]);


  const groupedAddOns = useMemo(() => {
    const groups: Record<string, AddOn[]> = {};
    for (const a of availableAddOns) {
      (groups[a.category] ||= []).push(a);
    }
    return groups;
  }, [availableAddOns]);

  const selectedAddOnObjs: SelectedAddOn[] = useMemo(() => {
    return availableAddOns
      .filter((a) => (addOnSelections[a.id] ?? 0) > 0)
      .map((a) => ({
        id: a.id,
        label: a.label,
        price: a.price,
        quantity: addOnSelections[a.id],
        is_percent: a.is_percent,
        percent: a.percent,
      }));
  }, [availableAddOns, addOnSelections]);

  const price = useMemo(() => {
    if (!config || !serviceType || !frequency || !condition) return null;
    const sqftNum = parseInt(sqft) || 0;
    const bedNum = parseInt(bedrooms) || 0;
    const bathNum = parseInt(bathrooms) || 0;
    if (sqftNum === 0) return null;
    return computePrice(
      {
        serviceType: serviceType as ServiceType,
        frequency: frequency as Frequency,
        condition: condition as Condition,
        sqft: sqftNum,
        bedrooms: bedNum,
        bathrooms: bathNum,
        addOns: selectedAddOnObjs,
      },
      config,
    );
  }, [config, serviceType, frequency, condition, sqft, bedrooms, bathrooms, selectedAddOnObjs]);

  const isResidentialFamily = serviceType === "residential" || serviceType === "deep" || serviceType === "move";

  const canNext = (): boolean => {
    switch (currentStep) {
      case "Service":
        return !!serviceType;
      case "Project":
        return !!pcEnvironment;
      case "Metrics":
        return !!sqft && parseInt(sqft) > 0;
      case "Phases":
        return pcPhases.length > 0;
      case "Timeline":
        return pcPhases.every((id) => !!pcSchedule[id]?.date && !!pcSchedule[id]?.time);
      case "Frequency":
        return !!frequency;
      case "Property":
        if (!sqft || parseInt(sqft) <= 0) return false;
        if (isResidentialFamily) return !!bedrooms && !!bathrooms;
        return !!propertyType && !!bathrooms;
      case "Condition":
        return !!condition;
      case "Add-Ons":
        return true;
      case "Schedule":
        return !!date && !!time;
      case "Contact":
        return !!contact.name && !!contact.email && !!contact.address;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (canNext() && step < steps.length - 1) setStep(step + 1);
  };
  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // Helper to send email via PHP API
  const sendEmailViaPHP = async (bookingData: any) => {
    try {
      const response = await fetch("https://emailapi.solutionaryhq.com/index.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        console.error("PHP email API error:", result.message);
        throw new Error(result.message || "Email sending failed");
      }
      return result;
    } catch (err) {
      console.error("Network error calling email API:", err);
      throw err;
    }
  };

  const handleSubmitPostConstruction = async () => {
    if (!pcQuote) return;
    setSubmitting(true);
    try {
      const firstPhase = PC_PHASES.find((p) => pcPhases.includes(p.id));
      const firstSlot = firstPhase ? pcSchedule[firstPhase.id] : undefined;

      const extras = [
        ...pcQuote.lines.map((l) => `phase_${l.id}:${l.amount}`),
        `ceiling:${pcCeiling}`,
        `rough_in_rooms:${parseInt(pcRooms) || 0}`,
        ...(pcQuote.bundleApplied ? [`bundle_discount:${pcQuote.bundleDiscount}`] : []),
      ];

      const notesParts = [
        `Post-Construction (${pcEnvironment === "commercial" ? "Commercial" : "Residential"})`,
        `Phases: ${pcQuote.lines.map((l) => l.label).join(", ")}`,
        `Ceiling: ${pcCeiling}`,
        `Rough-in rooms: ${parseInt(pcRooms) || 0}`,
        ...PC_PHASES.filter((p) => pcPhases.includes(p.id)).map(
          (p) => `${p.label} scheduled ${pcSchedule[p.id]?.date || "TBD"} ${pcSchedule[p.id]?.time || ""}`.trim(),
        ),
        pcQuote.bundleApplied ? `Bundle discount applied: -$${pcQuote.bundleDiscount.toFixed(2)}` : "",
        pcContractor.company ? `Contractor: ${pcContractor.company}` : "",
        pcContractor.siteContact ? `Site contact: ${pcContractor.siteContact}` : "",
        pcContractor.permitRef ? `Permit/Job #: ${pcContractor.permitRef}` : "",
        contact.notes,
      ].filter(Boolean);

      const bookingPayload = {
        businessId: business.id,
        category: pcEnvironment === "commercial" ? "commercial" : "residential",
        serviceType: "post_construction",
        name: contact.name,
        email: contact.email,
        phone: contact.phone || null,
        address: contact.address,
        city: contact.city || null,
        state: contact.state || null,
        zip: contact.zip || null,
        sqft,
        bedrooms: "",
        bathrooms: "",
        preferredDate: firstSlot?.date || null,
        preferredTime: firstSlot?.time || null,
        extras,
        notes: notesParts.join(" | "),
        estimatedTotal: pcQuote.total,
        leadScore: 85,
        isHighValue: pcQuote.total >= 500,
      };

      const { data: inserted, error: dbError } = await supabase.functions.invoke("public-submit-instaquote", {
        body: { kind: "booking_request", booking: bookingPayload },
      });
      if (dbError) throw dbError;
      if (inserted?.error) throw new Error(inserted.error);

      toast({
        title: "Project submitted ✅",
        description: `Estimated total: $${pcQuote.total.toFixed(2)}. Reserve your crew with a deposit below.`,
      });

      if (inserted?.bookingId) {
        setCreatedBookingId(inserted.bookingId);
        setBookingTotal(pcQuote.total);
      }
    } catch (err: any) {
      console.error("[PC Booking] Error:", err);
      toast({
        title: "Something went wrong",
        description: err?.message || "Could not submit your project.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (isPostConstruction) return handleSubmitPostConstruction();
    if (!price) {
      toast({ title: "Missing details", description: "Please complete the wizard.", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    try {
      // 1️⃣  Save to Supabase
      const extras = selectedAddOnObjs.map((a) => `${a.id}:${a.quantity}`);
      const notesParts: string[] = [];
      if (frequency) notesParts.push(`Frequency: ${FREQUENCY_LABELS[frequency as Frequency]}`);
      if (condition) notesParts.push(`Condition: ${condition}`);
      if (propertyType) notesParts.push(`Property type: ${propertyType}`);
      if (recurringDay) notesParts.push(`Preferred day: ${recurringDay}`);
      if (price.hidden) notesParts.push(`On-site quote requested (sqft ${sqft})`);
      if (contact.notes) notesParts.push(contact.notes);

      const bookingPayload = {
        businessId: business.id,
        category: serviceType === "commercial" ? "commercial" : "residential",
        serviceType,
        name: contact.name,
        email: contact.email,
        phone: contact.phone || null,
        address: contact.address,
        city: contact.city || null,
        state: contact.state || null,
        zip: contact.zip || null,
        sqft,
        bedrooms,
        bathrooms,
        preferredDate: date || null,
        preferredTime: time || null,
        extras,
        notes: notesParts.join(" | ") || null,
        estimatedTotal: price.hidden ? 0 : price.total,
        leadScore: serviceType === "commercial" ? 75 : 55,
        isHighValue: price.total >= 500,
      };

      const { data: inserted, error: dbError } = await supabase.functions.invoke("public-submit-instaquote", {
        body: { kind: "booking_request", booking: bookingPayload },
      });

      if (dbError) throw dbError;
      if (inserted?.error) throw new Error(inserted.error);
      console.log("[Supabase] Booking saved successfully.");

      // 2️⃣  Send email via PHP API (to user and admin)
      const addOnsText = selectedAddOnObjs.length
        ? selectedAddOnObjs
            .map(
              (a) =>
                `${a.label} x${a.quantity} (${a.is_percent ? `+${a.percent}%` : `$${(a.price * a.quantity).toFixed(2)}`})`,
            )
            .join(", ")
        : "None";

      const emailPayload = {
        user_email: contact.email,
        admin_email: "ik804b@gmail.com", // admin email hardcoded as provided
        customer_name: contact.name,
        customer_phone: contact.phone || "Not provided",
        service_type: SERVICE_LABELS[serviceType as ServiceType],
        frequency: FREQUENCY_LABELS[frequency as Frequency],
        condition: condition ? condition.charAt(0).toUpperCase() + condition.slice(1) : "N/A",
        sqft: sqft,
        bedrooms: bedrooms || "N/A",
        bathrooms: bathrooms || "N/A",
        property_type: propertyType || "N/A",
        add_ons: addOnsText,
        preferred_date: date,
        preferred_time: time,
        recurring_day: recurringDay || "One-time",
        address: contact.address,
        city: contact.city || "",
        state: contact.state || "",
        zip: contact.zip || "",
        notes: contact.notes || "None",
        total: price.hidden ? "On-site quote required" : `$${price.total.toFixed(2)}`,
        business_name: business.name,
      };

      await sendEmailViaPHP(emailPayload);
      console.log("[Email] Sent successfully via PHP API");

      // 3️⃣  Success toast
      toast({
        title: price.hidden ? "Request received! 📋" : "Booking submitted! ✅",
        description: price.hidden
          ? "We'll contact you for an on-site quote."
          : `Estimated total: $${price.total.toFixed(2)}. Reserve your spot with a deposit below.`,
      });

      // 4️⃣  If a price was calculated, move to payment step; otherwise reset.
      if (!price.hidden && inserted?.bookingId) {
        setCreatedBookingId(inserted.bookingId);
        setBookingTotal(price.total);
      } else {
        setStep(0);
        setServiceType("");
        setFrequency("");
        setSqft("");
        setBedrooms("");
        setBathrooms("");
        setPropertyType("");
        setCondition("");
        setAddOnSelections({});
        setDate("");
        setTime("");
        setRecurringDay("");
        setContact({ name: "", email: "", phone: "", address: "", city: "", state: "", zip: "", notes: "" });
      }
    } catch (err: any) {
      console.error("[Booking] Error:", err);
      toast({
        title: "Something went wrong",
        description: err?.message || "Booking saved but email could not be sent.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!config) {
    return <div className="flex items-center justify-center min-h-[40vh] text-sm text-muted-foreground">Loading…</div>;
  }

  if (createdBookingId && !paymentDone) {
    return (
      <div className={`min-h-screen ${isEmbed ? "bg-transparent" : "bg-background"} flex items-center justify-center py-10 px-4`}>
        <PublicPaymentStep
          kind="booking_request"
          id={createdBookingId}
          total={bookingTotal}
          businessName={business.name}
          onSkip={() => {
            setPaymentDone(true);
            setCreatedBookingId(null);
            setStep(0);
            setServiceType("");
            setFrequency("");
            setSqft("");
            setBedrooms("");
            setBathrooms("");
            setPropertyType("");
            setCondition("");
            setAddOnSelections({});
            setDate("");
            setTime("");
            setRecurringDay("");
            setContact({ name: "", email: "", phone: "", address: "", city: "", state: "", zip: "", notes: "" });
          }}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isEmbed ? "bg-transparent" : "bg-background"}`}>
      {/* Sticky top: progress + price */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <BusinessLogo name={business.name} logoUrl={business.logo_url} rounded="md" className="h-7 w-7" />
            <span className="text-sm font-semibold truncate">{business.name}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Step {step + 1} of {steps.length} · {currentStep}
            </span>
            {pcQuote && (
              <span className="text-base font-bold text-primary">${pcQuote.total.toFixed(2)}</span>
            )}
            {!isPostConstruction && price && !price.hidden && (
              <span className="text-base font-bold text-primary">${price.total.toFixed(2)}</span>
            )}
            {!isPostConstruction && price?.hidden && (
              <span className="text-xs font-semibold text-amber-600">On-site quote</span>
            )}
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={false}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
          >
            {currentStep === "Service" && (
              <StepService
                config={config}
                selected={serviceType}
                onSelect={(s) => {
                  setServiceType(s);
                  setAddOnSelections({});
                  setBedrooms("");
                  setBathrooms("");
                  setPropertyType("");
                  setPcEnvironment("");
                  setPcPhases(["final"]);
                  setPcSchedule({});
                }}
              />
            )}

            {currentStep === "Project" && (
              <PCStepProject
                environment={pcEnvironment}
                setEnvironment={setPcEnvironment}
                contractor={pcContractor}
                setContractor={setPcContractor}
              />
            )}
            {currentStep === "Metrics" && (
              <PCStepMetrics
                sqft={sqft}
                setSqft={setSqft}
                ceiling={pcCeiling}
                setCeiling={setPcCeiling}
                rooms={pcRooms}
                setRooms={setPcRooms}
              />
            )}
            {currentStep === "Phases" && (
              <PCStepPhases
                environment={(pcEnvironment || "residential") as PCEnvironment}
                phases={pcPhases}
                togglePhase={togglePhase}
                quote={pcQuote}
              />
            )}
            {currentStep === "Timeline" && (
              <PCStepTimeline phases={pcPhases} schedule={pcSchedule} setSchedule={setPcSchedule} />
            )}
            {currentStep === "Frequency" && (
              <StepFrequency config={config} selected={frequency} onSelect={setFrequency} />
            )}
            {currentStep === "Property" && (
              <StepProperty
                isResidential={isResidentialFamily}
                serviceType={serviceType as ServiceType}
                sqft={sqft}
                setSqft={setSqft}
                bedrooms={bedrooms}
                setBedrooms={setBedrooms}
                bathrooms={bathrooms}
                setBathrooms={setBathrooms}
                propertyType={propertyType}
                setPropertyType={setPropertyType}
              />
            )}
            {currentStep === "Condition" && <StepCondition selected={condition} onSelect={setCondition} />}
            {currentStep === "Add-Ons" && (
              <StepAddOns
                grouped={groupedAddOns}
                selections={addOnSelections}
                setSelections={setAddOnSelections}
                openCats={openAddOnCats}
                setOpenCats={setOpenAddOnCats}
              />
            )}
            {currentStep === "Schedule" && (
              <StepSchedule
                date={date}
                setDate={setDate}
                time={time}
                setTime={setTime}
                frequency={frequency as Frequency}
                recurringDay={recurringDay}
                setRecurringDay={setRecurringDay}
              />
            )}
            {currentStep === "Contact" && <StepContact contact={contact} setContact={setContact} />}
            {currentStep === "Review" && isPostConstruction && pcQuote && (
              <div>
                <h2 className="text-[26px] font-medium tracking-[-0.02em] mb-1">Review & Confirm</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  {SERVICE_LABELS.post_construction} · {pcEnvironment === "commercial" ? "Commercial" : "Residential"}
                </p>
                <PCSummary quote={pcQuote} />
                <Card className="mt-4 p-4 space-y-3 text-sm">
                  <Row label="Square Feet" value={sqft} />
                  <Row label="Ceiling Height" value={pcCeiling} />
                  <Row label="Rough-In Rooms" value={String(parseInt(pcRooms) || 0)} />
                  {PC_PHASES.filter((p) => pcPhases.includes(p.id)).map((p) => (
                    <Row
                      key={p.id}
                      label={p.label}
                      value={`${pcSchedule[p.id]?.date || "—"} · ${pcSchedule[p.id]?.time || "—"}`}
                    />
                  ))}
                  {pcContractor.company && <Row label="Contractor" value={pcContractor.company} />}
                  {pcContractor.siteContact && <Row label="Site Contact" value={pcContractor.siteContact} />}
                  {pcContractor.permitRef && <Row label="Permit / Job #" value={pcContractor.permitRef} />}
                  <Row label="Name" value={contact.name} />
                  <Row label="Email" value={contact.email} />
                  <Row
                    label="Address"
                    value={[contact.address, contact.city, contact.state, contact.zip].filter(Boolean).join(", ")}
                  />
                </Card>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full h-14 mt-6 text-base font-semibold">
                  {submitting ? "Submitting…" : "Pay & Book Now"}
                </Button>
              </div>
            )}
            {currentStep === "Review" && !isPostConstruction && (
              <StepReview
                serviceType={serviceType as ServiceType}
                frequency={frequency as Frequency}
                condition={condition as Condition}
                sqft={sqft}
                bedrooms={bedrooms}
                bathrooms={bathrooms}
                propertyType={propertyType}
                addOns={selectedAddOnObjs}
                date={date}
                time={time}
                recurringDay={recurringDay}
                contact={contact}
                price={price}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      {currentStep !== "Review" && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-3 z-40">
          <div className="max-w-2xl mx-auto flex justify-between gap-3">
            <Button variant="outline" onClick={goBack} disabled={step === 0} className="h-12 flex-1 max-w-[140px]">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button onClick={goNext} disabled={!canNext()} className="h-12 flex-1">
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step Components (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════

function StepService({
  config,
  selected,
  onSelect,
}: {
  config: WizardConfig;
  selected: ServiceType | "";
  onSelect: (s: ServiceType) => void;
}) {
  const types: ServiceType[] = (
    ["residential", "deep", "move", "commercial", "post_construction"] as ServiceType[]
  ).filter((t) => config.services[t]);
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Choose Cleaning Type</h2>
      <p className="text-sm text-muted-foreground mb-5">Pick the service that fits your space.</p>

      <div className="space-y-3">

        {types.map((t) => {
          const Icon = SERVICE_ICONS[t];
          const isSel = selected === t;
          return (
            <button
              key={t}
              onClick={() => onSelect(t)}
              className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all active:scale-[0.98] ${isSel ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-primary/40"}`}
            >
              <div
                className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${isSel ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold leading-tight">{SERVICE_LABELS[t]}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{SERVICE_DESCRIPTIONS[t]}</div>
              </div>
              {isSel && <Check className="h-5 w-5 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepFrequency({
  config,
  selected,
  onSelect,
}: {
  config: WizardConfig;
  selected: Frequency | "";
  onSelect: (f: Frequency) => void;
}) {
  const freqs: Frequency[] = (["one_time", "weekly", "biweekly", "monthly", "daily"] as Frequency[]).filter(
    (f) => config.frequencies[f],
  );
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">How often?</h2>
      <p className="text-sm text-muted-foreground mb-5">Recurring services unlock lower per-visit rates.</p>
      <div className="space-y-3">
        {freqs.map((f) => {
          const isSel = selected === f;
          return (
            <button
              key={f}
              onClick={() => onSelect(f)}
              className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all active:scale-[0.98] ${isSel ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-primary/40"}`}
            >
              <div className="flex items-center gap-3">
                {f === "one_time" ? (
                  <CalendarDays className="h-5 w-5 text-primary" />
                ) : (
                  <Repeat className="h-5 w-5 text-primary" />
                )}
                <span className="font-semibold">{FREQUENCY_LABELS[f]} Cleaning</span>
              </div>
              {isSel && <Check className="h-5 w-5 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepProperty({
  isResidential,
  serviceType,
  sqft,
  setSqft,
  bedrooms,
  setBedrooms,
  bathrooms,
  setBathrooms,
  propertyType,
  setPropertyType,
}: any) {
  const propertyOptions: readonly string[] =
    serviceType === "post_construction" ? POST_CONSTRUCTION_PROPERTY_TYPES : COMMERCIAL_PROPERTY_TYPES;
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Property Details</h2>
      <p className="text-sm text-muted-foreground mb-5">Help us size the job correctly.</p>
      <div className="space-y-5">
        {!isResidential && (
          <div>
            <Label>Property Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {propertyOptions.map((p) => (
                <button
                  key={p}
                  onClick={() => setPropertyType(p)}
                  className={`h-12 rounded-lg border text-sm font-medium transition-colors active:scale-[0.96] ${propertyType === p ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <Label>Square Footage</Label>
          <Input
            type="number"
            inputMode="numeric"
            className="mt-2 h-12 text-base"
            placeholder={isResidential ? "e.g. 1500" : "e.g. 5000"}
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
          />
        </div>
        {isResidential && (
          <>
            <div>
              <Label>Bedrooms</Label>
              <div className="flex gap-2 mt-2">
                {["1", "2", "3", "4", "5+"].map((n) => (
                  <button
                    key={n}
                    onClick={() => setBedrooms(n === "5+" ? "5" : n)}
                    className={`h-12 flex-1 rounded-lg border text-sm font-medium transition-colors active:scale-[0.95] ${bedrooms === n || (n === "5+" && bedrooms === "5") ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
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
                    onClick={() => setBathrooms(n === "4+" ? "4" : n)}
                    className={`h-12 flex-1 rounded-lg border text-sm font-medium transition-colors active:scale-[0.95] ${bathrooms === n || (n === "4+" && bathrooms === "4") ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {!isResidential && (
          <div>
            <Label>Bathrooms</Label>
            <Input
              type="number"
              inputMode="numeric"
              className="mt-2 h-12 text-base"
              placeholder="e.g. 3"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StepCondition({ selected, onSelect }: { selected: Condition | ""; onSelect: (c: Condition) => void }) {
  const opts: { id: Condition; label: string; desc: string }[] = [
    { id: "light", label: "Light", desc: "Regularly maintained, surface tidy-up" },
    { id: "moderate", label: "Moderate", desc: "Some buildup, normal wear" },
    { id: "heavy", label: "Heavy", desc: "Deep grime, neglected surfaces" },
  ];
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Condition</h2>
      <p className="text-sm text-muted-foreground mb-5">Honest answers help us bring the right team and supplies.</p>
      <div className="space-y-3">
        {opts.map((o) => {
          const isSel = selected === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onSelect(o.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all active:scale-[0.98] ${isSel ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-primary/40"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{o.label}</span>
                {isSel && <Check className="h-5 w-5 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{o.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepAddOns({ grouped, selections, setSelections, openCats, setOpenCats }: any) {
  const cats = Object.keys(grouped);
  if (cats.length === 0)
    return (
      <div>
        <h2 className="text-xl font-bold mb-1">Add-Ons</h2>
        <p className="text-sm text-muted-foreground">No optional services available — proceed to scheduling.</p>
      </div>
    );
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Add-Ons</h2>
      <p className="text-sm text-muted-foreground mb-5">Optional extras. Tap a section to expand.</p>
      <div className="space-y-2">
        {cats.map((cat) => {
          const isOpen = !!openCats[cat];
          const items = grouped[cat];
          const countSelected = items.filter((i) => (selections[i.id] ?? 0) > 0).length;
          return (
            <Card key={cat} className="overflow-hidden">
              <button
                onClick={() => setOpenCats({ ...openCats, [cat]: !isOpen })}
                className="w-full flex items-center justify-between p-4 hover:bg-accent/30"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{ADDON_CATEGORY_LABELS[cat] || cat}</span>
                  {countSelected > 0 && (
                    <span className="text-[10px] font-bold uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {countSelected}
                    </span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="border-t divide-y">
                  {items.map((a) => {
                    const qty = selections[a.id] ?? 0;
                    const isSel = qty > 0;
                    const supportsQty = /each|per /i.test(a.label) && !a.is_percent;
                    return (
                      <div key={a.id} className="p-3 flex items-center justify-between gap-3">
                        <button
                          onClick={() => setSelections({ ...selections, [a.id]: isSel ? 0 : 1 })}
                          className="flex-1 flex items-center gap-3 text-left"
                        >
                          <div
                            className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSel ? "bg-primary border-primary" : "border-muted-foreground/30"}`}
                          >
                            {isSel && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{a.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {a.is_percent ? `+${a.percent}%` : `+$${a.price.toFixed(a.price < 1 ? 2 : 0)}`}
                            </div>
                          </div>
                        </button>
                        {isSel && supportsQty && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setSelections({ ...selections, [a.id]: Math.max(1, qty - 1) })}
                              className="h-8 w-8 rounded-md border hover:bg-muted"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                            <button
                              onClick={() => setSelections({ ...selections, [a.id]: qty + 1 })}
                              className="h-8 w-8 rounded-md border hover:bg-muted"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StepSchedule({ date, setDate, time, setTime, frequency, recurringDay, setRecurringDay }: any) {
  const isRecurring = frequency && frequency !== "one_time";
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Schedule</h2>
      <p className="text-sm text-muted-foreground mb-5">Pick your first visit.</p>
      <div className="space-y-5">
        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            className="mt-2 h-12 text-base"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <Label>Time</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={`h-12 rounded-lg border text-xs font-medium transition-colors active:scale-[0.96] ${time === t ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {isRecurring && (
          <div>
            <Label>Preferred Recurring Day</Label>
            <div className="grid grid-cols-7 gap-1 mt-2">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => setRecurringDay(d)}
                  className={`h-12 rounded-lg border text-xs font-medium transition-colors active:scale-[0.96] ${recurringDay === d ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepContact({ contact, setContact }: any) {
  const upd = (k: string, v: string) => setContact({ ...contact, [k]: v });
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Your Info</h2>
      <p className="text-sm text-muted-foreground mb-5">We'll send confirmation to your email.</p>
      <div className="space-y-4">
        <div>
          <Label>Full Name</Label>
          <Input className="mt-1 h-12 text-base" value={contact.name} onChange={(e) => upd("name", e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            type="tel"
            className="mt-1 h-12 text-base"
            value={contact.phone}
            onChange={(e) => upd("phone", e.target.value)}
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            className="mt-1 h-12 text-base"
            value={contact.email}
            onChange={(e) => upd("email", e.target.value)}
          />
        </div>
        <div>
          <Label>Address</Label>
          <Input
            className="mt-1 h-12 text-base"
            value={contact.address}
            onChange={(e) => upd("address", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">City</Label>
            <Input className="mt-1 h-12 text-base" value={contact.city} onChange={(e) => upd("city", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">State</Label>
            <Input
              className="mt-1 h-12 text-base"
              value={contact.state}
              onChange={(e) => upd("state", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">ZIP</Label>
            <Input className="mt-1 h-12 text-base" value={contact.zip} onChange={(e) => upd("zip", e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Notes (optional)</Label>
          <Textarea
            className="mt-1 text-base"
            rows={3}
            value={contact.notes}
            onChange={(e) => upd("notes", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function StepReview({
  serviceType,
  frequency,
  condition,
  sqft,
  bedrooms,
  bathrooms,
  propertyType,
  addOns,
  date,
  time,
  recurringDay,
  contact,
  price,
  onSubmit,
  submitting,
}: any) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Review & Confirm</h2>
      <p className="text-sm text-muted-foreground mb-5">Make sure everything looks good.</p>
      <Card className="p-4 space-y-3 text-sm">
        <Row label="Service" value={SERVICE_LABELS[serviceType]} />
        <Row label="Frequency" value={FREQUENCY_LABELS[frequency]} />
        <Row label="Condition" value={condition?.charAt(0).toUpperCase() + condition?.slice(1)} />
        {propertyType && <Row label="Property" value={propertyType} />}
        <Row label="Square Feet" value={sqft} />
        {bedrooms && <Row label="Bedrooms" value={bedrooms} />}
        {bathrooms && <Row label="Bathrooms" value={bathrooms} />}
        <Row label="Date" value={date} />
        <Row label="Time" value={time} />
        {recurringDay && <Row label="Recurring Day" value={recurringDay} />}
        <Row label="Name" value={contact.name} />
        <Row label="Email" value={contact.email} />
        <Row
          label="Address"
          value={[contact.address, contact.city, contact.state, contact.zip].filter(Boolean).join(", ")}
        />
        {addOns.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Add-Ons</div>
            {addOns.map((a: any) => (
              <div key={a.id} className="flex justify-between text-xs">
                <span>
                  {a.label}
                  {a.quantity > 1 ? ` × ${a.quantity}` : ""}
                </span>
                <span>{a.is_percent ? `+${a.percent}%` : `+$${(a.price * a.quantity).toFixed(2)}`}</span>
              </div>
            ))}
          </div>
        )}
        <div className="pt-3 border-t">
          {price?.hidden ? (
            <div className="text-center">
              <div className="text-amber-600 font-bold">On-Site Quote Required</div>
              <div className="text-xs text-muted-foreground mt-1">
                Properties over 3,000 sq ft need a personalised quote.
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="font-semibold">Estimated Total</span>
              <span className="text-2xl font-bold text-primary">${price?.total.toFixed(2)}</span>
            </div>
          )}
        </div>
      </Card>
      <Button onClick={onSubmit} disabled={submitting} className="w-full h-14 mt-6 text-base font-semibold">
        {submitting ? "Submitting…" : price?.hidden ? "Request On-Site Quote" : "Pay & Book Now"}
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
