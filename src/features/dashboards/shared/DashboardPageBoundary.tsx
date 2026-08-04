"use client";

import type { ReactNode } from "react";
import { Component } from "react";
import { DashboardErrorState } from "./DashboardErrorState";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  error: Error | null;
};

// Boundary d'affichage YEMA. Ne swallow pas les erreurs runtime : logue
// dans la console + rend un état neutre (aucune donnée sensible affichée).
export class DashboardPageBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    console.error("[YEMA Dashboard]", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <DashboardErrorState
        title="Une erreur est survenue"
        description="Réessaie dans un instant. Si le problème persiste, contacte le support YEMA."
      />
    );
  }
}
