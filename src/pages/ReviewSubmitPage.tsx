import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, CheckCircle2 } from "lucide-react";

export default function ReviewSubmitPage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [valid, setValid] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token) return;

      const { data: bundle } = await supabase.rpc("get_review_token_bundle", { p_token: token });
      const b: any = bundle;

      if (!b) {
        setLoading(false);
        return;
      }

      setTokenData({ business_id: b.business_id, customer_id: b.customer_id, job_id: b.job_id });
      setValid(true);
      setBusiness(b.business);
      setCustomer(b.customer);
      setLoading(false);
    };
    load();
  }, [token]);

  const handleSubmit = async () => {
    if (rating === 0 || !tokenData || !token) return;
    setSubmitting(true);

    const { error } = await supabase.rpc("submit_review_with_token", {
      p_token: token,
      p_rating: rating,
      p_comment: comment.trim() || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
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
          <p className="text-muted-foreground">This review link may have expired or already been used.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">Thank You!</h1>
            <p className="text-muted-foreground">
              Your review for <strong>{business?.name}</strong> has been submitted. We appreciate your feedback!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          {business?.logo_url && (
            <img src={business.logo_url} alt={business?.name} className="h-12 mx-auto mb-3 object-contain" />
          )}
          <CardTitle className="text-xl">{business?.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Hi {customer?.first_name}, how was your experience?
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <p className="text-sm font-medium mb-3">Tap to rate</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-accent text-accent"
                        : "text-border"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <Textarea
              placeholder="Tell us about your experience (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Submit Review
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
