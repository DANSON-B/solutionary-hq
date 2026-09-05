import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BookingCategory } from "./BookingCategorySelect";

interface Props {
  category: BookingCategory;
  data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    notes: string;
    promo: string;
  };
  onUpdate: (field: string, value: string) => void;
}

export function BookingContactForm({ category, data, onUpdate }: Props) {
  const isCommercial = category === "commercial";

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
        {isCommercial ? "Business Contact" : "Contact & Address"}
      </h2>
      <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">How can we reach you?</p>
      <div className="space-y-4">
        <div>
          <Label>{isCommercial ? "Contact Name" : "Full Name"}</Label>
          <Input className="mt-1 h-12 sm:h-10 text-base sm:text-sm" value={data.name} onChange={(e) => onUpdate("name", e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" className="mt-1 h-12 sm:h-10 text-base sm:text-sm" value={data.email} onChange={(e) => onUpdate("email", e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input type="tel" className="mt-1 h-12 sm:h-10 text-base sm:text-sm" value={data.phone} onChange={(e) => onUpdate("phone", e.target.value)} />
        </div>
        <div>
          <Label>{isCommercial ? "Facility Address" : "Address"}</Label>
          <Input className="mt-1 h-12 sm:h-10 text-base sm:text-sm" value={data.address} onChange={(e) => onUpdate("address", e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div>
            <Label className="text-xs sm:text-sm">City</Label>
            <Input className="mt-1 h-12 sm:h-10 text-base sm:text-sm" value={data.city} onChange={(e) => onUpdate("city", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">State</Label>
            <Input className="mt-1 h-12 sm:h-10 text-base sm:text-sm" value={data.state} onChange={(e) => onUpdate("state", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs sm:text-sm">ZIP</Label>
            <Input className="mt-1 h-12 sm:h-10 text-base sm:text-sm" value={data.zip} onChange={(e) => onUpdate("zip", e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Special Instructions (optional)</Label>
          <Textarea className="mt-1 text-base sm:text-sm" rows={3} value={data.notes} onChange={(e) => onUpdate("notes", e.target.value)} />
        </div>
        <div>
          <Label>Promo Code (optional)</Label>
          <Input className="mt-1 h-12 sm:h-10 text-base sm:text-sm" value={data.promo} onChange={(e) => onUpdate("promo", e.target.value)} />
        </div>
      </div>
    </div>
  );
}
