import { useParams } from "react-router-dom";
import { useTenantSite } from "@/hooks/useTenantSite";
import { TenantSeo } from "@/components/site/TenantSeo";

export default function TenantBookPage() {
  const { slug } = useParams();
  const { data } = useTenantSite(slug);
  if (!data) return null;
  return (
    <>
      <TenantSeo title={`Book Online — ${data.business.name}`} description={`Book ${data.business.name} online in minutes.`} canonical={`/site/${slug}/book`} />
      <section className="container mx-auto px-4 py-8">
        <h1 className="font-display uppercase text-4xl tracking-tight mb-6">Book Your Service</h1>
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <iframe
            src={`/book/${slug}?embed=true`}
            title="Book online"
            className="w-full min-h-[900px] border-0"
          />
        </div>
      </section>
    </>
  );
}
