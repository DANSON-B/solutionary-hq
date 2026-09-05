import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BookingCategory } from "./BookingCategorySelect";
import type { ServiceOption } from "./BookingServiceSelect";
import type { ExtraOption } from "./BookingExtras";
import type { GiftCardPackage } from "./BookingGiftCard";

interface Props {
  category: BookingCategory;
  service?: ServiceOption;
  extras: ExtraOption[];
  total: number;
  propertyDetails: { bedrooms: string; bathrooms: string; sqft: string };
  schedule: { date: string; time: string };
  contact: { name: string; email: string; phone: string; address: string; city: string; state: string; zip: string };
  giftCard?: {
    pkg?: GiftCardPackage;
    recipientName: string;
    recipientEmail: string;
    buyerName: string;
  };
  onConfirm: () => void;
  isSubmitting: boolean;
}

const categoryLabels: Record<BookingCategory, string> = {
  residential: "Residential Cleaning",
  commercial: "Commercial Cleaning",
  post_construction: "Post-Construction Cleaning",
  gift_card: "Digital Gift Card",
};

export function BookingSummary({
  category, service, extras, total, propertyDetails, schedule, contact, giftCard, onConfirm, isSubmitting,
}: Props) {
  const isGiftCard = category === "gift_card";

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Booking Summary</h2>
      <div className="rounded-xl border p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Category</span>
          <Badge variant="secondary" className="text-xs">{categoryLabels[category]}</Badge>
        </div>

        {isGiftCard && giftCard?.pkg ? (
          <>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Package</span>
              <span className="font-medium text-sm">{giftCard.pkg.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Recipient</span>
              <span className="text-sm">{giftCard.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">From</span>
              <span className="text-sm">{giftCard.buyerName}</span>
            </div>
          </>
        ) : (
          <>
            {service && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Service</span>
                <span className="font-medium text-sm">{service.label}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Property</span>
              <span className="text-sm">
                {category === "residential"
                  ? `${propertyDetails.bedrooms} bed / ${propertyDetails.bathrooms} bath`
                  : `${propertyDetails.sqft || "—"} sq ft`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Date & Time</span>
              <span className="text-sm">{schedule.date} at {schedule.time}</span>
            </div>
            {extras.length > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground shrink-0">Extras</span>
                <span className="text-right text-xs sm:text-sm max-w-[180px] sm:max-w-[200px]">{extras.map((e) => e.label).join(", ")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Customer</span>
              <span className="text-sm">{contact.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground shrink-0">Address</span>
              <span className="text-right text-xs sm:text-sm max-w-[180px] sm:max-w-[200px]">
                {contact.address}{contact.city ? `, ${contact.city}` : ""}{contact.state ? ` ${contact.state}` : ""} {contact.zip}
              </span>
            </div>
          </>
        )}

        <div className="border-t pt-3 sm:pt-4 flex justify-between text-base sm:text-lg font-bold">
          <span>Total</span>
          <span>${total}</span>
        </div>
      </div>

      <Button className="w-full mt-4 sm:mt-6 h-12 sm:h-11 text-base sm:text-sm" disabled={isSubmitting} onClick={onConfirm}>
        {isSubmitting ? "Processing..." : isGiftCard ? `Purchase Gift Card — $${total}` : `Confirm & Pay $${total}`}
      </Button>
    </div>
  );
}
