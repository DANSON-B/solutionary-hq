import { Link, useParams } from "react-router-dom";
import { useTenantSite } from "@/hooks/useTenantSite";
import { TenantSeo } from "@/components/site/TenantSeo";

export default function TenantBlogPage() {
  const { slug } = useParams();
  const { data } = useTenantSite(slug);
  if (!data) return null;
  const base = `/site/${slug}`;
  return (
    <>
      <TenantSeo title={`Blog — ${data.business.name}`} description={`Tips, guides, and news from ${data.business.name}.`} canonical={`${base}/blog`} />
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-display uppercase text-5xl tracking-tight mb-10">Blog & Tips</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {data.posts.map((p: any) => (
            <Link key={p.id} to={`${base}/blog/${p.slug}`} className="block bg-white border border-border rounded-2xl p-6 hover:border-primary transition">
              <h2 className="font-display uppercase text-2xl mb-2">{p.title}</h2>
              <p className="text-muted-foreground text-sm">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
