import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { LearnHow } from "@/components/help/LearnHow";

export function GettingStartedChecklist() {
  const {
    steps,
    loading,
    isComplete,
    percent,
    allDone,
    checklistDismissed,
    markComplete,
    dismissChecklist,
  } = useOnboarding();
  const [expanded, setExpanded] = useState(true);

  if (loading || checklistDismissed) return null;

  const doneCount = steps.filter((s) => isComplete(s.key)).length;

  return (
    <Card className="relative overflow-hidden border-primary/25 bg-gradient-to-br from-primary/[0.06] to-accent/[0.06] p-5 sm:p-6">
      <button
        onClick={dismissChecklist}
        aria-label="Dismiss getting started checklist"
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-10">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold">
            {allDone ? "You're all set up" : "Getting started"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {allDone
              ? "Every setup step is done. You can hide this card."
              : `${doneCount} of ${steps.length} steps complete — finish setup to start taking bookings.`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Progress value={percent} className="h-2 flex-1" />
        <span className="text-sm font-semibold tabular-nums">{percent}%</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-2 h-9 px-2 text-muted-foreground"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
        {expanded ? "Hide steps" : "Show steps"}
      </Button>

      {expanded && (
        <ul className="mt-3 space-y-2">
          {steps.map((step) => {
            const done = isComplete(step.key);
            return (
              <li
                key={step.key}
                className="rounded-xl border bg-card/80 p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {done ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                    {step.articleSlug && <LearnHow slug={step.articleSlug} className="mt-1" />}
                  </div>
                </div>
                {!done && (
                  <div className="flex shrink-0 gap-2">
                    <Link to={step.link}>
                      <Button size="sm" className="h-11 sm:h-9">{step.cta}</Button>
                    </Link>
                    {!step.auto && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-11 sm:h-9"
                        onClick={() => markComplete(step.key)}
                      >
                        Mark done
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
