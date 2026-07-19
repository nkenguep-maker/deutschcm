-- Espace Famille · profils enfants sous compte parent.
-- Aucune PII sensible : prénom court + âge + animal + langue + progrès YEMA.
-- Sécurité : la table est écrite/lue uniquement via un backend authentifié
-- (les routes /api/family/children valident parentUserId côté serveur).
-- Row Level Security : à activer via policy dédiée après la migration.

create table "child_profiles" (
  "id"            text primary key,
  "parentUserId"  text not null references "users"("id") on delete cascade,
  "prenom"        text not null,
  "avatarAnimal"  text not null,
  "age"           integer not null,
  "langue"        text not null,
  "echelleYema"   text not null default 'E1',
  "etoiles"       integer not null default 0,
  "motsAppris"    text[] not null default '{}',
  "createdAt"     timestamp(3) not null default now(),
  "updatedAt"     timestamp(3) not null
);

create index "child_profiles_parentUserId_idx" on "child_profiles"("parentUserId");

-- RLS (activée dans une policy séparée si besoin). Par défaut, les routes
-- backend passent par prisma avec un userId dérivé de auth.getUser() —
-- aucune requête directe depuis le client.
alter table "child_profiles" enable row level security;

-- Policy service_role only (la porte reste fermée au client web).
create policy "child_profiles_service_only"
  on "child_profiles"
  for all
  using (auth.role() = 'service_role');
