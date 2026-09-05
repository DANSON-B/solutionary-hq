import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, ExternalLink, Copy, Loader2, RefreshCw } from "lucide-react";
import { NavigationEditor } from "@/components/dashboard/website/NavigationEditor";
import type { NavItem } from "@/lib/tenantNav";

export default function WebsiteBuilderPage() {
  const { business } = useAuth();
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: site, isLoading } = useQuery({
    queryKey: ["tenant-site-admin", business?.id],
    queryFn: async () => {
      if (!business?.id) return null;
      const { data } = await supabase.from("tenant_sites").select("*").eq("business_id", business.id).maybeSingle();
      return data;
    },
    enabled: !!business?.id,
  });

  const { data: services } = useQuery({
    queryKey: ["tenant-services-admin", business?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tenant_site_services").select("*").eq("business_id", business!.id).order("sort_order");
      return data || [];
    },
    enabled: !!business?.id,
  });

  const { data: areas } = useQuery({
    queryKey: ["tenant-areas-admin", business?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tenant_site_areas").select("*").eq("business_id", business!.id);
      return data || [];
    },
    enabled: !!business?.id,
  });

  const generate = async (regenerate = false) => {
    if (!business?.id) return;
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("generate-tenant-site", {
        body: { business_id: business.id, regenerate },
      });
      if (error) throw error;
      toast.success("Website generated!");
      qc.invalidateQueries({ queryKey: ["tenant-site-admin"] });
      qc.invalidateQueries({ queryKey: ["tenant-services-admin"] });
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const saveSite = async (patch: any) => {
    if (!site?.id) return;
    const { error } = await supabase.from("tenant_sites").update(patch).eq("id", site.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["tenant-site-admin"] });
    }
  };

  const publicUrl = business?.slug ? `${window.location.origin}/site/${business.slug}` : "";

  if (!business) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display uppercase text-3xl tracking-tight">Your Website</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-generated marketing site for {business.name}</p>
        </div>
        <div className="flex gap-2">
          {site ? (
            <Button onClick={() => generate(true)} disabled={generating} variant="outline">
              {generating ? <Loader2 className="animate-spin mr-2" size={16} /> : <RefreshCw size={16} className="mr-2" />}
              Regenerate
            </Button>
          ) : (
            <Button onClick={() => generate(false)} disabled={generating}>
              {generating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Sparkles size={16} className="mr-2" />}
              Generate Website
            </Button>
          )}
          {site && (
            <Button asChild variant="secondary">
              <a href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} className="mr-2" /> View Live</a>
            </Button>
          )}
        </div>
      </div>

      {isLoading && <Card className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></Card>}

      {!isLoading && !site && (
        <Card className="p-10 text-center">
          <Sparkles className="mx-auto mb-4 text-primary" size={40} />
          <h2 className="font-display uppercase text-2xl mb-2">Launch Your Website in Seconds</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            AI writes your hero, services, about copy, FAQs, and blog posts based on your business and industry.
            You can edit anything after.
          </p>
          <Button onClick={() => generate(false)} disabled={generating} size="lg">
            {generating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
            Generate My Website
          </Button>
        </Card>
      )}

      {site && (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Publishing</h2>
              <div className="flex items-center gap-2">
                <Label htmlFor="pub">Published</Label>
                <Switch id="pub" checked={site.published} onCheckedChange={(v) => saveSite({ published: v })} />
              </div>
            </div>
            {publicUrl && (
              <div className="flex items-center gap-2 text-sm bg-muted p-3 rounded">
                <code className="flex-1 truncate">{publicUrl}</code>
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Copied"); }}>
                  <Copy size={14} />
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Hero</h2>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input defaultValue={site.tagline || ""} onBlur={(e) => saveSite({ tagline: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input defaultValue={site.hero_headline || ""} onBlur={(e) => saveSite({ hero_headline: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Textarea defaultValue={site.hero_subheadline || ""} onBlur={(e) => saveSite({ hero_subheadline: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Primary CTA text</Label>
              <Input defaultValue={site.cta_text || ""} onBlur={(e) => saveSite({ cta_text: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>About</Label>
              <Textarea rows={6} defaultValue={site.about_text || ""} onBlur={(e) => saveSite({ about_text: e.target.value })} />
            </div>
          </Card>

          <NavigationEditor
            base={`/site/${business.slug}`}
            industry={business.industry}
            services={(services || []).map((s: any) => ({ slug: s.slug, title: s.title }))}
            areas={(areas || []).map((a: any) => ({ slug: a.slug, city: a.city }))}
            value={(site as any).nav_items as NavItem[] | null}
            onSave={(items) => saveSite({ nav_items: items })}
          />

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">SEO</h2>
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input defaultValue={site.meta_title || ""} onBlur={(e) => saveSite({ meta_title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea defaultValue={site.meta_description || ""} onBlur={(e) => saveSite({ meta_description: e.target.value })} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4">Services ({services?.length || 0})</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {services?.map((s: any) => (
                <div key={s.id} className="border rounded p-3">
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{s.description}</div>
                  {s.price_from && <div className="text-xs mt-1">From ${s.price_from}</div>}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">Edit services directly in <a className="underline" href="/dashboard/services">Services</a>, or regenerate to refresh.</p>
          </Card>
        </>
      )}
    </div>
  );
}
