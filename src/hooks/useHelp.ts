import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export interface HelpCategory {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

export interface HelpArticle {
  id: string;
  category_slug: string;
  slug: string;
  title: string;
  description: string | null;
  keywords: string[];
  steps: string[];
  body: string | null;
  video_url: string | null;
  image_urls: string[];
  related_slugs: string[];
  routes: string[];
  published: boolean;
  sort_order: number;
}

function normalizeArticle(row: any): HelpArticle {
  return {
    ...row,
    keywords: row.keywords ?? [],
    steps: Array.isArray(row.steps) ? (row.steps as string[]) : [],
    image_urls: row.image_urls ?? [],
    related_slugs: row.related_slugs ?? [],
    routes: row.routes ?? [],
  };
}

export function useHelpCategories() {
  return useQuery({
    queryKey: ["help-categories"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<HelpCategory[]> => {
      const { data, error } = await supabase
        .from("help_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as HelpCategory[];
    },
  });
}

export function useHelpArticles(includeUnpublished = false) {
  return useQuery({
    queryKey: ["help-articles", includeUnpublished],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<HelpArticle[]> => {
      let query = supabase.from("help_articles").select("*");
      if (!includeUnpublished) query = query.eq("published", true);
      const { data, error } = await query
        .order("category_slug", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(normalizeArticle);
    },
  });
}

/** Simple weighted search across title, description, keywords, category and body. */
export function searchArticles(articles: HelpArticle[], term: string): HelpArticle[] {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  const scored = articles.map((a) => {
    const hay = {
      title: a.title.toLowerCase(),
      description: (a.description ?? "").toLowerCase(),
      keywords: a.keywords.join(" ").toLowerCase(),
      category: a.category_slug.toLowerCase(),
      body: `${a.body ?? ""} ${a.steps.join(" ")}`.toLowerCase(),
    };
    let score = 0;
    if (hay.title.includes(q)) score += 50;
    if (hay.description.includes(q)) score += 20;
    if (hay.keywords.includes(q)) score += 25;
    if (hay.body.includes(q)) score += 8;
    for (const w of words) {
      if (hay.title.includes(w)) score += 10;
      if (hay.keywords.includes(w)) score += 6;
      if (hay.description.includes(w)) score += 4;
      if (hay.category.includes(w)) score += 3;
      if (hay.body.includes(w)) score += 2;
    }
    return { a, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 25)
    .map((s) => s.a);
}

/** Articles relevant to a given dashboard route. */
export function articlesForRoute(articles: HelpArticle[], pathname: string): HelpArticle[] {
  const exact = articles.filter((a) => a.routes.includes(pathname));
  if (exact.length) return exact;
  const partial = articles.filter((a) =>
    a.routes.some((r) => r !== "/dashboard" && (pathname.startsWith(r) || r.startsWith(pathname))),
  );
  if (partial.length) return partial;
  return articles.filter((a) => a.category_slug === "getting-started").slice(0, 5);
}

export function useContextualHelp() {
  const location = useLocation();
  const { data: articles = [], isLoading } = useHelpArticles();
  const contextual = useMemo(
    () => articlesForRoute(articles, location.pathname),
    [articles, location.pathname],
  );
  return { articles, contextual, isLoading, pathname: location.pathname };
}

export function useHelpArticle(slug?: string) {
  const { data: articles = [], isLoading } = useHelpArticles();
  const article = useMemo(() => articles.find((a) => a.slug === slug), [articles, slug]);
  const related = useMemo(
    () => (article ? articles.filter((a) => article.related_slugs.includes(a.slug)) : []),
    [articles, article],
  );
  return { article, related, isLoading, articles };
}
