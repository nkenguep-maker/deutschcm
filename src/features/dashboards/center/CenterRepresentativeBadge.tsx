import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { INTERNAL_TEST_COOKIE_NAME } from "@/lib/internalTest";

export async function CenterRepresentativeBadge({ locale }: { locale: "fr" | "en" }) {
  const jar = await cookies();
  if (jar.get(INTERNAL_TEST_COOKIE_NAME)?.value) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { fullName: true, city: true },
  });
  if (!profile?.fullName) return null;

  return (
    <aside
      data-center-representative
      aria-label={locale === "en" ? "Connected center representative" : "Représentant du centre connecté"}
      style={{
        position: "fixed",
        right: 18,
        top: 14,
        zIndex: 80,
        maxWidth: 320,
        border: "1px solid rgba(184,135,62,.26)",
        borderRadius: 999,
        background: "rgba(27,18,10,.92)",
        color: "#F4EBDC",
        padding: "8px 13px",
        boxShadow: "0 8px 30px rgba(0,0,0,.18)",
        backdropFilter: "blur(12px)",
        fontSize: 12,
        lineHeight: 1.25,
      }}
    >
      <span style={{ color: "#B8873E", marginRight: 6 }}>
        {locale === "en" ? "Center account" : "Compte Centre"}
      </span>
      <strong>{profile.fullName}</strong>
      {profile.city ? <span style={{ opacity: .68 }}> · {profile.city}</span> : null}
    </aside>
  );
}
