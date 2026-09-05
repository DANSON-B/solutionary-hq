import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Ruler, Trash2, Calculator, Plus, X, Eye } from "lucide-react";

interface Point {
  lat: number;
  lng: number;
}

interface GeocodeResult {
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
}

interface PricingTier {
  label: string;
  pricePerSqFt: number;
}

const DEFAULT_MAP_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_MAP_ZOOM = 5;
const SEARCH_RESULT_MAX_ZOOM = 18;
const SATELLITE_MAX_NATIVE_ZOOM = 18;

function calculateAreaSqFt(points: Point[]): number {
  if (points.length < 3) return 0;

  const toMeters = (point: Point, reference: Point) => ({
    x: (point.lng - reference.lng) * Math.cos((reference.lat * Math.PI) / 180) * 111320,
    y: (point.lat - reference.lat) * 111320,
  });

  const reference = points[0];
  const meterPoints = points.map((point) => toMeters(point, reference));

  let area = 0;
  for (let index = 0; index < meterPoints.length; index++) {
    const nextIndex = (index + 1) % meterPoints.length;
    area += meterPoints[index].x * meterPoints[nextIndex].y;
    area -= meterPoints[nextIndex].x * meterPoints[index].y;
  }

  return (Math.abs(area) / 2) * 10.7639;
}

async function searchAddress(query: string): Promise<GeocodeResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const baseUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&addressdetails=1`;

  const usResponse = await fetch(`${baseUrl}&countrycodes=us`, {
    headers: { Accept: "application/json" },
  });
  const usResults = (await usResponse.json()) as GeocodeResult[];

  if (usResults.length > 0) return usResults;

  const globalResponse = await fetch(baseUrl, {
    headers: { Accept: "application/json" },
  });
  return (await globalResponse.json()) as GeocodeResult[];
}

export default function MapMeasurePage() {
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const polygonRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [points, setPoints] = useState<Point[]>([]);
  const [address, setAddress] = useState("");
  const [mapVisible, setMapVisible] = useState(true);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    { label: "Basic Service", pricePerSqFt: 0.05 },
    { label: "Premium Service", pricePerSqFt: 0.08 },
  ]);

  const areaSqFt = calculateAreaSqFt(points);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = await import("leaflet");
      leafletRef.current = L;

      const map = L.map(mapRef.current).setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);

      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
        maxZoom: 20,
        maxNativeZoom: SATELLITE_MAX_NATIVE_ZOOM,
      }).addTo(map);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
        maxNativeZoom: 20,
      }).addTo(map);

      map.on("click", (event: any) => {
        setPoints((previous) => [
          ...previous,
          { lat: event.latlng.lat, lng: event.latlng.lng },
        ]);
      });

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    if (!mapInstanceRef.current || !L) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }

    points.forEach((point, index) => {
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 6,
        fillColor: "hsl(var(--accent))",
        color: "hsl(var(--background))",
        weight: 2,
        fillOpacity: 1,
      }).addTo(mapInstanceRef.current);

      marker.bindTooltip(`Point ${index + 1}`, { permanent: false });
      markersRef.current.push(marker);
    });

    if (points.length >= 3) {
      const polygonLatLngs: [number, number][] = points.map((point) => [point.lat, point.lng]);

      polygonRef.current = L.polygon(polygonLatLngs, {
        color: "hsl(var(--accent))",
        fillColor: "hsl(var(--accent))",
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(mapInstanceRef.current);
    }
  }, [points]);

  const geocodeAddress = async () => {
    if (!address.trim()) return;

    try {
      const results = await searchAddress(address.trim());
      const bestMatch = results[0];

      if (!bestMatch) {
        toast({
          title: "Address not found",
          description: "Try a more specific address or landmark.",
          variant: "destructive",
        });
        return;
      }

      const latitude = parseFloat(bestMatch.lat);
      const longitude = parseFloat(bestMatch.lon);

      if (bestMatch.boundingbox && mapInstanceRef.current && leafletRef.current) {
        const [south, north, west, east] = bestMatch.boundingbox.map(Number);
        const southwest: [number, number] = [south, west];
        const northeast: [number, number] = [north, east];
        const bounds = leafletRef.current.latLngBounds(southwest, northeast);

        mapInstanceRef.current.fitBounds(bounds, {
          padding: [24, 24],
          maxZoom: SEARCH_RESULT_MAX_ZOOM,
        });
      } else {
        mapInstanceRef.current?.setView([latitude, longitude], SEARCH_RESULT_MAX_ZOOM);
      }

      toast({
        title: "Location found",
        description: "Zoom capped for reliable imagery. Click the map to draw the boundary.",
      });
    } catch {
      toast({
        title: "Search failed",
        description: "We couldn't load that location right now. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearPoints = () => setPoints([]);
  const undoPoint = () => setPoints((previous) => previous.slice(0, -1));
  const addTier = () => setPricingTiers((tiers) => [...tiers, { label: "New Service", pricePerSqFt: 0.05 }]);
  const removeTier = (index: number) => setPricingTiers((tiers) => tiers.filter((_, tierIndex) => tierIndex !== index));
  const updateTier = (index: number, field: keyof PricingTier, value: string | number) =>
    setPricingTiers((tiers) => tiers.map((tier, tierIndex) => (tierIndex === index ? { ...tier, [field]: value } : tier)));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Ruler className="h-6 w-6 text-accent" /> MapMeasure Pro
          </h1>
          <p className="text-sm text-muted-foreground">Measure property area from satellite imagery and calculate pricing.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex gap-2">
              <Input
                placeholder="Enter property address..."
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && geocodeAddress()}
              />
              <Button onClick={geocodeAddress}>
                <MapPin className="mr-1 h-4 w-4" /> Go
              </Button>
            </div>

            {mapVisible ? (
              <div className="relative">
                <div ref={mapRef} className="h-[500px] w-full overflow-hidden rounded-lg" />
                <button
                  type="button"
                  onClick={() => setMapVisible(false)}
                  aria-label="Close map"
                  className="absolute top-3 right-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-full bg-background/95 border border-border shadow-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex h-[160px] w-full items-center justify-center rounded-lg border border-dashed bg-muted/30">
                <Button variant="outline" size="sm" onClick={() => setMapVisible(true)}>
                  <Eye className="mr-2 h-4 w-4" /> Show Map
                </Button>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={undoPoint} disabled={points.length === 0}>
                Undo
              </Button>
              <Button variant="outline" size="sm" onClick={clearPoints} disabled={points.length === 0}>
                <Trash2 className="mr-1 h-3 w-3" /> Clear All
              </Button>
              <span className="ml-auto flex items-center text-xs text-muted-foreground">
                {points.length} point{points.length !== 1 ? "s" : ""} placed — click map to add points
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <Calculator className="h-4 w-4" /> Measurements
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Area</span>
                <span className="text-lg font-bold">{areaSqFt.toLocaleString("en-US", { maximumFractionDigits: 0 })} sq ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Points</span>
                <span className="font-medium">{points.length}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-3 font-semibold">Pricing Calculator</h3>
            <div className="space-y-3">
              {pricingTiers.map((tier, index) => (
                <div key={index} className="space-y-2 border-b pb-3 last:border-0">
                  <div className="flex gap-2">
                    <Input value={tier.label} onChange={(event) => updateTier(index, "label", event.target.value)} className="text-sm" />
                    {pricingTiers.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeTier(index)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap text-xs text-muted-foreground">$/sqft:</span>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      value={tier.pricePerSqFt}
                      onChange={(event) => updateTier(index, "pricePerSqFt", parseFloat(event.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Price</span>
                    <span className="font-bold text-accent">${(areaSqFt * tier.pricePerSqFt).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addTier} className="w-full">
                <Plus className="mr-1 h-3 w-3" /> Add Tier
              </Button>
            </div>
          </div>

          {areaSqFt > 0 && (
            <Button
              className="w-full"
              onClick={() => {
                const items = pricingTiers.map((tier) => ({
                  description: `${tier.label} (${areaSqFt.toLocaleString("en-US", { maximumFractionDigits: 0 })} sqft × $${tier.pricePerSqFt}/sqft)`,
                  quantity: 1,
                  unit_price: parseFloat((areaSqFt * tier.pricePerSqFt).toFixed(2)),
                }));

                sessionStorage.setItem("ai_estimate_items", JSON.stringify(items));
                sessionStorage.setItem("ai_estimate_notes", `Property area: ${areaSqFt.toLocaleString("en-US", { maximumFractionDigits: 0 })} sq ft`);
                window.location.href = "/dashboard/quotes/new?from=ai";
              }}
            >
              Convert to Quote
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
