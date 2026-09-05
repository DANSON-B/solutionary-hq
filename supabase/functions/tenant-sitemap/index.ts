// Per-tenant sitemap at /functions/v1/tenant-sitemap?slug=xxx
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BASE = "https://solutionaryhq.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return new Response("slug required", { status: 400 });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await admin.rpc("get_tenant_site_bundle", { p_slug: slug });
  if (!data) return new Response("not found", { status: 404 });

  const base = `${BASE}/site/${slug}`;
  const urls: string[] = [base, `${base}/services`, `${base}/about`, `${base}/contact`, `${base}/book`, `${base}/reviews`, `${base}/blog`];
  for (const s of data.services || []) urls.push(`${base}/services/${s.slug}`);
  for (const p of data.posts || []) urls.push(`${base}/blog/${p.slug}`);
  for (const a of data.areas || []) for (const s of data.services || []) urls.push(`${base}/areas/${a.slug}/${s.slug}`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>`;
  return new Response(xml, { headers: { ...corsHeaders, "Content-Type": "application/xml" } });
});
