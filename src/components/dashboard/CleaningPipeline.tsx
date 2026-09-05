import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

const CLEANING_STAGES = [
  { key: "draft", label: "New Lead", color: "bg-muted text-muted-foreground" },
  { key: "sent", label: "Quoted", color: "bg-primary/10 text-primary" },
  { key: "viewed", label: "Follow-Up", color: "bg-accent/20 text-accent-foreground" },
  { key: "approved", label: "Booked", color: "bg-green-100 text-green-700" },
  { key: "declined", label: "Lost", color: "bg-destructive/10 text-destructive" },
  { key: "expired", label: "Expired", color: "bg-muted text-muted-foreground" },
];

interface Props {
  quotes: any[];
}

export function CleaningPipeline({ quotes }: Props) {
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of CLEANING_STAGES) map[s.key] = [];
    for (const q of quotes) {
      if (map[q.status]) map[q.status].push(q);
      else map["draft"]?.push(q);
    }
    return map;
  }, [quotes]);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {CLEANING_STAGES.map((stage) => (
          <div key={stage.key} className="w-56 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stage.color}`}>
                {stage.label}
              </span>
              <span className="text-xs text-muted-foreground">({grouped[stage.key]?.length || 0})</span>
            </div>
            <div className="space-y-2">
              {grouped[stage.key]?.map((q: any) => (
                <Link
                  key={q.id}
                  to={`/dashboard/quotes/${q.id}`}
                  className="block rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium truncate">{q.quote_number}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {q.customers?.first_name} {q.customers?.last_name}
                  </p>
                  <p className="text-sm font-semibold mt-1">${(q.total || 0).toFixed(2)}</p>
                </Link>
              ))}
              {(!grouped[stage.key] || grouped[stage.key].length === 0) && (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No quotes
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
