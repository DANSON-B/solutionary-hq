import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoTipProps {
  /** Short, plain-language explanation. Keep it under ~20 words. */
  text: ReactNode;
  className?: string;
  label?: string;
}

/**
 * Small "?" tooltip for buttons, fields and settings.
 * Usage: <Label>Deposit <InfoTip text="How much the customer pays up front." /></Label>
 */
export function InfoTip({ text, className, label = "More information" }: InfoTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={(e) => e.preventDefault()}
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors align-middle",
            className,
          )}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
