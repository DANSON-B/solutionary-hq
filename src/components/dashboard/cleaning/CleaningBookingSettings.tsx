import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsCleaning } from "@/hooks/useIsCleaning";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Repeat, Shield, Clock, Save } from "lucide-react";

export function CleaningBookingSettings() {
  const { business } = useAuth();
  const isCleaning = useIsCleaning();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    require_deposit: false,
    deposit_percentage: 25,
    buffer_minutes: 30,
    cancellation_policy: "Free cancellation up to 24 hours before the scheduled time.",
    allow_recurring: true,
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!business || !isCleaning) return;
    supabase
      .from("cleaning_booking_settings")
      .select("*")
      .eq("business_id", business.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSettings({
            require_deposit: data.require_deposit,
            deposit_percentage: data.deposit_percentage,
            buffer_minutes: data.buffer_minutes,
            cancellation_policy: data.cancellation_policy || "",
            allow_recurring: data.allow_recurring,
          });
        }
        setLoaded(true);
      });
  }, [business, isCleaning]);

  if (!isCleaning) return null;

  const handleSave = async () => {
    if (!business) return;
    setSaving(true);
    const { error } = await supabase
      .from("cleaning_booking_settings")
      .upsert({
        business_id: business.id,
        ...settings,
      }, { onConflict: "business_id" });

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking settings saved!" });
    }
    setSaving(false);
  };

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Repeat className="h-4 w-4" /> Cleaning Booking Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Deposit */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Require Deposit</Label>
            <p className="text-xs text-muted-foreground">Charge upfront deposit to confirm bookings</p>
          </div>
          <Switch
            checked={settings.require_deposit}
            onCheckedChange={(v) => setSettings({ ...settings, require_deposit: v })}
          />
        </div>
        {settings.require_deposit && (
          <div>
            <Label className="text-sm">Deposit Percentage</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                value={settings.deposit_percentage}
                onChange={(e) => setSettings({ ...settings, deposit_percentage: Number(e.target.value) })}
                min={5}
                max={100}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        )}

        {/* Buffer */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> Buffer Time Between Jobs
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              type="number"
              value={settings.buffer_minutes}
              onChange={(e) => setSettings({ ...settings, buffer_minutes: Number(e.target.value) })}
              min={0}
              max={120}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>
        </div>

        {/* Recurring */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Allow Recurring Bookings</Label>
            <p className="text-xs text-muted-foreground">Enable weekly, bi-weekly, monthly cleaning schedules</p>
          </div>
          <Switch
            checked={settings.allow_recurring}
            onCheckedChange={(v) => setSettings({ ...settings, allow_recurring: v })}
          />
        </div>

        {/* Cancellation policy */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" /> Cancellation Policy
          </Label>
          <Textarea
            value={settings.cancellation_policy}
            onChange={(e) => setSettings({ ...settings, cancellation_policy: e.target.value })}
            placeholder="Describe your cancellation policy..."
            className="mt-1"
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Booking Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
