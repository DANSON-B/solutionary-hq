import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileDown, FileSpreadsheet } from "lucide-react";

type Export = {
  id: string; export_type: string; format: string; period_start: string | null;
  period_end: string | null; row_count: number; status: string; created_at: string;
};

function toCsv(rows: any[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map(r => keys.map(k => esc(r[k])).join(","))].join("\n");
}

export default function AccountingPage() {
  const { business } = useAuth();
  const [exports, setExports] = useState<Export[]>([]);
  const [form, setForm] = useState({
    export_type: "invoices",
    period_start: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10),
  });
  const [running, setRunning] = useState(false);

  const load = async () => {
    if (!business?.id) return;
    const { data } = await supabase.from("accounting_exports").select("*")
      .eq("business_id", business.id).order("created_at", { ascending: false }).limit(50);
    setExports((data as any) || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [business?.id]);

  const run = async () => {
    if (!business?.id) return;
    setRunning(true);
    try {
      let rows: any[] = [];
      const start = new Date(form.period_start).toISOString();
      const end = new Date(new Date(form.period_end).getTime() + 86400_000).toISOString();
      if (form.export_type === "invoices") {
        const { data } = await supabase.from("invoices")
          .select("invoice_number,status,total,amount_paid,created_at,customer_id")
          .eq("business_id", business.id).gte("created_at", start).lt("created_at", end);
        rows = data || [];
      } else if (form.export_type === "payments") {
        const { data } = await supabase.from("payments")
          .select("id,amount,method,status,created_at,invoice_id")
          .eq("business_id", business.id).gte("created_at", start).lt("created_at", end);
        rows = data || [];
      } else if (form.export_type === "payroll") {
        const { data } = await supabase.from("payroll_line_items")
          .select("team_member_id,hours,gross_pay_cents,created_at,payroll_period_id")
          .eq("business_id", business.id).gte("created_at", start).lt("created_at", end);
        rows = data || [];
      }

      const csv = toCsv(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form.export_type}-${form.period_start}-to-${form.period_end}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      await supabase.from("accounting_exports").insert({
        business_id: business.id, export_type: form.export_type, format: "csv",
        period_start: form.period_start, period_end: form.period_end,
        row_count: rows.length, status: "ready",
      });
      toast.success(`Exported ${rows.length} row(s)`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Export failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Accounting sync</h1>
        <p className="text-muted-foreground">Export invoices, payments, and payroll for QuickBooks, Xero, or your accountant.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">New export</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <Label>Type</Label>
            <Select value={form.export_type} onValueChange={v => setForm({ ...form, export_type: v })}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="invoices">Invoices</SelectItem>
                <SelectItem value="payments">Payments</SelectItem>
                <SelectItem value="payroll">Payroll</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>From</Label><Input type="date" className="h-12" value={form.period_start} onChange={e => setForm({ ...form, period_start: e.target.value })} /></div>
          <div><Label>To</Label><Input type="date" className="h-12" value={form.period_end} onChange={e => setForm({ ...form, period_end: e.target.value })} /></div>
          <Button onClick={run} disabled={running} className="h-12">
            <FileDown className="h-4 w-4 mr-2" />{running ? "Exporting..." : "Export CSV"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent exports</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {exports.length === 0 ? <p className="text-sm text-muted-foreground">No exports yet.</p> :
            exports.map(x => (
              <div key={x.id} className="flex items-center gap-3 p-3 rounded border text-sm">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium capitalize">{x.export_type} <Badge variant="outline" className="ml-2 uppercase text-xs">{x.format}</Badge></div>
                  <div className="text-xs text-muted-foreground">
                    {x.period_start} → {x.period_end} · {x.row_count} rows · {new Date(x.created_at).toLocaleString()}
                  </div>
                </div>
                <Badge variant={x.status === "ready" ? "default" : "destructive"}>{x.status}</Badge>
              </div>
            ))
          }
        </CardContent>
      </Card>
    </div>
  );
}
