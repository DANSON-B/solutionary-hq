import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { BookingCategory } from "./BookingCategorySelect";

interface Props {
  category: BookingCategory;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  onUpdate: (field: string, value: string) => void;
}

export function BookingPropertyDetails({ category, bedrooms, bathrooms, sqft, onUpdate }: Props) {
  const isCommercial = category === "commercial" || category === "post_construction";

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Property Details</h2>
      <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Tell us about the space.</p>
      <div className="space-y-5">
        {!isCommercial && (
          <>
            <div>
              <Label>Bedrooms</Label>
              <div className="flex gap-2 mt-2">
                {["1", "2", "3", "4", "5+"].map((n) => (
                  <button
                    key={n}
                    onClick={() => onUpdate("bedrooms", n)}
                    className={`h-11 sm:h-10 flex-1 min-w-0 rounded-lg border text-sm font-medium transition-colors active:scale-[0.95] ${
                      bedrooms === n ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Bathrooms</Label>
              <div className="flex gap-2 mt-2">
                {["1", "2", "3", "4+"].map((n) => (
                  <button
                    key={n}
                    onClick={() => onUpdate("bathrooms", n)}
                    className={`h-11 sm:h-10 flex-1 min-w-0 rounded-lg border text-sm font-medium transition-colors active:scale-[0.95] ${
                      bathrooms === n ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        <div>
          <Label>Approximate Square Footage</Label>
          <Input
            type="number"
            className="mt-2 h-12 sm:h-10 text-base sm:text-sm"
            placeholder={isCommercial ? "e.g. 5000" : "e.g. 1500"}
            value={sqft}
            onChange={(e) => onUpdate("sqft", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
