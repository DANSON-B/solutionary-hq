import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollText, Copy, RotateCcw, Save, Lock, ClipboardPaste, Trash2, X, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DEFAULT_SCRIPT = `☎️ SALES SCRIPT — CLEANING INTAKE

1. GREETING
"Thanks for calling [Business Name], this is ___. Who am I speaking with?"

2. QUALIFY
• What area / ZIP are you in?
• How many bedrooms / bathrooms?
• Approx square footage?
• Any pets in the home?
• When were you hoping to have it cleaned?

3. SERVICE FIT
• Standard, Deep, Move-In/Out, or Post-Construction?
• Any add-ons? (oven, fridge, windows, baseboards, cabinets…)

4. PRICE PRESENTATION
"Based on what you've shared, your total comes to $____.
We can lock that in with a small deposit and I'll text you a secure link right now."

5. CLOSE
• "Would morning or afternoon work better?"
• "I'll send the quote to your phone — you can review and approve in one tap."

6. OBJECTION HANDLERS
• "That's more than I expected." → highlight what's included, offer Basic tier.
• "Let me think about it." → "No problem — I'll text the quote so you have it. It stays valid for 7 days."
• "Do you have insurance?" → "Yes — fully insured and bonded."

7. WRAP UP
"You'll get a text in about 30 seconds. Tap the link, review, and hit Approve.
Anything changes, just reply to that text and it comes straight to me."`;

interface Props {
  businessId?: string;
  onInsertToNotes?: (text: string) => void;
}

export function SalesScriptDrawer({ businessId, onInsertToNotes }: Props) {
  const storageKey = businessId ? `sales_script_${businessId}` : "sales_script_default";
  const [open, setOpen] = useState(false);
  const [script, setScript] = useState<string>(DEFAULT_SCRIPT);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) setScript(saved);
    else setScript(DEFAULT_SCRIPT);
    setDirty(false);
  }, [storageKey]);

  const save = () => {
    localStorage.setItem(storageKey, script);
    setDirty(false);
    toast({ title: "Script saved", description: "Only you and your team can see this." });
  };

  const reset = () => {
    setScript(DEFAULT_SCRIPT);
    setDirty(true);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(script);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <ScrollText className="h-3.5 w-3.5" />
          Script
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full flex flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b bg-gradient-to-br from-slate-900 to-slate-800 px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                if (dirty && !confirm("You have unsaved changes. Go back without saving?")) return;
                setOpen(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
              aria-label="Back to Call Quote Console"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
          <SheetTitle className="flex items-center gap-2 text-white">
            <ScrollText className="h-5 w-5 text-amber-300" />
            Sales Script
          </SheetTitle>
          <SheetDescription className="flex items-center gap-1.5 text-white/70">
            <Lock className="h-3 w-3" /> Owner-only · Never shown to customers
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden px-5 py-4">
          <Textarea
            value={script}
            onChange={(e) => { setScript(e.target.value); setDirty(true); }}
            placeholder="Paste or write your sales script here..."
            className="h-full min-h-[420px] resize-none font-mono text-sm leading-relaxed"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/40 px-5 py-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={reset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
            <Button size="sm" variant="ghost" onClick={copy} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
            {onInsertToNotes && (
              <Button size="sm" variant="ghost" onClick={() => { onInsertToNotes(script); toast({ title: "Added to call notes" }); }} className="gap-1.5">
                <ClipboardPaste className="h-3.5 w-3.5" /> To notes
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (!confirm("Delete your saved script? This can't be undone.")) return;
                localStorage.removeItem(storageKey);
                setScript("");
                setDirty(false);
                toast({ title: "Script deleted" });
              }}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (dirty && !confirm("You have unsaved changes. Close without saving?")) return;
                setOpen(false);
              }}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" /> Close
            </Button>
            <Button size="sm" onClick={save} disabled={!dirty} className="gap-1.5">
              <Save className="h-3.5 w-3.5" /> {dirty ? "Save changes" : "Saved"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
