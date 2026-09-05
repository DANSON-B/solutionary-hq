import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Square, ClipboardList } from "lucide-react";
import {
  DEFAULT_CONFIG,
  ADDON_CATEGORY_LABELS,
  type AddOn,
} from "@/components/booking/cleaning-wizard/types";

interface Props {
  /** Free-text fields where booking add-ons typically appear (job.description, job.notes, quote.scope, etc.) */
  sources: (string | null | undefined)[];
  /** Optional: per-item check state keyed by addon id, persisted by parent */
  checkedIds?: Set<string>;
  onToggle?: (id: string) => void;
}

/**
 * Crew-friendly brief: scans free-text job fields for add-on labels from the
 * cleaning wizard catalog, groups them by step category, and renders a
 * step-by-step checklist for the field crew.
 */
export default function CrewAddonsBrief({ sources, checkedIds, onToggle }: Props) {
  const matched = useMemo(() => {
    const haystack = sources.filter(Boolean).join("\n").toLowerCase();
    if (!haystack) return [];
    const all: AddOn[] = [
      ...DEFAULT_CONFIG.residential_addons,
      ...DEFAULT_CONFIG.commercial_addons,
    ];
    // De-dupe by id
    const seen = new Set<string>();
    const hits: AddOn[] = [];
    for (const a of all) {
      if (seen.has(a.id)) continue;
      // Match the human label (strip parenthetical/percent suffixes for fuzzier match)
      const stripped = a.label.replace(/\s*\([^)]*\)/g, "").trim().toLowerCase();
      if (stripped.length < 3) continue;
      if (haystack.includes(stripped) || haystack.includes(a.label.toLowerCase())) {
        seen.add(a.id);
        hits.push(a);
      }
    }
    return hits;
  }, [sources]);

  const grouped = useMemo(() => {
    const map = new Map<string, AddOn[]>();
    for (const a of matched) {
      const arr = map.get(a.category) || [];
      arr.push(a);
      map.set(a.category, arr);
    }
    // Preserve the order defined in ADDON_CATEGORY_LABELS
    const ordered: { key: string; label: string; items: AddOn[] }[] = [];
    for (const key of Object.keys(ADDON_CATEGORY_LABELS)) {
      if (map.has(key)) {
        ordered.push({ key, label: ADDON_CATEGORY_LABELS[key], items: map.get(key)! });
      }
    }
    // Append any unknown categories at the end
    for (const [key, items] of map.entries()) {
      if (!ADDON_CATEGORY_LABELS[key]) {
        ordered.push({ key, label: key, items });
      }
    }
    return ordered;
  }, [matched]);

  if (matched.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Crew Add-Ons Brief
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No add-ons detected on this job. Add-ons selected during booking will appear here as a
            step-by-step checklist for the crew.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalChecked = checkedIds ? matched.filter((a) => checkedIds.has(a.id)).length : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Crew Add-Ons Brief
          </CardTitle>
          <span className="text-xs font-medium text-muted-foreground">
            {matched.length} task{matched.length === 1 ? "" : "s"}
            {checkedIds ? ` · ${totalChecked}/${matched.length} complete` : ""}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {grouped.map((group) => {
          const groupDone = checkedIds
            ? group.items.every((i) => checkedIds.has(i.id))
            : false;
          return (
            <div key={group.key} className="rounded-xl border bg-card overflow-hidden">
              <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
                groupDone ? "bg-primary/5" : "bg-muted/40"
              }`}>
                <h4 className="text-sm font-semibold">{group.label}</h4>
                <span className="text-xs text-muted-foreground">
                  {group.items.length} item{group.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="divide-y">
                {group.items.map((item) => {
                  const checked = checkedIds?.has(item.id) ?? false;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onToggle?.(item.id)}
                        disabled={!onToggle}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors min-h-12 ${
                          onToggle ? "hover:bg-accent/40 active:bg-accent/60" : ""
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`flex-1 text-sm ${
                            checked ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {item.label}
                        </span>
                        {item.is_percent ? (
                          <span className="text-xs font-medium text-muted-foreground shrink-0">
                            +{item.percent}%
                          </span>
                        ) : item.price > 0 ? (
                          <span className="text-xs font-medium text-muted-foreground shrink-0">
                            ${item.price}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
