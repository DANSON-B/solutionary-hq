import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsCleaning } from "@/hooks/useIsCleaning";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Copy, Send, Loader2, TrendingUp, Bell } from "lucide-react";

export default function ReviewsPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const isCleaning = useIsCleaning();

  const [reviews, setReviews] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [sendingFor, setSendingFor] = useState<string | null>(null);

  useEffect(() => {
    if (!business) return;
    const load = async () => {
      const [revRes, custRes, jobRes, tokRes] = await Promise.all([
        supabase.from("reviews").select("*").eq("business_id", business.id).order("created_at", { ascending: false }),
        supabase.from("customers").select("id, first_name, last_name, email").eq("business_id", business.id),
        supabase.from("jobs").select("id, title, customer_id, status").eq("business_id", business.id).eq("status", "completed"),
        supabase.from("review_request_tokens").select("*").eq("business_id", business.id).order("created_at", { ascending: false }),
      ]);
      setReviews(revRes.data || []);
      setCustomers(custRes.data || []);
      setJobs(jobRes.data || []);
      setTokens(tokRes.data || []);
      setLoading(false);
    };
    load();
  }, [business]);

  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]));

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: reviews.filter((rev) => rev.rating === r).length,
  }));

  const filteredReviews = filter === "all" ? reviews : reviews.filter((r) => r.rating === parseInt(filter));

  const generateReviewLink = async (customerId: string, jobId?: string) => {
    if (!business) return;
    setSendingFor(customerId);

    const { data, error } = await supabase
      .from("review_request_tokens")
      .insert({
        business_id: business.id,
        customer_id: customerId,
        job_id: jobId || null,
      })
      .select("token")
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const url = `${window.location.origin}/review/${data.token}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "Review link copied!", description: "Send this link to your customer." });
    }
    setSendingFor(null);
  };

  const togglePublic = async (reviewId: string, current: boolean) => {
    await supabase.from("reviews").update({ is_public: !current }).eq("id", reviewId);
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, is_public: !current } : r)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">Manage customer reviews and request new ones</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-accent fill-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reviews.length}</p>
                <p className="text-xs text-muted-foreground">Total Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1.5">
              {ratingCounts.map(({ rating, count }) => (
                <div key={rating} className="flex items-center gap-2 text-xs">
                  <span className="w-3">{rating}</span>
                  <Star className="h-3 w-3 text-accent fill-accent" />
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request a Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customers.slice(0, 12).map((cust) => {
              const custJobs = jobs.filter((j) => j.customer_id === cust.id);
              const hasReview = reviews.some((r) => r.customer_id === cust.id);
              return (
                <div
                  key={cust.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {cust.first_name} {cust.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hasReview ? "✅ Reviewed" : custJobs.length > 0 ? `${custJobs.length} completed job(s)` : "No completed jobs"}
                    </p>
                  </div>
                  {!hasReview && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateReviewLink(cust.id, custJobs[0]?.id)}
                      disabled={sendingFor === cust.id}
                    >
                      {sendingFor === cust.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cleaning: Review Follow-Up Tracker */}
      {isCleaning && (() => {
        const pendingTokens = tokens.filter(t => !t.is_used && new Date(t.expires_at) > new Date());
        const reviewedCustomerIds = new Set(reviews.map(r => r.customer_id));
        const unreplied = pendingTokens.filter(t => !reviewedCustomerIds.has(t.customer_id));
        if (unreplied.length === 0) return null;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-accent" /> Review Follow-Ups Needed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {unreplied.length} customer{unreplied.length !== 1 ? "s" : ""} received a review request but haven't responded yet.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {unreplied.slice(0, 9).map(token => {
                  const cust = customerMap[token.customer_id];
                  const daysSent = Math.floor((Date.now() - new Date(token.created_at).getTime()) / 86400000);
                  return (
                    <div key={token.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{cust ? `${cust.first_name} ${cust.last_name}` : "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{daysSent}d ago</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => {
                        const url = `${window.location.origin}/review/${token.token}`;
                        navigator.clipboard.writeText(url);
                        toast({ title: "Follow-up link copied!" });
                      }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Reviews list */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Reviews</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r} Star{r !== 1 && "s"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {reviews.length === 0 ? "No reviews yet. Send review requests to your customers!" : "No reviews match this filter."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => {
            const cust = customerMap[review.customer_id];
            return (
              <Card key={review.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${s <= review.rating ? "text-accent fill-accent" : "text-border"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-medium text-sm">
                        {cust ? `${cust.first_name} ${cust.last_name}` : "Unknown Customer"}
                      </p>
                      {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant={review.is_public ? "default" : "outline"}
                      onClick={() => togglePublic(review.id, review.is_public)}
                      className="shrink-0 text-xs"
                    >
                      {review.is_public ? "Public" : "Private"}
                    </Button>
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
