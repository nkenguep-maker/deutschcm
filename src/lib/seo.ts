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
      description: "Deux territoires, une seule maison. Les langues étrangères sur l'échelle CECRL et les langues natales africaines sur l'échelle YEMA — voix, récits, palabres.",
      ogTitle: "Les langues de YEMA — étrangères et natales, côte à côte",
      twitterTitle: "Toutes les langues de la maison — YEMA",
      ogImageAlt: "YEMA — la carte des voix, étrangères et natales",
    },
    methode: {
      title: "La méthode — YEMA",
      description: "L'oral d'abord, l'écrit ensuite. Un prof au centre, des paliers concrets. Pas d'étoiles — des choses que vous saurez faire.",
      ogTitle: "La méthode YEMA — l'oral d'abord, le prof au centre",
      twitterTitle: "Comment YEMA enseigne — méthode",
      ogImageAlt: "YEMA — la méthode : oral d'abord, prof au centre",
    },
    histoires: {
      title: "Histoires — YEMA",
      description: "Cinq voix, cinq parcours réels. De Yaoundé à Berlin, d'Abidjan à Toronto, de Paris au foyer. Chaque récit s'écoute dans sa langue.",
      ogTitle: "Les histoires de YEMA — cinq voix, cinq parcours",
      twitterTitle: "Cinq histoires vraies — YEMA",
      ogImageAlt: "YEMA — les histoires, cinq voix côte à côte",
    },
    pricing: {
      title: "Tarifs — YEMA",
      description: "L'entrée, la Braise, le Passage, la Grande Maison, la Famille. Un prix simple pour un but précis. Mobile Money ou carte, 14 jours sans risque.",
      ogTitle: "Les tarifs YEMA — un prix simple, un but précis",
      twitterTitle: "Tarifs YEMA · un prix par cap",
      ogImageAlt: "YEMA — tarifs, un prix par cap",
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
      description: "Two territories, one home. Foreign languages on the CEFR scale, African native languages on the YEMA scale — voice, story, palaver.",
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
    histoires: {
      title: "Stories — YEMA",
      description: "Five voices, five real journeys. From Yaoundé to Berlin, Abidjan to Toronto, Paris to home. Each story is listened to in its own language.",
      ogTitle: "YEMA stories — five voices, five journeys",
      twitterTitle: "Five true stories — YEMA",
      ogImageAlt: "YEMA — the stories, five voices side by side",
    },
    pricing: {
      title: "Pricing — YEMA",
      description: "The Entrance, the Ember, the Passage, the Great House, the Family. One simple price for one precise goal. Mobile Money or card, 14 days risk-free.",
      ogTitle: "YEMA pricing — one simple price, one precise goal",
      twitterTitle: "YEMA pricing · one price per cap",
      ogImageAlt: "YEMA — pricing, one price per cap",
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
      description: "The teacher at the center. A paid, valued role backed by the house. Join YEMA teachers — German, English, native languages.",
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
