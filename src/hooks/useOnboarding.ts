import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  link: string;
  cta: string;
  /** auto steps are detected from real data, manual steps are ticked by the user */
  auto: boolean;
  articleSlug?: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: "business_profile",
    title: "Complete your business profile",
    description: "Add your business name, phone and industry so they appear on quotes, invoices and your booking page.",
    link: "/dashboard/settings",
    cta: "Open Settings",
    auto: true,
    articleSlug: "setup-business",
  },
  {
    key: "services",
    title: "Add your first service",
    description: "Create the services customers can book, with a price and how long they take.",
    link: "/dashboard/services",
    cta: "Add a service",
    auto: true,
    articleSlug: "first-service",
  },
  {
    key: "team",
    title: "Add your team",
    description: "Invite the people who will do the work so you can assign jobs to them.",
    link: "/dashboard/team",
    cta: "Add team members",
    auto: true,
    articleSlug: "add-team",
  },
  {
    key: "availability",
    title: "Set your availability",
    description: "Choose the days and hours your team can work so bookings land at the right times.",
    link: "/dashboard/team/schedule",
    cta: "Set availability",
    auto: false,
    articleSlug: "set-availability",
  },
  {
    key: "booking_settings",
    title: "Set up your booking form",
    description: "Pick the services, add-ons and pricing shown on your online booking form.",
    link: "/dashboard/cleaning-wizard-config",
    cta: "Configure booking",
    auto: false,
    articleSlug: "setup-booking",
  },
  {
    key: "payments",
    title: "Configure payments",
    description: "Turn on card payments and choose whether customers pay a deposit when booking.",
    link: "/dashboard/settings",
    cta: "Set up payments",
    auto: false,
    articleSlug: "setup-payments",
  },
  {
    key: "notifications",
    title: "Configure notifications",
    description: "Switch on confirmations, reminders and review requests so customers stay informed.",
    link: "/dashboard/cleaning-automations",
    cta: "Open automations",
    auto: false,
    articleSlug: "setup-notifications",
  },
  {
    key: "booking_page",
    title: "Publish your booking page",
    description: "Share your booking link, or generate a full website, so customers can book online.",
    link: "/dashboard/website",
    cta: "Open Website Builder",
    auto: true,
    articleSlug: "launch-booking-page",
  },
  {
    key: "first_booking",
    title: "Create your first booking",
    description: "Book a job on the calendar to see the full workflow in action.",
    link: "/dashboard/calendar",
    cta: "Create a booking",
    auto: true,
    articleSlug: "first-booking",
  },
];

interface OnboardingRow {
  completed_steps: string[];
  skipped_steps: string[];
  current_step: number;
  wizard_dismissed: boolean;
  checklist_dismissed: boolean;
}

const EMPTY: OnboardingRow = {
  completed_steps: [],
  skipped_steps: [],
  current_step: 0,
  wizard_dismissed: false,
  checklist_dismissed: false,
};

export function useOnboarding() {
  const { business } = useAuth();
  const [row, setRow] = useState<OnboardingRow>(EMPTY);
  const [autoDone, setAutoDone] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const [progress, services, team, jobs] = await Promise.all([
        supabase.from("business_onboarding").select("*").eq("business_id", business.id).maybeSingle(),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("business_id", business.id),
        supabase.from("team_members").select("id", { count: "exact", head: true }).eq("business_id", business.id),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("business_id", business.id),
      ]);

      if (progress.data) {
        setRow({
          completed_steps: progress.data.completed_steps ?? [],
          skipped_steps: progress.data.skipped_steps ?? [],
          current_step: progress.data.current_step ?? 0,
          wizard_dismissed: !!progress.data.wizard_dismissed,
          checklist_dismissed: !!progress.data.checklist_dismissed,
        });
      } else {
        setRow(EMPTY);
      }

      const detected: string[] = [];
      const biz = business as any;
      if (biz?.name && biz?.phone && biz?.industry) detected.push("business_profile");
      if ((services.count ?? 0) > 0) detected.push("services");
      if ((team.count ?? 0) > 0) detected.push("team");
      if (biz?.slug) detected.push("booking_page");
      if ((jobs.count ?? 0) > 0) detected.push("first_booking");
      setAutoDone(detected);
    } finally {
      setLoading(false);
    }
  }, [business]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (patch: Partial<OnboardingRow>) => {
      if (!business?.id) return;
      const next = { ...row, ...patch };
      setRow(next);
      await supabase
        .from("business_onboarding")
        .upsert({ business_id: business.id, ...next }, { onConflict: "business_id" });
    },
    [business?.id, row],
  );

  const completed = useMemo(() => {
    const set = new Set([...autoDone, ...row.completed_steps]);
    return ONBOARDING_STEPS.filter((s) => set.has(s.key)).map((s) => s.key);
  }, [autoDone, row.completed_steps]);

  const isComplete = (key: string) => completed.includes(key);
  const percent = Math.round((completed.length / ONBOARDING_STEPS.length) * 100);

  const markComplete = (key: string) =>
    save({ completed_steps: Array.from(new Set([...row.completed_steps, key])) });
  const markSkipped = (key: string) =>
    save({ skipped_steps: Array.from(new Set([...row.skipped_steps, key])) });
  const setCurrentStep = (index: number) => save({ current_step: index });
  const dismissWizard = () => save({ wizard_dismissed: true });
  const dismissChecklist = () => save({ checklist_dismissed: true });

  return {
    steps: ONBOARDING_STEPS,
    loading,
    completed,
    isComplete,
    percent,
    allDone: completed.length === ONBOARDING_STEPS.length,
    currentStep: row.current_step,
    wizardDismissed: row.wizard_dismissed,
    checklistDismissed: row.checklist_dismissed,
    markComplete,
    markSkipped,
    setCurrentStep,
    dismissWizard,
    dismissChecklist,
    refresh: load,
  };
}
