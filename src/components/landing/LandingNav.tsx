"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isPubliclyLinked, type PublicSurfaceId } from "@/lib/release/publicSurface";
import { LandingBrand } from "./LandingBrand";

type NavLabels = {
  features: string;
  levels: string;
  pricing?: string;
  centers: string;
  login: string;
  register: string;
  methode?: string;
  histoires?: string;
  tarifs?: string;
};

function switchLocale(target: "fr" | "en", current: string) {
  if (target === current) return;
  document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=31536000; SameSite=Lax`;
  const path = window.location.pathname.replace(/^\/(fr|en)/, `/${target}`);
  window.location.assign(path + window.location.hash);
}

export function LandingNav({ locale, labels, isMobile = false }: { locale: string; labels: NavLabels; isMobile?: boolean }) {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { const onScroll = () => setSolid(window.scrollY > 50); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  useEffect(() => {
    if (!menuOpen) { document.body.style.overflow = ""; return; }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenuOpen(false); burgerRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [menuOpen]);
  useEffect(() => { if (menuOpen) drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus(); }, [menuOpen]);

  const navCandidates: Array<{ surface: PublicSurfaceId; label: string; href: string }> = [
    { surface: "languages", label: labels.features, href: `/${locale}/langues` },
    { surface: "method", label: labels.methode ?? labels.levels, href: `/${locale}/methode` },
    { surface: "pricing", label: labels.tarifs ?? labels.pricing ?? (locale === "en" ? "Pricing" : "Tarifs"), href: `/${locale}/pricing` },
    { surface: "centers", label: labels.centers, href: `/${locale}/landing` },
  ];
  const navItems = navCandidates.filter((item) => isPubliclyLinked(item.surface));
  const closeLabel = locale === "en" ? "Close menu" : "Fermer le menu";
  const openLabel = locale === "en" ? "Open menu" : "Ouvrir le menu";
  const langLabel = locale === "en" ? "Interface language" : "Langue de l'interface";

  return <>
    <nav className={`lnav${solid ? " solid" : ""}`}>
      <Link href={`/${locale}`} className="lnav-brand" onClick={() => setMenuOpen(false)}><LandingBrand /></Link>
      {!isMobile ? <div className="lnav-links">{navItems.map((it) => <a key={it.href} href={it.href}>{it.label}</a>)}</div> : null}
      <div className="lnav-right">
        {!isMobile ? <>
          <button type="button" className="lnav-btn-ghost" onClick={() => router.push(`/${locale}/login`)}>{labels.login}</button>
          <button type="button" className="lnav-btn-primary" onClick={() => router.push(`/${locale}/register`)}>{labels.register}</button>
          <div className="lnav-locale" role="group" aria-label={langLabel}><button type="button" className={`lnav-locale-btn ${locale === "fr" ? "active" : ""}`} onClick={() => switchLocale("fr", locale)} aria-pressed={locale === "fr"}>FR</button><button type="button" className={`lnav-locale-btn ${locale === "en" ? "active" : ""}`} onClick={() => switchLocale("en", locale)} aria-pressed={locale === "en"}>EN</button></div>
        </> : <button ref={burgerRef} type="button" className="lnav-burger" onClick={() => setMenuOpen(true)} aria-label={openLabel} aria-expanded={menuOpen} aria-controls="lnav-drawer"><span className="lnav-burger-bar" aria-hidden="true" /><span className="lnav-burger-bar" aria-hidden="true" /><span className="lnav-burger-bar" aria-hidden="true" /></button>}
      </div>
    </nav>
    {isMobile ? <><button type="button" className={`lnav-scrim ${menuOpen ? "open" : ""}`} aria-hidden="true" tabIndex={-1} onClick={() => setMenuOpen(false)} /><div ref={drawerRef} id="lnav-drawer" className={`lnav-drawer ${menuOpen ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu"><div className="lnav-drawer-head"><span className="lnav-drawer-eye">MENU</span><button type="button" className="lnav-drawer-close" onClick={() => setMenuOpen(false)} aria-label={closeLabel}><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg></button></div><ul className="lnav-drawer-links" role="list">{navItems.map((it) => <li key={it.href}><a href={it.href} onClick={() => setMenuOpen(false)}>{it.label}</a></li>)}</ul><div className="lnav-drawer-actions"><button type="button" className="lnav-drawer-cta lnav-drawer-cta-primary" onClick={() => { setMenuOpen(false); router.push(`/${locale}/register`); }}>{labels.register}</button><button type="button" className="lnav-drawer-cta lnav-drawer-cta-ghost" onClick={() => { setMenuOpen(false); router.push(`/${locale}/login`); }}>{labels.login}</button></div><div className="lnav-drawer-locale" role="group" aria-label={langLabel}><button type="button" className={`lnav-locale-btn ${locale === "fr" ? "active" : ""}`} onClick={() => switchLocale("fr", locale)} aria-pressed={locale === "fr"}>FR</button><button type="button" className={`lnav-locale-btn ${locale === "en" ? "active" : ""}`} onClick={() => switchLocale("en", locale)} aria-pressed={locale === "en"}>EN</button></div></div></> : null}
  </>;
}
