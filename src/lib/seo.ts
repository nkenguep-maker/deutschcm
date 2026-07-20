// SEO helper · construit les métadonnées d'une page à partir d'une
// clé + d'une locale. Chaque page appelle buildPageMetadata dans son
// layout.tsx pour poser son propre canonical, og:url, og:title,
// og:description, twitter:*, alternates hreflang.
//
// Le domaine canonique est piloté par NEXT_PUBLIC_SITE_URL (fallback
// deutschcm.vercel.app) — aucune URL en dur, migration future vers
// yema.app sans recode.

import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://deutschcm.vercel.app").replace(/\/$/, "");

/** Locale interface metadata — indexée par [locale][pageKey]. */
type LocaleKey = "fr" | "en";

interface PageMeta {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  ogImageAlt?: string;
}

type SiteMeta = Record<LocaleKey, Record<string, PageMeta>>;

// ── Dictionnaire des métas par page · voix éditoriale unique ──────
// L'allemand reste « premier chapitre », mais chaque page pose sa
// propre thèse (voir /langues, /methode…), jamais une répétition de
// l'accueil.
export const SITE_META: SiteMeta = {
  fr: {
    langues: {
      title: "Langues — YEMA",
      description: "Deux territoires, une seule maison. Les langues du monde sur l'échelle CECRL et les langues africaines sur l'échelle YEMA — voix, récits, palabres.",
      ogTitle: "Les langues de YEMA — du monde et africaines, côte à côte",
      twitterTitle: "Toutes les langues de la maison — YEMA",
      ogImageAlt: "YEMA — la carte des voix, du monde et africaines",
    },
    methode: {
      title: "La méthode — YEMA",
      description: "L'oral d'abord, l'écrit ensuite. Un prof au centre, des paliers concrets. Pas d'étoiles — des choses que vous saurez faire.",
      ogTitle: "La méthode YEMA — l'oral d'abord, le prof au centre",
      twitterTitle: "Comment YEMA enseigne — méthode",
      ogImageAlt: "YEMA — la méthode : oral d'abord, prof au centre",
    },
    pricing: {
      title: "Tarifs — YEMA",
      description: "Deux mondes, deux façons d'entrer. Les langues du monde pour le voyage, les langues africaines pour les racines. Choisissez d'abord l'univers.",
      ogTitle: "Les tarifs YEMA — deux mondes, deux portes",
      twitterTitle: "Tarifs YEMA · deux portes",
      ogImageAlt: "YEMA — tarifs, deux univers séparés",
    },
    pricingMonde: {
      title: "Langues du monde · Tarifs — YEMA",
      description: "Le Passage · un niveau complet, à votre rythme, en autonomie. Cinq niveaux du A1 au C1. Un professeur en option, en supplément.",
      ogTitle: "Les langues du monde — tarifs par niveau",
      twitterTitle: "Langues du monde · YEMA",
      ogImageAlt: "YEMA — langues du monde, Passage par niveau",
    },
    pricingRacines: {
      title: "Langues africaines · Tarifs — YEMA",
      description: "Habiter la langue, la transmettre. Solo pour une personne, Famille pour deux adultes et jusqu'à quatre enfants.",
      ogTitle: "Les langues africaines — Solo ou Famille",
      twitterTitle: "Langues africaines · YEMA",
      ogImageAlt: "YEMA — langues africaines, Solo ou Famille",
    },
    eleves: {
      title: "Pour les apprenants — YEMA",
      description: "Ce que YEMA change pour un élève : un cap, une échelle, un foyer. La preuve de compétence, pas la course aux points.",
      ogTitle: "YEMA pour les élèves — un cap, une échelle",
      twitterTitle: "YEMA pour les élèves",
      ogImageAlt: "YEMA — l'espace apprenant",
    },
    enseignants: {
      title: "Enseignants — YEMA",
      description: "Le prof au centre. Un rôle payé, valorisé, garanti par la maison. Rejoindre les enseignants YEMA — allemand, anglais, natales.",
      ogTitle: "Enseigner avec YEMA — le prof au centre",
      twitterTitle: "Rejoindre les enseignants YEMA",
      ogImageAlt: "YEMA — l'espace enseignant",
    },
    landing: {
      title: "Pour les centres — YEMA",
      description: "Une plateforme B2B pour vos apprenants et vos enseignants. Suivi, examens blancs, communauté. Démo gratuite.",
      ogTitle: "YEMA pour les centres — B2B, plateforme unique",
      twitterTitle: "YEMA · centres de langue",
      ogImageAlt: "YEMA — la plateforme pour les centres",
    },
    register: {
      title: "Créer mon compte — YEMA",
      description: "Ouvrez la porte. Aucune carte bancaire, aucun engagement. Commencez par le premier chapitre — l'allemand.",
      ogTitle: "S'inscrire à YEMA — commencez ce soir",
      twitterTitle: "S'inscrire · YEMA",
      ogImageAlt: "YEMA — ouvrir la porte, créer un compte",
    },
    onboardingMonde: {
      title: "Le voyage · Onboarding — YEMA",
      description: "Trois questions, une minute. La langue, le pourquoi, votre point de départ.",
      ogTitle: "Le voyage · Onboarding YEMA",
      twitterTitle: "Onboarding · Le voyage",
      ogImageAlt: "YEMA — onboarding, les langues du monde",
    },
    onboardingRacines: {
      title: "Les racines · Onboarding — YEMA",
      description: "Trois questions, une minute. Choisissez votre langue, dites votre lien, pour qui vous apprenez.",
      ogTitle: "Les racines · Onboarding YEMA",
      twitterTitle: "Onboarding · Les racines",
      ogImageAlt: "YEMA — onboarding, les langues africaines",
    },
    login: {
      title: "Se connecter — YEMA",
      description: "Retour au foyer. Reprendre la leçon là où vous l'avez laissée.",
      ogTitle: "Se connecter à YEMA",
      twitterTitle: "Connexion · YEMA",
      ogImageAlt: "YEMA — se connecter",
    },
    privacy: {
      title: "Confidentialité — YEMA",
      description: "Notre engagement sur vos données personnelles. Conforme à la loi camerounaise n°2024/017 et aux standards internationaux.",
      ogTitle: "Confidentialité — YEMA",
      twitterTitle: "Politique de confidentialité · YEMA",
      ogImageAlt: "YEMA — confidentialité et données",
    },
    terms: {
      title: "Conditions — YEMA",
      description: "Les conditions générales d'utilisation de YEMA Languages.",
      ogTitle: "Conditions d'utilisation — YEMA",
      twitterTitle: "CGU · YEMA",
      ogImageAlt: "YEMA — conditions d'utilisation",
    },
  },
  en: {
    langues: {
      title: "Languages — YEMA",
      description: "Two territories, one home. World languages on the CEFR scale, African languages on the YEMA scale — voice, story, palaver.",
      ogTitle: "YEMA languages — foreign and native, side by side",
      twitterTitle: "All the languages of the house — YEMA",
      ogImageAlt: "YEMA — the map of voices, foreign and native",
    },
    methode: {
      title: "The method — YEMA",
      description: "Voice first, writing next. A teacher at the center, real skills at each stage. Not stars — things you'll actually do.",
      ogTitle: "The YEMA method — voice first, teacher at the center",
      twitterTitle: "How YEMA teaches — the method",
      ogImageAlt: "YEMA — the method: voice first, teacher at center",
    },
    pricing: {
      title: "Pricing — YEMA",
      description: "Two worlds, two ways in. World languages for the journey, African languages for the roots. Pick the universe first.",
      ogTitle: "YEMA pricing — two worlds, two doors",
      twitterTitle: "YEMA pricing · two doors",
      ogImageAlt: "YEMA — pricing, two separate universes",
    },
    pricingMonde: {
      title: "World languages · Pricing — YEMA",
      description: "The Passage · one full level, on your own, at your own pace. Five levels A1 to C1. A teacher as an optional add-on.",
      ogTitle: "World languages — pricing by level",
      twitterTitle: "World languages · YEMA",
      ogImageAlt: "YEMA — world languages, Passage per level",
    },
    pricingRacines: {
      title: "African languages · Pricing — YEMA",
      description: "Live in the language, pass it on. Solo for one person, Family for two adults and up to four children.",
      ogTitle: "African languages — Solo or Family",
      twitterTitle: "African languages · YEMA",
      ogImageAlt: "YEMA — African languages, Solo or Family",
    },
    eleves: {
      title: "For learners — YEMA",
      description: "What YEMA changes for a learner: a cap, a scale, a home. Proof of skill, not the points race.",
      ogTitle: "YEMA for learners — a cap, a scale",
      twitterTitle: "YEMA for learners",
      ogImageAlt: "YEMA — the learner space",
    },
    enseignants: {
      title: "Teachers — YEMA",
      description: "The teacher at the center. A paid, valued role backed by the house. Join YEMA teachers — German, English, African languages.",
      ogTitle: "Teach with YEMA — the teacher at the center",
      twitterTitle: "Join YEMA teachers",
      ogImageAlt: "YEMA — the teacher space",
    },
    landing: {
      title: "For language centers — YEMA",
      description: "A B2B platform for your learners and your teachers. Tracking, mock exams, community. Free demo.",
      ogTitle: "YEMA for centers — B2B, single platform",
      twitterTitle: "YEMA · language centers",
      ogImageAlt: "YEMA — the platform for language centers",
    },
    register: {
      title: "Create my account — YEMA",
      description: "Open the door. No credit card, no commitment. Start with the first chapter — German.",
      ogTitle: "Sign up to YEMA — start tonight",
      twitterTitle: "Sign up · YEMA",
      ogImageAlt: "YEMA — open the door, create an account",
    },
    onboardingMonde: {
      title: "The journey · Onboarding — YEMA",
      description: "Three questions, one minute. Your language, your why, your starting point.",
      ogTitle: "The journey · YEMA onboarding",
      twitterTitle: "Onboarding · The journey",
      ogImageAlt: "YEMA — onboarding, world languages",
    },
    onboardingRacines: {
      title: "The roots · Onboarding — YEMA",
      description: "Three questions, one minute. Pick your language, name your bond, tell us for whom.",
      ogTitle: "The roots · YEMA onboarding",
      twitterTitle: "Onboarding · The roots",
      ogImageAlt: "YEMA — onboarding, African languages",
    },
    login: {
      title: "Sign in — YEMA",
      description: "Back home. Resume the lesson where you left it.",
      ogTitle: "Sign in to YEMA",
      twitterTitle: "Sign in · YEMA",
      ogImageAlt: "YEMA — sign in",
    },
    privacy: {
      title: "Privacy — YEMA",
      description: "Our commitment on your personal data. Compliant with Cameroon Law No. 2024/017 and international standards.",
      ogTitle: "Privacy — YEMA",
      twitterTitle: "Privacy policy · YEMA",
      ogImageAlt: "YEMA — privacy and data",
    },
    terms: {
      title: "Terms — YEMA",
      description: "Terms of use for YEMA Languages.",
      ogTitle: "Terms of use — YEMA",
      twitterTitle: "Terms · YEMA",
      ogImageAlt: "YEMA — terms of use",
    },
  },
};

/** Construit l'objet Metadata pour une page donnée. Le canonical
 *  pointe vers l'URL locale exacte (jamais la racine), et hreflang
 *  croise fr/en du même chemin. */
export function buildPageMetadata({
  locale,
  pageKey,
  path,
}: {
  locale: string;
  pageKey: string;
  /** Chemin après le segment locale, ex. "/langues", "/pricing/famille". */
  path: string;
}): Metadata {
  const key: LocaleKey = locale === "en" ? "en" : "fr";
  const meta = SITE_META[key][pageKey];
  if (!meta) {
    // Sécurité : si la clé n'est pas définie, on ne casse pas la page.
    // Retourne une métadonnée minimale plutôt qu'une exception au build.
    return { title: "YEMA", robots: { index: true, follow: true } };
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${SITE_URL}/${key}${cleanPath === "/" ? "" : cleanPath}`;
  const otherLocale: LocaleKey = key === "fr" ? "en" : "fr";
  const otherUrl = `${SITE_URL}/${otherLocale}${cleanPath === "/" ? "" : cleanPath}`;
  const ogImage = `/${key}/opengraph-image`;

  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    openGraph: {
      type: "website",
      locale: key === "fr" ? "fr_FR" : "en_US",
      alternateLocale: [otherLocale === "fr" ? "fr_FR" : "en_US"],
      url,
      siteName: "Yema",
      title: meta.ogTitle ?? meta.title,
      description: meta.ogDescription ?? meta.description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: meta.ogImageAlt ?? meta.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.twitterTitle ?? meta.title,
      description: meta.twitterDescription ?? meta.description,
      images: [ogImage],
      creator: "@yema",
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: url,
      languages: {
        [key]: url,
        [otherLocale]: otherUrl,
        "x-default": key === "fr" ? url : otherUrl,
      },
    },
  };
}
