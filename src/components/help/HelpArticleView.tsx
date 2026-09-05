import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, PlayCircle } from "lucide-react";
import type { HelpArticle } from "@/hooks/useHelp";

interface Props {
  article: HelpArticle;
  related?: HelpArticle[];
  compact?: boolean;
}

export function HelpArticleView({ article, related = [], compact = false }: Props) {
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        {!compact && <Badge variant="secondary" className="capitalize">{article.category_slug.replace(/-/g, " ")}</Badge>}
        <h1 className={compact ? "text-lg font-semibold" : "text-2xl sm:text-3xl font-bold"}>{article.title}</h1>
        {article.description && (
          <p className="text-muted-foreground text-sm sm:text-base">{article.description}</p>
        )}
      </header>

      {article.body && <p className="text-sm sm:text-base leading-relaxed">{article.body}</p>}

      {article.steps.length > 0 && (
        <ol className="space-y-3">
          {article.steps.map((step, i) => (
            <li key={i} className="flex gap-3 rounded-xl border bg-card p-3 sm:p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      )}

      {article.video_url && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <PlayCircle className="h-4 w-4 text-primary" /> Watch the walkthrough
          </div>
          <div className="aspect-video w-full overflow-hidden rounded-xl border">
            <iframe
              src={article.video_url}
              title={article.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {article.image_urls.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {article.image_urls.map((src) => (
            <img key={src} src={src} alt={article.title} loading="lazy" className="w-full rounded-xl border" />
          ))}
        </div>
      )}

      {article.routes.length > 0 && (
        <Link
          to={article.routes[0]}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Take me there <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      {related.length > 0 && (
        <div className="pt-2">
          <Separator className="mb-4" />
          <h2 className="text-sm font-semibold mb-3">Related articles</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/help/article/${r.slug}`}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-sm hover:bg-accent/50 transition-colors"
                >
                  <span>{r.title}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
