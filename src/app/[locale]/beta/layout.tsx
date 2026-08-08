import type { Metadata } from "next";

export const metadata: Metadata = {
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

// Invitation pages must never become static/cached artifacts. The actual token
// lives only in the URL fragment and is removed from browser history client-side,
// but keeping the route dynamic avoids serving stale admission UI during beta.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function BetaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
