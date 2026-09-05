import { Link, useParams } from "react-router-dom";
import { useTenantSite } from "@/hooks/useTenantSite";
import { TenantSeo } from "@/components/site/TenantSeo";
import { ArrowRight } from "lucide-react";

export default function TenantServicesPage() {
  const { slug } = useParams();
  const { data } = useTenantSite(slug);
  if (!data) return null;
  const { business, services } = data;
  const base = `/site/${slug}`;
  return (
    <>
      <TenantSeo
        title={`Services — ${business.name}`}
        description={`Full list of ${business.industry || ""} services offered by ${business.name}.`}
        canonical={`${base}/services`}
      />
      <section className="container mx-auto px-4 py-16">
        <h1 className="font-display uppercase text-5xl tracking-tight mb-8">Our Services</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((s: any) => (
            <Link to={`${base}/services/${s.slug}`} key={s.id} className="group block bg-white border border-border/60 rounded-2xl p-6 hover:border-primary transition">
              <h2 className="font-display uppercase text-2xl mb-2 group-hover:text-primary">{s.title}</h2>
              <p className="text-muted-foreground mb-4">{s.description}</p>
              <div className="flex items-center justify-between">
                {s.price_from ? <span className="font-bold text-primary">From ${s.price_from}</span> : <span />}
                <span className="text-sm font-medium inline-flex items-center gap-1 text-primary">Learn more <ArrowRight size={16} /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
