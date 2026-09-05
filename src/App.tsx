import { Suspense } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelmetProvider } from "react-helmet-async";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ServiceWorkerUpdatePrompt } from "@/components/ServiceWorkerUpdatePrompt";

const Index = lazyWithRetry(() => import("./pages/Index"));
const BookingPage = lazyWithRetry(() => import("./pages/BookingPage"));
const DashboardLayout = lazyWithRetry(() => import("./pages/DashboardPage"));
const LoginPage = lazyWithRetry(() => import("./pages/LoginPage"));
const OnboardingPage = lazyWithRetry(() => import("./pages/OnboardingPage"));
const IndustryPage = lazyWithRetry(() => import("./pages/IndustryPage"));
const FeaturePage = lazyWithRetry(() => import("./pages/FeaturePage"));
const PricingPage = lazyWithRetry(() => import("./pages/PricingPage"));
const ContactPage = lazyWithRetry(() => import("./pages/ContactPage"));
const AboutPage = lazyWithRetry(() => import("./pages/AboutPage"));
const InstaQuotePage = lazyWithRetry(() => import("./pages/InstaQuotePage"));
const InvoicePaymentPage = lazyWithRetry(() => import("./pages/InvoicePaymentPage"));
const CustomerPortalPage = lazyWithRetry(() => import("./pages/CustomerPortalPage"));
const ReviewSubmitPage = lazyWithRetry(() => import("./pages/ReviewSubmitPage"));
const PublicReviewsPage = lazyWithRetry(() => import("./pages/PublicReviewsPage"));
const ResetPasswordPage = lazyWithRetry(() => import("./pages/ResetPasswordPage"));
const ChoosePlanPage = lazyWithRetry(() => import("./pages/ChoosePlanPage"));
const CustomerLoginPage = lazyWithRetry(() => import("./pages/CustomerLoginPage"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const HelpCenterPage = lazyWithRetry(() => import("./pages/HelpCenterPage"));
const HelpArticlePage = lazyWithRetry(() =>
  import("./pages/HelpCenterPage").then((m) => ({ default: m.HelpArticlePage })),
);
const AdminTenantsPage = lazyWithRetry(() => import("./pages/AdminTenantsPage"));
const CallQuoteViewPage = lazyWithRetry(() => import("./pages/CallQuoteViewPage"));
const CallQuoteConsolePage = lazyWithRetry(() => import("./pages/dashboard/CallQuoteConsolePage"));
const ContractorInvoiceTemplatePage = lazyWithRetry(() => import("./pages/ContractorInvoiceTemplatePage"));
const OfflineDiagnosticsPage = lazyWithRetry(() => import("./pages/dashboard/OfflineDiagnosticsPage"));

const DashboardHome = lazyWithRetry(() => import("./pages/dashboard/DashboardHome"));
const QuotesPage = lazyWithRetry(() => import("./pages/dashboard/QuotesPage"));
const NewQuotePage = lazyWithRetry(() => import("./pages/dashboard/NewQuotePage"));
const QuoteDetailPage = lazyWithRetry(() => import("./pages/dashboard/QuoteDetailPage"));
const JobsPage = lazyWithRetry(() => import("./pages/dashboard/JobsPage"));
const JobDetailPage = lazyWithRetry(() => import("./pages/dashboard/JobDetailPage"));
const InvoicesPage = lazyWithRetry(() => import("./pages/dashboard/InvoicesPage"));
const CustomersPage = lazyWithRetry(() => import("./pages/dashboard/CustomersPage"));
const ServicesPage = lazyWithRetry(() => import("./pages/dashboard/ServicesPage"));
const AIEstimatorPage = lazyWithRetry(() => import("./pages/dashboard/AIEstimatorPage"));
const MapMeasurePage = lazyWithRetry(() => import("./pages/dashboard/MapMeasurePage"));
const CalendarPage = lazyWithRetry(() => import("./pages/dashboard/CalendarPage"));
const RouteOptimizerPage = lazyWithRetry(() => import("./pages/dashboard/RouteOptimizerPage"));
const ServiceRequestsPage = lazyWithRetry(() => import("./pages/dashboard/ServiceRequestsPage"));
const ReviewsPage = lazyWithRetry(() => import("./pages/dashboard/ReviewsPage"));
const SettingsPage = lazyWithRetry(() => import("./pages/dashboard/SettingsPage"));
const AnalyticsPage = lazyWithRetry(() => import("./pages/dashboard/AnalyticsPage"));
const TeamPage = lazyWithRetry(() => import("./pages/dashboard/TeamPage"));
const TeamHqPage = lazyWithRetry(() => import("./pages/dashboard/TeamHqPage"));
const TeamSchedulingPage = lazyWithRetry(() => import("./pages/dashboard/TeamSchedulingPage"));
const TechnicianViewPage = lazyWithRetry(() => import("./pages/dashboard/TechnicianViewPage"));
const CleaningQuotePage = lazyWithRetry(() => import("./pages/dashboard/CleaningQuotePage"));
const RecurringCleaningsPage = lazyWithRetry(() => import("./pages/dashboard/RecurringCleaningsPage"));
const MissedLeadsPage = lazyWithRetry(() => import("./pages/dashboard/MissedLeadsPage"));
const CleaningPackagesPage = lazyWithRetry(() => import("./pages/dashboard/CleaningPackagesPage"));
const CleaningAutomationsPage = lazyWithRetry(() => import("./pages/dashboard/CleaningAutomationsPage"));
const CleaningAnalyticsPage = lazyWithRetry(() => import("./pages/dashboard/CleaningAnalyticsPage"));
const BookingRequestsPage = lazyWithRetry(() => import("./pages/dashboard/BookingRequestsPage"));
const GiftCardsPage = lazyWithRetry(() => import("./pages/dashboard/GiftCardsPage"));
const CleaningWizardConfigPage = lazyWithRetry(() => import("./pages/dashboard/CleaningWizardConfigPage"));
const ChecklistTemplatesPage = lazyWithRetry(() => import("./pages/dashboard/ChecklistTemplatesPage"));
const MarketingPage = lazyWithRetry(() => import("./pages/dashboard/MarketingPage"));
const MembershipsPage = lazyWithRetry(() => import("./pages/dashboard/MembershipsPage"));
const InventoryPage = lazyWithRetry(() => import("./pages/dashboard/InventoryPage"));
const AccountingPage = lazyWithRetry(() => import("./pages/dashboard/AccountingPage"));
const WebsiteBuilderPage = lazyWithRetry(() => import("./pages/dashboard/WebsiteBuilderPage"));
const TenantSiteLayout = lazyWithRetry(() => import("./pages/site/TenantSiteLayout"));
const TenantHomePage = lazyWithRetry(() => import("./pages/site/TenantHomePage"));
const TenantServicesPage = lazyWithRetry(() => import("./pages/site/TenantServicesPage"));
const TenantServiceDetailPage = lazyWithRetry(() => import("./pages/site/TenantServiceDetailPage"));
const TenantAboutPage = lazyWithRetry(() => import("./pages/site/TenantAboutPage"));
const TenantContactPage = lazyWithRetry(() => import("./pages/site/TenantContactPage"));
const TenantBookPage = lazyWithRetry(() => import("./pages/site/TenantBookPage"));
const TenantReviewsPage = lazyWithRetry(() => import("./pages/site/TenantReviewsPage"));
const TenantBlogPage = lazyWithRetry(() => import("./pages/site/TenantBlogPage"));
const TenantBlogPostPage = lazyWithRetry(() => import("./pages/site/TenantBlogPostPage"));
const TenantAreaPage = lazyWithRetry(() => import("./pages/site/TenantAreaPage"));
const queryClient = new QueryClient();

const routeFallback = (
  <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
    Loading...
  </div>
);

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <ServiceWorkerUpdatePrompt />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={routeFallback}>
            <Routes>
              {/* Marketing pages */}
              <Route path="/" element={<Index />} />
              <Route path="/book" element={<BookingPage />} />
              <Route path="/book/:slug" element={<BookingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/choose-plan" element={<ChoosePlanPage />} />
              <Route path="/industries/:slug" element={<IndustryPage />} />
              <Route path="/features/:slug" element={<FeaturePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/help" element={<HelpCenterPage />} />
              <Route path="/help/article/:slug" element={<HelpArticlePage />} />
              <Route path="/help/:categorySlug" element={<HelpCenterPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/q/:slug" element={<InstaQuotePage />} />
              <Route path="/pay/:invoiceId" element={<InvoicePaymentPage />} />
              <Route path="/pay/:invoiceId/success" element={<InvoicePaymentPage />} />
              <Route path="/portal/:token" element={<CustomerPortalPage />} />
              <Route path="/review/:token" element={<ReviewSubmitPage />} />
              <Route path="/reviews/:slug" element={<PublicReviewsPage />} />
              <Route path="/customer-login" element={<CustomerLoginPage />} />
              <Route path="/quote/:token" element={<CallQuoteViewPage />} />
              <Route path="/tools/contractor-invoice-template" element={<ContractorInvoiceTemplatePage />} />

              {/* Super admin */}
              <Route path="/admin" element={<AdminTenantsPage />} />
              <Route path="/admin/tenants" element={<AdminTenantsPage />} />

              {/* Dashboard (protected) */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="quotes" element={<QuotesPage />} />
                <Route path="quotes/new" element={<NewQuotePage />} />
                <Route path="quotes/:id" element={<QuoteDetailPage />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="jobs/:id" element={<JobDetailPage />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="ai-estimator" element={<AIEstimatorPage />} />
                <Route path="map-measure" element={<MapMeasurePage />} />
                <Route path="route-optimizer" element={<RouteOptimizerPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="service-requests" element={<ServiceRequestsPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="team-hq" element={<TeamHqPage />} />
                <Route path="call-quote-console" element={<CallQuoteConsolePage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="team/schedule" element={<TeamSchedulingPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="field" element={<TechnicianViewPage />} />
                <Route path="quotes/cleaning-quote" element={<CleaningQuotePage />} />
                <Route path="recurring-cleanings" element={<RecurringCleaningsPage />} />
                <Route path="missed-leads" element={<MissedLeadsPage />} />
                <Route path="cleaning-packages" element={<CleaningPackagesPage />} />
                <Route path="cleaning-automations" element={<CleaningAutomationsPage />} />
                <Route path="cleaning-analytics" element={<CleaningAnalyticsPage />} />
                <Route path="booking-requests" element={<BookingRequestsPage />} />
                <Route path="gift-cards" element={<GiftCardsPage />} />
                <Route path="cleaning-wizard-config" element={<CleaningWizardConfigPage />} />
                <Route path="checklist-templates" element={<ChecklistTemplatesPage />} />
                <Route path="marketing" element={<MarketingPage />} />
                <Route path="memberships" element={<MembershipsPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="accounting" element={<AccountingPage />} />
                <Route path="offline" element={<OfflineDiagnosticsPage />} />
                <Route path="website" element={<WebsiteBuilderPage />} />
              </Route>

              {/* AI-generated tenant sites */}
              <Route path="/site/:slug" element={<TenantSiteLayout />}>
                <Route index element={<TenantHomePage />} />
                <Route path="services" element={<TenantServicesPage />} />
                <Route path="services/:serviceSlug" element={<TenantServiceDetailPage />} />
                <Route path="about" element={<TenantAboutPage />} />
                <Route path="contact" element={<TenantContactPage />} />
                <Route path="book" element={<TenantBookPage />} />
                <Route path="reviews" element={<TenantReviewsPage />} />
                <Route path="blog" element={<TenantBlogPage />} />
                <Route path="blog/:postSlug" element={<TenantBlogPostPage />} />
                <Route path="areas/:city/:serviceSlug" element={<TenantAreaPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
