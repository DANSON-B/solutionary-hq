import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  quotes: "Quotes",
  new: "New",
  jobs: "Jobs",
  invoices: "Invoices",
  customers: "Customers",
  services: "Services",
  "ai-estimator": "AI Estimator",
  "map-measure": "Map Measure",
  "route-optimizer": "Route Optimizer",
  calendar: "Calendar",
  "service-requests": "Service Requests",
  reviews: "Reviews",
  "team-hq": "Team HQ",
  "call-quote-console": "Call Quote Console",
  team: "Team",
  schedule: "Schedule",
  analytics: "Analytics",
  settings: "Settings",
  field: "Field View",
  "cleaning-quote": "Cleaning Quote",
  "recurring-cleanings": "Recurring",
  "missed-leads": "Missed Leads",
  "cleaning-packages": "Packages",
  "cleaning-automations": "Automations",
  "cleaning-analytics": "Cleaning Analytics",
  "booking-requests": "Booking Requests",
  "gift-cards": "Gift Cards",
  "cleaning-wizard-config": "Wizard Config",
  "checklist-templates": "Checklists",
  marketing: "Marketing",
  memberships: "Memberships",
  inventory: "Inventory",
  accounting: "Accounting",
  offline: "Offline",
};

function label(seg: string) {
  return LABELS[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function BackNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const segments = location.pathname.split("/").filter(Boolean);

  const canGoBack = window.history.length > 1;

  // Keyboard navigation: Alt+← to go back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (target?.isContentEditable) return;
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        canGoBack ? navigate(-1) : navigate("/dashboard");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canGoBack, navigate]);

  // Hide on dashboard root
  if (segments.length <= 1) return null;


  const crumbs = segments.map((seg, i) => {
    const to = "/" + segments.slice(0, i + 1).join("/");
    return { seg, to, label: label(seg) };
  });

  return (
    <div className="flex items-center gap-2 px-4 sm:px-6 md:px-8 pt-4 pb-2 animate-fade-in">
      <button
        onClick={() => (canGoBack ? navigate(-1) : navigate("/dashboard"))}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-full",
          "border border-border/60 bg-card/80 backdrop-blur-sm",
          "px-3 py-1.5 text-sm font-medium text-foreground/80",
          "shadow-sm hover:shadow-md hover:border-primary/40 hover:text-primary",
          "hover:-translate-x-0.5 active:translate-x-0",
          "transition-all duration-200"
        )}
        aria-label="Go back"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <nav aria-label="Breadcrumb" className="flex items-center min-w-0 flex-1">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground overflow-hidden">
          <li className="flex items-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </li>
          {crumbs.slice(1).map((c, i, arr) => {
            const isLast = i === arr.length - 1;
            return (
              <li key={c.to} className="flex items-center gap-1 min-w-0">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                {isLast ? (
                  <span className="px-2 py-1 font-semibold text-foreground truncate max-w-[40vw] sm:max-w-none">
                    {c.label}
                  </span>
                ) : (
                  <Link
                    to={c.to}
                    className="px-2 py-1 rounded-md hover:bg-secondary hover:text-foreground transition-colors truncate max-w-[30vw] sm:max-w-none"
                  >
                    {c.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
