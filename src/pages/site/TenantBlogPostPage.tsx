import { useParams } from "react-router-dom";
import { useTenantSite } from "@/hooks/useTenantSite";
import { TenantSeo } from "@/components/site/TenantSeo";

// Minimal markdown: paragraphs + h2
function renderMd(md: string) {
  return md.split(/\n\n+/).map((block, i) => {
    if (block.startsWith("## ")) return <h2 key={i} className="font-display uppercase text-2xl mt-8 mb-3">{block.slice(3)}</h2>;
    if (block.startsWith("# ")) return <h1 key={i} className="font-display uppercase text-3xl mt-8 mb-3">{block.slice(2)}</h1>;
    return <p key={i} className="mb-4 text-muted-foreground leading-relaxed">{block}</p>;
  });
}

export default function TenantBlogPostPage() {
  const { slug, postSlug } = useParams();
  const { data } = useTenantSite(slug);
  if (!data) return null;
  const post = data.posts.find((p: any) => p.slug === postSlug);
  if (!post) return <div className="container mx-auto px-4 py-16"><h1 className="font-display text-3xl">Post not found</h1></div>;
  const url = `/site/${slug}/blog/${post.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.published_at,
      author: { "@type": "Organization", name: data.business.name },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `https://solutionaryhq.com/site/${slug}` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `https://solutionaryhq.com/site/${slug}/blog` },
        { "@type": "ListItem", position: 3, name: post.title },
      ],
    },
  ];
  return (
    <>
      <TenantSeo title={`${post.title} — ${data.business.name}`} description={post.excerpt} canonical={url} jsonLd={jsonLd} />
      <article className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display uppercase text-4xl md:text-5xl tracking-tight mb-3">{post.title}</h1>
        <p className="text-lg text-muted-foreground mb-8">{post.excerpt}</p>
        <div>{renderMd(post.body_md || "")}</div>
      </article>
    </>
  );
}
