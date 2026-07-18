"use client";

import { useState, useEffect, type ReactElement } from "react";
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
  IconContext,
  IconMic,
  IconChart,
  IconSettings,
  IconGroup,
  IconLogout,
  IconTeacher,
  IconInstitution,
  IconSpark,
  IconMoney,
} from "@/components/landing/icons";

interface NavItem {
  Icon: (p: { size?: number }) => ReactElement;
  label: string;
  href: string;
}

interface NavSection {
  /** Label optionnel — quand présent, s'affiche en JetBrains Mono muted
   * au-dessus des items du groupe. Absent = section silencieuse. */
  label?: string;
  items: NavItem[];
}

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export default function Layout({ children, title }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const { language: activeLang } = useActiveLanguage();
  const { nav: tn, layout: tl } = useT();

  // Chaque profil a sa nav groupée par intention. Les section-labels
  // sont silencieux pour student (parcours linéaire simple) mais
  // explicites pour teacher/center/admin (contextes plus riches).

  const STUDENT_NAV: NavSection[] = [
    { items: [
        { Icon: IconHome,   label: tn.home,          href: "/dashboard"  },
        { Icon: IconBook,   label: tn.path,          href: "/courses"    },
    ]},
    { label: locale === "en" ? "Practice" : "Pratiquer",
      items: [
        { Icon: IconMic,    label: tn.practice,      href: "/simulateur" },
        { Icon: IconClasse, label: tn.myClass,       href: "/classroom"  },
    ]},
    { label: locale === "en" ? "Belong" : "Se relier",
      items: [
        { Icon: IconContext,label: tn.community,     href: "/discover"   },
        { Icon: IconChart,  label: tn.journey,       href: "/progress"   },
    ]},
    { items: [
        { Icon: IconSettings, label: tn.settings,    href: "/settings"   },
    ]},
  ];

  const TEACHER_NAV: NavSection[] = [
    { items: [
        { Icon: IconHome,     label: tn.today,       href: "/teacher"             },
    ]},
    { label: locale === "en" ? "Classes" : "Classes",
      items: [
        { Icon: IconClasse,   label: tn.teacherClasses, href: "/teacher/classrooms" },
        { Icon: IconGroup,    label: tn.learners,       href: "/teacher/students"   },
        { Icon: IconBook,     label: tn.corrections,    href: "/teacher/assignments" },
    ]},
    { label: locale === "en" ? "Create" : "Créer",
      items: [
        { Icon: IconSpark,    label: tn.studio,      href: "/teacher/studio"      },
        { Icon: IconChart,    label: tn.tracking,    href: "/teacher/stats"       },
        { Icon: IconBook,     label: tn.resources,   href: "/teacher/resources"   },
    ]},
    { items: [
        { Icon: IconSettings, label: tn.settings,    href: "/settings"            },
    ]},
  ];

  const CENTER_NAV: NavSection[] = [
    { items: [
        { Icon: IconHome,     label: tn.centerOverview, href: "/center"          },
    ]},
    { label: locale === "en" ? "Team" : "Équipe",
      items: [
        { Icon: IconTeacher,  label: tn.teachers,       href: "/center/teachers" },
        { Icon: IconGroup,    label: tn.centerLearners, href: "/center/students" },
        { Icon: IconClasse,   label: tn.centerClasses,  href: "/center/classes"  },
    ]},
    { label: locale === "en" ? "Steer" : "Piloter",
      items: [
        { Icon: IconChart,    label: tn.centerTracking, href: "/center/stats"    },
        { Icon: IconMoney,    label: tn.billing,        href: "/center/billing"  },
    ]},
    { items: [
        { Icon: IconSettings, label: tn.settings,       href: "/settings"        },
    ]},
  ];

  const ADMIN_NAV: NavSection[] = [
    { items: [
        { Icon: IconHome,        label: tn.adminOverview, href: "/admin"                  },
    ]},
    { label: locale === "en" ? "Accounts" : "Comptes",
      items: [
        { Icon: IconGroup,       label: tn.adminUsers,    href: "/admin/users"            },
        { Icon: IconInstitution, label: tn.adminRoles,    href: "/admin/roles"            },
        { Icon: IconInstitution, label: tn.adminCenters,  href: "/admin/centers"          },
    ]},
    { label: locale === "en" ? "Content" : "Contenu",
      items: [
        { Icon: IconBook,        label: tn.adminCourses,  href: "/admin/courses"          },
        { Icon: IconSpark,       label: tn.studio,        href: "/admin/courses/generate" },
    ]},
    { items: [
        { Icon: IconChart,       label: tn.tracking,      href: "/admin/system"           },
        { Icon: IconSettings,    label: tn.settings,      href: "/settings"               },
    ]},
  ];

  const NAV_BY_ROLE: Record<string, NavSection[]> = {
    STUDENT: STUDENT_NAV,
    TEACHER: TEACHER_NAV,
    CENTER:  CENTER_NAV,
    ADMIN:   ADMIN_NAV,
  };

  const [userName, setUserName] = useState(tl.userFallback);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<string>("STUDENT");
  const [userRoles, setUserRoles] = useState<SpaceRole[]>([]);
  const [activeSpace, setActiveSpace] = useState<SpaceRole>("STUDENT");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? "");
        const name =
          data.user.user_metadata?.full_name ??
          data.user.email?.split("@")[0] ??
          tl.userFallback;
        setUserName(name);
      }
    });
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(d => {
      if (!d || typeof d.onboardingDone === "undefined") return;
      if (d.role) setUserRole(d.role);
      if (Array.isArray(d.roles)) setUserRoles(d.roles as SpaceRole[]);
      if (d.activeSpace) setActiveSpace(d.activeSpace as SpaceRole);
      if (d.fullName) setUserName(d.fullName);
      const skipOnboarding =
        pathname.startsWith("/onboarding") ||
        pathname.startsWith("/test-niveau") ||
        pathname.startsWith("/teacher") ||
        pathname.startsWith("/center") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/discover") ||
        pathname.startsWith("/notifications");
      if (!skipOnboarding) {
        if (d.germanLevel) return;
        if (d.onboardingDone === false) {
          const dest = d.role === "TEACHER" ? "/onboarding/teacher"
            : d.role === "CENTER" ? "/onboarding/center"
            : "/onboarding/student";
          router.replace(dest);
          return;
        }
        if (d.role === "STUDENT") {
          router.replace("/test-niveau");
        }
      }
    }).catch(() => {});
  }, [pathname, router, tl.userFallback]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/goodbye");
  };

  // Multi-rôles : la sidebar suit activeSpace (le choix explicite de
  // l'user via SpaceSwitcher/TestSpaceBar), pas User.role legacy.
  // Fallback sur userRole si activeSpace pas encore chargé.
  const navRole = activeSpace ?? userRole;
  const activeNav = NAV_BY_ROLE[navRole] ?? STUDENT_NAV;
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "Y";
  const spaceLabel: Record<SpaceRole, string> = {
    STUDENT: tl.studentRole ?? "Espace apprenant",
    TEACHER: tl.teacherRole ?? "Espace enseignant",
    CENTER:  tl.centerRole ?? "Espace centre",
    ADMIN:   tl.adminRole ?? "Espace admin",
  };

  return (
    <div className={`app-shell territory-${activeLang.territory}`}>
      <aside className={`app-sidebar ${sidebarOpen ? "open" : ""}`}>
        <Link href="/dashboard" className="app-sidebar-brand">
          <span
            aria-hidden="true"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1.5px solid var(--brass-edge)",
              background: "var(--brass-glow)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: 18,
              fontStyle: "italic",
              color: "var(--brass)",
              flexShrink: 0,
            }}
          >
            Y
          </span>
          <span
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontStyle: "italic",
              fontSize: 20,
              color: "var(--creme)",
              letterSpacing: "-0.01em",
            }}
          >
            Yema
          </span>
        </Link>

        <div className="app-sidebar-space">
          <p className="app-sidebar-space-lbl">{spaceLabel[activeSpace]}</p>
          <svg
            className="app-sidebar-space-check"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 7l3 3 5-6" />
          </svg>
        </div>

        <nav className="app-nav" aria-label="Navigation principale">
          {activeNav.map((section, si) => (
            <div key={si} className="app-nav-section">
              {section.label && (
                <p className="app-nav-section-label">{section.label}</p>
              )}
              {section.items.map((item) => {
                const exact =
                  item.href === "/teacher" ||
                  item.href === "/center" ||
                  item.href === "/dashboard" ||
                  item.href === "/admin";
                const active = exact
                  ? pathname === item.href
                  : pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`app-nav-link ${active ? "active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={active ? "page" : undefined}
                  >
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
          <button
            type="button"
            className="app-sidebar-logout"
            onClick={handleLogout}
            aria-label={tl.logout ?? "Se déconnecter"}
          >
            <IconLogout size={16} />
          </button>
        </div>
      </aside>

      <div
        className={`app-scrim ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <div className="app-main">
        <header className="app-header">
          <button
            type="button"
            className="app-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              <path d="M3 5h12M3 9h12M3 13h12" />
            </svg>
          </button>
          <h1 className="app-header-title">{title}</h1>
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
