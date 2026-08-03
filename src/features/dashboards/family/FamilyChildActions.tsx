"use client";

// FamilyChildActions · petit composant client rendu à l'intérieur du
// FamilyDashboard SSR pour restaurer la parité fonctionnelle de l'ancien
// /famille sur la route canonique /family ·
//   - bouton "Ouvrir son espace" par carte enfant → ChildPinDialog
//   - bouton "Ajouter un enfant" (footer + empty state) → AddChildDialog
// Aucune nouvelle logique métier · réutilise les composants canoniques.

import { useState } from "react";
import { ChildPinDialog } from "@/components/famille/ChildPinDialog";
import { AddChildDialog, type AddChildDialogCopy } from "@/components/famille/AddChildDialog";
import type { AvatarAnimal } from "@/components/famille/AnimalAvatar";

export type FamilyChildActionsCopy = {
  openChildSpace: string;
  addChild: string;
  childPinTitle: string;
  childPinLabel: string;
  childPinPlaceholder: string;
  childPinSubmit: string;
  childPinCancel: string;
  childPinErrGeneric: string;
  addDialog: AddChildDialogCopy;
};

type OpenableChild = {
  id: string;
  prenom: string;
  avatarAnimal: AvatarAnimal;
};

type Props = {
  locale: "fr" | "en";
  copy: FamilyChildActionsCopy;
  canAddChild: boolean;
  child?: OpenableChild;
  slot?: "child" | "add";
};

// Slot "child" · rend le bouton "Ouvrir son espace" pour un enfant donné.
// Slot "add"   · rend le bouton "Ajouter un enfant" (footer/empty).
export function FamilyChildActions({ locale, copy, canAddChild, child, slot }: Props) {
  const [pinChild, setPinChild] = useState<OpenableChild | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const openBtnStyle: React.CSSProperties = {
    minHeight: 44,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 600,
    borderRadius: "var(--yema-r-pill)",
    border: "1px solid var(--yema-gold-edge)",
    background: "var(--yema-gold-glow)",
    color: "var(--yema-gold-light)",
    fontFamily: "inherit",
    cursor: "pointer",
  };

  return (
    <>
      {slot === "child" && child ? (
        <button
          type="button"
          onClick={() => setPinChild(child)}
          data-testid="family-child-open-space"
          data-child-id={child.id}
          aria-label={`${copy.openChildSpace} · ${child.prenom}`}
          style={openBtnStyle}
        >
          {copy.openChildSpace}
        </button>
      ) : null}

      {slot === "add" && canAddChild ? (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          data-testid="family-add-child-open"
          aria-label={copy.addChild}
          style={{ ...openBtnStyle, background: "transparent" }}
        >
          + {copy.addChild}
        </button>
      ) : null}

      {pinChild ? (
        <ChildPinDialog
          child={pinChild}
          locale={locale}
          copy={{
            title: copy.childPinTitle,
            pinLbl: copy.childPinLabel,
            pinPlaceholder: copy.childPinPlaceholder,
            submit: copy.childPinSubmit,
            cancel: copy.childPinCancel,
            errGeneric: copy.childPinErrGeneric,
          }}
          onClose={() => setPinChild(null)}
        />
      ) : null}

      {showAdd ? (
        <AddChildDialog
          loc={locale}
          copy={copy.addDialog}
          onCancel={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            // Le FamilyDashboard re-fetch via /api/family/dashboard lors du
            // prochain mount ou navigation · un reload complet garantit la
            // synchronisation seat + universe + hasPin.
            if (typeof window !== "undefined") window.location.reload();
          }}
        />
      ) : null}
    </>
  );
}
