export interface IndustryData {
  slug: string;
  name: string;
  headline: string;
  description: string;
  image: string;
  features: { title: string; description: string }[];
  stats: { label: string; value: string }[];
}

export const industries: IndustryData[] = [
  {
    slug: "plumbing",
    name: "Plumbing",
    headline: "Plumbing Software That Keeps Your Business Flowing",
    description: "Manage estimates, schedule jobs, dispatch techs, and get paid faster — all from one platform built for plumbing pros.",
    image: "/images/industry-plumbing.jpg",
    features: [
      { title: "Instant Estimates", description: "Create professional plumbing estimates on-site with pre-built templates for common jobs like pipe repair, water heater install, and drain cleaning." },
      { title: "Smart Scheduling", description: "Drag-and-drop calendar with route optimization so your techs spend less time driving and more time fixing." },
      { title: "Digital Invoicing", description: "Convert estimates to invoices in one tap. Accept payments on the spot with credit card or ACH." },
      { title: "Customer Management", description: "Track service history, property details, and follow-up reminders for every customer." },
    ],
    stats: [
      { label: "Faster Estimates", value: "3x" },
      { label: "Revenue Increase", value: "27%" },
      { label: "Time Saved Weekly", value: "12hrs" },
    ],
  },
  {
    slug: "hvac",
    name: "HVAC",
    headline: "HVAC Software That Keeps You Cool Under Pressure",
    description: "From AC installs to furnace repairs — manage your entire HVAC operation with scheduling, estimates, and payments in one place.",
    image: "/images/industry-hvac.jpg",
    features: [
      { title: "Equipment Tracking", description: "Log equipment models, warranty info, and maintenance schedules for every customer location." },
      { title: "Seasonal Scheduling", description: "Plan ahead for peak seasons with recurring maintenance contracts and automated reminders." },
      { title: "On-Site Estimates", description: "Build detailed HVAC estimates with labor, parts, and equipment markups — right from your phone." },
      { title: "Technician Dispatch", description: "Assign the right tech to the right job based on skills, location, and availability." },
    ],
    stats: [
      { label: "Jobs Per Day", value: "+40%" },
      { label: "Customer Retention", value: "92%" },
      { label: "Estimate Accuracy", value: "98%" },
    ],
  },
  {
    slug: "electrical",
    name: "Electrical",
    headline: "Electrical Contractor Software That Powers Your Growth",
    description: "Streamline your electrical business with job management, quoting, invoicing, and customer tracking — all wired together.",
    image: "/images/industry-electrical.jpg",
    features: [
      { title: "Code-Compliant Estimates", description: "Create detailed electrical estimates with material lists, permit tracking, and code references." },
      { title: "Job Costing", description: "Track labor hours, materials, and overhead per job to understand your true profitability." },
      { title: "Permit Management", description: "Track inspection dates, permit numbers, and approval status for every project." },
      { title: "Multi-Phase Projects", description: "Break large projects into phases with separate milestones, billing, and scheduling." },
    ],
    stats: [
      { label: "Profit Margin Boost", value: "18%" },
      { label: "Admin Time Saved", value: "15hrs/wk" },
      { label: "Faster Payments", value: "2x" },
    ],
  },
  {
    slug: "cleaning",
    name: "Cleaning",
    headline: "Cleaning Business Software That Sparkles",
    description: "Book more jobs, manage your crew, and grow your cleaning business with an all-in-one platform built for cleaning pros.",
    image: "/images/industry-cleaning.jpg",
    features: [
      { title: "Online Booking", description: "Let customers book cleaning appointments directly from your website with real-time availability." },
      { title: "Recurring Jobs", description: "Set up weekly, bi-weekly, or monthly cleaning schedules that auto-populate your calendar." },
      { title: "Crew Management", description: "Assign teams to jobs, track hours, and manage payroll with built-in time tracking." },
      { title: "Supply Tracking", description: "Monitor cleaning supply inventory and set reorder alerts so you never run out." },
    ],
    stats: [
      { label: "Bookings Increase", value: "45%" },
      { label: "No-Shows Reduced", value: "80%" },
      { label: "Revenue Growth", value: "35%" },
    ],
  },
  {
    slug: "landscaping",
    name: "Landscaping",
    headline: "Landscaping Software That Helps Your Business Grow",
    description: "From lawn care to full landscape design — manage bids, crews, and billing from one powerful platform.",
    image: "/images/industry-landscaping.jpg",
    features: [
      { title: "Property Measurements", description: "Use satellite imagery to measure properties and create accurate bids without a site visit." },
      { title: "Crew Scheduling", description: "Assign crews to routes, track job completion in real-time, and optimize daily schedules." },
      { title: "Seasonal Contracts", description: "Set up annual maintenance contracts with seasonal service changes and automated billing." },
      { title: "Before/After Photos", description: "Document your work with timestamped photos attached to each job record." },
    ],
    stats: [
      { label: "Bids Won", value: "+32%" },
      { label: "Route Efficiency", value: "25%" },
      { label: "Annual Revenue", value: "+40%" },
    ],
  },
  {
    slug: "handyman",
    name: "Handyman",
    headline: "Handyman Software for the Jack of All Trades",
    description: "Manage every type of job — from minor repairs to full renovations — with estimates, scheduling, and invoicing in one app.",
    image: "/images/industry-handyman.jpg",
    features: [
      { title: "Multi-Service Quotes", description: "Combine multiple repair tasks into a single estimate with itemized pricing." },
      { title: "Flexible Scheduling", description: "Book same-day, next-day, or recurring appointments with automated customer confirmations." },
      { title: "Photo Documentation", description: "Snap before/after photos for every job to build trust and showcase your work." },
      { title: "Quick Invoicing", description: "Generate and send invoices from your phone the moment a job is complete." },
    ],
    stats: [
      { label: "Jobs Completed", value: "+50%" },
      { label: "Customer Reviews", value: "4.9★" },
      { label: "Payment Speed", value: "Same Day" },
    ],
  },
  {
    slug: "contractor",
    name: "General Contractor",
    headline: "Contractor Software That Builds Your Business",
    description: "Manage projects, subs, bids, and change orders from one platform designed for general contractors.",
    image: "/images/industry-contractor.jpg",
    features: [
      { title: "Project Management", description: "Track multi-phase construction projects with timelines, milestones, and budget tracking." },
      { title: "Subcontractor Management", description: "Manage sub bids, contracts, insurance verification, and payment schedules." },
      { title: "Change Orders", description: "Create and track change orders with customer approval workflows and cost adjustments." },
      { title: "Lien Waiver Tracking", description: "Generate and collect lien waivers to protect your business on every project." },
    ],
    stats: [
      { label: "Project Efficiency", value: "+35%" },
      { label: "Budget Accuracy", value: "96%" },
      { label: "Sub Management", value: "3x faster" },
    ],
  },
  {
    slug: "painting",
    name: "Painting",
    headline: "Painting Contractor Software That Colors Your Success",
    description: "Estimate, schedule, and manage painting projects with tools built for interior and exterior painting pros.",
    image: "/images/industry-plumbing.jpg",
    features: [
      { title: "Square Footage Calculator", description: "Quickly calculate paint needs based on room dimensions, coats, and surface types." },
      { title: "Color Consultation Tracking", description: "Record customer color preferences, brand selections, and finish types per room." },
      { title: "Crew Assignments", description: "Assign painters to jobs based on skills (interior/exterior) and availability." },
      { title: "Material Cost Tracking", description: "Track paint, primer, tape, and supply costs per job for accurate billing." },
    ],
    stats: [
      { label: "Estimate Speed", value: "5x faster" },
      { label: "Material Waste", value: "-30%" },
      { label: "Revenue Growth", value: "+28%" },
    ],
  },
  {
    slug: "roofing",
    name: "Roofing",
    headline: "Roofing Software Built to Elevate Your Business",
    description: "From inspections to installations — manage roofing projects with estimates, photos, and financing options.",
    image: "/images/industry-contractor.jpg",
    features: [
      { title: "Roof Measurements", description: "Import satellite measurements for accurate material and labor estimates." },
      { title: "Storm Damage Reports", description: "Create detailed inspection reports with photos and notes for insurance claims." },
      { title: "Financing Integration", description: "Offer customers financing options directly from your estimates." },
      { title: "Warranty Tracking", description: "Log manufacturer warranties and labor guarantees for every completed project." },
    ],
    stats: [
      { label: "Close Rate", value: "+25%" },
      { label: "Estimate Time", value: "-70%" },
      { label: "Revenue Per Job", value: "+15%" },
    ],
  },
  {
    slug: "pest-control",
    name: "Pest Control",
    headline: "Pest Control Software That Eliminates the Busywork",
    description: "Route optimization, treatment tracking, and recurring service plans — everything pest control pros need.",
    image: "/images/industry-cleaning.jpg",
    features: [
      { title: "Treatment Records", description: "Log chemicals used, application methods, and EPA-required documentation per service." },
      { title: "Route Optimization", description: "Plan daily routes to minimize drive time and maximize service calls." },
      { title: "Recurring Plans", description: "Set up monthly or quarterly pest prevention plans with automated scheduling and billing." },
      { title: "Customer Portal", description: "Give customers access to service history, upcoming appointments, and treatment reports." },
    ],
    stats: [
      { label: "Daily Stops", value: "+40%" },
      { label: "Customer Retention", value: "94%" },
      { label: "Admin Time", value: "-60%" },
    ],
  },
];

export function getIndustryBySlug(slug: string): IndustryData | undefined {
  return industries.find((i) => i.slug === slug);
}
