import { Home, Building2, HardHat, Gift } from "lucide-react";
import { motion } from "framer-motion";

export type BookingCategory = "residential" | "commercial" | "post_construction" | "gift_card";

interface CategoryOption {
  id: BookingCategory;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}

const categories: CategoryOption[] = [
  {
    id: "residential",
    label: "Residential Cleaning",
    description: "Regular, deep, or move-in/out cleaning for homes",
    icon: Home,
  },
  {
    id: "commercial",
    label: "Commercial Cleaning",
    description: "Office, retail, and large facility cleaning",
    icon: Building2,
    
  },
  {
    id: "post_construction",
    label: "Post-Construction",
    description: "Debris removal and detail cleaning after construction",
    icon: HardHat,
  },
  {
    id: "gift_card",
    label: "Digital Gift Card",
    description: "Give the gift of a clean home — residential only",
    icon: Gift,
    badge: "Popular",
  },
];

interface Props {
  selected: BookingCategory | "";
  onSelect: (category: BookingCategory) => void;
}

export function BookingCategorySelect({ selected, onSelect }: Props) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">What can we help with?</h2>
      <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Select the type of cleaning service you need.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {categories.map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onSelect(cat.id)}
            className={`relative rounded-xl border p-4 sm:p-5 text-left transition-all active:scale-[0.98] ${
              selected === cat.id
                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                : "hover:border-primary/40"
            }`}
          >
            {cat.badge && (
              <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {cat.badge}
              </span>
            )}
            <cat.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary mb-2 sm:mb-3" />
            <div className="font-semibold text-sm sm:text-base">{cat.label}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">{cat.description}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
