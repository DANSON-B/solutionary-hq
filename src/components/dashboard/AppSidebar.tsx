import { useState } from "react";
import { BusinessLogo } from "@/components/BusinessLogo";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Users,
  Briefcase,
  CreditCard,
  BarChart3,
  PieChart,
  Settings,
  Tag,
  Star,
  LogOut,
  Sparkles,
  Ruler,
  UsersRound,
  Route,
  Inbox,
  CalendarClock,
  Smartphone,
  Calculator,
  Repeat,
  TrendingDown,
  Package,
  Gift,
  Zap,
  ExternalLink,
  Copy,
  Check,
  ClipboardCheck,
  ShieldCheck,
  Phone,
  CloudOff,
  Globe,
  LifeBuoy,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsCleaning } from "@/hooks/useIsCleaning";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Quotes", url: "/dashboard/quotes", icon: FileText },
  { title: "Jobs", url: "/dashboard/jobs", icon: Briefcase },
  { title: "Calendar", url: "/dashboard/calendar", icon: CalendarDays },
  { title: "Requests", url: "/dashboard/service-requests", icon: Inbox },
  { title: "Invoices", url: "/dashboard/invoices", icon: CreditCard },
  { title: "Customers", url: "/dashboard/customers", icon: Users },
];

const toolsNav = [
  { title: "Website Builder", url: "/dashboard/website", icon: Globe, highlight: true as const },
  { title: "Call Quote Console", url: "/dashboard/call-quote-console", icon: Phone },
  { title: "AI Estimator", url: "/dashboard/ai-estimator", icon: Sparkles },
  { title: "MapMeasure", url: "/dashboard/map-measure", icon: Ruler },
  { title: "Route Optimizer", url: "/dashboard/route-optimizer", icon: Route },
  { title: "Field View", url: "/dashboard/field", icon: Smartphone },
];

const secondaryNav = [
  { title: "Services", url: "/dashboard/services", icon: Tag },
  { title: "Team HQ", url: "/dashboard/team-hq", icon: UsersRound },
  { title: "Team", url: "/dashboard/team", icon: Users },
  { title: "Team Schedule", url: "/dashboard/team/schedule", icon: CalendarClock },
  { title: "Reviews", url: "/dashboard/reviews", icon: Star },
  { title: "Marketing", url: "/dashboard/marketing", icon: Sparkles },
  { title: "Memberships", url: "/dashboard/memberships", icon: ShieldCheck },
  { title: "Inventory", url: "/dashboard/inventory", icon: Package },
  { title: "Accounting", url: "/dashboard/accounting", icon: Calculator },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Offline & Sync", url: "/dashboard/offline", icon: CloudOff },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
  { title: "Help Center", url: "/help", icon: LifeBuoy },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, business, user } = useAuth();
  const isCleaning = useIsCleaning();
  const [copied, setCopied] = useState(false);
  const bookingUrl = business?.slug ? `/book/${business.slug}` : "/book";
  const isSuperAdmin = user?.email?.toLowerCase() === "support@solutionaryhq.com";

  const cleaningNav = isCleaning
    ? [
        { title: "Cleaning Quote", url: "/dashboard/quotes/cleaning-quote", icon: Calculator },
        { title: "Booking Wizard", url: "/dashboard/cleaning-wizard-config", icon: Settings },
        { title: "Checklists", url: "/dashboard/checklist-templates", icon: ClipboardCheck },
        { title: "Recurring", url: "/dashboard/recurring-cleanings", icon: Repeat },
        { title: "Packages", url: "/dashboard/cleaning-packages", icon: Package },
        { title: "Gift Cards", url: "/dashboard/gift-cards", icon: Gift },
        { title: "Automations", url: "/dashboard/cleaning-automations", icon: Zap },
        { title: "Booking Requests", url: "/dashboard/booking-requests", icon: Inbox },
        { title: "Missed Leads", url: "/dashboard/missed-leads", icon: TrendingDown },
        { title: "Cleaning Analytics", url: "/dashboard/cleaning-analytics", icon: PieChart },
      ]
    : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
          <BusinessLogo name={business?.name} logoUrl={business?.logo_url} rounded="md" className="h-8 w-8" />
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground truncate" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              {business?.name || (
                <>
                  Solutionary<span className="text-sidebar-primary"> HQ</span>
                </>
              )}
            </span>
          )}
        </div>

        {/* Book Now Link */}
        <div className="px-3 py-2 flex items-center gap-1">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Book Now</span>}
          </a>
          {!collapsed && (
            <button
              onClick={() => {
                const fullUrl = `${window.location.origin}${bookingUrl}`;
                navigator.clipboard.writeText(fullUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="rounded-md border border-border p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Copy booking link"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </button>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/dashboard"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[...toolsNav, ...cleaningNav].map((item: any) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={
                        item.highlight
                          ? "hover:bg-sidebar-accent/50 bg-gradient-to-r from-primary/15 to-accent/15 border border-primary/30 font-semibold text-sidebar-primary"
                          : "hover:bg-sidebar-accent/50"
                      }
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <span className="flex items-center gap-2">
                          {item.title}
                          {item.highlight && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-bold tracking-wide">NEW</span>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/tenants" className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {!collapsed && <span>All Tenants</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
