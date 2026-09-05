export interface NavItem {
  label: string;
  to: string;
  external?: boolean;
  children?: { label: string; to: string; external?: boolean }[];
}

const INDUSTRY_PRESETS: Record<string, (base: string) => NavItem[]> = {
  cleaning: (b) => [
    { label: "Home", to: b },
    {
      label: "Cleaning Services",
      to: `${b}/services`,
      children: [
        { label: "Residential Cleaning", to: `${b}/services` },
        { label: "Commercial Cleaning", to: `${b}/services` },
        { label: "Deep Cleaning", to: `${b}/services` },
        { label: "Move In / Move Out", to: `${b}/services` },
      ],
    },
    { label: "Service Areas", to: `${b}/services` },
    { label: "Reviews", to: `${b}/reviews` },
    { label: "About Us", to: `${b}/about` },
    { label: "Blog", to: `${b}/blog` },
    { label: "Contact", to: `${b}/contact` },
  ],
  hvac: (b) => [
    { label: "Home", to: b },
    {
      label: "HVAC Services",
      to: `${b}/services`,
      children: [
        { label: "AC Repair", to: `${b}/services` },
        { label: "Heating Repair", to: `${b}/services` },
        { label: "Installation", to: `${b}/services` },
        { label: "Maintenance Plans", to: `${b}/services` },
      ],
    },
    { label: "Service Areas", to: `${b}/services` },
    { label: "Reviews", to: `${b}/reviews` },
    { label: "About", to: `${b}/about` },
    { label: "Contact", to: `${b}/contact` },
  ],
  plumbing: (b) => [
    { label: "Home", to: b },
    {
      label: "Plumbing Services",
      to: `${b}/services`,
      children: [
        { label: "Emergency Plumbing", to: `${b}/services` },
        { label: "Drain Cleaning", to: `${b}/services` },
        { label: "Water Heaters", to: `${b}/services` },
        { label: "Sewer Services", to: `${b}/services` },
      ],
    },
    { label: "Service Areas", to: `${b}/services` },
    { label: "Reviews", to: `${b}/reviews` },
    { label: "About", to: `${b}/about` },
    { label: "Contact", to: `${b}/contact` },
  ],
  roofing: (b) => [
    { label: "Home", to: b },
    {
      label: "Roofing Services",
      to: `${b}/services`,
      children: [
        { label: "Roof Repair", to: `${b}/services` },
        { label: "Roof Replacement", to: `${b}/services` },
        { label: "Roof Inspection", to: `${b}/services` },
        { label: "Commercial Roofing", to: `${b}/services` },
      ],
    },
    { label: "Projects", to: `${b}/blog` },
    { label: "Reviews", to: `${b}/reviews` },
    { label: "Service Areas", to: `${b}/services` },
    { label: "Contact", to: `${b}/contact` },
  ],
};

function keyFor(industry?: string | null): string | null {
  const i = (industry || "").toLowerCase();
  if (/clean|maid|janitor/.test(i)) return "cleaning";
  if (/hvac|air|heat/.test(i)) return "hvac";
  if (/plumb/.test(i)) return "plumbing";
  if (/roof/.test(i)) return "roofing";
  return null;
}

/** Build an industry-aware main menu, enriched with real services and service areas. */
export function buildDefaultNav(
  base: string,
  industry?: string | null,
  services: { slug: string; title: string }[] = [],
  areas: { slug: string; city: string }[] = []
): NavItem[] {
  const preset = INDUSTRY_PRESETS[keyFor(industry) || ""];
  let items: NavItem[] = preset
    ? preset(base)
    : [
        { label: "Home", to: base },
        { label: "Services", to: `${base}/services` },
        { label: "Service Areas", to: `${base}/services` },
        { label: "Reviews", to: `${base}/reviews` },
        { label: "About", to: `${base}/about` },
        { label: "Blog", to: `${base}/blog` },
        { label: "Contact", to: `${base}/contact` },
      ];

  // Replace generic service children with the business's real services
  if (services.length) {
    items = items.map((it) =>
      it.to === `${base}/services` && it.children
        ? { ...it, children: services.slice(0, 8).map((s) => ({ label: s.title, to: `${base}/services/${s.slug}` })) }
        : it
    );
    const svcIdx = items.findIndex((it) => it.to === `${base}/services` && !it.children);
    if (svcIdx > -1) {
      items[svcIdx] = {
        ...items[svcIdx],
        children: services.slice(0, 8).map((s) => ({ label: s.title, to: `${base}/services/${s.slug}` })),
      };
    }
  }

  // Locations dropdown from real service areas
  if (areas.length) {
    const firstService = services[0]?.slug;
    const idx = items.findIndex((it) => /area|location/i.test(it.label));
    const locations: NavItem = {
      label: "Locations",
      to: `${base}/services`,
      children: areas.slice(0, 8).map((a) => ({
        label: a.city,
        to: firstService ? `${base}/areas/${a.slug}/${firstService}` : `${base}/services`,
      })),
    };
    if (idx > -1) items[idx] = locations;
    else items.splice(2, 0, locations);
  }

  return items;
}

/** Lightweight navigation audit used by the Website Builder. */
export function auditNav(items: NavItem[]): string[] {
  const notes: string[] = [];
  const top = items.length;
  if (top > 8) notes.push(`${top} top-level items — group related pages into dropdowns to keep the menu scannable.`);
  if (top < 4) notes.push("Fewer than 4 menu items — add Services, Reviews and Contact so visitors can self-qualify.");
  if (!items.some((i) => /contact/i.test(i.label))) notes.push("No Contact link — add one; it is the top converting nav item for local services.");
  if (!items.some((i) => /review|testimonial/i.test(i.label))) notes.push("No Reviews link — social proof in the nav lifts conversion.");
  if (!items.some((i) => /area|location/i.test(i.label))) notes.push("No Service Areas link — local SEO relies on location pages being crawlable from the menu.");
  if (items.some((i) => (i.children?.length || 0) > 8)) notes.push("A dropdown has more than 8 links — split it into categories.");
  if (items.some((i) => !i.label.trim() || !i.to.trim())) notes.push("An item is missing a label or link.");
  if (!notes.length) notes.push("Navigation looks healthy: clear click paths, good depth, and conversion pages are one click away.");
  return notes;
}
