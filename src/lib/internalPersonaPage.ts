import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  INTERNAL_TEST_COOKIE_NAME,
  resolveInternalPersona,
  type InternalPersonaId,
} from "@/lib/internalPersona";

export async function resolveActiveInternalPersona(
  accepted?: readonly InternalPersonaId[],
): Promise<InternalPersonaId | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const jar = await cookies();
  const rawPersona = jar.get(INTERNAL_TEST_COOKIE_NAME)?.value;
  const resolved = resolveInternalPersona(rawPersona, user.email);
  if (!resolved) return null;
  if (accepted && !accepted.includes(resolved.id)) return null;
  return resolved.id;
}
