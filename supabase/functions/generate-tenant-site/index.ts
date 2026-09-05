// Generate AI website content for a business (owner-only).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

async function callAI(prompt: string): Promise<any> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are an expert local-service marketing copywriter. Return ONLY valid minified JSON matching the requested schema. No prose, no markdown." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return JSON.parse(j.choices[0].message.content);
}

async function generateHeroImage(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const imgs = j.choices?.[0]?.message?.images;
    if (imgs && imgs[0]?.image_url?.url) return imgs[0].image_url.url;
  } catch (_) {}
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "auth required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { business_id, regenerate } = await req.json();
    if (!business_id) return new Response(JSON.stringify({ error: "business_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: biz } = await admin.from("businesses").select("*").eq("id", business_id).single();
    if (!biz) return new Response(JSON.stringify({ error: "business not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (biz.owner_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "not owner" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: existingSite } = await admin.from("tenant_sites").select("id, generated_at").eq("business_id", business_id).maybeSingle();
    if (existingSite?.generated_at && !regenerate) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const industry = biz.industry || "home services";
    const location = [biz.city, biz.state].filter(Boolean).join(", ") || "your area";

    const prompt = `Create marketing website content for a local ${industry} business named "${biz.name}" serving ${location}.
Return this exact JSON schema:
{
 "tagline": "6-10 word tagline",
 "hero_headline": "8-14 word headline with a clear benefit",
 "hero_subheadline": "20-30 word supporting line",
 "about_text": "150-200 word about paragraph, warm, professional, mentions local service and quality",
 "meta_title": "<=60 char SEO title with industry + city",
 "meta_description": "<=155 char meta description with clear CTA",
 "cta_text": "3-5 word primary CTA",
 "services": [ { "title": "Service name", "description": "25-40 word benefit description", "price_from": 99, "icon": "sparkles|hammer|wrench|zap|droplet|home|broom|shield|thermometer|leaf" } ],  // 5-7 services common to a ${industry} business
 "faqs": [ { "question": "Common question", "answer": "40-70 word answer" } ],  // exactly 6 FAQs
 "blog_posts": [ { "title": "Article title", "excerpt": "25-35 word excerpt", "body_md": "600-800 word helpful markdown article with 3-4 H2 sections" } ]  // exactly 3 industry-relevant posts
}`;

    const ai = await callAI(prompt);

    const heroImg = await generateHeroImage(
      `Professional photograph, ${industry} business hero image, clean modern branding, natural light, wide 16:9 composition, no text, no logos, high quality`
    );

    // Upsert site
    const { error: siteErr } = await admin.from("tenant_sites").upsert({
      business_id,
      published: true,
      tagline: ai.tagline,
      hero_headline: ai.hero_headline,
      hero_subheadline: ai.hero_subheadline,
      hero_image_url: heroImg,
      about_text: ai.about_text,
      meta_title: ai.meta_title,
      meta_description: ai.meta_description,
      cta_text: ai.cta_text || "Get a Free Quote",
      phone: biz.phone,
      email: biz.email,
      address: [biz.city, biz.state].filter(Boolean).join(", "),
      generated_at: new Date().toISOString(),
    }, { onConflict: "business_id" });
    if (siteErr) throw siteErr;

    if (regenerate) {
      await admin.from("tenant_site_services").delete().eq("business_id", business_id);
      await admin.from("tenant_site_faqs").delete().eq("business_id", business_id);
      await admin.from("tenant_blog_posts").delete().eq("business_id", business_id);
    }

    if (Array.isArray(ai.services)) {
      await admin.from("tenant_site_services").insert(
        ai.services.slice(0, 8).map((s: any, i: number) => ({
          business_id,
          slug: slugify(s.title) || `service-${i + 1}`,
          title: s.title,
          description: s.description,
          price_from: s.price_from ?? null,
          icon: s.icon || "sparkles",
          sort_order: i,
        }))
      );
    }
    if (Array.isArray(ai.faqs)) {
      await admin.from("tenant_site_faqs").insert(
        ai.faqs.slice(0, 8).map((f: any, i: number) => ({
          business_id, question: f.question, answer: f.answer, sort_order: i,
        }))
      );
    }
    if (Array.isArray(ai.blog_posts)) {
      await admin.from("tenant_blog_posts").insert(
        ai.blog_posts.slice(0, 5).map((p: any) => ({
          business_id,
          slug: slugify(p.title),
          title: p.title,
          excerpt: p.excerpt,
          body_md: p.body_md,
          published: true,
        }))
      );
    }
    if (biz.city) {
      const city = biz.city;
      await admin.from("tenant_site_areas").upsert({
        business_id, city, state: biz.state, slug: slugify(city),
        headline: `${industry} in ${city}`,
        body: `Trusted ${industry} serving ${city} and nearby neighborhoods. Book online in minutes.`,
      }, { onConflict: "business_id,slug" });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
