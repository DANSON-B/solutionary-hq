import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, ExternalLink, Code2, Link2, Sparkles } from "lucide-react";

interface Props {
  businessSlug: string | null;
}

export default function CleaningEmbedWidget({ businessSlug }: Props) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const baseUrl = window.location.origin;
  const directLink = businessSlug ? `${baseUrl}/q/${businessSlug}` : "";
  const embedUrl = businessSlug ? `${baseUrl}/q/${businessSlug}?embed=true` : "";

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="900"
  frameborder="0"
  style="border: none; border-radius: 12px; max-width: 640px;"
  title="Cleaning Quote Widget"
></iframe>`;

  const scriptCode = `<div id="cleaning-quote-widget"></div>
<script>
(function() {
  var iframe = document.createElement('iframe');
  iframe.src = '${embedUrl}';
  iframe.style.cssText = 'width:100%;height:900px;border:none;border-radius:12px;max-width:640px;';
  iframe.title = 'Cleaning Quote Widget';
  document.getElementById('cleaning-quote-widget').appendChild(iframe);
})();
</script>`;

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyBtn = ({ field, text }: { field: string; text: string }) => (
    <Button variant="outline" size="sm" onClick={() => copyToClipboard(text, field)} className="shrink-0">
      {copiedField === field ? <><Check className="h-4 w-4 mr-1" /> Copied</> : <><Copy className="h-4 w-4 mr-1" /> Copy</>}
    </Button>
  );

  if (!businessSlug) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Set a business slug in Company Profile first to generate embed codes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Cleaning Quote Widget
          </CardTitle>
          <CardDescription>
            Embed an instant cleaning quote calculator on your website. Uses your cleaning pricing rules for real-time estimates.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" /> Direct Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input value={directLink} readOnly className="font-mono text-sm" />
            <CopyBtn field="cl-direct" text={directLink} />
            <Button variant="outline" size="sm" asChild>
              <a href={directLink} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Code2 className="h-4 w-4" /> Iframe Embed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-end"><CopyBtn field="cl-iframe" text={iframeCode} /></div>
          <Textarea value={iframeCode} readOnly rows={6} className="font-mono text-xs bg-muted" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Code2 className="h-4 w-4" /> Script Tag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-end"><CopyBtn field="cl-script" text={scriptCode} /></div>
          <Textarea value={scriptCode} readOnly rows={10} className="font-mono text-xs bg-muted" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><ExternalLink className="h-4 w-4" /> Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href={embedUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" /> Open Preview
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
