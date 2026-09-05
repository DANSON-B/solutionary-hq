export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export function toE164(raw: string, defaultCountry: "US" | "CA" = "US"): string | null {
  let phone = raw.replace(/\D/g, "");

  if (phone.length === 10 && (defaultCountry === "US" || defaultCountry === "CA")) {
    phone = "1" + phone;
  }

  phone = "+" + phone;

  return isValidE164(phone) ? phone : null;
}
