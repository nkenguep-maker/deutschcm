export function sanitizeInternalNext(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;

  const candidate = value.trim();
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\")) return fallback;

  try {
    const base = new URL("https://yema.invalid");
    const parsed = new URL(candidate, base);
    if (parsed.origin !== base.origin) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function sanitizeOptionalInternalNext(
  value: string | null | undefined,
): string | null {
  const sanitized = sanitizeInternalNext(value, "");
  return sanitized || null;
}
