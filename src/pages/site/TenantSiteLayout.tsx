import { useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { useTenantSite } from "@/hooks/useTenantSite";
import { useBrandFavicon } from "@/hooks/useBrandFavicon";
import { BusinessLogo } from "@/components/BusinessLogo";
import { buildDefaultNav, NavItem } from "@/lib/tenantNav";
import { Phone, Mail, MapPin, Loader2, ChevronDown, Menu, X, ShieldCheck, CalendarCheck } from "lucide-react";

export default function TenantSiteLayout() {
  const { slug } = useParams();
  const { data, isLoading } = useTenantSite(slug);
  const [open, setOpen] = useState(false);
  useBrandFavicon(data?.business?.logo_url, data?.business?.name);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream p-8 text-center">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-tight mb-2">Site not published</h1>
          <p className="text-muted-foreground">This business hasn't published a website yet.</p>
        </div>
      </div>
    );
  }

  const { business, site, services, areas } = data;
  const base = `/site/${slug}`;
  const custom = Array.isArray(site?.nav_items) && site.nav_items.length ? (site.nav_items as NavItem[]) : null;
  const nav: NavItem[] = custom || buildDefaultNav(base, business.industry, services || [], areas || []);
  const ctaLabel = site?.cta_text || "Book Now";

  const renderLink = (item: { label: string; to: string; external?: boolean }, className: string) =>
    item.external ? (
      <a key={item.to + item.label} href={item.to} target="_blank" rel="noreferrer" className={className}>
        {item.label}
      </a>
    ) : (
      <NavLink
        key={item.to + item.label}
        to={item.to}
        end={item.to === base}
        className={({ isActive }) => `${className} ${isActive ? "text-primary font-medium" : ""}`}
        onClick={() => setOpen(false)}
      >
        {item.label}
      </NavLink>
    );

  return (
    <div className="min-h-screen bg-cream text-foreground flex flex-col">
      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-border/60">
        {/* Trust bar */}
        <div className="hidden md:block bg-primary text-primary-foreground text-xs">
          <div className="container mx-auto px-4 h-9 flex items-center justify-between">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={14} /> Licensed, insured & background-checked pros</span>
            {business.phone && (
              <a href={`tel:${business.phone}`} className="inline-flex items-center gap-2 hover:underline">
                <Phone size={14} /> {business.phone}
              </a>
            )}
          </div>
        </div>

        <div className="container mx-auto flex items-center justify-between h-16 px-4 gap-4">
          <Link to={base} className="flex items-center gap-2 shrink-0">
            <BusinessLogo name={business.name} logoUrl={business.logo_url} rounded="md" className="h-9 w-9" />
            <span className="font-display uppercase tracking-tight text-lg">{business.name}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm">
            {nav.map((item) =>
              item.children?.length ? (
                <div key={item.label} className="relative group">
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => `inline-flex items-center gap-1 transition hover:text-primary ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}
                  >
                    {item.label} <ChevronDown size={14} className="transition group-hover:rotate-180" />
                  </NavLink>
                  <div className="absolute left-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                    <div className="min-w-56 rounded-xl border border-border/60 bg-white shadow-lg p-2">
                      {item.children.map((c) =>
                        renderLink(c, "block px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-primary transition")
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                renderLink(item, "text-muted-foreground hover:text-primary transition")
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="hidden sm:inline-flex h-11 px-4 items-center gap-2 rounded-full border border-border text-sm font-medium hover:bg-muted transition"
              >
                <Phone size={16} /> Call
              </a>
            )}
            <Link
              to={`${base}/book`}
              className="hidden sm:inline-flex h-11 px-5 items-center rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
            >
              {ctaLabel}
            </Link>
            <button
              className="lg:hidden h-11 w-11 inline-flex items-center justify-center rounded-full border border-border"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-border/60 bg-cream max-h-[70vh] overflow-y-auto">
            <div className="container mx-auto px-4 py-3 space-y-1">
              {nav.map((item) => (
                <div key={item.label} className="py-1">
                  {renderLink(item, "block py-3 text-base font-medium text-foreground")}
                  {item.children?.length ? (
                    <div className="pl-4 border-l border-border/60 space-y-1">
                      {item.children.map((c) => renderLink(c, "block py-2 text-sm text-muted-foreground"))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pb-20 sm:pb-0">
        <Outlet />
      </main>

      {/* Mobile sticky conversion bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 grid grid-cols-2 gap-2 p-3 bg-cream/95 backdrop-blur border-t border-border/60">
        <a
          href={business.phone ? `tel:${business.phone}` : `${base}/contact`}
          className="h-12 inline-flex items-center justify-center gap-2 rounded-full border border-primary text-primary font-medium"
        >
          <Phone size={18} /> Call
        </a>
        <Link
          to={`${base}/book`}
          className="h-12 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-medium"
        >
          <CalendarCheck size={18} /> {ctaLabel}
        </Link>
      </div>

      <footer className="mt-20 border-t border-border/60 bg-white/60">
        <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
          <div>
            <h4 className="font-display uppercase text-lg mb-2">{business.name}</h4>
            <p className="text-sm text-muted-foreground">{site?.tagline}</p>
          </div>
          <div className="text-sm space-y-2">
            {business.phone && <div className="flex items-center gap-2"><Phone size={16} /> <a href={`tel:${business.phone}`} className="hover:underline">{business.phone}</a></div>}
            {business.email && <div className="flex items-center gap-2"><Mail size={16} /> <a href={`mailto:${business.email}`} className="hover:underline">{business.email}</a></div>}
            {(business.city || business.state) && <div className="flex items-center gap-2"><MapPin size={16} /> {[business.city, business.state].filter(Boolean).join(", ")}</div>}
          </div>
          <div className="text-sm text-muted-foreground md:text-right">
            © {new Date().getFullYear()} {business.name}. Website by <a href="https://solutionaryhq.com" className="underline">Solutionary HQ</a>.
          </div>
        </div>
      </footer>
    </div>
  );
}
