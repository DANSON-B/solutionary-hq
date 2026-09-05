import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Navigation, Clock, GripVertical, RotateCcw,
  ChevronUp, ChevronDown, ExternalLink, Route, Loader2,
} from "lucide-react";

interface ScheduledJob {
  id: string;
  title: string;
  address: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  assigned_to: string | null;
  status: string;
  customer_id: string;
  customers?: { first_name: string; last_name: string };
}

interface GeocodedJob extends ScheduledJob {
  lat: number;
  lng: number;
}

interface TeamMember {
  id: string;
  full_name: string;
}

// Haversine distance in miles
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Nearest-neighbor route optimization
function optimizeRoute(jobs: GeocodedJob[], startLat?: number, startLng?: number): GeocodedJob[] {
  if (jobs.length <= 1) return [...jobs];
  const remaining = [...jobs];
  const ordered: GeocodedJob[] = [];
  let current = startLat != null && startLng != null
    ? { lat: startLat, lng: startLng }
    : { lat: remaining[0].lat, lng: remaining[0].lng };

  // If we have a start point, use it; otherwise pick nearest to first
  if (startLat == null) {
    ordered.push(remaining.shift()!);
    current = { lat: ordered[0].lat, lng: ordered[0].lng };
  }

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach((j, i) => {
      const d = haversine(current, { lat: j.lat, lng: j.lng });
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    });
    const next = remaining.splice(nearestIdx, 1)[0];
    ordered.push(next);
    current = { lat: next.lat, lng: next.lng };
  }
  return ordered;
}

function totalDistance(jobs: GeocodedJob[]): number {
  let d = 0;
  for (let i = 1; i < jobs.length; i++) d += haversine(jobs[i - 1], jobs[i]);
  return d;
}

export default function RouteOptimizerPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routeLineRef = useRef<any>(null);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [filterTech, setFilterTech] = useState<string>("all");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [rawJobs, setRawJobs] = useState<ScheduledJob[]>([]);
  const [geocodedJobs, setGeocodedJobs] = useState<GeocodedJob[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [startAddress, setStartAddress] = useState("");
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch jobs for date
  useEffect(() => {
    if (!business) return;
    const fetchJobs = async () => {
      const dayStart = `${selectedDate}T00:00:00`;
      const dayEnd = `${selectedDate}T23:59:59`;
      const [jobsRes, teamRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("*, customers(first_name, last_name)")
          .eq("business_id", business.id)
          .not("status", "eq", "cancelled")
          .gte("scheduled_start", dayStart)
          .lte("scheduled_start", dayEnd)
          .order("scheduled_start"),
        supabase
          .from("team_members")
          .select("id, full_name")
          .eq("business_id", business.id)
          .eq("is_active", true),
      ]);
      setRawJobs((jobsRes.data as ScheduledJob[]) || []);
      setTeamMembers(teamRes.data || []);
    };
    fetchJobs();
  }, [business, selectedDate]);

  // Filter by tech
  const filteredJobs = useMemo(() => {
    if (filterTech === "all") return rawJobs;
    return rawJobs.filter((j) => j.assigned_to === filterTech);
  }, [rawJobs, filterTech]);

  // Geocode jobs with addresses
  const geocodeJobs = useCallback(async () => {
    const withAddress = filteredJobs.filter((j) => j.address);
    if (withAddress.length === 0) {
      setGeocodedJobs([]);
      return;
    }
    setIsGeocoding(true);
    const results: GeocodedJob[] = [];
    for (const job of withAddress) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(job.address!)}&limit=1`
        );
        const data = await res.json();
        if (data.length > 0) {
          results.push({ ...job, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        }
        // Rate limit for Nominatim
        await new Promise((r) => setTimeout(r, 1100));
      } catch {
        // Skip failed geocodes
      }
    }
    setGeocodedJobs(results);
    setIsGeocoding(false);
  }, [filteredJobs]);

  useEffect(() => { geocodeJobs(); }, [filteredJobs]);

  // Geocode start address
  const geocodeStart = async () => {
    if (!startAddress) { setStartCoords(null); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startAddress)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        setStartCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        toast({ title: "Start location set" });
      } else {
        toast({ title: "Address not found", variant: "destructive" });
      }
    } catch {
      toast({ title: "Geocoding failed", variant: "destructive" });
    }
  };

  const handleOptimize = () => {
    const optimized = optimizeRoute(geocodedJobs, startCoords?.lat, startCoords?.lng);
    setGeocodedJobs(optimized);
    toast({ title: "Route optimized!", description: `${optimized.length} stops reordered for shortest distance.` });
  };

  const moveJob = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= geocodedJobs.length) return;
    const copy = [...geocodedJobs];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    setGeocodedJobs(copy);
  };

  const dist = totalDistance(geocodedJobs);

  // Google Maps directions URL
  const getDirectionsUrl = () => {
    if (geocodedJobs.length === 0) return "";
    const waypoints = geocodedJobs.map((j) => `${j.lat},${j.lng}`);
    const origin = startCoords ? `${startCoords.lat},${startCoords.lng}` : waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const middle = waypoints.slice(startCoords ? 0 : 1, -1).join("|");
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${middle ? `&waypoints=${middle}` : ""}&travelmode=driving`;
  };

  // Initialize Leaflet map
  useEffect(() => {
    const initMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = L.map(mapRef.current).setView([39.8283, -98.5795], 4);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
    };
    initMap();
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, []);

  // Update map markers & route line
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Clear
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null; }

    // Start marker
    if (startCoords) {
      const m = L.circleMarker([startCoords.lat, startCoords.lng], {
        radius: 10, fillColor: "hsl(var(--primary))", color: "#fff", weight: 3, fillOpacity: 1,
      }).addTo(mapInstanceRef.current);
      m.bindTooltip("Start", { permanent: true, direction: "top", className: "font-semibold" });
      markersRef.current.push(m);
    }

    // Job markers
    geocodedJobs.forEach((j, idx) => {
      const color = j.status === "completed" ? "#22c55e" : j.status === "in_progress" ? "hsl(var(--accent))" : "hsl(var(--primary))";
      const m = L.circleMarker([j.lat, j.lng], {
        radius: 8, fillColor: color, color: "#fff", weight: 2, fillOpacity: 1,
      }).addTo(mapInstanceRef.current);
      m.bindTooltip(`${idx + 1}. ${j.title}`, { permanent: false });
      // Number label
      const numIcon = L.divIcon({
        html: `<div style="background:${color};color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3)">${idx + 1}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        className: "",
      });
      const numMarker = L.marker([j.lat, j.lng], { icon: numIcon }).addTo(mapInstanceRef.current);
      markersRef.current.push(m, numMarker);
    });

    // Route line
    const linePoints = [
      ...(startCoords ? [[startCoords.lat, startCoords.lng]] : []),
      ...geocodedJobs.map((j) => [j.lat, j.lng]),
    ];
    if (linePoints.length >= 2) {
      routeLineRef.current = L.polyline(linePoints as [number, number][], {
        color: "hsl(var(--primary))", weight: 3, opacity: 0.7, dashArray: "8 6",
      }).addTo(mapInstanceRef.current);
    }

    // Fit bounds
    if (linePoints.length > 0) {
      const bounds = L.latLngBounds(linePoints as [number, number][]);
      mapInstanceRef.current.fitBounds(bounds.pad(0.15));
    }
  }, [geocodedJobs, startCoords]);

  const statusBadge: Record<string, string> = {
    scheduled: "bg-primary/15 text-primary",
    in_progress: "bg-accent/20 text-accent-foreground",
    completed: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Route className="h-6 w-6 text-primary" /> Route Optimizer
          </h1>
          <p className="text-sm text-muted-foreground">Plan daily routes for technicians with optimized driving directions.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[160px]" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Technician</label>
          <Select value={filterTech} onValueChange={setFilterTech}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technicians</SelectItem>
              {teamMembers.map((tm) => (
                <SelectItem key={tm.id} value={tm.full_name}>{tm.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Location (optional)</label>
          <div className="flex gap-2">
            <Input
              placeholder="Office / home address..."
              value={startAddress}
              onChange={(e) => setStartAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && geocodeStart()}
            />
            <Button variant="outline" size="sm" onClick={geocodeStart}><MapPin className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div ref={mapRef} className="w-full h-[500px] rounded-lg overflow-hidden" />
            </CardContent>
          </Card>
        </div>

        {/* Job List */}
        <div className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-primary">{geocodedJobs.length}</div>
                <div className="text-xs text-muted-foreground">Stops</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-primary">{dist.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Miles</div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleOptimize}
              disabled={geocodedJobs.length < 2 || isGeocoding}
              className="flex-1"
            >
              <Navigation className="h-4 w-4 mr-1" /> Optimize Route
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(getDirectionsUrl(), "_blank")}
              disabled={geocodedJobs.length === 0}
            >
              <ExternalLink className="h-4 w-4 mr-1" /> Directions
            </Button>
          </div>

          {/* Job List */}
          {isGeocoding && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Geocoding addresses...
            </div>
          )}

          {!isGeocoding && geocodedJobs.length === 0 && filteredJobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No jobs scheduled for this date.
            </div>
          )}

          {!isGeocoding && geocodedJobs.length === 0 && filteredJobs.length > 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              {filteredJobs.length} job(s) found but none have addresses to map.
            </div>
          )}

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {geocodedJobs.map((job, idx) => (
              <Card key={job.id} className="border">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col items-center gap-0.5 pt-0.5">
                      <button onClick={() => moveJob(idx, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs font-bold text-primary w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <button onClick={() => moveJob(idx, 1)} disabled={idx === geocodedJobs.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{job.title}</span>
                        <Badge variant="secondary" className={`text-[10px] ${statusBadge[job.status] || ""}`}>
                          {job.status.replace("_", " ")}
                        </Badge>
                      </div>
                      {job.customers && (
                        <div className="text-xs text-muted-foreground">{job.customers.first_name} {job.customers.last_name}</div>
                      )}
                      {job.address && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{job.address}</span>
                        </div>
                      )}
                      {job.scheduled_start && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          {new Date(job.scheduled_start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          {job.scheduled_end && ` – ${new Date(job.scheduled_end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
                        </div>
                      )}
                      {idx > 0 && (
                        <div className="text-[10px] text-muted-foreground/70 mt-1">
                          ↳ {haversine(geocodedJobs[idx - 1], job).toFixed(1)} mi from previous
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
