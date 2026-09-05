import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsCleaning } from "@/hooks/useIsCleaning";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Zap, Mail, Clock, Star, CalendarPlus, MessageSquare, Plus } from "lucide-react";

interface AutomationTemplate {
  id: string;
  template_type: string;
  name: string;
  description: string | null;
  trigger_event: string;
  delay_days: number;
  message_template: string | null;
  is_active: boolean;
}

const PREBUILT_TEMPLATES = [
  {
    template_type: "quote_follow_up",
    name: "Quote Follow-Up",
    description: "Automatically follow up on quotes that haven't been approved after 2 days.",
    trigger_event: "quote_sent",
    delay_days: 2,
    message_template: "Hi {customer_name}, just checking in about the cleaning quote we sent. Ready to book? Reply to schedule!",
    icon: Mail,
    color: "text-blue-600 bg-blue-100",
  },
  {
    template_type: "booking_confirmation",
    name: "Booking Confirmation",
    description: "Send confirmation details immediately after a cleaning is booked.",
    trigger_event: "job_created",
    delay_days: 0,
    message_template: "Your cleaning is confirmed for {date} at {time}! Address: {address}. See you then!",
    icon: CalendarPlus,
    color: "text-green-600 bg-green-100",
  },
  {
    template_type: "post_cleaning_review",
    name: "Post-Cleaning Review Request",
    description: "Request a review 1 day after the cleaning is completed.",
    trigger_event: "job_completed",
    delay_days: 1,
    message_template: "Thanks for choosing us! How was your cleaning? Leave a quick review: {review_link}",
    icon: Star,
    color: "text-amber-600 bg-amber-100",
  },
  {
    template_type: "rebooking_reminder",
    name: "Rebooking Reminder",
    description: "Remind customers to rebook after 30 days since last cleaning.",
    trigger_event: "days_since_last_clean",
    delay_days: 30,
    message_template: "Hi {customer_name}, it's been a month since your last cleaning. Book your next one and save with a recurring plan!",
    icon: Clock,
    color: "text-purple-600 bg-purple-100",
  },
  {
    template_type: "missed_quote_discount",
    name: "Missed Quote Discount Offer",
    description: "Send a discount offer for quotes that weren't booked after 5 days.",
    trigger_event: "quote_not_booked",
    delay_days: 5,
    message_template: "Hi {customer_name}, we noticed you haven't booked yet. Here's 10% off your first cleaning! Use code: CLEAN10",
    icon: MessageSquare,
    color: "text-pink-600 bg-pink-100",
  },
  {
    template_type: "day_before_reminder",
    name: "Day-Before Reminder",
    description: "Remind customers about their cleaning appointment 24 hours before.",
    trigger_event: "job_day_before",
    delay_days: 0,
    message_template: "Reminder: Your cleaning is tomorrow at {time}. Please ensure easy access to your home. See you soon!",
    icon: Clock,
    color: "text-teal-600 bg-teal-100",
  },
];

export default function CleaningAutomationsPage() {
  const isCleaning = useIsCleaning();
  const { business } = useAuth();
  const { toast } = useToast();
  const [automations, setAutomations] = useState<AutomationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    fetchAutomations();
  }, [business]);

  const fetchAutomations = async () => {
    if (!business) return;
    const { data } = await supabase
      .from("cleaning_automation_templates")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at");
    setAutomations((data as AutomationTemplate[]) || []);
    setLoading(false);
  };

  const seedTemplates = async () => {
    if (!business) return;
    const toInsert = PREBUILT_TEMPLATES.map((t) => ({
      business_id: business.id,
      template_type: t.template_type,
      name: t.name,
      description: t.description,
      trigger_event: t.trigger_event,
      delay_days: t.delay_days,
      message_template: t.message_template,
      is_active: false,
    }));
    const { error } = await supabase.from("cleaning_automation_templates").insert(toInsert);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Templates loaded!" });
    fetchAutomations();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from("cleaning_automation_templates").update({ is_active: !isActive, updated_at: new Date().toISOString() }).eq("id", id);
    toast({ title: !isActive ? "Automation enabled" : "Automation paused" });
    fetchAutomations();
  };

  if (!isCleaning) return <Navigate to="/dashboard" replace />;
  if (loading) return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading...</div>;

  const activeCount = automations.filter((a) => a.is_active).length;

  // Match prebuilt template config by template_type
  const getTemplateConfig = (type: string) => PREBUILT_TEMPLATES.find((t) => t.template_type === type);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Automations</h1>
            <p className="text-sm text-muted-foreground">{activeCount} of {automations.length} active</p>
          </div>
        </div>
      </div>

      {automations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Set Up Automations</h2>
            <p className="text-muted-foreground mb-4">Load prebuilt cleaning automation templates to streamline your workflow.</p>
            <Button onClick={seedTemplates}><Plus className="h-4 w-4 mr-2" /> Load Templates</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map((auto) => {
            const config = getTemplateConfig(auto.template_type);
            const Icon = config?.icon || Zap;
            const colorClass = config?.color || "text-primary bg-primary/10";
            return (
              <Card key={auto.id} className={auto.is_active ? "border-primary/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{auto.name}</span>
                        {auto.is_active ? (
                          <Badge className="text-[10px] bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Paused</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{auto.description}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          Trigger: <span className="font-medium">{auto.trigger_event.replace(/_/g, " ")}</span>
                        </span>
                        {auto.delay_days > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Delay: <span className="font-medium">{auto.delay_days} day{auto.delay_days > 1 ? "s" : ""}</span>
                          </span>
                        )}
                      </div>
                      {auto.message_template && (
                        <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground italic">
                          "{auto.message_template}"
                        </div>
                      )}
                    </div>
                    <div className="flex items-center sm:pt-1">
                      <Switch checked={auto.is_active} onCheckedChange={() => toggleActive(auto.id, auto.is_active)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
