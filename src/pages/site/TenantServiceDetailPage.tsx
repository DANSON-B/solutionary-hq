import { Link, useParams } from "react-router-dom";
import { useTenantSite } from "@/hooks/useTenantSite";
import { TenantSeo } from "@/components/site/TenantSeo";

export default function TenantServiceDetailPage() {
  const { slug, serviceSlug } = useParams();
  const { data } = useTenantSite(slug);
  if (!data) return null;
  const service = data.services.find((s: any) => s.slug === serviceSlug);
  const base = `/site/${slug}`;
  if (!service) {
    return <div className="container mx-auto px-4 py-16"><h1 className="font-display text-3xl">Service not found</h1></div>;
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    provider: { "@type": "LocalBusiness", name: data.business.name },
    offers: service.price_from ? { "@type": "Offer", price: service.price_from, priceCurrency: "USD" } : undefined,
  };
  return (
    <>
      <TenantSeo
        title={`${service.title} — ${data.business.name}`}
        description={service.description}
        canonical={`${base}/services/${service.slug}`}
        jsonLd={jsonLd}
      />
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display uppercase text-5xl tracking-tight mb-4">{service.title}</h1>
        {service.price_from && <div className="text-xl text-primary font-bold mb-6">Starting at ${service.price_from}</div>}
        <p className="text-lg text-muted-foreground mb-8">{service.description}</p>
        <Link to={`${base}/book`} className="inline-flex h-12 px-6 items-center rounded-full bg-primary text-primary-foreground font-medium">Book This Service</Link>
      </section>
    </>
  );
}
