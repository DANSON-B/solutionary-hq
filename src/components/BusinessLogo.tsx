import { cn } from "@/lib/utils";

interface BusinessLogoProps {
  name?: string | null;
  logoUrl?: string | null;
  /** Tailwind size classes, e.g. "h-10 w-10" */
  className?: string;
  /** Rounded style */
  rounded?: "md" | "lg" | "xl" | "full";
}

const roundedMap = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
} as const;

/**
 * Single source of truth for rendering a business logo across the
 * dashboard, tenant sites, booking widgets and public payment pages.
 * Falls back to the business initial when no logo is uploaded.
 */
export function BusinessLogo({ name, logoUrl, className, rounded = "lg" }: BusinessLogoProps) {
  const base = cn("shrink-0 object-cover bg-primary/10", roundedMap[rounded], className || "h-10 w-10");

  if (logoUrl) {
    return <img src={logoUrl} alt={`${name || "Business"} logo`} className={base} loading="lazy" />;
  }

  return (
    <div className={cn(base, "flex items-center justify-center font-bold uppercase text-primary")}>
      {(name || "B").charAt(0)}
    </div>
  );
}

export default BusinessLogo;
