import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Eraser, PenLine } from "lucide-react";

interface Props {
  job: any;
  onSaved: () => void;
}

export default function SignatureCapture({ job, onSaved }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [name, setName] = useState(
    job?.signature_name || `${job?.customers?.first_name || ""} ${job?.customers?.last_name || ""}`.trim()
  );
  const [saving, setSaving] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const { toast } = useToast();

  const alreadySigned = !!job?.signed_at;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    // Set backing store for crispness
    const rect = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  const pos = (e: any) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const t = e.touches?.[0];
    return {
      x: (t ? t.clientX : e.clientX) - rect.left,
      y: (t ? t.clientY : e.clientY) - rect.top,
    };
  };

  const start = (e: any) => {
    e.preventDefault();
    drawing.current = true;
    const { x, y } = pos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e: any) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = pos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  };
  const end = () => { drawing.current = false; };

  const clear = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  const save = async () => {
    if (!hasInk) { toast({ title: "Please sign first", variant: "destructive" }); return; }
    if (!name.trim()) { toast({ title: "Signer name required", variant: "destructive" }); return; }
    setSaving(true);
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    const { error } = await supabase
      .from("jobs")
      .update({
        signature_url: dataUrl,
        signature_name: name.trim(),
        signed_at: new Date().toISOString(),
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Signed & completed" });
    onSaved();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PenLine className="h-5 w-5" /> Customer Sign-off
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alreadySigned ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">
                Signed by {job.signature_name} on {new Date(job.signed_at).toLocaleString()}
              </span>
            </div>
            {job.signature_url && (
              <div className="border rounded-md bg-muted/20 p-3 inline-block">
                <img src={job.signature_url} alt="Signature" className="max-h-32" />
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Have the customer confirm work quality and sign below. Saving will mark the job complete.
            </p>
            <Input
              placeholder="Signer full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base"
            />
            <div className="border-2 border-dashed rounded-md bg-white touch-none">
              <canvas
                ref={canvasRef}
                className="w-full h-48 rounded-md"
                onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
                onTouchStart={start} onTouchMove={move} onTouchEnd={end}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clear} className="h-11">
                <Eraser className="h-4 w-4 mr-1" /> Clear
              </Button>
              <Button onClick={save} disabled={saving} className="flex-1 h-11">
                {saving ? "Saving..." : "Save signature & complete job"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
