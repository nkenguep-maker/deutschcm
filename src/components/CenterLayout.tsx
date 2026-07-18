"use client";

import { useEffect, useState, type ReactElement } from "react";
import { Link } from "@/navigation";
import { usePathname, useRouter } from "@/navigation";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { SpaceSwitcher, type SpaceRole } from "@/components/SpaceSwitcher";
import { useT } from "@/hooks/useT";
import {
  IconHome,
  IconTeacher,
  IconGroup,
  IconClasse,
  IconSpark,
  IconChart,
  IconMoney,
  IconLogout,
} from "@/components/landing/icons";

interface Item {
  Icon: (p: { size?: number }) => ReactElement;
  label: string;
  href: string;
}

interface Props {
  children: React.ReactNode;
  title: string;
  centerName?: string;
  centerCity?: string;
}

export default function CenterLayout({ children, title, centerName, centerCity }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { nav: tNav } = useT();

  const NAV: Item[] = [
    { Icon: IconHome,        label: tNav.overview,       href: "/center"                   },
    { Icon: IconTeacher,     label: tNav.teachers,       href: "/center/teachers"          },
    { Icon: IconGroup,       label: tNav.students,       href: "/center/students"          },
    { Icon: IconClasse,      label: tNav.myClasses,      href: "/center/classes"           },
    { Icon: IconSpark,       label: tNav.generateCourse, href: "/admin/courses/generate"   },
    { Icon: IconChart,       label: tNav.stats,          href: "/center/stats"             },
    { Icon: IconMoney,       label: tNav.billing,        href: "/center/billing"           },
  ];

  const [userName, setUserName] = useState("Directeur");
  const [userEmail, setUserEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<SpaceRole[]>([]);
  const [activeSpace, setActiveSpace] = useState<SpaceRole>("CENTER");

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
    router.push("/goodbye");
  };

  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "C";
  const spaceLbl = centerName
    ? centerCity ? `${centerName} · ${centerCity}` : centerName
    : "Espace centre";

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${sidebarOpen ? "open" : ""}`}>
        <Link href="/center" className="app-sidebar-brand">
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
          <p className="app-sidebar-space-lbl" title={spaceLbl}>{spaceLbl}</p>
          <svg className="app-sidebar-space-check" width="14" height="14" viewBox="0 0 14 14"
               fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
               aria-hidden="true"><path d="M3 7l3 3 5-6" /></svg>
        </div>

        <nav className="app-nav" aria-label="Navigation centre">
          {NAV.map(item => {
            const exact = item.href === "/center";
            const active = exact ? pathname === item.href : (pathname === item.href || pathname.startsWith(item.href + "/"));
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
          <h1 className="app-header-title">{title}</h1>
          <div className="app-header-actions">
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
