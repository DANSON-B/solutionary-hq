import { Link, useParams } from "react-router-dom";
import { useTenantSite } from "@/hooks/useTenantSite";
import { TenantSeo } from "@/components/site/TenantSeo";
import { Star, ArrowRight, ShieldCheck, Clock, Award } from "lucide-react";

export default function TenantHomePage() {
  const { slug } = useParams();
  const { data } = useTenantSite(slug);
  if (!data) return null;
  const { business, site, services, reviews, rating_avg, rating_count, faqs } = data;
  const base = `/site/${slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: business.name,
      description: site?.meta_description,
      url: `https://solutionaryhq.com${base}`,
      telephone: business.phone,
      email: business.email,
      image: site?.hero_image_url,
      address: (business.city || business.state) ? {
        "@type": "PostalAddress",
        addressLocality: business.city,
        addressRegion: business.state,
      } : undefined,
      aggregateRating: rating_count > 0 ? {
        "@type": "AggregateRating",
        ratingValue: rating_avg,
        reviewCount: rating_count,
      } : undefined,
    },
    faqs.length > 0 ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f: any) => ({
        "@type": "Question", name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    } : null,
  ].filter(Boolean) as object[];

  return (
    <>
      <TenantSeo
        title={site?.meta_title || `${business.name} — ${business.industry || "Local Service"}`}
        description={site?.meta_description || site?.tagline}
        canonical={base}
        image={site?.hero_image_url}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="bg-grid">
        <div className="container mx-auto px-4 pt-16 pb-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            {site?.tagline && <div className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-medium mb-4 uppercase tracking-wide">{site.tagline}</div>}
            <h1 className="font-display uppercase tracking-tight text-5xl md:text-6xl leading-[0.95] mb-5">
              {site?.hero_headline || `Premium ${business.industry || "service"} you can trust`}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">{site?.hero_subheadline}</p>
            <div className="flex flex-wrap gap-3">
              <Link to={`${base}/book`} className="inline-flex h-12 px-6 items-center rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition">
                {site?.cta_text || "Get a Free Quote"} <ArrowRight className="ml-2" size={18} />
              </Link>
              <Link to={`${base}/services`} className="inline-flex h-12 px-6 items-center rounded-full border-2 border-primary text-primary font-medium hover:bg-primary/5 transition">
                View Services
              </Link>
            </div>
            {rating_count > 0 && (
              <div className="mt-6 flex items-center gap-2">
                <div className="flex text-accent">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={18} fill="currentColor" />)}</div>
                <span className="text-sm text-muted-foreground">{rating_avg.toFixed(1)} from {rating_count} reviews</span>
              </div>
            )}
          </div>
          {site?.hero_image_url && (
            <div className="relative">
              <img src={site.hero_image_url} alt={business.name} className="w-full aspect-[4/5] object-cover rounded-t-[50%] rounded-b-3xl shadow-2xl" />
            </div>
          )}
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-border/60 bg-white/60 py-8">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: ShieldCheck, label: "Licensed & Insured" },
            { icon: Clock, label: "On-Time Guarantee" },
            { icon: Award, label: "100% Satisfaction" },
            { icon: Star, label: "5-Star Rated" },
          ].map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-2">
              <t.icon className="text-primary" />
              <span className="text-sm font-medium">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-2xl mb-10">
          <h2 className="font-display uppercase text-4xl md:text-5xl tracking-tight mb-3">Our Services</h2>
          <p className="text-muted-foreground">Everything you need, delivered by pros who care.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 6).map((s: any) => (
            <Link to={`${base}/services/${s.slug}`} key={s.id} className="group bg-white border border-border/60 rounded-2xl p-6 hover:border-primary transition hover:shadow-lg">
              <h3 className="font-display uppercase text-xl mb-2 group-hover:text-primary transition">{s.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{s.description}</p>
              {s.price_from && <div className="text-sm"><span className="text-muted-foreground">Starting at</span> <span className="font-bold text-primary">${s.price_from}</span></div>}
            </Link>
          ))}
        </div>
      </section>

      {/* Reviews snippet */}
      {reviews.length > 0 && (
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <h2 className="font-display uppercase text-4xl md:text-5xl tracking-tight mb-10">What Customers Say</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {reviews.slice(0, 3).map((r: any, i: number) => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-6">
                  <div className="flex text-accent mb-3">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}</div>
                  <p className="text-sm mb-4 opacity-90">"{r.comment || "Excellent service!"}"</p>
                  <p className="text-xs opacity-70">— {r.author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 container mx-auto px-4">
        <div className="bg-primary text-primary-foreground rounded-3xl p-12 text-center">
          <h2 className="font-display uppercase text-4xl md:text-5xl tracking-tight mb-4">Ready to book?</h2>
          <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">Instant online booking. Real people. Real results.</p>
          <Link to={`${base}/book`} className="inline-flex h-14 px-8 items-center rounded-full bg-accent text-accent-foreground font-medium text-lg hover:bg-accent/90 transition">
            {site?.cta_text || "Get Your Free Quote"} <ArrowRight className="ml-2" />
          </Link>
        </div>
      </section>
    </>
  );
}
