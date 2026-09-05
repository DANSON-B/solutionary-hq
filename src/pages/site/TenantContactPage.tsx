import { Link, useParams } from "react-router-dom";
import { useTenantSite } from "@/hooks/useTenantSite";
import { TenantSeo } from "@/components/site/TenantSeo";
import { Phone, Mail, MapPin } from "lucide-react";

export default function TenantContactPage() {
  const { slug } = useParams();
  const { data } = useTenantSite(slug);
  if (!data) return null;
  const { business } = data;
  const base = `/site/${slug}`;
  return (
    <>
      <TenantSeo title={`Contact — ${business.name}`} description={`Reach ${business.name} by phone, email, or online booking.`} canonical={`${base}/contact`} />
      <section className="container mx-auto px-4 py-16 max-w-2xl">
        <h1 className="font-display uppercase text-5xl tracking-tight mb-8">Get in Touch</h1>
        <div className="space-y-4 mb-10">
          {business.phone && <a href={`tel:${business.phone}`} className="flex items-center gap-3 p-4 bg-white border border-border rounded-xl hover:border-primary"><Phone className="text-primary" /> <span className="text-lg">{business.phone}</span></a>}
          {business.email && <a href={`mailto:${business.email}`} className="flex items-center gap-3 p-4 bg-white border border-border rounded-xl hover:border-primary"><Mail className="text-primary" /> <span className="text-lg">{business.email}</span></a>}
          {(business.city || business.state) && <div className="flex items-center gap-3 p-4 bg-white border border-border rounded-xl"><MapPin className="text-primary" /> <span className="text-lg">{[business.city, business.state].filter(Boolean).join(", ")}</span></div>}
        </div>
        <Link to={`${base}/book`} className="inline-flex h-12 px-6 items-center rounded-full bg-primary text-primary-foreground font-medium">Book Online Instead</Link>
      </section>
    </>
  );
}
