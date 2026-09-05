export interface FeatureData {
  slug: string;
  name: string;
  headline: string;
  description: string;
  icon: string;
  benefits: { title: string; description: string }[];
  howItWorks: { step: string; title: string; description: string }[];
}

export const features: FeatureData[] = [
  {
    slug: "call-quote-console",
    name: "Call Quote Console",
    headline: "Quote Customers While You’re Still on the Call",
    description: "Price services, capture customer details, send quote links, and open checkout from one fast call-time console built for desktop and mobile teams.",
    icon: "Phone",
    benefits: [
      { title: "Fast Call Intake", description: "Keep caller details, service notes, property info, and pricing in one focused workflow while the conversation is live." },
      { title: "Instant Quote Links", description: "Send customers a professional quote link by text or email before they hang up." },
      { title: "Checkout Ready", description: "Move approved call quotes toward payment without rebuilding the job from scratch." },
      { title: "Mobile & Desktop Friendly", description: "Use the same console from the office, a tablet, or an installed mobile app in the field." },
      { title: "Cleaner Follow-Up", description: "Keep quote status, contact details, and next actions organized so fewer phone leads slip away." },
      { title: "Built for Service Teams", description: "Designed for cleaning, HVAC, plumbing, landscaping, and other high-volume service calls." },
    ],
    howItWorks: [
      { step: "1", title: "Answer the Call", description: "Enter the caller, service type, property details, notes, and expected scope as you talk." },
      { step: "2", title: "Price the Work", description: "Build the quote quickly with service items, adjustments, deposits, and customer-ready terms." },
      { step: "3", title: "Send & Convert", description: "Share the quote link, collect approval, and move the customer toward checkout or scheduling." },
    ],
  },
  {
    slug: "estimates",
    name: "Estimates & Quoting",
    headline: "Create Professional Estimates in Minutes",
    description: "Build accurate, branded estimates on-site or in-office. Convert more leads into paying customers with professional proposals.",
    icon: "FileText",
    benefits: [
      { title: "Pre-Built Templates", description: "Choose from industry-specific templates with common line items, labor rates, and material costs pre-loaded." },
      { title: "Digital Signatures", description: "Customers can approve estimates with a tap — no printing, scanning, or mailing required." },
      { title: "Automatic Follow-Ups", description: "Set automated reminders for unsigned estimates to improve your close rate." },
      { title: "Photo Attachments", description: "Include job site photos directly in your estimates for complete transparency." },
      { title: "Estimate-to-Invoice", description: "Convert approved estimates to invoices in one click — no re-entering data." },
      { title: "Profit Margins", description: "See real-time margin calculations as you build each estimate." },
    ],
    howItWorks: [
      { step: "1", title: "Build Your Estimate", description: "Select services, add materials, set labor rates, and attach photos from the job site." },
      { step: "2", title: "Send to Customer", description: "Email or text a branded estimate link. Customers can view, comment, and approve online." },
      { step: "3", title: "Get Approved & Paid", description: "Once approved, convert to an invoice and collect payment — all in the same platform." },
    ],
  },
  {
    slug: "invoicing",
    name: "Invoicing & Payments",
    headline: "Get Paid Faster with Effortless Invoicing",
    description: "Send professional invoices, accept online payments, and automate payment reminders — so you spend less time chasing money.",
    icon: "CreditCard",
    benefits: [
      { title: "One-Tap Invoicing", description: "Generate invoices from completed jobs or approved estimates with a single tap." },
      { title: "Online Payments", description: "Accept credit cards, debit cards, and ACH bank transfers directly through your invoices." },
      { title: "Automated Reminders", description: "Set up automatic payment reminders for overdue invoices to improve cash flow." },
      { title: "Partial Payments", description: "Accept deposits, progress payments, and final payments on a single invoice." },
      { title: "QuickBooks Sync", description: "Automatically sync invoices and payments with QuickBooks for seamless bookkeeping." },
      { title: "Payment Reports", description: "Track outstanding invoices, payment history, and revenue trends in real-time." },
    ],
    howItWorks: [
      { step: "1", title: "Create Invoice", description: "Auto-generate from estimates or build from scratch with your service catalog." },
      { step: "2", title: "Send & Track", description: "Email invoices with a payment link. Track when customers open and view them." },
      { step: "3", title: "Get Paid", description: "Customers pay online instantly. Funds deposit directly to your bank account." },
    ],
  },
  {
    slug: "scheduling",
    name: "Scheduling & Dispatch",
    headline: "Smart Scheduling That Keeps Your Team Moving",
    description: "Drag-and-drop scheduling, real-time dispatching, and route optimization — manage your team's day without the chaos.",
    icon: "Calendar",
    benefits: [
      { title: "Drag & Drop Calendar", description: "Visually schedule and reschedule jobs with an intuitive drag-and-drop interface." },
      { title: "Real-Time Dispatch", description: "See where your team is in real-time and dispatch the nearest available tech." },
      { title: "Route Optimization", description: "Automatically plan the most efficient routes to reduce drive time and fuel costs." },
      { title: "Customer Notifications", description: "Send automated appointment reminders and 'on my way' notifications to customers." },
      { title: "Recurring Jobs", description: "Set up weekly, monthly, or custom recurring schedules that auto-populate your calendar." },
      { title: "Availability Management", description: "Track time-off, blocked hours, and technician availability in one place." },
    ],
    howItWorks: [
      { step: "1", title: "Schedule the Job", description: "Drag jobs onto your calendar or let customers book online through your booking page." },
      { step: "2", title: "Dispatch Your Team", description: "Assign techs, send job details to their phone, and track arrival in real-time." },
      { step: "3", title: "Complete & Invoice", description: "Techs mark jobs complete, capture signatures, and trigger invoicing automatically." },
    ],
  },
  {
    slug: "crm",
    name: "Customer Management",
    headline: "Know Every Customer Like Your Best Customer",
    description: "Track every interaction, service history, and communication in one place. Build lasting relationships that drive repeat business.",
    icon: "Users",
    benefits: [
      { title: "Complete Service History", description: "See every job, estimate, invoice, and note for each customer at a glance." },
      { title: "Property Records", description: "Store property details, access codes, equipment specs, and special instructions." },
      { title: "Automated Follow-Ups", description: "Set reminders for seasonal check-ins, warranty expirations, and maintenance visits." },
      { title: "Customer Tags", description: "Segment customers by type, source, location, or custom criteria for targeted marketing." },
      { title: "Communication Log", description: "Track every call, email, and text in one timeline so nothing falls through the cracks." },
      { title: "Review Requests", description: "Automatically request reviews from happy customers to build your online reputation." },
    ],
    howItWorks: [
      { step: "1", title: "Add Customers", description: "Import your existing customer list or add new customers as they book services." },
      { step: "2", title: "Track Everything", description: "Every job, payment, and communication is automatically logged to their profile." },
      { step: "3", title: "Stay Connected", description: "Automated follow-ups and review requests keep customers engaged and coming back." },
    ],
  },
  {
    slug: "payments",
    name: "Payments & Financing",
    headline: "Accept Payments Anywhere, Anytime",
    description: "Credit cards, ACH, and customer financing — give your customers flexible ways to pay and get your money faster.",
    icon: "DollarSign",
    benefits: [
      { title: "Mobile Payments", description: "Accept credit and debit card payments on-site with your phone — no card reader needed." },
      { title: "ACH Bank Transfers", description: "Offer lower-cost ACH payments for customers who prefer paying from their bank account." },
      { title: "Customer Financing", description: "Let customers finance larger jobs with monthly payment plans through integrated lending partners." },
      { title: "Automatic Deposits", description: "Payments deposit directly to your bank account — typically within 1-2 business days." },
      { title: "Tip Collection", description: "Enable optional tipping on invoices to boost your team's earnings." },
      { title: "Payment Dashboard", description: "See all payments, pending transactions, and refunds in one real-time dashboard." },
    ],
    howItWorks: [
      { step: "1", title: "Set Up Payments", description: "Connect your bank account and start accepting payments in minutes — no hardware needed." },
      { step: "2", title: "Collect On-Site or Online", description: "Charge cards on-site, send payment links, or let customers pay through their invoice." },
      { step: "3", title: "Money in Your Account", description: "Funds are automatically deposited to your bank within 1-2 business days." },
    ],
  },
];

export function getFeatureBySlug(slug: string): FeatureData | undefined {
  return features.find((f) => f.slug === slug);
}
