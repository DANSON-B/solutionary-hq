import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, Search, ArrowLeft, ArrowRight, LifeBuoy } from "lucide-react";
import { useContextualHelp, searchArticles, type HelpArticle } from "@/hooks/useHelp";
import { HelpArticleView } from "./HelpArticleView";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard help",
  "/dashboard/jobs": "Booking help",
  "/dashboard/calendar": "Scheduling help",
  "/dashboard/customers": "Customer help",
  "/dashboard/services": "Service help",
  "/dashboard/team": "Team help",
  "/dashboard/invoices": "Payment help",
  "/dashboard/settings": "Settings help",
};

export function HelpLauncher() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<HelpArticle | null>(null);
  const location = useLocation();
  const { articles, contextual, isLoading } = useContextualHelp();

  const results = term.trim() ? searchArticles(articles, term) : contextual;
  const heading = ROUTE_TITLES[location.pathname] ?? "Help for this page";
  const related = selected ? articles.filter((a) => selected.related_slugs.includes(a.slug)) : [];

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setSelected(null);
          setTerm("");
        }
      }}
    >
      <SheetTrigger asChild>
        <button
          aria-label="Open help"
          className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors sm:h-14 sm:w-14"
        >
          <HelpCircle className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-5 pb-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" />
            {selected ? "Help article" : heading}
          </SheetTitle>
        </SheetHeader>

        {!selected && (
          <div className="px-5 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search all help articles"
                className="h-12 pl-9 text-base"
              />
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 px-5 py-4">
          {selected ? (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setSelected(null)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <HelpArticleView article={selected} compact />
              {related.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold mb-2">Related</h3>
                  <ul className="space-y-2">
                    {related.map((r) => (
                      <li key={r.id}>
                        <button
                          onClick={() => setSelected(r)}
                          className="w-full rounded-lg border bg-card px-4 py-3 text-left text-sm hover:bg-accent/50"
                        >
                          {r.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading help…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No articles matched “{term}”. Try a different word, or contact support below.
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => setSelected(a)}
                    className="w-full rounded-xl border bg-card p-4 text-left hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        {a.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                        )}
                      </div>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <div className="border-t p-4 space-y-2">
          <Link to="/help" onClick={() => setOpen(false)}>
            <Button variant="outline" className="w-full h-11">Browse the Help Center</Button>
          </Link>
          <a href="mailto:support@solutionaryhq.com">
            <Button variant="ghost" className="w-full h-11">Still need help? Contact support</Button>
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
