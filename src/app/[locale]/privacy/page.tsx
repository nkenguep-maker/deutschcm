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
const CONTACT_EMAIL = "privacy@yema.app";
const COMPANY = "YEMA Languages";

export default function PrivacyPage() {
  const locale = useLocale();
  return locale === "en" ? <PrivacyEN /> : <PrivacyFR />;
}

function PrivacyEN() {
  return (
    <LegalShell
      locale="en"
      eye="Legal"
      title="Privacy Policy"
      effective={EFFECTIVE_DATE_EN}
      updated={EFFECTIVE_DATE_EN}
      contactEmail={CONTACT_EMAIL}
      contactLine="Questions or requests? Reach us at"
    >
      <P>
        {COMPANY} (&quot;YEMA&quot;, &quot;we&quot;, &quot;us&quot;) is
        committed to protecting your personal data. This Privacy Policy
        explains what data we collect, how we use it, and your rights — in
        compliance with Cameroon Law No. 2024/017 on Personal Data Protection
        and GDPR best practices.
      </P>

      <Callout variant="info">
        <strong>Independence notice:</strong> {COMPANY} is an independent
        pan-African language learning platform, not affiliated with any state
        examination institute.
      </Callout>

      <H2>1. Data we collect</H2>
      <P>When you use YEMA, we may collect:</P>
      <Ul
        items={[
          "Account data: name, email address, chosen role (student, teacher, center manager)",
          "Learning data: lesson progress, quiz scores, XP points, streak, badge history",
          "Voice & audio data: audio recordings submitted during pronunciation exercises and simulator sessions — processed in real time and not stored permanently",
          "Usage data: pages visited, features used, session duration (via anonymized analytics)",
          "Payment data: Mobile Money transaction references — processed by MTN / Orange Money, not stored by YEMA",
          "Device data: browser type, operating system, approximate country (via IP, not stored)",
        ]}
      />

      <H2>2. How we use your data</H2>
      <Ul
        items={[
          "Provide and improve the learning platform",
          "Personalize your learning experience across languages (foreign and native)",
          "Process AI-powered voice analysis and writing correction",
          "Send account-related emails (confirmation, notifications) — with your consent",
          "Generate anonymous platform usage statistics",
          "Comply with legal obligations",
        ]}
      />

      <H2>3. AI and voice processing</H2>
      <P>
        AI features (voice recognition, scenario simulator, writing correction)
        process audio and text input using third-party AI APIs. Audio is
        transmitted securely via HTTPS and is not stored after processing. By
        using these features, you consent to this real-time processing.
      </P>

      <H2>4. Data sharing</H2>
      <P>We do not sell your personal data. We may share data with:</P>
      <Ul
        items={[
          "Supabase (database and authentication infrastructure, hosted in the EU)",
          "AI providers (AI features — data not used to train models)",
          "Vercel (hosting infrastructure)",
          "Your teacher or center manager (learning progress only, if you are enrolled in a class)",
        ]}
      />

      <H2>5. Data retention</H2>
      <Ul
        items={[
          "Account data: retained while your account is active",
          "Learning data: retained for 36 months after last activity",
          "Voice recordings: deleted immediately after processing (not stored)",
          "Deleted accounts: all personal data erased within 30 days of deletion request",
        ]}
      />

      <H2>6. Your rights</H2>
      <P>You have the right to:</P>
      <Ul
        items={[
          "Access your personal data",
          "Correct inaccurate data",
          "Delete your account and all associated data",
          "Withdraw consent for email notifications or analytics at any time",
          "Request a copy of your data (data portability)",
          "Lodge a complaint with Cameroon's personal data protection authority",
        ]}
      />
      <P>
        To exercise these rights, email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or use the
        &quot;Delete my account&quot; option in your account settings.
      </P>

      <H2>7. Cookies and analytics</H2>
      <P>
        YEMA uses minimal, privacy-respecting analytics (no cross-site
        tracking). We do not use advertising cookies. Session cookies are
        required for authentication. You can disable non-essential cookies in
        your browser.
      </P>

      <H2>8. Children</H2>
      <P>
        YEMA is not directed at children under 16. If you believe a child has
        provided us with personal data without parental consent, please contact
        us immediately.
      </P>

      <H2>9. Changes to this policy</H2>
      <P>
        We may update this policy. We will notify you by email for material
        changes. Continued use of YEMA after changes constitutes acceptance.
      </P>
    </LegalShell>
  );
}

function PrivacyFR() {
  return (
    <LegalShell
      locale="fr"
      eye="Mentions légales"
      title="Politique de confidentialité"
      effective={EFFECTIVE_DATE}
      updated={EFFECTIVE_DATE}
      contactEmail={CONTACT_EMAIL}
      contactLine="Questions ou demandes ? Contactez-nous à"
    >
      <P>
        {COMPANY} (&quot;YEMA&quot;, &quot;nous&quot;) s&apos;engage à protéger
        vos données personnelles. Cette politique explique les données
        collectées, leur utilisation et vos droits — conformément à la Loi
        camerounaise n°2024/017 sur la protection des données personnelles et
        aux bonnes pratiques RGPD.
      </P>

      <Callout variant="info">
        <strong>Notice d&apos;indépendance :</strong> {COMPANY} est une
        plateforme d&apos;apprentissage indépendante, non affiliée à aucun
        organisme officiel d&apos;examen.
      </Callout>

      <H2>1. Données collectées</H2>
      <Ul
        items={[
          "Données de compte : nom, email, rôle (élève, enseignant, responsable de centre)",
          "Données d'apprentissage : progression, scores, XP, streak, badges — pour les langues étrangères comme natales",
          "Données vocales : enregistrements audio traités en temps réel lors des exercices de prononciation et du simulateur — non stockés",
          "Données d'utilisation : pages visitées, fonctionnalités utilisées (analytics anonymisés)",
          "Données de paiement : références Mobile Money traitées par MTN/Orange, non stockées par YEMA",
        ]}
      />

      <H2>2. Utilisation des données</H2>
      <Ul
        items={[
          "Fournir et améliorer la plateforme",
          "Personnaliser votre apprentissage (langues étrangères ou natales)",
          "Traitement IA (voix, écriture) — avec votre consentement",
          "Envoi d'emails liés au compte (avec votre accord)",
          "Statistiques anonymes d'utilisation",
          "Respect des obligations légales",
        ]}
      />

      <H2>3. Traitement IA et voix</H2>
      <P>
        Les fonctionnalités IA (reconnaissance vocale, simulateur, correction
        écrite) utilisent des APIs IA tierces. L&apos;audio est transmis en
        HTTPS et non stocké après traitement. En utilisant ces fonctionnalités,
        vous consentez à ce traitement.
      </P>

      <H2>4. Partage des données</H2>
      <P>Nous ne vendons pas vos données. Nous les partageons avec :</P>
      <Ul
        items={[
          "Supabase (infrastructure base de données et authentification, hébergée en UE)",
          "Fournisseurs IA (fonctionnalités IA — données non utilisées pour l'entraînement)",
          "Vercel (infrastructure d'hébergement)",
          "Votre enseignant ou responsable de centre (progression uniquement, si inscrit en classe)",
        ]}
      />

      <H2>5. Conservation des données</H2>
      <Ul
        items={[
          "Données de compte : conservées tant que le compte est actif",
          "Données d'apprentissage : conservées 36 mois après dernière activité",
          "Enregistrements vocaux : supprimés immédiatement après traitement",
          "Comptes supprimés : toutes données effacées dans les 30 jours",
        ]}
      />

      <H2>6. Vos droits</H2>
      <Ul
        items={[
          "Accéder à vos données",
          "Corriger vos données",
          "Supprimer votre compte et toutes les données associées",
          "Retirer votre consentement aux emails ou analytics",
          "Demander une copie de vos données (portabilité)",
          "Déposer une réclamation auprès de l'autorité compétente au Cameroun",
        ]}
      />
      <P>
        Contactez-nous à{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ou utilisez
        l&apos;option &quot;Supprimer mon compte&quot; dans vos paramètres.
      </P>

      <H2>7. Cookies et analytics</H2>
      <P>
        YEMA utilise des analytics minimales, respectueuses de la vie privée
        (pas de tracking inter-sites). Pas de cookies publicitaires. Les
        cookies de session sont requis pour l&apos;authentification. Vous
        pouvez désactiver les cookies non essentiels dans votre navigateur.
      </P>

      <H2>8. Enfants</H2>
      <P>
        YEMA n&apos;est pas destiné aux enfants de moins de 16 ans. Si vous
        pensez qu&apos;un enfant nous a communiqué des données personnelles
        sans consentement parental, contactez-nous immédiatement.
      </P>

      <H2>9. Modifications</H2>
      <P>
        Nous pouvons mettre à jour cette politique. Pour les modifications
        importantes, vous serez notifié par email. La poursuite de
        l&apos;utilisation de YEMA vaut acceptation.
      </P>
    </LegalShell>
  );
}
