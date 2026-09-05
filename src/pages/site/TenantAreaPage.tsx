import { Link, useParams } from "react-router-dom";
import { useTenantSite } from "@/hooks/useTenantSite";
import { TenantSeo } from "@/components/site/TenantSeo";

export default function TenantAreaPage() {
  const { slug, city, serviceSlug } = useParams();
  const { data } = useTenantSite(slug);
  if (!data) return null;
  const area = data.areas.find((a: any) => a.slug === city);
  const service = data.services.find((s: any) => s.slug === serviceSlug);
  if (!area || !service) return <div className="container mx-auto px-4 py-16"><h1 className="font-display text-3xl">Not found</h1></div>;
  const title = `${service.title} in ${area.city} — ${data.business.name}`;
  const desc = `Trusted ${service.title.toLowerCase()} serving ${area.city}${area.state ? ", " + area.state : ""}. Book online in minutes.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: data.business.name,
    areaServed: { "@type": "City", name: area.city },
    makesOffer: { "@type": "Offer", itemOffered: { "@type": "Service", name: service.title } },
  };
  return (
    <>
      <TenantSeo title={title} description={desc} canonical={`/site/${slug}/areas/${area.slug}/${service.slug}`} jsonLd={jsonLd} />
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display uppercase text-4xl md:text-5xl tracking-tight mb-4">{service.title} in {area.city}</h1>
        <p className="text-lg text-muted-foreground mb-8">{service.description} We proudly serve {area.city}{area.state ? `, ${area.state}` : ""} and surrounding neighborhoods.</p>
        <Link to={`/site/${slug}/book`} className="inline-flex h-12 px-6 items-center rounded-full bg-primary text-primary-foreground font-medium">Book in {area.city}</Link>
      </section>
    </>
  );
}
