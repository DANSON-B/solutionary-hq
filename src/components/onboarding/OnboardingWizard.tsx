import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowRight, ArrowLeft, Rocket } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { LearnHow } from "@/components/help/LearnHow";

/**
 * First-run interactive setup guide. Opens once for brand-new businesses,
 * can be skipped at any time and resumed later from the Getting Started card.
 */
export function OnboardingWizard() {
  const {
    steps,
    loading,
    isComplete,
    percent,
    currentStep,
    wizardDismissed,
    setCurrentStep,
    markComplete,
    markSkipped,
    dismissWizard,
  } = useOnboarding();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!wizardDismissed) {
      setIndex(Math.min(currentStep, steps.length - 1));
      setOpen(true);
    }
  }, [loading, wizardDismissed]);

  if (loading || wizardDismissed) return null;

  const step = steps[index];
  const done = isComplete(step.key);
  const isLast = index === steps.length - 1;

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(next, steps.length - 1));
    setIndex(clamped);
    setCurrentStep(clamped);
  };

  const finish = () => {
    dismissWizard();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setCurrentStep(index);
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto sm:max-w-lg p-0">
        <div className="bg-primary px-6 py-5 text-primary-foreground">
          <div className="flex items-center gap-2 text-sm font-medium opacity-90">
            <Rocket className="h-4 w-4" /> Welcome to Solutionary HQ
          </div>
          <h2 className="mt-2 text-xl font-bold">Let's get your business set up</h2>
          <p className="mt-1 text-sm opacity-90">
            Step {index + 1} of {steps.length} — this takes about 10 minutes.
          </p>
        </div>

        <div className="px-6 pt-4">
          <Progress value={percent} className="h-2" />
        </div>

        <div className="space-y-3 px-6 py-5">
          <div className="flex items-start gap-3">
            {done && <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />}
            <div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
          {step.articleSlug && <LearnHow slug={step.articleSlug} label="See the step-by-step guide" />}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Link to={step.link} className="sm:flex-1" onClick={() => setOpen(false)}>
              <Button className="h-12 w-full">{step.cta}</Button>
            </Link>
            {!done && (
              <Button
                variant="outline"
                className="h-12 sm:flex-1"
                onClick={() => {
                  if (!step.auto) markComplete(step.key);
                  isLast ? finish() : goTo(index + 1);
                }}
              >
                {step.auto ? "I've done this" : "Mark done & continue"}
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
          <Button variant="ghost" className="h-11" onClick={() => goTo(index - 1)} disabled={index === 0}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" className="h-11 text-muted-foreground" onClick={finish}>
              Skip setup
            </Button>
            <Button
              className="h-11"
              onClick={() => {
                if (!done) markSkipped(step.key);
                isLast ? finish() : goTo(index + 1);
              }}
            >
              {isLast ? "Finish" : "Next"} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
