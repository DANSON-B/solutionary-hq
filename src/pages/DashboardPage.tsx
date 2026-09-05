import { useEffect, useState } from "react";
import { Outlet, Navigate, useSearchParams, useLocation } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { BackNav } from "@/components/dashboard/BackNav";
import { HelpLauncher } from "@/components/help/HelpLauncher";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

function RouteTransition() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fade-in">
      <Outlet />
    </div>
  );
}



export default function DashboardLayout() {
  const { user, business, loading, refreshBusiness, subscription } = useAuth();
  const [checkingBusiness, setCheckingBusiness] = useState(true);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Show success toast when redirected from Stripe checkout
  useEffect(() => {
    if (searchParams.get("subscription") === "success") {
      toast({ title: "Welcome!", description: "Your subscription is now active. Enjoy your 14-day free trial!" });
    }
  }, [searchParams]);

  useEffect(() => {
    let isActive = true;

    if (loading) {
      setCheckingBusiness(true);
      return () => { isActive = false; };
    }

    if (!user) {
      setCheckingBusiness(false);
      return () => { isActive = false; };
    }

    if (business) {
      setCheckingBusiness(false);
      return () => { isActive = false; };
    }

    const verifyBusiness = async () => {
      await refreshBusiness();
      if (isActive) setCheckingBusiness(false);
    };

    verifyBusiness();
    return () => { isActive = false; };
  }, [loading, user?.id, business?.id]);

  if (loading || (user && !business && checkingBusiness)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!business) return <Navigate to="/onboarding" replace />;

  // Gate: require active subscription or trial
  if (subscription.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Checking subscription...</div>
      </div>
    );
  }
  if (!subscription.subscribed) {
    return <Navigate to="/choose-plan" replace />;
  }

  // Calculate trial warning
  const trialDaysLeft = subscription.trialEnd
    ? Math.max(0, Math.ceil((new Date(subscription.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const showTrialWarning = subscription.status === "trialing" && trialDaysLeft !== null && trialDaysLeft <= 3;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4">
            <SidebarTrigger className="mr-4" />
            <span className="text-sm font-medium text-muted-foreground">{business.name}</span>
          </header>
          {showTrialWarning && (
            <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-destructive font-medium">
                Your trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}. 
              </span>
              <a href="/dashboard/settings" className="text-destructive underline font-medium ml-1">
                Manage subscription →
              </a>
            </div>
          )}
          <BackNav />
          <main className="flex-1 p-4 sm:p-6 md:p-8 pt-2 bg-secondary/30 overflow-x-hidden">
            <RouteTransition />
          </main>
          <OnboardingWizard />
          <HelpLauncher />
        </div>
      </div>
    </SidebarProvider>
  );
}
