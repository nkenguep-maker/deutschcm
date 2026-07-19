"use client";

import { useLocale } from "next-intl";
import {
  Callout,
  H2,
  LegalShell,
  P,
  Ul,
} from "@/components/landing/LegalShell";

const EFFECTIVE_DATE = "15 mai 2026";
const EFFECTIVE_DATE_EN = "May 15, 2026";
const CONTACT_EMAIL = "legal@yema.app";
const COMPANY = "YEMA Languages";

export default function TermsPage() {
  const locale = useLocale();
  return locale === "en" ? <TermsEN /> : <TermsFR />;
}

function TermsEN() {
  return (
    <LegalShell
      locale="en"
      eye="Legal"
      title="Terms of Service"
      effective={EFFECTIVE_DATE_EN}
      updated={EFFECTIVE_DATE_EN}
      contactEmail={CONTACT_EMAIL}
      contactLine="Questions? Reach us at"
    >
      <P>
        By accessing or using {COMPANY} (&quot;YEMA&quot;, &quot;the
        platform&quot;), you agree to these Terms of Service. Please read them
        carefully. If you do not agree, do not use the platform.
      </P>

      <Callout variant="warning">
        <strong>Important:</strong> {COMPANY} is an independent pan-African
        language learning platform. It is not affiliated with, endorsed by, or
        officially connected to any state examination institute. Completing
        YEMA courses does not grant any official diploma or certification.
      </Callout>

      <H2>1. Acceptance and eligibility</H2>
      <P>
        You must be at least 16 years old to use YEMA. By creating an account,
        you confirm you meet this requirement and that the information you
        provide is accurate.
      </P>

      <H2>2. Account</H2>
      <Ul
        items={[
          "You are responsible for maintaining the confidentiality of your account credentials.",
          "You may not share your account or allow others to access it.",
          `Notify us immediately at ${CONTACT_EMAIL} if you suspect unauthorized access.`,
          "One account per person. Multiple accounts may be suspended.",
        ]}
      />

      <H2>3. Free and paid plans</H2>
      <P>
        YEMA offers a free plan with access to A1 content of the current
        chapter (German), and premium plans with expanded access. Paid
        subscriptions are processed via Mobile Money (MTN MoMo / Orange Money).
        Prices are displayed in XAF.
      </P>
      <Ul
        items={[
          "Subscriptions renew monthly unless cancelled.",
          "No refunds after 48 hours of a billing period starting, except where required by law.",
          "YEMA reserves the right to change pricing with 30 days notice.",
        ]}
      />

      <H2>4. Acceptable use</H2>
      <P>You agree not to:</P>
      <Ul
        items={[
          "Use the platform for any unlawful purpose",
          "Attempt to reverse-engineer, scrape, or copy platform content at scale",
          "Share class access codes publicly or sell access to others",
          "Upload content that is illegal, harmful, or infringes third-party rights",
          "Impersonate teachers, centers, or platform staff",
        ]}
      />

      <H2>5. AI features and content</H2>
      <P>
        YEMA uses AI to generate learning content, correct writing, and
        simulate scenarios. AI-generated content may contain errors. YEMA does
        not guarantee the accuracy or completeness of AI outputs. Do not rely
        solely on YEMA for official exam preparation without consulting
        licensed educators.
      </P>

      <H2>6. World languages and no certification guarantee</H2>
      <P>
        YEMA prepares learners for CEFR-aligned world languages (A1–C1).
        Official exams are issued by independent bodies. YEMA is not
        affiliated with any of these organizations.
      </P>

      <H2>7. African languages and independent scale</H2>
      <P>
        For African languages, YEMA uses its own progression scale
        (É1 Listen · É2 Voice · É3 Story · É4 Palaver · É5 Home). This scale
        is proprietary and does not constitute an official standard.
      </P>

      <H2>8. User content</H2>
      <P>
        When you submit content (text responses, audio recordings) through
        YEMA features, you grant YEMA a limited, non-exclusive license to
        process this content for the purpose of providing the service. Audio
        is not stored after processing. You retain ownership of your content.
      </P>

      <H2>9. Availability and modifications</H2>
      <Ul
        items={[
          "YEMA is provided 'as is' during beta. We aim for 99% uptime but make no guarantees.",
          "We may modify, suspend, or discontinue features with reasonable notice.",
          "YEMA is currently in public beta — some features may be incomplete.",
        ]}
      />

      <H2>10. Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, {COMPANY} shall not be liable
        for indirect, incidental, or consequential damages arising from your
        use of the platform, including but not limited to failed visa
        applications or exam results. Your use of YEMA is at your own risk.
      </P>

      <H2>11. Governing law</H2>
      <P>
        These Terms are governed by the laws of Cameroon. Disputes shall be
        resolved in the courts of Yaoundé, Cameroon, unless applicable law
        requires otherwise.
      </P>

      <H2>12. Account deletion</H2>
      <P>
        You may delete your account at any time from your settings. Upon
        deletion, your personal data will be erased within 30 days as
        described in our Privacy Policy.
      </P>

      <H2>13. Changes to these Terms</H2>
      <P>
        We may update these Terms. Material changes will be communicated by
        email or in-app notification at least 14 days before they take effect.
        Continued use constitutes acceptance.
      </P>
    </LegalShell>
  );
}

function TermsFR() {
  return (
    <LegalShell
      locale="fr"
      eye="Mentions légales"
      title="Conditions d'utilisation"
      effective={EFFECTIVE_DATE}
      updated={EFFECTIVE_DATE}
      contactEmail={CONTACT_EMAIL}
      contactLine="Questions ? Contactez-nous à"
    >
      <P>
        En accédant à {COMPANY} (&quot;YEMA&quot;, &quot;la plateforme&quot;),
        vous acceptez les présentes Conditions d&apos;utilisation. Si vous
        n&apos;êtes pas d&apos;accord, n&apos;utilisez pas la plateforme.
      </P>

      <Callout variant="warning">
        <strong>Important :</strong> {COMPANY} est une plateforme pan-africaine
        indépendante d&apos;apprentissage des langues. Elle n&apos;est
        affiliée à aucun organisme officiel d&apos;examen. Compléter les cours
        YEMA ne confère aucun diplôme officiel.
      </Callout>

      <H2>1. Acceptation et éligibilité</H2>
      <P>
        Vous devez avoir au moins 16 ans pour utiliser YEMA. En créant un
        compte, vous confirmez remplir cette condition et que les informations
        fournies sont exactes.
      </P>

      <H2>2. Compte</H2>
      <Ul
        items={[
          "Vous êtes responsable de la confidentialité de vos identifiants.",
          "Vous ne pouvez pas partager votre compte.",
          `Signalez toute utilisation non autorisée à ${CONTACT_EMAIL}.`,
          "Un seul compte par personne. Les comptes multiples peuvent être suspendus.",
        ]}
      />

      <H2>3. Plans gratuit et payants</H2>
      <P>
        YEMA propose un plan gratuit (A1 du chapitre en cours — l&apos;allemand)
        et des plans premium. Les abonnements sont traités via Mobile Money
        (MTN MoMo / Orange Money). Les prix sont en XAF.
      </P>
      <Ul
        items={[
          "Les abonnements se renouvellent mensuellement sauf résiliation.",
          "Pas de remboursement après 48 h du début d'une période, sauf obligation légale.",
          "YEMA se réserve le droit de modifier les tarifs avec 30 jours de préavis.",
        ]}
      />

      <H2>4. Utilisation acceptable</H2>
      <Ul
        items={[
          "Ne pas utiliser la plateforme à des fins illégales.",
          "Ne pas copier ou extraire le contenu de la plateforme à grande échelle.",
          "Ne pas partager publiquement les codes de classe ou les revendre.",
          "Ne pas télécharger de contenu illégal ou portant atteinte aux droits tiers.",
        ]}
      />

      <H2>5. Fonctionnalités IA</H2>
      <P>
        YEMA utilise des APIs IA pour générer du contenu, corriger les écrits
        et simuler des scénarios. Les contenus générés par IA peuvent contenir
        des erreurs. YEMA ne garantit pas leur exactitude.
      </P>

      <H2>6. Langues du monde et absence de garantie de certification</H2>
      <P>
        YEMA prépare aux langues du monde alignées CECRL (A1–C1). Les
        examens officiels sont délivrés par des organismes indépendants. YEMA
        n&apos;est affilié à aucun de ces organismes.
      </P>

      <H2>7. Langues africaines et échelle propre</H2>
      <P>
        Pour les langues africaines, YEMA utilise sa propre échelle de
        progression (É1 Écoute · É2 Voix · É3 Récit · É4 Palabre · É5 Foyer).
        Cette échelle est propriétaire et ne constitue pas un standard
        officiel.
      </P>

      <H2>8. Suppression de compte</H2>
      <P>
        Vous pouvez supprimer votre compte à tout moment depuis vos paramètres.
        Vos données personnelles seront effacées dans les 30 jours suivant la
        suppression, conformément à notre Politique de confidentialité.
      </P>

      <H2>9. Droit applicable</H2>
      <P>
        Les présentes Conditions sont régies par le droit camerounais. Les
        litiges seront portés devant les tribunaux compétents de Yaoundé,
        Cameroun.
      </P>

      <H2>10. Modifications</H2>
      <P>
        Nous pouvons modifier ces Conditions. Les modifications importantes
        seront communiquées 14 jours à l&apos;avance. La poursuite de
        l&apos;utilisation vaut acceptation.
      </P>
    </LegalShell>
  );
}
