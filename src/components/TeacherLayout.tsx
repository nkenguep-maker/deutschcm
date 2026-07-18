"use client";

import { useEffect, useState, type ReactElement } from "react";
import { Link } from "@/navigation";
import { usePathname, useRouter } from "@/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { SpaceSwitcher, type SpaceRole } from "@/components/SpaceSwitcher";
import { LanguageChooser } from "@/components/LanguageChooser";
import { useActiveLanguage } from "@/hooks/useActiveLanguage";
import { useT } from "@/hooks/useT";
import {
  IconHome,
  IconBook,
  IconClasse,
  IconChart,
  IconSettings,
  IconGroup,
  IconLogout,
  IconSpark,
} from "@/components/landing/icons";

interface Item {
  Icon: (p: { size?: number }) => ReactElement;
  label: string;
  href: string;
}

interface Section {
  label?: string;
  items: Item[];
}

interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function TeacherLayout({ children, title }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const { language: activeLang } = useActiveLanguage();
  const { nav: tNav, layout: tl } = useT();

  // Nav enseignant·e groupée par intention.
  //   Aujourd'hui  → point d'entrée quotidien
  //   Classes      → gestion des groupes et corrections
  //   Créer        → Studio IA + suivi + ressources
  const NAV: Section[] = [
    { items: [
        { Icon: IconHome,     label: tNav.today,          href: "/teacher"             },
    ]},
    { label: locale === "en" ? "Classes" : "Classes",
      items: [
        { Icon: IconClasse,   label: tNav.teacherClasses, href: "/teacher/classrooms"  },
        { Icon: IconGroup,    label: tNav.learners,       href: "/teacher/students"    },
        { Icon: IconBook,     label: tNav.corrections,    href: "/teacher/assignments" },
    ]},
    { label: locale === "en" ? "Create" : "Créer",
      items: [
        { Icon: IconSpark,    label: tNav.studio,         href: "/teacher/studio"      },
        { Icon: IconChart,    label: tNav.tracking,       href: "/teacher/stats"       },
        { Icon: IconBook,     label: tNav.resources,      href: "/teacher/resources"   },
    ]},
    { items: [
        { Icon: IconSettings, label: tNav.settings,       href: "/settings"            },
    ]},
  ];

  const [userName, setUserName] = useState(tl.userFallback ?? "Enseignant·e");
  const [userEmail, setUserEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<SpaceRole[]>([]);
  const [activeSpace, setActiveSpace] = useState<SpaceRole>("TEACHER");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserEmail(data.user.email ?? "");
      setUserName(data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0] ?? userName);
    });
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      if (d.fullName) setUserName(d.fullName);
      if (Array.isArray(d.roles)) setUserRoles(d.roles as SpaceRole[]);
      if (d.activeSpace) setActiveSpace(d.activeSpace as SpaceRole);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/teacher/goodbye");
  };

  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "E";

  return (
    <div className={`app-shell territory-${activeLang.territory}`}>
      <aside className={`app-sidebar ${sidebarOpen ? "open" : ""}`}>
        <Link href="/teacher" className="app-sidebar-brand">
          <span aria-hidden="true" style={{
            width: 34, height: 34, borderRadius: 10,
            border: "1.5px solid var(--brass-edge)",
            background: "var(--brass-glow)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 18, fontStyle: "italic",
            color: "var(--brass)", flexShrink: 0,
          }}>Y</span>
          <span style={{
            fontFamily: "var(--font-fraunces), Georgia, serif", fontStyle: "italic",
            fontSize: 20, color: "var(--creme)", letterSpacing: "-0.01em",
          }}>Yema</span>
        </Link>

        <div className="app-sidebar-space">
          <p className="app-sidebar-space-lbl">Espace enseignant·e</p>
          <svg className="app-sidebar-space-check" width="14" height="14" viewBox="0 0 14 14"
               fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
               aria-hidden="true"><path d="M3 7l3 3 5-6" /></svg>
        </div>

        <nav className="app-nav" aria-label="Navigation enseignant">
          {NAV.map((section, si) => (
            <div key={si} className="app-nav-section">
              {section.label && (
                <p className="app-nav-section-label">{section.label}</p>
              )}
              {section.items.map((item) => {
                const exact = item.href === "/teacher";
                const active = exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href}
                        className={`app-nav-link ${active ? "active" : ""}`}
                        onClick={() => setSidebarOpen(false)}
                        aria-current={active ? "page" : undefined}>
                    <span className="app-nav-icon" aria-hidden="true"><item.Icon size={18} /></span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="app-sidebar-user">
          <div className="app-sidebar-avatar" aria-hidden="true">{initials}</div>
          <div className="app-sidebar-user-info">
            <p className="app-sidebar-user-name">{userName}</p>
            <p className="app-sidebar-user-mail">{userEmail}</p>
          </div>
          <button type="button" className="app-sidebar-logout" onClick={handleLogout} aria-label="Se déconnecter">
            <IconLogout size={16} />
          </button>
        </div>
      </aside>

      <div className={`app-scrim ${sidebarOpen ? "open" : ""}`}
           onClick={() => setSidebarOpen(false)} aria-hidden="true" />

      <div className="app-main">
        <header className="app-header">
          <button type="button" className="app-hamburger"
                  onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
                 stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              <path d="M3 5h12M3 9h12M3 13h12" />
            </svg>
          </button>
          {title ? <h1 className="app-header-title">{title}</h1> : <div style={{ flex: 1 }} />}
          <div className="app-header-actions">
            <LanguageChooser />
            <SpaceSwitcher roles={userRoles} activeSpace={activeSpace} />
            <LanguageSwitcher />
            <NotificationBell accentColor="var(--brass)" />
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
