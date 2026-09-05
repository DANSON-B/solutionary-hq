import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, User, AlertTriangle, Repeat } from "lucide-react";

interface CleaningBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: any;
  items: any[];
}

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

const FREQUENCY_OPTIONS = [
  { value: "one_time", label: "One-Time" },
  { value: "weekly", label: "Weekly" },
  { value: "bi_weekly", label: "Bi-Weekly" },
  { value: "monthly", label: "Monthly" },
];

const FREQUENCY_DISCOUNTS: Record<string, number> = {
  one_time: 0,
  weekly: 15,
  bi_weekly: 10,
  monthly: 5,
};

export function CleaningBookingDialog({ open, onOpenChange, quote, items }: CleaningBookingDialogProps) {
  const { business } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [frequency, setFrequency] = useState("one_time");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [existingJobs, setExistingJobs] = useState<any[]>([]);
  const [bookingSettings, setBookingSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!business || !open) return;
    Promise.all([
      supabase.from("team_members").select("id, full_name, role").eq("business_id", business.id).eq("is_active", true),
      supabase.from("cleaning_booking_settings").select("*").eq("business_id", business.id).maybeSingle(),
    ]).then(([teamRes, settingsRes]) => {
      setTeamMembers(teamRes.data || []);
      setBookingSettings(settingsRes.data);
    });
  }, [business, open]);

  // Check for conflicts when date/time/assignee changes
  useEffect(() => {
    if (!business || !date || !time) return;
    const startOfSelectedDay = format(date, "yyyy-MM-dd");
    supabase
      .from("jobs")
      .select("id, title, scheduled_start, scheduled_end, assigned_to")
      .eq("business_id", business.id)
      .gte("scheduled_start", `${startOfSelectedDay}T00:00:00`)
      .lte("scheduled_start", `${startOfSelectedDay}T23:59:59`)
      .in("status", ["scheduled", "in_progress"])
      .then(({ data }) => setExistingJobs(data || []));
  }, [business, date, time]);

  const bufferMinutes = bookingSettings?.buffer_minutes ?? 30;
  const requireDeposit = bookingSettings?.require_deposit ?? false;
  const depositPct = bookingSettings?.deposit_percentage ?? 25;

  const discount = FREQUENCY_DISCOUNTS[frequency] || 0;
  const baseTotal = quote?.total || 0;
  const discountedTotal = Math.round(baseTotal * (1 - discount / 100) * 100) / 100;
  const depositAmount = requireDeposit ? Math.round(discountedTotal * (depositPct / 100) * 100) / 100 : 0;

  // Check for double booking
  const hasConflict =
    assignedTo &&
    date &&
    time &&
    existingJobs.some((job) => {
      if (job.assigned_to !== assignedTo) return false;
      if (!job.scheduled_start) return false;
      const jobStart = new Date(job.scheduled_start);
      const selectedStart = new Date(`${format(date, "yyyy-MM-dd")}T${time}:00`);
      const jobEnd = job.scheduled_end
        ? new Date(job.scheduled_end)
        : new Date(jobStart.getTime() + 2 * 60 * 60 * 1000);
      const selectedEnd = new Date(selectedStart.getTime() + 2 * 60 * 60 * 1000);
      // Add buffer
      const bufferedJobEnd = new Date(jobEnd.getTime() + bufferMinutes * 60 * 1000);
      const bufferedSelectedEnd = new Date(selectedEnd.getTime() + bufferMinutes * 60 * 1000);
      return selectedStart < bufferedJobEnd && jobStart < bufferedSelectedEnd;
    });

  const slotsToday = date && existingJobs.filter((j) => j.assigned_to === assignedTo).length;
  const limitedAvailability = slotsToday !== undefined && slotsToday >= 3;

  const handleBook = async () => {
    if (!business || !quote || !date || !time) {
      toast({ title: "Please select date and time", variant: "destructive" });
      return;
    }
    setSaving(true);

    const scheduledStart = new Date(`${format(date, "yyyy-MM-dd")}T${time}:00`);
    const scheduledEnd = new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000); // 2hr default

    // Create job from quote
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        business_id: business.id,
        customer_id: quote.customer_id,
        quote_id: quote.id,
        title: `Cleaning - ${quote.quote_number}`,
        description: quote.notes,
        status: "scheduled" as const,
        total: discountedTotal,
        address: quote.customers?.address,
        assigned_to: assignedTo || null,
        scheduled_start: scheduledStart.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
      })
      .select()
      .single();

    if (error || !job) {
      toast({ title: "Error creating booking", description: error?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Update quote to approved
    await supabase
      .from("quotes")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", quote.id);

    // If recurring, create the recurring booking record
    if (frequency !== "one_time") {
      const dayOfWeek = date.getDay();
      await supabase.from("cleaning_recurring_bookings").insert({
        business_id: business.id,
        customer_id: quote.customer_id,
        frequency,
        preferred_day_of_week: dayOfWeek,
        preferred_time: time,
        assigned_to: assignedTo || null,
        cleaning_type: "standard",
        total_per_visit: discountedTotal,
        discount_percentage: discount,
        next_scheduled_date: format(getNextRecurringDate(date, frequency), "yyyy-MM-dd"),
        last_job_id: job.id,
      });
    }

    // If deposit required, create invoice for deposit
    if (requireDeposit && depositAmount > 0) {
      const invoiceNumber = `DEP-${Date.now().toString().slice(-6)}`;
      await supabase.from("invoices").insert({
        business_id: business.id,
        customer_id: quote.customer_id,
        quote_id: quote.id,
        job_id: job.id,
        invoice_number: invoiceNumber,
        status: "sent" as const,
        subtotal: depositAmount,
        total: depositAmount,
        notes: `Deposit (${depositPct}%) for cleaning booking ${quote.quote_number}`,
      });
    }

    // Add cleaning checklist items based on quote notes
    const checklistItems = getCleaningChecklist(quote.notes || "");
    if (checklistItems.length > 0) {
      await supabase.from("job_checklist_items").insert(
        checklistItems.map((label, i) => ({
          job_id: job.id,
          business_id: business.id,
          label,
          sort_order: i,
        })),
      );
    }

    // Create reminders (24h before and same-day)
    const dayBefore = new Date(scheduledStart.getTime() - 24 * 60 * 60 * 1000);
    const sameDayMorning = new Date(`${format(date, "yyyy-MM-dd")}T07:00:00`);
    const reminders = [];
    if (dayBefore > new Date()) {
      reminders.push({
        business_id: business.id,
        job_id: job.id,
        customer_id: quote.customer_id,
        reminder_type: "day_before",
        scheduled_for: dayBefore.toISOString(),
      });
    }
    if (sameDayMorning > new Date()) {
      reminders.push({
        business_id: business.id,
        job_id: job.id,
        customer_id: quote.customer_id,
        reminder_type: "same_day",
        scheduled_for: sameDayMorning.toISOString(),
      });
    }
    if (reminders.length > 0) {
      await supabase.from("cleaning_reminders").insert(reminders);
    }

    // Send booking confirmation email
    if (quote.customers?.email) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "job-confirmed",
          recipientEmail: quote.customers.email,
          idempotencyKey: `job-confirmed-${job.id}`,
          templateData: {
            customerName: quote.customers.first_name,
            jobTitle: `Cleaning - ${quote.quote_number}`,
            scheduledDate: format(date, "PPP"),
            scheduledTime: format(new Date(`2000-01-01T${time}`), "h:mm a"),
            address: quote.customers.address,
            businessName: business?.name,
          },
        },
      });
    }

    toast({
      title: "Booking confirmed! 🎉",
      description:
        frequency !== "one_time"
          ? `Recurring ${frequency.replace("_", "-")} cleaning scheduled with ${discount}% discount.`
          : "Cleaning job has been scheduled.",
    });
    onOpenChange(false);
    navigate(`/dashboard/jobs/${job.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Schedule Cleaning
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Date picker */}
          <div>
            <Label className="text-sm font-medium">Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal mt-1.5", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => isBefore(d, startOfDay(new Date()))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time selector */}
          <div>
            <Label className="text-sm font-medium">Select Time</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {format(new Date(`2000-01-01T${slot}`), "h:mm a")}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cleaner assignment */}
          <div>
            <Label className="text-sm font-medium">Assign Cleaner</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.full_name}>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {m.full_name} ({m.role})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conflict warning */}
          {hasConflict && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Schedule Conflict</p>
                <p className="text-muted-foreground">
                  This cleaner has another job at this time (including {bufferMinutes}min buffer).
                </p>
              </div>
            </div>
          )}

          {/* Limited availability */}
          {limitedAvailability && !hasConflict && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 p-3">
              <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 font-medium">
                Limited availability — this cleaner already has {slotsToday} jobs today.
              </p>
            </div>
          )}

          {/* Recurring frequency */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Repeat className="h-4 w-4" /> Booking Frequency
            </Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                    {FREQUENCY_DISCOUNTS[opt.value] > 0 && (
                      <span className="text-xs text-green-600 ml-2">-{FREQUENCY_DISCOUNTS[opt.value]}%</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {discount > 0 && (
              <p className="text-xs text-green-600 mt-1">
                🎉 {discount}% recurring discount applied! Save ${((baseTotal * discount) / 100).toFixed(2)} per visit.
              </p>
            )}
          </div>

          {/* Pricing summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Service Total</span>
              <span>${baseTotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Recurring Discount ({discount}%)</span>
                <span>-${((baseTotal * discount) / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total</span>
              <span className="text-primary">${discountedTotal.toFixed(2)}</span>
            </div>
            {requireDeposit && (
              <div className="flex justify-between text-sm text-muted-foreground border-t pt-2">
                <span>Deposit Due ({depositPct}%)</span>
                <span>${depositAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Book button */}
          <Button onClick={handleBook} disabled={saving || !date || !time || hasConflict} className="w-full" size="lg">
            {saving
              ? "Booking..."
              : requireDeposit
                ? `Book & Send Deposit Invoice ($${depositAmount.toFixed(2)})`
                : "Confirm Booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getNextRecurringDate(currentDate: Date, frequency: string): Date {
  switch (frequency) {
    case "weekly":
      return addDays(currentDate, 7);
    case "bi_weekly":
      return addDays(currentDate, 14);
    case "monthly":
      return addDays(currentDate, 30);
    default:
      return addDays(currentDate, 7);
  }
}

function getCleaningChecklist(notes: string): string[] {
  const lower = notes.toLowerCase();
  const checklist: string[] = [];

  // Base cleaning items
  checklist.push("Dust all surfaces");
  checklist.push("Vacuum all floors");
  checklist.push("Mop hard floors");
  checklist.push("Clean bathrooms");
  checklist.push("Clean kitchen counters & sink");
  checklist.push("Empty trash cans");

  if (lower.includes("deep")) {
    checklist.push("Clean baseboards");
    checklist.push("Wipe light switches & door handles");
    checklist.push("Clean window sills");
    checklist.push("Clean behind appliances");
  }

  if (lower.includes("move")) {
    checklist.push("Clean inside all closets");
    checklist.push("Clean all shelving");
    checklist.push("Wipe interior doors");
    checklist.push("Deep clean all fixtures");
  }

  // Add-ons from notes
  if (lower.includes("fridge")) checklist.push("Clean inside refrigerator");
  if (lower.includes("oven")) checklist.push("Clean inside oven");
  if (lower.includes("cabinet")) checklist.push("Clean inside cabinets");
  if (lower.includes("laundry")) checklist.push("Laundry service");
  if (lower.includes("window")) checklist.push("Clean windows");
  if (lower.includes("garage")) checklist.push("Clean garage");

  return checklist;
}
