import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Briefcase,
  Loader2,
  Inbox,
  ArrowRight,
} from "lucide-react";

interface ServiceRequest {
  id: string;
  business_id: string;
  customer_id: string;
  title: string;
  description: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  address: string | null;
  status: string;
  created_at: string;
  customers?: { first_name: string; last_name: string; email: string | null; phone: string | null };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200" },
  reviewed: { label: "Reviewed", color: "bg-blue-100 text-blue-700 border-blue-200" },
  scheduled: { label: "Scheduled", color: "bg-green-100 text-green-700 border-green-200" },
  declined: { label: "Declined", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function ServiceRequestsPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [converting, setConverting] = useState(false);

  // Convert to job form
  const [jobTitle, setJobTitle] = useState("");
  const [jobStart, setJobStart] = useState("");
  const [jobEnd, setJobEnd] = useState("");
  const [jobAddress, setJobAddress] = useState("");
  const [jobNotes, setJobNotes] = useState("");

  const fetchRequests = useCallback(async () => {
    if (!business) return;
    const { data, error } = await supabase
      .from("service_requests")
      .select("*, customers(first_name, last_name, email, phone)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading requests", description: error.message, variant: "destructive" });
    }
    setRequests((data as ServiceRequest[]) || []);
    setLoading(false);
  }, [business, toast]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openConvert = (req: ServiceRequest) => {
    setSelectedRequest(req);
    setJobTitle(req.title);
    setJobAddress(req.address || "");
    setJobNotes(req.description || "");
    if (req.preferred_date) {
      const time = req.preferred_time || "09:00";
      const hours = time.match(/(\d+)/)?.[1] || "9";
      const pad = (n: number) => n.toString().padStart(2, "0");
      const d = new Date(req.preferred_date + "T00:00:00");
      setJobStart(`${req.preferred_date}T${pad(parseInt(hours))}:00`);
      const endDate = new Date(d);
      endDate.setHours(parseInt(hours) + 1);
      setJobEnd(`${req.preferred_date}T${pad(parseInt(hours) + 1)}:00`);
    } else {
      setJobStart(""); setJobEnd("");
    }
    setShowConvertDialog(true);
  };

  const convertToJob = async () => {
    if (!business || !selectedRequest || !jobTitle) return;
    setConverting(true);

    const { error: jobError } = await supabase.from("jobs").insert({
      business_id: business.id,
      customer_id: selectedRequest.customer_id,
      title: jobTitle,
      address: jobAddress || null,
      notes: jobNotes || null,
      scheduled_start: jobStart || null,
      scheduled_end: jobEnd || null,
      status: "scheduled",
    });

    if (jobError) {
      toast({ title: "Error creating job", description: jobError.message, variant: "destructive" });
      setConverting(false);
      return;
    }

    await supabase.from("service_requests").update({ status: "scheduled" }).eq("id", selectedRequest.id);
    toast({ title: "Job created!", description: `"${jobTitle}" has been scheduled.` });
    setShowConvertDialog(false);
    setConverting(false);
    fetchRequests();
  };

  const markReviewed = async (req: ServiceRequest) => {
    await supabase.from("service_requests").update({ status: "reviewed" }).eq("id", req.id);
    toast({ title: "Marked as reviewed" });
    fetchRequests();
  };

  const declineRequest = async () => {
    if (!selectedRequest) return;
    await supabase.from("service_requests").update({ status: "declined" }).eq("id", selectedRequest.id);
    toast({ title: "Request declined" });
    setShowDeclineDialog(false);
    fetchRequests();
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const reviewedRequests = requests.filter((r) => r.status === "reviewed");
  const resolvedRequests = requests.filter((r) => ["scheduled", "declined"].includes(r.status));

  const RequestCard = ({ req }: { req: ServiceRequest }) => {
    const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
    const customerName = req.customers ? `${req.customers.first_name} ${req.customers.last_name}` : "Unknown";

    return (
      <Card className={req.status === "pending" ? "border-amber-200" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{req.title}</CardTitle>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" /> {customerName}
                {req.customers?.phone && <span className="ml-2">· {req.customers.phone}</span>}
              </div>
            </div>
            <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium border ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {req.description && <p className="text-sm text-muted-foreground">{req.description}</p>}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {new Date(req.created_at).toLocaleDateString()}
            </span>
            {req.preferred_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Preferred: {new Date(req.preferred_date).toLocaleDateString()}
                {req.preferred_time && ` at ${req.preferred_time}`}
              </span>
            )}
            {req.address && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {req.address}</span>
            )}
          </div>

          {/* Actions */}
          {req.status === "pending" && (
            <div className="flex gap-2 pt-2 border-t">
              <Button size="sm" onClick={() => openConvert(req)} className="flex-1">
                <Briefcase className="h-3.5 w-3.5 mr-1" /> Schedule Job
              </Button>
              <Button size="sm" variant="outline" onClick={() => markReviewed(req)}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Reviewed
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { setSelectedRequest(req); setShowDeclineDialog(true); }}>
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {req.status === "reviewed" && (
            <div className="flex gap-2 pt-2 border-t">
              <Button size="sm" onClick={() => openConvert(req)} className="flex-1">
                <ArrowRight className="h-3.5 w-3.5 mr-1" /> Convert to Job
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { setSelectedRequest(req); setShowDeclineDialog(true); }}>
                <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Requests</h1>
          <p className="text-sm text-muted-foreground">Review and manage incoming customer service requests</p>
        </div>
        {pendingRequests.length > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            {pendingRequests.length} new
          </Badge>
        )}
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            <Inbox className="h-4 w-4" /> Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Reviewed ({reviewedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-1.5">
            <Briefcase className="h-4 w-4" /> Resolved ({resolvedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pendingRequests.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No pending requests — all caught up! 🎉</CardContent></Card>
          ) : pendingRequests.map((r) => <RequestCard key={r.id} req={r} />)}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-3">
          {reviewedRequests.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No reviewed requests.</CardContent></Card>
          ) : reviewedRequests.map((r) => <RequestCard key={r.id} req={r} />)}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-3">
          {resolvedRequests.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No resolved requests yet.</CardContent></Card>
          ) : resolvedRequests.map((r) => <RequestCard key={r.id} req={r} />)}
        </TabsContent>
      </Tabs>

      {/* Convert to Job Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Job from Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
              <strong>Customer:</strong> {selectedRequest?.customers?.first_name} {selectedRequest?.customers?.last_name}
              {selectedRequest?.customers?.email && <span> · {selectedRequest.customers.email}</span>}
            </div>
            <div>
              <Label>Job Title</Label>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Start</Label>
                <Input type="datetime-local" value={jobStart} onChange={(e) => setJobStart(e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> End</Label>
                <Input type="datetime-local" value={jobEnd} onChange={(e) => setJobEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</Label>
              <Input value={jobAddress} onChange={(e) => setJobAddress(e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={jobNotes} onChange={(e) => setJobNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>Cancel</Button>
            <Button onClick={convertToJob} disabled={converting || !jobTitle}>
              {converting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Briefcase className="h-4 w-4 mr-1" />}
              Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Decline Request</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to decline "{selectedRequest?.title}"?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={declineRequest}>Decline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
