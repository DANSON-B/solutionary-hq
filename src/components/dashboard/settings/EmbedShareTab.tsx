import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, ExternalLink, Code2, Link2, QrCode, Download } from "lucide-react";
import { useIsCleaning } from "@/hooks/useIsCleaning";
import CleaningEmbedWidget from "@/components/dashboard/cleaning/CleaningEmbedWidget";

interface EmbedShareTabProps {
  businessSlug: string | null;
}

export default function EmbedShareTab({ businessSlug }: EmbedShareTabProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const isCleaning = useIsCleaning();

  const baseUrl = window.location.origin;

  // InstaQuote URLs
  const iqDirectLink = businessSlug ? `${baseUrl}/q/${businessSlug}` : "";
  const iqEmbedUrl = businessSlug ? `${baseUrl}/q/${businessSlug}?embed=true` : "";

  // Booking URLs
  const bookDirectLink = businessSlug ? `${baseUrl}/book/${businessSlug}` : "";
  const bookEmbedUrl = businessSlug ? `${baseUrl}/book/${businessSlug}?embed=true` : "";

  const makeIframeCode = (url: string, title: string) => `<iframe
  src="${url}"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none; border-radius: 12px; max-width: 640px;"
  title="${title}"
></iframe>`;

  const makeScriptCode = (url: string, title: string, divId: string) => `<div id="${divId}"></div>
<script>
(function() {
  var iframe = document.createElement('iframe');
  iframe.src = '${url}';
  iframe.style.cssText = 'width:100%;height:800px;border:none;border-radius:12px;max-width:640px;';
  iframe.title = '${title}';
  document.getElementById('${divId}').appendChild(iframe);
})();
</script>`;

  const [activeWidget, setActiveWidget] = useState<"instaquote" | "booking">("instaquote");

  const currentDirect = activeWidget === "instaquote" ? iqDirectLink : bookDirectLink;
  const currentEmbed = activeWidget === "instaquote" ? iqEmbedUrl : bookEmbedUrl;
  const currentTitle = activeWidget === "instaquote" ? "Get a Quote" : "Book a Service";
  const currentDivId = activeWidget === "instaquote" ? "instaquote-widget" : "booking-widget";

  const iframeCode = makeIframeCode(currentEmbed, currentTitle);
  const scriptCode = makeScriptCode(currentEmbed, currentTitle, currentDivId);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ field, text }: { field: string; text: string }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
      className="shrink-0"
    >
      {copiedField === field ? (
        <><Check className="h-4 w-4 mr-1" /> Copied</>
      ) : (
        <><Copy className="h-4 w-4 mr-1" /> Copy</>
      )}
    </Button>
  );

  if (!businessSlug) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            You need a business slug to generate embed codes. Please set one in your Company Profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Widget Selector */}
      <Card>
        <CardContent className="pt-6">
          <Label className="text-sm font-medium mb-3 block">Choose Widget</Label>
          <div className="flex gap-2">
            <Button
              variant={activeWidget === "instaquote" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveWidget("instaquote")}
            >
              InstaQuote Form
            </Button>
            <Button
              variant={activeWidget === "booking" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveWidget("booking")}
            >
              Booking Form
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Direct Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Direct Link
          </CardTitle>
          <CardDescription>
            Share this link directly with customers or add it to your website as a button.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input value={currentDirect} readOnly className="font-mono text-sm" />
            <CopyButton field="direct" text={currentDirect} />
            <Button variant="outline" size="sm" asChild>
              <a href={currentDirect} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="h-4 w-4" /> QR Code
          </CardTitle>
          <CardDescription>
            Download a QR code that links directly to your {activeWidget === "instaquote" ? "InstaQuote" : "Booking"} page. Perfect for flyers, business cards, and print materials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="rounded-lg border bg-white p-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentDirect)}&margin=8`}
                alt={`QR code for ${currentTitle}`}
                width={200}
                height={200}
                className="block"
              />
            </div>
            <div className="flex flex-col gap-3 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                Scan to open your <span className="font-medium text-foreground">{currentTitle}</span> page
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(currentDirect)}&margin=16&format=png`;
                    link.download = `qr-${activeWidget}-${businessSlug}.png`;
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-1" /> Download PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(currentDirect)}&margin=16&format=svg`;
                    link.download = `qr-${activeWidget}-${businessSlug}.svg`;
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-1" /> Download SVG
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="h-4 w-4" /> Iframe Embed
          </CardTitle>
          <CardDescription>
            Paste this code into any HTML page, WordPress Custom HTML block, or website builder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-end">
            <CopyButton field="iframe" text={iframeCode} />
          </div>
          <Textarea
            value={iframeCode}
            readOnly
            rows={6}
            className="font-mono text-xs bg-muted"
          />
        </CardContent>
      </Card>

      {/* Script Tag (WordPress-friendly) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="h-4 w-4" /> Script Tag (WordPress Plugin-style)
          </CardTitle>
          <CardDescription>
            Drop this snippet into a WordPress Custom HTML block or any page. It auto-creates the widget.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-end">
            <CopyButton field="script" text={scriptCode} />
          </div>
          <Textarea
            value={scriptCode}
            readOnly
            rows={10}
            className="font-mono text-xs bg-muted"
          />
        </CardContent>
      </Card>

      {/* Preview Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="h-4 w-4" /> Preview
          </CardTitle>
          <CardDescription>
            Open the {activeWidget === "instaquote" ? "InstaQuote" : "Booking"} widget in a new tab to see how it looks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href={currentEmbed} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" /> Open Preview in New Tab
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">WordPress Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Open your WordPress page or post editor</li>
            <li>Add a <span className="font-semibold text-foreground">Custom HTML</span> block</li>
            <li>Paste either the iframe or script tag code above</li>
            <li>Save and preview your page — the {activeWidget === "instaquote" ? "InstaQuote" : "Booking"} form will appear inline</li>
            <li>Leads submitted through the widget will appear in your dashboard automatically</li>
          </ol>
        </CardContent>
      </Card>

      {/* Cleaning-specific widget */}
      {isCleaning && (
        <>
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">🧹 Cleaning Quote Widget</h3>
          </div>
          <CleaningEmbedWidget businessSlug={businessSlug} />
        </>
      )}
    </div>
  );
}
