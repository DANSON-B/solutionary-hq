import { BusinessLogo } from "@/components/BusinessLogo";
import { useBrandFavicon } from "@/hooks/useBrandFavicon";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  CreditCard,
  FileText,
  Loader2,
  X,
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  Phone,
  Mail,
  Camera,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  AlertCircle,
  Send,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

const JOB_STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-700", icon: Circle },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

const REQUEST_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  reviewed: { label: "Reviewed", color: "bg-blue-100 text-blue-700" },
  scheduled: { label: "Scheduled", color: "bg-green-100 text-green-700" },
  declined: { label: "Declined", color: "bg-destructive/10 text-destructive" },
};

export default function CustomerPortalPage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [checklistItems, setChecklistItems] = useState<Record<string, any[]>>({});
  useBrandFavicon(business?.logo_url, business?.name);
  const [quoteItems, setQuoteItems] = useState<Record<string, any[]>>({});
  const [jobPhotos, setJobPhotos] = useState<Record<string, any[]>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Photo lightbox
  const [lightboxPhotos, setLightboxPhotos] = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // Service request form
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqTitle, setReqTitle] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [reqDate, setReqDate] = useState("");
  const [reqTime, setReqTime] = useState("");
  const [reqAddress, setReqAddress] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Store token data for service request submissions
  const [tokenData, setTokenData] = useState<{ customer_id: string; business_id: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;

      const { data: bundle } = await supabase.rpc("get_portal_bundle", { p_token: token });
      const b: any = bundle;

      if (!b) { setLoading(false); return; }
      setValid(true);
      setTokenData({ customer_id: b.customer_id, business_id: b.business_id });

      setCustomer(b.customer);
      setBusiness(b.business);
      setQuotes(b.quotes || []);
      setInvoices(b.invoices || []);
      setJobs(b.jobs || []);
      setServiceRequests(b.service_requests || []);
      setMemberships(b.memberships || []);

      const groupedCl: Record<string, any[]> = {};
      (b.checklist_items || []).forEach((item: any) => {
        (groupedCl[item.job_id] = groupedCl[item.job_id] || []).push(item);
      });
      setChecklistItems(groupedCl);

      const groupedPhotos: Record<string, any[]> = {};
      (b.job_photos || []).forEach((p: any) => {
        (groupedPhotos[p.job_id] = groupedPhotos[p.job_id] || []).push(p);
      });
      setJobPhotos(groupedPhotos);

      // Fetch signed URLs for all job photos via edge function (bucket is private)
      const urlMap: Record<string, string> = {};
      await Promise.all(
        (b.job_photos || []).map(async (p: any) => {
          try {
            const { data: signed } = await supabase.functions.invoke("get-portal-photo-url", {
              body: { token, photo_id: p.id },
            });
            if (signed?.url) urlMap[p.id] = signed.url;
          } catch { /* ignore */ }
        }),
      );
      setPhotoUrls(urlMap);

      const items: Record<string, any[]> = {};
      (b.quotes || []).forEach((q: any) => { items[q.id] = q.quote_items || []; });
      setQuoteItems(items);
      setLoading(false);
    };
    load();
  }, [token]);

  const approveQuote = async (quoteId: string) => {
    setApprovingId(quoteId);
    const { error } = await supabase.rpc("portal_approve_quote", { p_token: token!, p_quote_id: quoteId, p_approve: true });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quote approved!", description: "The business has been notified." });
      setQuotes((prev) => prev.map((q) => q.id === quoteId ? { ...q, status: "approved", approved_at: new Date().toISOString() } : q));

      const quote = quotes.find((q) => q.id === quoteId);
      if (business?.email) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "quote-approved",
            recipientEmail: business.email,
            idempotencyKey: `quote-approved-${quoteId}`,
            templateData: {
              customerName: `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim(),
              quoteNumber: quote?.quote_number,
              total: (quote?.total || 0).toFixed(2),
            },
          },
        });
      }
    }
    setApprovingId(null);
  };

  const declineQuote = async (quoteId: string) => {
    const { error } = await supabase.rpc("portal_approve_quote", { p_token: token!, p_quote_id: quoteId, p_approve: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quote declined." });
      setQuotes((prev) => prev.map((q) => q.id === quoteId ? { ...q, status: "declined" } : q));
    }
  };

  const payInvoice = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-invoice-payment", { body: { invoiceId } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Payment Error", description: err.message, variant: "destructive" });
    }
  };

  const submitServiceRequest = async () => {
    if (!tokenData || !reqTitle.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSubmittingRequest(true);
    const { data: newId, error } = await supabase.rpc("portal_submit_service_request", {
      p_token: token!,
      p_title: reqTitle.trim(),
      p_description: reqDesc.trim() || null,
      p_preferred_date: reqDate || null,
      p_preferred_time: reqTime || null,
      p_address: reqAddress.trim() || customer?.address || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request submitted!", description: "The business will review your request shortly." });
      setShowRequestForm(false);
      setReqTitle(""); setReqDesc(""); setReqDate(""); setReqTime(""); setReqAddress("");

      if (business?.email) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "service-request-received",
            recipientEmail: business.email,
            idempotencyKey: `service-request-${newId}`,
            templateData: {
              customerName: `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim(),
              requestTitle: reqTitle.trim(),
              preferredDate: reqDate || undefined,
            },
          },
        });
      }

      // Refresh full bundle
      const { data: bundle } = await supabase.rpc("get_portal_bundle", { p_token: token! });
      if (bundle) setServiceRequests(((bundle as any).service_requests) || []);
    }
    setSubmittingRequest(false);
  };

  const openLightbox = (photos: any[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  const getPhotoUrl = (photo: any) => photoUrls[photo?.id] || "";

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      sent: "bg-primary/10 text-primary",
      viewed: "bg-primary/10 text-primary",
      approved: "bg-green-100 text-green-700",
      declined: "bg-destructive/10 text-destructive",
      expired: "bg-muted text-muted-foreground",
      paid: "bg-green-100 text-green-700",
      overdue: "bg-destructive/10 text-destructive",
    };
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[status] || "bg-muted"}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold mb-2">Link Expired or Invalid</h1>
          <p className="text-muted-foreground">This portal link may have expired. Please contact the business for a new link.</p>
        </div>
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => ["scheduled", "in_progress"].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const unpaidInvoices = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled");
  const pendingQuotes = quotes.filter((q) => ["sent", "viewed"].includes(q.status));

  // Attention items
  const attentionItems: { label: string; tab: string }[] = [];
  if (pendingQuotes.length > 0) attentionItems.push({ label: `${pendingQuotes.length} quote${pendingQuotes.length > 1 ? "s" : ""} awaiting your review`, tab: "quotes" });
  if (unpaidInvoices.length > 0) attentionItems.push({ label: `${unpaidInvoices.length} unpaid invoice${unpaidInvoices.length > 1 ? "s" : ""}`, tab: "invoices" });

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-4">
            <BusinessLogo name={business?.name} logoUrl={business?.logo_url} className="h-12 w-12" />
            <div className="flex-1">
              <h1 className="text-xl font-bold">{business?.name}</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {customer?.first_name}</p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
              {business?.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{business.phone}</span>}
              {business?.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{business.email}</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Attention Banner */}
        {attentionItems.length > 0 && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-amber-800 text-sm">Action Required</p>
                {attentionItems.map((item, i) => (
                  <p key={i} className="text-xs text-amber-700">• {item.label}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="text-2xl font-bold">{activeJobs.length}</div>
            <div className="text-xs text-muted-foreground">Active Jobs</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{pendingQuotes.length}</div>
            <div className="text-xs text-muted-foreground">Pending Quotes</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{unpaidInvoices.length}</div>
            <div className="text-xs text-muted-foreground">Unpaid Invoices</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{completedJobs.length}</div>
            <div className="text-xs text-muted-foreground">Jobs Done</div>
          </Card>
        </div>

        {/* Request Service Button */}
        <Button variant="outline" className="w-full" onClick={() => setShowRequestForm(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Request New Service
        </Button>

        <Tabs defaultValue={pendingQuotes.length > 0 ? "quotes" : "jobs"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="jobs" className="gap-1.5 text-xs sm:text-sm">
              <Briefcase className="h-4 w-4" /> <span className="hidden sm:inline">Jobs</span> ({jobs.length})
            </TabsTrigger>
            <TabsTrigger value="quotes" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="h-4 w-4" /> <span className="hidden sm:inline">Quotes</span> ({quotes.length})
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5 text-xs sm:text-sm">
              <CreditCard className="h-4 w-4" /> <span className="hidden sm:inline">Invoices</span> ({invoices.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1.5 text-xs sm:text-sm">
              <Send className="h-4 w-4" /> <span className="hidden sm:inline">Requests</span> ({serviceRequests.length})
            </TabsTrigger>
            <TabsTrigger value="memberships" className="gap-1.5 text-xs sm:text-sm">
              <Sparkles className="h-4 w-4" /> <span className="hidden sm:inline">Plans</span> ({memberships.length})
            </TabsTrigger>
          </TabsList>

          {/* JOBS TAB */}
          <TabsContent value="jobs" className="space-y-4">
            {jobs.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No jobs yet.</CardContent></Card>
            ) : (
              jobs.map((job) => {
                const config = JOB_STATUS_CONFIG[job.status] || JOB_STATUS_CONFIG.scheduled;
                const Icon = config.icon;
                const items = checklistItems[job.id] || [];
                const completedItems = items.filter((i: any) => i.is_completed);
                const photos = jobPhotos[job.id] || [];
                const beforePhotos = photos.filter((p: any) => p.photo_type === "before");
                const afterPhotos = photos.filter((p: any) => p.photo_type === "after");

                return (
                  <Card key={job.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{job.title}</CardTitle>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
                          <Icon className="h-3 w-3" /> {config.label}
                        </span>
                      </div>
                      {job.description && <p className="text-sm text-muted-foreground">{job.description}</p>}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {job.scheduled_start && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(job.scheduled_start).toLocaleDateString()} at{" "}
                            {new Date(job.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        {job.address && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.address}</span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {items.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{completedItems.length}/{items.length} tasks</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${items.length > 0 ? (completedItems.length / items.length) * 100 : 0}%` }}
                            />
                          </div>
                          {(() => {
                            const byRoom: Record<string, any[]> = {};
                            items.forEach((i: any) => { const k = i.room || "General"; (byRoom[k] = byRoom[k] || []).push(i); });
                            return Object.keys(byRoom).map((room) => (
                              <div key={room} className="space-y-1 pt-1">
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                  {room} ({byRoom[room].filter((i:any)=>i.is_completed).length}/{byRoom[room].length})
                                </div>
                                {byRoom[room].map((item: any) => (
                                  <div key={item.id} className="flex items-center gap-2 text-sm">
                                    {item.is_completed ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                                    )}
                                    <span className={`flex-1 ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>{item.label}</span>
                                    {item.photo_required && item.photo_id && (
                                      <Camera className="h-3 w-3 text-green-600 shrink-0" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            ));
                          })()}
                        </div>
                      )}

                      {/* Before/After Photo Gallery */}
                      {photos.length > 0 && (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Camera className="h-4 w-4" /> Job Photos
                          </div>

                          {/* Before & After comparison */}
                          {beforePhotos.length > 0 && afterPhotos.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Before</p>
                                <div
                                  className="relative aspect-video rounded-md overflow-hidden cursor-pointer group"
                                  onClick={() => openLightbox(beforePhotos, 0)}
                                >
                                  <img
                                    src={getPhotoUrl(beforePhotos[0])}
                                    alt="Before"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  {beforePhotos.length > 1 && (
                                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                      +{beforePhotos.length - 1}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">After</p>
                                <div
                                  className="relative aspect-video rounded-md overflow-hidden cursor-pointer group"
                                  onClick={() => openLightbox(afterPhotos, 0)}
                                >
                                  <img
                                    src={getPhotoUrl(afterPhotos[0])}
                                    alt="After"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  {afterPhotos.length > 1 && (
                                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                      +{afterPhotos.length - 1}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Photo grid if no before/after comparison */}
                          {(beforePhotos.length === 0 || afterPhotos.length === 0) && (
                            <div className="grid grid-cols-3 gap-1.5">
                              {photos.slice(0, 6).map((photo: any, idx: number) => (
                                <div
                                  key={photo.id}
                                  className="relative aspect-square rounded-md overflow-hidden cursor-pointer group"
                                  onClick={() => openLightbox(photos, idx)}
                                >
                                  <img
                                    src={getPhotoUrl(photo)}
                                    alt={photo.caption || "Job photo"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  {idx === 5 && photos.length > 6 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium">
                                      +{photos.length - 6}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {job.total && job.total > 0 && (
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span>Total</span>
                          <span>${Number(job.total).toFixed(2)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* QUOTES TAB */}
          <TabsContent value="quotes" className="space-y-4">
            {quotes.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No quotes yet.</CardContent></Card>
            ) : (
              quotes.map((quote) => (
                <Card key={quote.id} className={["sent", "viewed"].includes(quote.status) ? "ring-2 ring-primary/20" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Quote #{quote.quote_number}</CardTitle>
                      {statusBadge(quote.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(quote.created_at).toLocaleDateString()}
                      {quote.valid_until && ` · Valid until ${new Date(quote.valid_until).toLocaleDateString()}`}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      {(quoteItems[quote.id] || []).map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.description} × {item.quantity}</span>
                          <span className="font-medium">${(item.total || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${(quote.subtotal || 0).toFixed(2)}</span>
                      </div>
                      {(quote.tax_amount || 0) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax</span>
                          <span>${(quote.tax_amount || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-1">
                        <span>Total</span>
                        <span>${(quote.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    {quote.notes && (
                      <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3">{quote.notes}</p>
                    )}
                    {["sent", "viewed"].includes(quote.status) && (
                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1" onClick={() => approveQuote(quote.id)} disabled={approvingId === quote.id}>
                          {approvingId === quote.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                          Approve
                        </Button>
                        <Button variant="outline" onClick={() => declineQuote(quote.id)}>
                          <X className="h-4 w-4 mr-1" /> Decline
                        </Button>
                      </div>
                    )}
                    {quote.status === "approved" && (
                      <div className="text-center text-green-600 font-medium text-sm pt-1">
                        ✅ Approved on {new Date(quote.approved_at).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* INVOICES TAB */}
          <TabsContent value="invoices" className="space-y-4">
            {invoices.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No invoices yet.</CardContent></Card>
            ) : (
              invoices.map((inv) => {
                const balanceDue = (inv.total || 0) - (inv.amount_paid || 0);
                return (
                  <Card key={inv.id} className={inv.status === "overdue" ? "ring-2 ring-destructive/20" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Invoice #{inv.invoice_number}</CardTitle>
                        {statusBadge(inv.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString()}
                        {inv.due_date && ` · Due ${new Date(inv.due_date).toLocaleDateString()}`}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        {(inv.invoice_items || []).map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.description} × {item.quantity}</span>
                            <span className="font-medium">${(item.total || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-3 space-y-1">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>${(inv.total || 0).toFixed(2)}</span>
                        </div>
                        {(inv.amount_paid || 0) > 0 && (
                          <>
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Paid</span>
                              <span>-${(inv.amount_paid || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span>Balance Due</span>
                              <span>${balanceDue.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                      </div>
                      {inv.status !== "paid" && balanceDue > 0 && (
                        <Button className="w-full" onClick={() => payInvoice(inv.id)}>
                          <CreditCard className="h-4 w-4 mr-1" /> Pay ${balanceDue.toFixed(2)}
                        </Button>
                      )}
                      {inv.status === "paid" && (
                        <div className="text-center text-green-600 font-medium text-sm">✅ Paid in Full</div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* SERVICE REQUESTS TAB */}
          <TabsContent value="requests" className="space-y-4">
            <Button variant="outline" className="w-full" onClick={() => setShowRequestForm(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Submit New Request
            </Button>
            {serviceRequests.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No service requests yet. Submit one above!</CardContent></Card>
            ) : (
              serviceRequests.map((req) => {
                const cfg = REQUEST_STATUS_CONFIG[req.status] || REQUEST_STATUS_CONFIG.pending;
                return (
                  <Card key={req.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{req.title}</CardTitle>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {req.description && <p className="text-sm text-muted-foreground">{req.description}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {req.preferred_date && (
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(req.preferred_date).toLocaleDateString()}</span>
                        )}
                        {req.preferred_time && (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {req.preferred_time}</span>
                        )}
                        {req.address && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {req.address}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* MEMBERSHIPS TAB */}
          <TabsContent value="memberships" className="space-y-4">
            {memberships.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                No active membership plans. Ask {business?.name} about their recurring cleaning plans for member pricing and perks.
              </CardContent></Card>
            ) : (
              memberships.map((m: any) => {
                const plan = m.membership || {};
                const price = ((plan.price_cents || 0) / 100).toFixed(2);
                const statusColor =
                  m.status === "active" ? "bg-green-100 text-green-700" :
                  m.status === "paused" ? "bg-amber-100 text-amber-700" :
                  "bg-muted text-muted-foreground";
                return (
                  <Card key={m.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" /> {plan.name || "Membership"}
                        </CardTitle>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor}`}>
                          {m.status}
                        </span>
                      </div>
                      {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">${price}</span>
                        <span className="text-sm text-muted-foreground">/ {plan.billing_interval || "month"}</span>
                      </div>
                      {Array.isArray(plan.perks) && plan.perks.length > 0 && (
                        <ul className="space-y-1 text-sm">
                          {plan.perks.map((perk: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t">
                        {m.started_at && (
                          <span>Started {new Date(m.started_at).toLocaleDateString()}</span>
                        )}
                        {m.next_billing_at && m.status === "active" && (
                          <span>Next billing {new Date(m.next_billing_at).toLocaleDateString()}</span>
                        )}
                        {m.cancelled_at && (
                          <span>Cancelled {new Date(m.cancelled_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Service Request Form Dialog */}
      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request New Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>What do you need?</Label>
              <Input value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder="e.g. AC maintenance, plumbing repair" />
            </div>
            <div>
              <Label>Details (optional)</Label>
              <Textarea value={reqDesc} onChange={(e) => setReqDesc(e.target.value)} placeholder="Describe the issue or service needed..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Preferred Date</Label>
                <Input type="date" value={reqDate} onChange={(e) => setReqDate(e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Preferred Time</Label>
                <Input value={reqTime} onChange={(e) => setReqTime(e.target.value)} placeholder="Morning, 2pm, etc." />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</Label>
              <Input value={reqAddress} onChange={(e) => setReqAddress(e.target.value)} placeholder={customer?.address || "Service address"} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestForm(false)}>Cancel</Button>
            <Button onClick={submitServiceRequest} disabled={submittingRequest}>
              {submittingRequest ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          <div className="relative bg-black">
            {lightboxPhotos.length > 0 && (
              <>
                <img
                  src={getPhotoUrl(lightboxPhotos[lightboxIndex])}
                  alt={lightboxPhotos[lightboxIndex]?.caption || "Photo"}
                  className="w-full max-h-[70vh] object-contain"
                />
                {lightboxPhotos.length > 1 && (
                  <>
                    <button
                      onClick={() => setLightboxIndex((i) => (i - 1 + lightboxPhotos.length) % lightboxPhotos.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setLightboxIndex((i) => (i + 1) % lightboxPhotos.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="flex items-center justify-between text-white">
                    <div>
                      {lightboxPhotos[lightboxIndex]?.caption && (
                        <p className="text-sm">{lightboxPhotos[lightboxIndex].caption}</p>
                      )}
                      <p className="text-xs opacity-70 capitalize">{lightboxPhotos[lightboxIndex]?.photo_type} photo</p>
                    </div>
                    <span className="text-xs opacity-70">{lightboxIndex + 1} / {lightboxPhotos.length}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
