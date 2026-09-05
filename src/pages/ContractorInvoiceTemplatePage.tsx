import { useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Download, Printer, FileText, Sparkles } from "lucide-react";

type LineItem = { id: string; description: string; qty: number; rate: number };

const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const todayISO = () => new Date().toISOString().slice(0, 10);
const inDaysISO = (d: number) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 10);
};

export default function ContractorInvoiceTemplatePage() {
  const [businessName, setBusinessName] = useState("Your Contracting Co.");
  const [businessAddress, setBusinessAddress] = useState("123 Main St\nYour City, ST 00000");
  const [businessEmail, setBusinessEmail] = useState("billing@yourcompany.com");
  const [businessPhone, setBusinessPhone] = useState("(555) 123-4567");
  const [logo, setLogo] = useState<string | null>(null);

  const [clientName, setClientName] = useState("Client Name");
  const [clientAddress, setClientAddress] = useState("456 Client Ave\nCity, ST 00000");

  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(inDaysISO(14));
  const [poNumber, setPoNumber] = useState("");
  const [notes, setNotes] = useState("Thank you for your business. Payment due within 14 days.");
  const [terms, setTerms] = useState("Late payments are subject to a 1.5% monthly fee.");
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [deposit, setDeposit] = useState(0);

  const [items, setItems] = useState<LineItem[]>([
    { id: uid(), description: "Labor — 8 hrs @ $75/hr", qty: 8, rate: 75 },
    { id: uid(), description: "Materials (lumber, fasteners)", qty: 1, rate: 240 },
  ]);

  const previewRef = useRef<HTMLDivElement>(null);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0),
    [items]
  );
  const discounted = Math.max(subtotal - (Number(discount) || 0), 0);
  const tax = discounted * ((Number(taxRate) || 0) / 100);
  const total = discounted + tax;
  const balanceDue = Math.max(total - (Number(deposit) || 0), 0);

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems((p) => p.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const addItem = () =>
    setItems((p) => [...p, { id: uid(), description: "", qty: 1, rate: 0 }]);
  const removeItem = (id: string) => setItems((p) => p.filter((it) => it.id !== id));

  const onLogo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePrint = () => window.print();

  const handleDownloadHTML = () => {
    const node = previewRef.current;
    if (!node) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${invoiceNumber}</title>
<style>body{font-family:ui-sans-serif,system-ui,Arial;color:#0f172a;padding:40px;max-width:800px;margin:auto}
table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:14px}
th{background:#f8fafc;color:#475569;font-size:12px;text-transform:uppercase;letter-spacing:.05em}
.right{text-align:right}
h1{margin:0;font-size:28px;letter-spacing:-.02em}
.muted{color:#64748b;font-size:13px}
.tot{font-size:18px;font-weight:700;color:#0f172a}
.brand{color:#0f172a}
.divider{height:1px;background:#e2e8f0;margin:24px 0}
.row{display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
.box{padding:16px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc}
img.logo{max-height:64px;margin-bottom:12px}
</style></head><body>${node.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Contractor Invoice Template",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Free, customizable contractor invoice template. Add line items, tax, deposits, then print or download.",
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What should be on a contractor invoice?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A contractor invoice should include your business name and contact info, the client's details, a unique invoice number, issue and due dates, an itemized list of labor and materials, applicable taxes, deposits paid, the balance due, and clear payment terms.",
        },
      },
      {
        "@type": "Question",
        name: "Is this contractor invoice template really free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Fill it in directly in your browser and print or download the invoice as an HTML file with zero signup required.",
        },
      },
      {
        "@type": "Question",
        name: "How do I send the invoice to my client?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Print to PDF using your browser's print dialog and email the PDF, or download the HTML file and attach it. For automatic delivery, online payment, and reminders, use Solutionary HQ.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Free Contractor Invoice Template (Printable & Editable) | Solutionary HQ</title>
        <meta
          name="description"
          content="Free contractor invoice template you can fill out, print, and download in seconds. Built for service pros — add labor, materials, tax, and deposits."
        />
        <link rel="canonical" href="https://solutionaryhq.com/tools/contractor-invoice-template" />
        <meta property="og:title" content="Free Contractor Invoice Template — Editable & Printable" />
        <meta
          property="og:description"
          content="Build a professional contractor invoice in minutes. Free, no signup, print or download instantly."
        />
        <meta property="og:url" content="https://solutionaryhq.com/tools/contractor-invoice-template" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/40 to-background print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Free tool · No signup
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Free Contractor Invoice Template
          </h1>
          <p className="mt-3 max-w-2xl text-base md:text-lg text-muted-foreground">
            Build a clean, professional contractor invoice in under a minute. Add labor, materials,
            tax, and deposits — then print or download. Designed for general contractors,
            handymen, cleaners, landscapers, and trades.
          </p>
        </div>
      </section>

      {/* Editor + Preview */}
      <section className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[420px_1fr] gap-8">
        {/* Editor */}
        <div className="space-y-4 print:hidden">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your business</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="logo">Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])}
                />
              </div>
              <div>
                <Label>Business name</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Email</Label>
                  <Input value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bill to</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Client name</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div>
                <Label>Client address</Label>
                <Textarea
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Invoice details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Invoice #</Label>
                  <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                </div>
                <div>
                  <Label>PO #</Label>
                  <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
                </div>
                <div>
                  <Label>Issue date</Label>
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div>
                  <Label>Due date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Tax %</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Discount $</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Deposit $</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={deposit}
                    onChange={(e) => setDeposit(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Payment terms</Label>
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Line items</CardTitle>
              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="rounded-md border p-3 space-y-2">
                  <Input
                    placeholder="Description"
                    value={it.description}
                    onChange={(e) => updateItem(it.id, { description: e.target.value })}
                  />
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Qty"
                      value={it.qty}
                      onChange={(e) => updateItem(it.id, { qty: Number(e.target.value) })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Rate"
                      value={it.rate}
                      onChange={(e) => updateItem(it.id, { rate: Number(e.target.value) })}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(it.id)}
                      aria-label="Remove line item"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-2 sticky bottom-4">
            <Button className="flex-1 h-12" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Print / Save as PDF
            </Button>
            <Button className="flex-1 h-12" variant="outline" onClick={handleDownloadHTML}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <div
            ref={previewRef}
            className="bg-card text-card-foreground border rounded-lg shadow-sm p-8 md:p-10 print:border-0 print:shadow-none print:p-0"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
              <div>
                {logo && <img src={logo} alt="Business logo" className="logo max-h-16 mb-3" />}
                <div className="font-semibold text-lg">{businessName}</div>
                <div className="muted whitespace-pre-line text-sm text-muted-foreground">
                  {businessAddress}
                </div>
                <div className="muted text-sm text-muted-foreground">
                  {businessEmail} · {businessPhone}
                </div>
              </div>
              <div className="text-right">
                <h1 className="brand text-3xl font-bold tracking-tight">INVOICE</h1>
                <div className="text-sm text-muted-foreground mt-1">#{invoiceNumber}</div>
                {poNumber && (
                  <div className="text-sm text-muted-foreground">PO: {poNumber}</div>
                )}
              </div>
            </div>

            <div className="divider my-6 h-px bg-border" />

            <div className="row grid md:grid-cols-2 gap-6">
              <div className="box rounded-md border bg-muted/40 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Bill to
                </div>
                <div className="font-medium">{clientName}</div>
                <div className="muted whitespace-pre-line text-sm text-muted-foreground">
                  {clientAddress}
                </div>
              </div>
              <div className="box rounded-md border bg-muted/40 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issue date</span>
                  <span>{issueDate}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Due date</span>
                  <span>{dueDate}</span>
                </div>
              </div>
            </div>

            <table className="w-full mt-6 text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 border-b text-xs uppercase tracking-wide text-muted-foreground">
                    Description
                  </th>
                  <th className="right text-right py-2 border-b text-xs uppercase tracking-wide text-muted-foreground">
                    Qty
                  </th>
                  <th className="right text-right py-2 border-b text-xs uppercase tracking-wide text-muted-foreground">
                    Rate
                  </th>
                  <th className="right text-right py-2 border-b text-xs uppercase tracking-wide text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b">
                    <td className="py-3 align-top">{it.description || "—"}</td>
                    <td className="right text-right py-3">{it.qty}</td>
                    <td className="right text-right py-3">{fmt(it.rate)}</td>
                    <td className="right text-right py-3">{fmt(it.qty * it.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-6">
              <div className="w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>−{fmt(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                  <span>{fmt(tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t tot text-base font-semibold">
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
                {deposit > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deposit paid</span>
                      <span>−{fmt(deposit)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t tot text-base font-semibold">
                      <span>Balance due</span>
                      <span>{fmt(balanceDue)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {(notes || terms) && (
              <div className="mt-8 grid md:grid-cols-2 gap-6 text-sm">
                {notes && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Notes
                    </div>
                    <p className="whitespace-pre-line">{notes}</p>
                  </div>
                )}
                {terms && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Payment terms
                    </div>
                    <p className="whitespace-pre-line">{terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SEO content */}
      <section className="max-w-3xl mx-auto px-4 py-12 print:hidden">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          How to use this contractor invoice template
        </h2>
        <ol className="mt-4 space-y-3 text-muted-foreground list-decimal pl-5">
          <li>Add your business name, logo, address, and contact details.</li>
          <li>Enter the client you're billing and any PO number they provided.</li>
          <li>List labor hours, materials, and any add-ons as separate line items.</li>
          <li>Add tax, a deposit you've already collected, or a discount if needed.</li>
          <li>Print to PDF or download the file, then email it to your client.</li>
        </ol>

        <h2 className="mt-12 text-2xl md:text-3xl font-bold tracking-tight">
          What should be on every contractor invoice
        </h2>
        <ul className="mt-4 space-y-2 text-muted-foreground list-disc pl-5">
          <li>Business name, license number (where applicable), and contact info</li>
          <li>Unique invoice number and PO reference</li>
          <li>Issue date and clear due date</li>
          <li>Itemized labor and materials with quantity and rate</li>
          <li>Subtotal, tax, deposits, and balance due</li>
          <li>Accepted payment methods and late-fee terms</li>
        </ul>

        <div className="mt-12 rounded-xl border bg-muted/40 p-6 md:p-8">
          <div className="flex items-start gap-4">
            <FileText className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h3 className="text-xl font-semibold">
                Want invoices that get paid automatically?
              </h3>
              <p className="mt-2 text-muted-foreground">
                Solutionary HQ turns this template into a full quote-to-payment pipeline — online
                payment links, automatic reminders, deposits, and customer portals.
              </p>
              <div className="mt-4 flex gap-2">
                <Button asChild>
                  <Link to="/pricing">See pricing</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/features/call-quote-console">Tour the platform</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <h2 className="mt-12 text-2xl md:text-3xl font-bold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="font-semibold">Is this contractor invoice template really free?</h3>
            <p className="text-muted-foreground">
              Yes — no signup, no watermark. Fill it in directly in your browser and print or
              download as needed.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Can I save my invoice as a PDF?</h3>
            <p className="text-muted-foreground">
              Click <em>Print / Save as PDF</em> and pick "Save as PDF" in your browser's print
              dialog.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Does this work for handymen, cleaners, and trades?</h3>
            <p className="text-muted-foreground">
              Yes. The line items are flexible — use it for general contracting, remodeling,
              cleaning, landscaping, HVAC, electrical, plumbing, and any service business.
            </p>
          </div>
        </div>
      </section>

      <style>{`
        @media print {
          body { background: white; }
          header, footer, nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
