import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Star } from "lucide-react";
import { BusinessLogo } from "@/components/BusinessLogo";
import { useBrandFavicon } from "@/hooks/useBrandFavicon";

export default function PublicReviewsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  useBrandFavicon(business?.logo_url, business?.name);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;

      const { data: bizRows } = await supabase.rpc("get_public_business_by_slug", { p_slug: slug });
      const biz = Array.isArray(bizRows) ? bizRows[0] : bizRows;

      if (!biz) {
        setLoading(false);
        return;
      }

      setBusiness(biz);

      const { data: revs } = await supabase
        .from("reviews")
        .select("rating, comment, created_at")
        .eq("business_id", biz.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      setReviews(revs || []);
      setLoading(false);
    };
    load();
  }, [slug]);

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold mb-2">Business Not Found</h1>
          <p className="text-muted-foreground">This reviews page doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b">
        <div className="container mx-auto max-w-3xl px-4 py-8 text-center">
          <BusinessLogo name={business.name} logoUrl={business.logo_url} className="h-14 w-14 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">{business.name}</h1>
          {reviews.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-5 w-5 ${s <= Math.round(avgRating) ? "text-accent fill-accent" : "text-border"}`}
                  />
                ))}
              </div>
              <span className="font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">({reviews.length} review{reviews.length !== 1 && "s"})</span>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8 space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">No reviews yet.</CardContent>
          </Card>
        ) : (
          reviews.map((review, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4 space-y-2">
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
                {review.comment && <p className="text-sm">{review.comment}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
