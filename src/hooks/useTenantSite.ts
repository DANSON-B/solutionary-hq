import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TenantSiteBundle {
  business: { id: string; name: string; slug: string; industry: string | null; logo_url: string | null; phone: string | null; email: string | null; city: string | null; state: string | null; website: string | null };
  site: any;
  services: any[];
  areas: any[];
  posts: any[];
  faqs: any[];
  reviews: any[];
  rating_avg: number;
  rating_count: number;
}

export function useTenantSite(slug?: string) {
  return useQuery({
    queryKey: ["tenant-site", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase.rpc("get_tenant_site_bundle", { p_slug: slug });
      if (error) throw error;
      return (data as unknown) as TenantSiteBundle | null;
    },
    enabled: !!slug,
  });
}
