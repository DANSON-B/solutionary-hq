import { Check } from "lucide-react";
import type { BookingCategory } from "./BookingCategorySelect";

export interface ExtraOption {
  id: string;
  label: string;
  price: number;
}

const residentialExtras: ExtraOption[] = [
  { id: "fridge", label: "Inside Fridge", price: 25 },
  { id: "oven", label: "Inside Oven", price: 30 },
  { id: "windows", label: "Interior Windows", price: 40 },
  { id: "laundry", label: "Laundry & Folding", price: 35 },
  { id: "garage", label: "Garage Sweep", price: 45 },
  { id: "baseboards", label: "Baseboards & Trim", price: 30 },
];

const commercialExtras: ExtraOption[] = [
  { id: "carpet", label: "Carpet Shampooing", price: 200 },
  { id: "floor_wax", label: "Floor Waxing", price: 300 },
  { id: "window_ext", label: "Exterior Windows", price: 250 },
  { id: "pressure_wash", label: "Pressure Washing", price: 350 },
];

const postConstructionExtras: ExtraOption[] = [
  { id: "window_clean", label: "Window Cleaning (All)", price: 150 },
  { id: "adhesive", label: "Sticker/Adhesive Removal", price: 80 },
  { id: "paint_touch", label: "Paint Spot Cleanup", price: 60 },
  { id: "vent_clean", label: "Vent & Duct Cleaning", price: 120 },
];

export function getExtrasForCategory(category: BookingCategory): ExtraOption[] {
  switch (category) {
    case "residential": return residentialExtras;
    case "commercial": return commercialExtras;
    case "post_construction": return postConstructionExtras;
    default: return [];
  }
}

interface Props {
  category: BookingCategory;
  selected: string[];
  onToggle: (id: string) => void;
}

export function BookingExtras({ category, selected, onToggle }: Props) {
  const extras = getExtrasForCategory(category);

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Add Extras</h2>
      <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Optional add-ons to enhance your service.</p>
      <div className="space-y-2 sm:space-y-3">
        {extras.map((e) => {
          const isSelected = selected.includes(e.id);
          return (
            <button
              key={e.id}
              onClick={() => onToggle(e.id)}
              className={`w-full flex items-center justify-between rounded-xl border p-4 transition-all active:scale-[0.98] ${
                isSelected ? "border-primary bg-primary/5" : "hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span className="font-medium text-sm sm:text-base">{e.label}</span>
              </div>
              <span className="text-sm font-semibold shrink-0 ml-2">+${e.price}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
