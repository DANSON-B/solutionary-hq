import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gift, AlertTriangle, CheckCircle2 } from "lucide-react";

interface GiftCardPackage {
  id: string;
  name: string;
  description: string;
  rooms: string[];
  maxRooms: number;
  maxSqft: number;
  durationMinutes: number;
  price: number;
}

const defaultPackages: GiftCardPackage[] = [
  {
    id: "quick_refresh",
    name: "Quick Refresh",
    description: "Light cleaning of 1-2 rooms — kitchen, bathroom, or living area",
    rooms: ["kitchen", "bathroom", "living_room"],
    maxRooms: 2,
    maxSqft: 800,
    durationMinutes: 60,
    price: 75,
  },
  {
    id: "home_sparkle",
    name: "Home Sparkle",
    description: "Standard cleaning of up to 3 rooms with surface detail",
    rooms: ["kitchen", "bathroom", "living_room", "bedroom"],
    maxRooms: 3,
    maxSqft: 1200,
    durationMinutes: 120,
    price: 130,
  },
  {
    id: "full_glow",
    name: "Full Glow",
    description: "Thorough clean of up to 4 rooms including kitchen & bathrooms",
    rooms: ["kitchen", "bathroom", "living_room", "bedroom", "dining"],
    maxRooms: 4,
    maxSqft: 1500,
    durationMinutes: 180,
    price: 199,
  },
];

interface ValidationResult {
  valid: boolean;
  message: string;
  suggestion?: string;
}

function validateGiftCardScope(
  pkg: GiftCardPackage,
  sqft: number,
  roomCount: number
): ValidationResult {
  if (sqft > pkg.maxSqft) {
    return {
      valid: false,
      message: `This package covers up to ${pkg.maxSqft} sq ft. Your space (${sqft} sq ft) exceeds this limit.`,
      suggestion: sqft <= 1500 ? "Full Glow" : undefined,
    };
  }
  if (roomCount > pkg.maxRooms) {
    return {
      valid: false,
      message: `This package covers up to ${pkg.maxRooms} rooms. Consider upgrading for ${roomCount} rooms.`,
      suggestion: roomCount <= 4 ? "Full Glow" : undefined,
    };
  }
  if (sqft > 2500) {
    return {
      valid: false,
      message: "Gift cards are designed for standard residential spaces (up to 2,500 sq ft). For larger properties, please book a regular residential cleaning.",
    };
  }
  return { valid: true, message: "Great choice! This package fits your space perfectly." };
}

interface GiftCardData {
  packageId: string;
  recipientName: string;
  recipientEmail: string;
  personalMessage: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  sqft: string;
  roomCount: string;
}

interface Props {
  data: GiftCardData;
  onUpdate: (field: string, value: string) => void;
}

export function BookingGiftCard({ data, onUpdate }: Props) {
  const selectedPkg = defaultPackages.find((p) => p.id === data.packageId);
  const sqft = parseInt(data.sqft) || 0;
  const roomCount = parseInt(data.roomCount) || 0;
  const validation = selectedPkg && sqft > 0 ? validateGiftCardScope(selectedPkg, sqft, roomCount) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          <Gift className="inline h-6 w-6 mr-2 text-primary" />
          Digital Gift Card
        </h2>
        <p className="text-muted-foreground mb-6">Give someone the gift of a sparkling clean home.</p>
      </div>

      {/* Package selection */}
      <div>
        <Label className="text-base font-semibold">Choose a Package</Label>
        <div className="grid gap-3 mt-3">
          {defaultPackages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onUpdate("packageId", pkg.id)}
              className={`rounded-xl border p-4 text-left transition-all ${
                data.packageId === pkg.id
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{pkg.name}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{pkg.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Up to {pkg.maxRooms} rooms · {pkg.maxSqft} sq ft · ~{pkg.durationMinutes} min
                  </div>
                </div>
                <span className="text-xl font-bold text-primary ml-4">${pkg.price}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Scope validation */}
      {selectedPkg && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Recipient's Home Size (sq ft)</Label>
            <Input
              type="number"
              className="mt-1"
              placeholder="e.g. 1000"
              value={data.sqft}
              onChange={(e) => onUpdate("sqft", e.target.value)}
            />
          </div>
          <div>
            <Label>Number of Rooms</Label>
            <Input
              type="number"
              className="mt-1"
              placeholder="e.g. 2"
              value={data.roomCount}
              onChange={(e) => onUpdate("roomCount", e.target.value)}
            />
          </div>
        </div>
      )}

      {validation && !validation.valid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {validation.message}
            {validation.suggestion && (
              <span className="block mt-1 font-medium">
                We recommend the "{validation.suggestion}" package instead.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
      {validation && validation.valid && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription>{validation.message}</AlertDescription>
        </Alert>
      )}

      {/* Recipient info */}
      <div className="space-y-4 pt-2">
        <h3 className="font-semibold text-base">Recipient Details</h3>
        <div>
          <Label>Recipient's Name</Label>
          <Input className="mt-1" value={data.recipientName} onChange={(e) => onUpdate("recipientName", e.target.value)} />
        </div>
        <div>
          <Label>Recipient's Email</Label>
          <Input type="email" className="mt-1" value={data.recipientEmail} onChange={(e) => onUpdate("recipientEmail", e.target.value)} />
        </div>
        <div>
          <Label>Personal Message (optional)</Label>
          <Textarea className="mt-1" rows={3} placeholder="Enjoy a clean home on me!" value={data.personalMessage} onChange={(e) => onUpdate("personalMessage", e.target.value)} />
        </div>
      </div>

      {/* Buyer info */}
      <div className="space-y-4 pt-2">
        <h3 className="font-semibold text-base">Your Details</h3>
        <div>
          <Label>Your Name</Label>
          <Input className="mt-1" value={data.buyerName} onChange={(e) => onUpdate("buyerName", e.target.value)} />
        </div>
        <div>
          <Label>Your Email</Label>
          <Input type="email" className="mt-1" value={data.buyerEmail} onChange={(e) => onUpdate("buyerEmail", e.target.value)} />
        </div>
        <div>
          <Label>Your Phone</Label>
          <Input type="tel" className="mt-1" value={data.buyerPhone} onChange={(e) => onUpdate("buyerPhone", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

export { defaultPackages, type GiftCardData, type GiftCardPackage };
