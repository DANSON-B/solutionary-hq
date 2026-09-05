import { Link } from "react-router-dom";

const footerLinks = {
  Features: [
    { label: "Call Quote Console", href: "/features/call-quote-console" },
    { label: "Estimates & Quoting", href: "/features/estimates" },
    { label: "Invoicing & Payments", href: "/features/invoicing" },
    { label: "Scheduling & Dispatch", href: "/features/scheduling" },
    { label: "Customer Management", href: "/features/crm" },
    { label: "Payments & Financing", href: "/features/payments" },
  ],
  Industries: [
    { label: "Plumbing", href: "/industries/plumbing" },
    { label: "HVAC", href: "/industries/hvac" },
    { label: "Electrical", href: "/industries/electrical" },
    { label: "Cleaning", href: "/industries/cleaning" },
    { label: "Landscaping", href: "/industries/landscaping" },
    { label: "Roofing", href: "/industries/roofing" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Pricing", href: "/pricing" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-hcp-dark text-primary-foreground/80">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-xl font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <span className="text-primary-foreground">Solutionary</span>
              <span className="text-amber"> HQ</span>
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/50 leading-relaxed">
              Everything to run and grow your service business.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-semibold text-sm text-primary-foreground mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/40">
          © {new Date().getFullYear()} Solutionary HQ. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
