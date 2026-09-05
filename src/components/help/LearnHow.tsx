import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GraduationCap } from "lucide-react";
import { useHelpArticle } from "@/hooks/useHelp";
import { HelpArticleView } from "./HelpArticleView";
import { cn } from "@/lib/utils";

interface LearnHowProps {
  /** slug of the help article to show */
  slug: string;
  label?: string;
  className?: string;
}

/** "Learn how" link that opens the matching guide in a modal, without leaving the page. */
export function LearnHow({ slug, label = "Learn how", className }: LearnHowProps) {
  const [open, setOpen] = useState(false);
  const { article, related, isLoading } = useHelpArticle(slug);

  return (
    <>
      <Button
        type="button"
        variant="link"
        size="sm"
        className={cn("h-auto p-0 text-primary", className)}
        onClick={() => setOpen(true)}
      >
        <GraduationCap className="mr-1.5 h-4 w-4" />
        {label} →
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">{article?.title ?? "Guide"}</DialogTitle>
          </DialogHeader>
          {isLoading && <p className="text-sm text-muted-foreground">Loading guide…</p>}
          {!isLoading && !article && (
            <p className="text-sm text-muted-foreground">This guide is not available yet.</p>
          )}
          {article && <HelpArticleView article={article} related={related} compact />}
        </DialogContent>
      </Dialog>
    </>
  );
}
