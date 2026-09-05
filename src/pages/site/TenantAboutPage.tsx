import { useParams } from "react-router-dom";
import { useTenantSite } from "@/hooks/useTenantSite";
import { TenantSeo } from "@/components/site/TenantSeo";

export default function TenantAboutPage() {
  const { slug } = useParams();
  const { data } = useTenantSite(slug);
  if (!data) return null;
  const { business, site, faqs } = data;
  const base = `/site/${slug}`;
  return (
    <>
      <TenantSeo
        title={`About — ${business.name}`}
        description={site?.about_text?.slice(0, 155)}
        canonical={`${base}/about`}
      />
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display uppercase text-5xl tracking-tight mb-8">About {business.name}</h1>
        <div className="prose prose-lg max-w-none mb-12 whitespace-pre-wrap">{site?.about_text}</div>
        {faqs.length > 0 && (
          <>
            <h2 className="font-display uppercase text-3xl mb-6">FAQs</h2>
            <div className="space-y-6">
              {faqs.map((f: any) => (
                <div key={f.id}>
                  <h3 className="font-semibold text-lg mb-1">{f.question}</h3>
                  <p className="text-muted-foreground">{f.answer}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
