import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Inbox, Search, Flame, ArrowRight, CheckCircle2, XCircle,
  Clock, Eye, Filter, TrendingUp, DollarSign, Users,
} from "lucide-react";

type BookingRequest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  category: string;
  cleaning_type: string | null;
  status: string;
  estimated_total: number | null;
  lead_score: number | null;
  is_high_value: boolean | null;
  preferred_date: string | null;
  preferred_time: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_sqft: number | null;
  extras: string[] | null;
  notes: string | null;
  gift_card_code: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "New", variant: "default" },
  contacted: { label: "Contacted", variant: "secondary" },
  converted: { label: "Converted", variant: "outline" },
  declined: { label: "Declined", variant: "destructive" },
};

const CATEGORY_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  post_construction: "Post-Construction",
  gift_card: "Gift Card",
};

export default function BookingRequestsPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [highValueOnly, setHighValueOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["booking-requests", business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data, error } = await supabase
        .from("cleaning_booking_requests")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BookingRequest[];
    },
    enabled: !!business?.id,
  });

  const filtered = requests.filter((r) => {
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (highValueOnly && !r.is_high_value) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.name.toLowerCase().includes(q) &&
        !r.email.toLowerCase().includes(q) &&
        !(r.phone?.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });

  const stats = {
    total: requests.length,
    newLeads: requests.filter((r) => r.status === "new").length,
    highValue: requests.filter((r) => r.is_high_value).length,
    totalRevenue: requests.reduce((s, r) => s + (r.estimated_total || 0), 0),
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("cleaning_booking_requests")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
      toast({ title: "Status updated" });
    }
  };

  const convertToJob = async (req: BookingRequest) => {
    if (!business?.id) return;

    // Create or find customer
    const nameParts = req.name.trim().split(/\s+/);
    const firstName = nameParts[0] || req.name;
    const lastName = nameParts.slice(1).join(" ") || "-";

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("business_id", business.id)
      .eq("email", req.email)
      .maybeSingle();

    let customerId = existingCustomer?.id;

    if (!customerId) {
      const { data: newCustomer, error: custErr } = await supabase
        .from("customers")
        .insert({
          business_id: business.id,
          first_name: firstName,
          last_name: lastName,
          email: req.email,
          phone: req.phone,
          address: req.address,
          city: req.city,
          state: req.state,
          zip: req.zip,
        })
        .select("id")
        .single();
      if (custErr) {
        toast({ title: "Error creating customer", description: custErr.message, variant: "destructive" });
        return;
      }
      customerId = newCustomer.id;
    }

    // Create job
    const scheduledStart = req.preferred_date
      ? new Date(`${req.preferred_date}T09:00:00`).toISOString()
      : null;

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .insert({
        business_id: business.id,
        customer_id: customerId,
        title: `${CATEGORY_LABELS[req.category] || req.category} — ${req.cleaning_type || "Cleaning"}`,
        description: [
          req.property_sqft ? `${req.property_sqft} sq ft` : null,
          req.bedrooms ? `${req.bedrooms} bed` : null,
          req.bathrooms ? `${req.bathrooms} bath` : null,
          req.extras?.length ? `Extras: ${req.extras.join(", ")}` : null,
          req.notes,
        ].filter(Boolean).join(" · "),
        address: [req.address, req.city, req.state, req.zip].filter(Boolean).join(", "),
        total: req.estimated_total || 0,
        scheduled_start: scheduledStart,
        status: "scheduled",
      })
      .select("id")
      .single();

    if (jobErr) {
      toast({ title: "Error creating job", description: jobErr.message, variant: "destructive" });
      return;
    }

    await updateStatus(req.id, "converted");
    setSelectedRequest(null);
    toast({ title: "Job created!", description: "Booking request converted to a scheduled job." });
    navigate(`/dashboard/jobs/${job.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Booking Requests</h1>
          <p className="text-muted-foreground text-sm">Manage incoming leads from your public booking form</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Inbox className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.newLeads}</p>
                <p className="text-xs text-muted-foreground">New Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.highValue}</p>
                <p className="text-xs text-muted-foreground">High-Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="post_construction">Post-Construction</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={highValueOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setHighValueOnly(!highValueOnly)}
              className="gap-1.5"
            >
              <Flame className="h-3.5 w-3.5" />
              High-Value
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-medium">No booking requests found</p>
              <p className="text-sm">Requests from your public booking form will appear here</p>
            </div>
          ) : (
            <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((req) => {
                    const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.new;
                    return (
                      <TableRow key={req.id} className={req.is_high_value ? "bg-orange-500/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {req.is_high_value && <Flame className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                            <div>
                              <p className="font-medium text-sm">{req.name}</p>
                              <p className="text-xs text-muted-foreground">{req.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {CATEGORY_LABELS[req.category] || req.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{req.cleaning_type || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {req.preferred_date
                            ? format(new Date(req.preferred_date + "T00:00:00"), "MMM d, yyyy")
                            : "—"}
                          {req.preferred_time && (
                            <span className="text-muted-foreground ml-1 text-xs">{req.preferred_time}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          ${(req.estimated_total || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                (req.lead_score || 0) >= 80
                                  ? "bg-green-500"
                                  : (req.lead_score || 0) >= 50
                                  ? "bg-yellow-500"
                                  : "bg-muted-foreground"
                              }`}
                            />
                            <span className="text-xs">{req.lead_score || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusCfg.variant} className="text-xs">
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setSelectedRequest(req)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {req.status === "new" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-green-600 hover:text-green-700"
                                onClick={() => convertToJob(req)}
                                title="Convert to Job"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y">
              {filtered.map((req) => {
                const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.new;
                return (
                  <div key={req.id} className={`p-4 ${req.is_high_value ? "bg-orange-500/5" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {req.is_high_value && <Flame className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                          <p className="font-medium text-sm truncate">{req.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{req.email}</p>
                      </div>
                      <Badge variant={statusCfg.variant} className="text-[10px] shrink-0">{statusCfg.label}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[req.category] || req.category}</Badge>
                      {req.cleaning_type && <span>· {req.cleaning_type}</span>}
                      {req.preferred_date && <span>· {format(new Date(req.preferred_date + "T00:00:00"), "MMM d")}</span>}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-semibold text-sm">${(req.estimated_total || 0).toLocaleString()}</span>
                        <span className="flex items-center gap-1">
                          <span className={`h-2 w-2 rounded-full ${(req.lead_score || 0) >= 80 ? "bg-green-500" : (req.lead_score || 0) >= 50 ? "bg-yellow-500" : "bg-muted-foreground"}`} />
                          {req.lead_score || 0}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-10" onClick={() => setSelectedRequest(req)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        {req.status === "new" && (
                          <Button size="sm" className="h-10" onClick={() => convertToJob(req)}>
                            <ArrowRight className="h-4 w-4 mr-1" /> Convert
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedRequest.is_high_value && <Flame className="h-4 w-4 text-orange-500" />}
                  {selectedRequest.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p>{selectedRequest.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Phone</p>
                    <p>{selectedRequest.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Category</p>
                    <p>{CATEGORY_LABELS[selectedRequest.category] || selectedRequest.category}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Service</p>
                    <p>{selectedRequest.cleaning_type || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Preferred Date</p>
                    <p>
                      {selectedRequest.preferred_date
                        ? format(new Date(selectedRequest.preferred_date + "T00:00:00"), "MMM d, yyyy")
                        : "—"}{" "}
                      {selectedRequest.preferred_time || ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Estimated Total</p>
                    <p className="font-semibold">${(selectedRequest.estimated_total || 0).toLocaleString()}</p>
                  </div>
                </div>

                {selectedRequest.address && (
                  <div>
                    <p className="text-muted-foreground text-xs">Address</p>
                    <p>
                      {[selectedRequest.address, selectedRequest.city, selectedRequest.state, selectedRequest.zip]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {selectedRequest.bedrooms != null && (
                    <div>
                      <p className="text-muted-foreground text-xs">Bedrooms</p>
                      <p>{selectedRequest.bedrooms}</p>
                    </div>
                  )}
                  {selectedRequest.bathrooms != null && (
                    <div>
                      <p className="text-muted-foreground text-xs">Bathrooms</p>
                      <p>{selectedRequest.bathrooms}</p>
                    </div>
                  )}
                  {selectedRequest.property_sqft != null && (
                    <div>
                      <p className="text-muted-foreground text-xs">Sq Ft</p>
                      <p>{selectedRequest.property_sqft.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {selectedRequest.extras && selectedRequest.extras.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Extras</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedRequest.extras.map((e) => (
                        <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.notes && (
                  <div>
                    <p className="text-muted-foreground text-xs">Notes</p>
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Lead Score: {selectedRequest.lead_score || 0}</span>
                  <span>·</span>
                  <span>Submitted {format(new Date(selectedRequest.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:gap-2">
                {selectedRequest.status === "new" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateStatus(selectedRequest.id, "contacted");
                        setSelectedRequest(null);
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Mark Contacted
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateStatus(selectedRequest.id, "declined");
                        setSelectedRequest(null);
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Decline
                    </Button>
                  </>
                )}
                {selectedRequest.status !== "converted" && selectedRequest.status !== "declined" && (
                  <Button size="sm" onClick={() => convertToJob(selectedRequest)}>
                    <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                    Convert to Job
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
