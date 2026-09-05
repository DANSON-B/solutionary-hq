import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsCleaning } from "@/hooks/useIsCleaning";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Repeat, Calendar, User, Pause, Play, Trash2, AlertTriangle } from "lucide-react";

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  bi_weekly: "Bi-Weekly",
  monthly: "Monthly",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RecurringCleaningsPage() {
  const isCleaning = useIsCleaning();
  const { business } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    supabase
      .from("cleaning_recurring_bookings")
      .select("*, customers(first_name, last_name)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBookings(data || []);
        setLoading(false);
      });
  }, [business]);

  if (!isCleaning) return <Navigate to="/dashboard" replace />;

  const toggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from("cleaning_recurring_bookings").update({ is_active: !currentActive }).eq("id", id);
    setBookings(bookings.map((b) => b.id === id ? { ...b, is_active: !currentActive } : b));
    toast({ title: currentActive ? "Recurring booking paused" : "Recurring booking resumed" });
  };

  const deleteBooking = async (id: string) => {
    await supabase.from("cleaning_recurring_bookings").delete().eq("id", id);
    setBookings(bookings.filter((b) => b.id !== id));
    toast({ title: "Recurring booking deleted" });
  };

  // Detect recurring bookings that collide on the same day/time/tech
  const conflictIds = new Set<string>();
  bookings.forEach((a) => {
    if (!a.is_active) return;
    bookings.forEach((b) => {
      if (a.id === b.id || !b.is_active) return;
      const sameDay = a.preferred_day_of_week != null && a.preferred_day_of_week === b.preferred_day_of_week;
      const sameTime = a.preferred_time && a.preferred_time === b.preferred_time;
      const sameTech = a.assigned_to && b.assigned_to && a.assigned_to === b.assigned_to;
      if (sameDay && sameTime && sameTech) {
        conflictIds.add(a.id);
        conflictIds.add(b.id);
      }
    });
  });

  if (loading) return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Repeat className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Recurring Cleanings</h1>
          <p className="text-sm text-muted-foreground">Manage automated recurring cleaning schedules</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Recurring Bookings</h2>
            <p className="text-muted-foreground">Recurring bookings are created automatically when you schedule a cleaning with a recurring frequency.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className={!booking.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">
                        {booking.customers?.first_name} {booking.customers?.last_name}
                      </h3>
                      <Badge variant={booking.is_active ? "default" : "secondary"}>
                        {booking.is_active ? "Active" : "Paused"}
                      </Badge>
                      <Badge variant="outline">{FREQUENCY_LABELS[booking.frequency] || booking.frequency}</Badge>
                      {booking.discount_percentage > 0 && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          -{booking.discount_percentage}%
                        </Badge>
                      )}
                      {conflictIds.has(booking.id) && (
                        <Badge variant="outline" className="text-amber-700 border-amber-400 bg-amber-50">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Conflicts with another recurring
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {booking.preferred_day_of_week !== null
                          ? `Every ${DAY_LABELS[booking.preferred_day_of_week]}`
                          : "—"}
                        {booking.preferred_time && ` at ${booking.preferred_time.slice(0, 5)}`}
                      </span>
                      {booking.assigned_to && (
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {booking.assigned_to}
                        </span>
                      )}
                      <span>${booking.total_per_visit.toFixed(2)}/visit</span>
                    </div>
                    {booking.next_scheduled_date && (
                      <p className="text-xs text-muted-foreground">
                        Next: {new Date(booking.next_scheduled_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(booking.id, booking.is_active)}
                    >
                      {booking.is_active ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                      {booking.is_active ? "Pause" : "Resume"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBooking(booking.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
