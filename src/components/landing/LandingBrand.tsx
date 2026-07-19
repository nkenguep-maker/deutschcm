// LandingBrand · adapter du composant Confluent pour la nav et
// les headers landing. Réutilise BrandLockup horizontal, monté sur
// state="static" (les respirations sont réservées au Seuil).

import { BrandLockup } from "@/components/brand/BrandLockup";

export function LandingBrand({ size = 30 }: { size?: number }) {
  return (
    <BrandLockup
      orientation="horizontal"
      variant="world"
      state="static"
      size={size}
      ariaLabel="YEMA Languages"
    />
  );
}
