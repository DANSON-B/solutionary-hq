import { useParams } from "react-router-dom";
import { useTenantSite } from "@/hooks/useTenantSite";
import { TenantSeo } from "@/components/site/TenantSeo";
import { Star } from "lucide-react";

export default function TenantReviewsPage() {
  const { slug } = useParams();
  const { data } = useTenantSite(slug);
  if (!data) return null;
  const { business, reviews, rating_avg, rating_count } = data;
  const jsonLd = rating_count > 0 ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    aggregateRating: { "@type": "AggregateRating", ratingValue: rating_avg, reviewCount: rating_count },
    review: reviews.slice(0, 20).map((r: any) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: { "@type": "Rating", ratingValue: r.rating },
      reviewBody: r.comment,
    })),
  } : undefined;

  return (
    <>
      <TenantSeo title={`Reviews — ${business.name}`} description={`Read ${rating_count} verified customer reviews of ${business.name}.`} canonical={`/site/${slug}/reviews`} jsonLd={jsonLd} />
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display uppercase text-5xl tracking-tight mb-3">Customer Reviews</h1>
        {rating_count > 0 && (
          <div className="flex items-center gap-3 mb-10">
            <div className="flex text-accent">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={22} fill="currentColor" />)}</div>
            <span className="text-lg font-medium">{rating_avg.toFixed(1)}</span>
            <span className="text-muted-foreground">({rating_count} reviews)</span>
          </div>
        )}
        <div className="space-y-6">
          {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet. Be the first!</p>}
          {reviews.map((r: any, i: number) => (
            <div key={i} className="bg-white border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{r.author}</span>
                <div className="flex text-accent">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
              </div>
              {r.comment && <p className="text-muted-foreground">{r.comment}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
