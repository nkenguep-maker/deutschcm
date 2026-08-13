import type { Metadata } from "next";
import { isClosedBetaEnabled } from "@/lib/beta/invite";

export function generateMetadata(): Metadata {
  if (isClosedBetaEnabled()) {
    return {
      robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
          noarchive: true,
          nosnippet: true,
          noimageindex: true,
        },
      },
    };
  }

  return {
    robots: { index: true, follow: true },
  };
}

// The access state depends on a server-only flag. Keep it dynamic so an open
// registration page is never served as a stale invitation-only page, or vice versa.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function BetaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
