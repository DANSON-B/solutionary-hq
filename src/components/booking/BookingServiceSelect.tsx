import { Home, Sparkles, Brush, Wrench, Building2, HardHat } from "lucide-react";
import type { BookingCategory } from "./BookingCategorySelect";

export interface ServiceOption {
  id: string;
  label: string;
  icon: React.ElementType;
  price: number;
  duration: string;
  description?: string;
}

const residentialServices: ServiceOption[] = [
  { id: "standard", label: "Residential Cleaning", icon: Home, price: 120, duration: "2-3 hours", description: "Routine cleaning to keep your home fresh, tidy, and stress-free." },
  { id: "deep", label: "Deep Cleaning", icon: Sparkles, price: 200, duration: "4-5 hours", description: "Detailed top-to-bottom cleaning for built-up dirt and hard-to-reach areas." },
  { id: "move", label: "Move-In / Move-Out", icon: Brush, price: 280, duration: "5-6 hours", description: "Thorough cleaning for a smooth move or final inspection." },
  { id: "maintenance", label: "General Maintenance", icon: Wrench, price: 150, duration: "2-4 hours", description: "Quick touch-ups between regular cleans." },
];

const commercialServices: ServiceOption[] = [
  { id: "office", label: "Light Commercial Cleaning", icon: Building2, price: 500, duration: "4-6 hours", description: "Reliable cleaning for offices and small businesses." },
  { id: "retail", label: "Retail Space", icon: Building2, price: 600, duration: "3-5 hours", description: "Spotless storefronts that welcome every customer." },
  { id: "warehouse", label: "Warehouse / Facility", icon: Building2, price: 1200, duration: "6-10 hours", description: "Heavy-duty cleaning for large industrial spaces." },
  { id: "medical", label: "Medical / Healthcare", icon: Building2, price: 800, duration: "4-6 hours", description: "Sanitization-grade cleaning for clinics and offices." },
];

const postConstructionServices: ServiceOption[] = [
  { id: "rough_clean", label: "Rough Clean", icon: HardHat, price: 400, duration: "4-6 hours", description: "Dust and debris removal to make your space move-in ready." },
  { id: "final_clean", label: "Final Clean", icon: HardHat, price: 600, duration: "6-8 hours", description: "Detailed final pass before occupancy or inspection." },
  { id: "touch_up", label: "Touch-Up Clean", icon: HardHat, price: 250, duration: "2-3 hours", description: "Quick pass after final walkthrough or punch list." },
];

export function getServicesForCategory(category: BookingCategory): ServiceOption[] {
  switch (category) {
    case "residential": return residentialServices;
    case "commercial": return commercialServices;
    case "post_construction": return postConstructionServices;
    default: return [];
  }
}

interface Props {
  category: BookingCategory;
  selected: string;
  onSelect: (id: string) => void;
}

export function BookingServiceSelect({ category, selected, onSelect }: Props) {
  const services = getServicesForCategory(category);

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 tracking-tight">Choose a Service</h2>
      <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
        {category === "commercial" ? "Select the type of facility." : "Pick the cleaning package that fits your space."}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {services.map((s) => {
          const isSelected = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              aria-pressed={isSelected}
              className={`group relative w-full text-left rounded-2xl p-4 sm:p-5 border transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                isSelected
                  ? "bg-primary border-accent shadow-xl shadow-primary/20 ring-2 ring-primary ring-offset-2"
                  : "bg-card border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
              }`}
            >
              <div className="flex gap-4 items-start">
                <div
                  className={`shrink-0 p-3 rounded-xl transition-colors ${
                    isSelected
                      ? "bg-accent text-primary shadow-lg shadow-accent/30"
                      : "bg-secondary text-primary group-hover:bg-primary group-hover:text-accent"
                  }`}
                >
                  <s.icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-bold text-base sm:text-lg leading-tight tracking-tight ${
                      isSelected ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {s.label}
                  </h3>
                  {s.description && (
                    <p
                      className={`text-xs sm:text-sm mt-1 leading-snug ${
                        isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {s.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed gap-2 border-current/10">
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {s.duration}
                    </span>
                    <span
                      className={`text-base sm:text-lg font-extrabold tracking-tight ${
                        isSelected ? "text-accent" : "text-primary"
                      }`}
                    >
                      ${s.price}
                    </span>
                  </div>
                </div>
              </div>
              {isSelected && (
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-accent border-2 border-background shadow-md flex items-center justify-center animate-in zoom-in-50 duration-200">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-primary">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
