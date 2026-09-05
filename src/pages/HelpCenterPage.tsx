import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight, ArrowLeft, LifeBuoy, Mail } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useHelpArticles, useHelpCategories, searchArticles, useHelpArticle } from "@/hooks/useHelp";
import { HelpArticleView } from "@/components/help/HelpArticleView";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="text-lg font-bold">
            Solutionary<span className="text-primary"> HQ</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="h-10">Go to dashboard</Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-center sm:px-6">
          <p className="text-sm text-muted-foreground">Can't find what you need?</p>
          <a href="mailto:support@solutionaryhq.com">
            <Button className="h-12">
              <Mail className="mr-2 h-4 w-4" /> Contact support
            </Button>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function HelpCenterPage() {
  const { categorySlug } = useParams();
  const [term, setTerm] = useState("");
  const { data: categories = [] } = useHelpCategories();
  const { data: articles = [], isLoading } = useHelpArticles();

  const results = useMemo(() => searchArticles(articles, term), [articles, term]);
  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const visible = categorySlug ? articles.filter((a) => a.category_slug === categorySlug) : [];

  return (
    <Shell>
      <Seo
        title="Help Center | Solutionary HQ"
        description="Step-by-step guides for setting up services, bookings, scheduling, payments and your team in Solutionary HQ."
      />

      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LifeBuoy className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">How can we help?</h1>
        <p className="mt-2 text-muted-foreground">Plain-language guides for every part of Solutionary HQ.</p>
        <div className="relative mx-auto mt-6 max-w-xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search help articles…"
            className="h-14 rounded-full pl-12 text-base"
          />
        </div>
      </div>

      {term.trim() ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            {results.length} result{results.length !== 1 ? "s" : ""} for “{term}”
          </h2>
          <ul className="space-y-2">
            {results.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/help/article/${a.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:bg-accent/40"
                >
                  <div>
                    <p className="font-medium">{a.title}</p>
                    {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : categorySlug ? (
        <section>
          <Link to="/help" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> All categories
          </Link>
          <h2 className="text-2xl font-bold">{activeCategory?.title ?? "Articles"}</h2>
          {activeCategory?.description && (
            <p className="mt-1 text-muted-foreground">{activeCategory.description}</p>
          )}
          <ul className="mt-5 space-y-2">
            {visible.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/help/article/${a.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:bg-accent/40"
                >
                  <div>
                    <p className="font-medium">{a.title}</p>
                    {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
            {visible.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground">No articles in this category yet.</p>
            )}
          </ul>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const count = articles.filter((a) => a.category_slug === c.slug).length;
            return (
              <Link key={c.id} to={`/help/${c.slug}`}>
                <Card className="h-full p-5 transition-colors hover:border-primary/40 hover:bg-accent/30">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold">{c.title}</h2>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                  {c.description && <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>}
                </Card>
              </Link>
            );
          })}
        </section>
      )}
    </Shell>
  );
}

export function HelpArticlePage() {
  const { slug } = useParams();
  const { article, related, isLoading } = useHelpArticle(slug);

  return (
    <Shell>
      {article && (
        <Seo
          title={`${article.title} | Solutionary HQ Help`}
          description={article.description ?? "Step-by-step guide for Solutionary HQ."}
        />
      )}
      <Link to="/help" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Help Center
      </Link>
      {isLoading && <p className="text-muted-foreground">Loading article…</p>}
      {!isLoading && !article && <p className="text-muted-foreground">We couldn't find that article.</p>}
      {article && (
        <div className="rounded-2xl border bg-card p-5 sm:p-8">
          <HelpArticleView article={article} related={related} />
        </div>
      )}
    </Shell>
  );
}
