// Types miroir de ChildSessionActor + langues Json — copie minimale
// client-safe (aucune importation Prisma).

export interface ChildLangueRow {
  langue: string;
  type: "native" | "foreign";
  echelle: number;
  etoiles: number;
  motsAppris?: string[];
}

export interface ChildData {
  childProfileId: string;
  prenom: string;
  avatarAnimal: string;
  age: number;
  activeLangue: string | null;
  langues: ChildLangueRow[];
}
