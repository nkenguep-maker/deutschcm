"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import Layout from "@/components/Layout";

type Member = { id: string; fullName: string; germanLevel: string | null; xpTotal: number; streakDays: number };
type Group = { id: string; name: string; code: string; level?: string | null; maxMembers: number; creator: { fullName: string }; members: { user: Member }[] };
type Me = { studentType?: string; groupId?: string };

export function StudyGroupPage() {
  const locale = useLocale();
  const en = locale === "en";
  const [group, setGroup] = useState<Group | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"members" | "leaderboard">("members");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch("/api/me", { cache: "no-store" });
        if (!meRes.ok) throw new Error("me_failed");
        const meData = await meRes.json() as Me;
        if (cancelled) return;
        setMe(meData);
        if (!meData.groupId) return;
        const groupRes = await fetch(`/api/group?id=${encodeURIComponent(meData.groupId)}`, { cache: "no-store" });
        if (groupRes.status === 404) return;
        if (!groupRes.ok) throw new Error("group_failed");
        const data = await groupRes.json() as { group?: Group | null };
        if (!cancelled) setGroup(data.group ?? null);
      } catch {
        if (!cancelled) setError(en ? "Unable to load the study group right now." : "Impossible de charger le groupe pour le moment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [en]);

  const members = group?.members.map((m) => m.user) ?? [];
  const leaderboard = useMemo(() => [...members].sort((a, b) => b.xpTotal - a.xpTotal), [members]);
  const displayed = tab === "leaderboard" ? leaderboard : members;
  const isCreator = me?.studentType === "group_creator";

  async function copyCode() {
    if (!group) return;
    await navigator.clipboard.writeText(group.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (loading) return <Layout title={en ? "Study group" : "Groupe d'étude"}><main aria-busy="true" style={{ minHeight: 320, display: "grid", placeItems: "center" }}>{en ? "Loading group…" : "Chargement du groupe…"}</main></Layout>;

  if (!group) return (
    <Layout title={en ? "Study group" : "Groupe d'étude"}>
      <main style={{ maxWidth: 640, margin: "48px auto", textAlign: "center", padding: "0 16px" }}>
        <div aria-hidden="true" style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
        <h1 style={{ margin: "0 0 10px", fontSize: 24 }}>{en ? "You don't have a group yet" : "Vous n'avez pas encore de groupe"}</h1>
        <p style={{ color: "var(--yema-text-muted)", lineHeight: 1.7 }}>{en ? "Create a private beta study group or join one with its code. No payment is required during the technical beta." : "Créez un groupe privé de bêta ou rejoignez-en un avec son code. Aucun paiement n'est demandé pendant la bêta technique."}</p>
        {error ? <p role="alert" style={{ color: "#fca5a5" }}>{error}</p> : null}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 22 }}>
          <Link href="/group/create" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 20px", borderRadius: 12, background: "#10b981", color: "#fff", textDecoration: "none", fontWeight: 800 }}>{en ? "+ Create a group" : "+ Créer un groupe"}</Link>
          <Link href="/group/join" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", color: "inherit", textDecoration: "none" }}>{en ? "Join with a code →" : "Rejoindre avec un code →"}</Link>
        </div>
      </main>
    </Layout>
  );

  return (
    <Layout title={group.name}>
      <main style={{ maxWidth: 920, margin: "0 auto", display: "grid", gap: 16 }}>
        <section style={{ border: "1px solid rgba(255,255,255,.09)", borderRadius: 18, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 8 }}>
                {group.level ? <span className="yema-mono">{group.level}</span> : null}
                <span className="yema-mono">{en ? "Technical beta" : "Bêta technique"}</span>
                {isCreator ? <span className="yema-mono">{en ? "Creator" : "Créateur"}</span> : null}
              </div>
              <h1 style={{ margin: "0 0 6px", overflowWrap: "anywhere" }}>{group.name}</h1>
              <p style={{ margin: 0, color: "var(--yema-text-muted)", overflowWrap: "anywhere" }}>{members.length} / {group.maxMembers} {en ? "members" : "membres"} · {en ? "created by" : "créé par"} {group.creator.fullName}</p>
            </div>
            {isCreator ? <div style={{ minWidth: 190 }}><div className="yema-mono" style={{ padding: 12, border: "1px solid rgba(16,185,129,.25)", borderRadius: 10, textAlign: "center" }}>{group.code}</div><button type="button" onClick={copyCode} style={{ marginTop: 8, width: "100%", minHeight: 44 }}>{copied ? (en ? "✓ Copied" : "✓ Copié") : (en ? "Copy private code" : "Copier le code privé")}</button></div> : null}
          </div>
        </section>

        <nav aria-label={en ? "Group view" : "Vue du groupe"} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <button type="button" aria-pressed={tab === "members"} onClick={() => setTab("members")} style={{ minHeight: 44 }}>{en ? "Members" : "Membres"}</button>
          <button type="button" aria-pressed={tab === "leaderboard"} onClick={() => setTab("leaderboard")} style={{ minHeight: 44 }}>{en ? "Leaderboard" : "Classement"}</button>
        </nav>

        <section aria-label={tab === "members" ? (en ? "Members" : "Membres") : (en ? "Leaderboard" : "Classement")} style={{ display: "grid", gap: 8 }}>
          {displayed.map((member, index) => (
            <article key={member.id} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
              <div aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 999, display: "grid", placeItems: "center", background: "rgba(16,185,129,.12)" }}>{tab === "leaderboard" && index < 3 ? ["🥇", "🥈", "🥉"][index] : member.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}><strong style={{ overflowWrap: "anywhere" }}>{member.fullName}</strong><div style={{ color: "var(--yema-text-muted)", fontSize: 12 }}>{member.germanLevel ?? (en ? "Level not provided" : "Niveau non renseigné")} · {member.streakDays} {en ? `day${member.streakDays === 1 ? "" : "s"} streak` : `jour${member.streakDays === 1 ? "" : "s"} de série`}</div></div>
              <strong>{member.xpTotal.toLocaleString(en ? "en-US" : "fr-FR")} XP</strong>
            </article>
          ))}
        </section>
      </main>
    </Layout>
  );
}
