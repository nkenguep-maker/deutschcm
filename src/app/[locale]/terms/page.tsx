"use client";

import { useLocale } from "next-intl";
import { Callout, H2, LegalShell, P, Ul } from "@/components/landing/LegalShell";

const EFFECTIVE_DATE = "14 août 2026";
const EFFECTIVE_DATE_EN = "August 14, 2026";
const CONTACT_EMAIL = "legal@yema.app";
const COMPANY = "YEMA Languages";

export default function TermsPage() {
  const locale = useLocale();
  return locale === "en" ? <TermsEN /> : <TermsFR />;
}

function TermsEN() {
  return (
    <LegalShell locale="en" eye="Legal" title="Terms of Service" effective={EFFECTIVE_DATE_EN} updated={EFFECTIVE_DATE_EN} contactEmail={CONTACT_EMAIL} contactLine="Questions? Reach us at">
      <P>By accessing or using {COMPANY} (&quot;YEMA&quot;, &quot;the platform&quot;), you agree to these Terms. YEMA is currently operated as an open beta and some features may change before broader release.</P>
      <Callout variant="warning"><strong>Independent platform:</strong> YEMA is not an official examination body and is not affiliated with any state examination institute. YEMA learning journeys, scores or completion records do not themselves constitute an official diploma or exam result.</Callout>

      <H2>1. Adult accounts and family profiles</H2>
      <P>An authenticated YEMA account must be created and controlled by a person who is legally able to enter into these Terms. A parent or guardian may create and manage child profiles under their adult account through the Family experience. Child profiles do not receive independent email/password accounts through that flow.</P>
      <P>The adult account holder is responsible for the accuracy of information supplied for child profiles, for supervising their use of YEMA and for using available parent and PIN controls appropriately.</P>

      <H2>2. Open-beta access</H2>
      <Ul items={[
        "Anyone eligible to use YEMA may create an account through the public registration flow.",
        "Some access paths may still use a personal, time-limited invitation when that is required for the relevant feature or workspace.",
        "Access may be revoked or restricted when required for security, abuse prevention or beta operations.",
        "Professional workspaces such as Teacher, Center or Roots Coach require the trusted approval or role assignment defined by YEMA; selecting a persona does not grant professional access by itself.",
      ]} />

      <H2>3. Account security</H2>
      <Ul items={[
        "Keep adult account credentials confidential and do not knowingly provide them to unauthorized people.",
        "Use child-space PINs and family controls only for the child profiles you are authorized to manage.",
        `Contact ${CONTACT_EMAIL} if you believe an account or protected space has been compromised.`,
        "Do not impersonate another learner, parent, teacher, coach, center representative or YEMA administrator.",
      ]} />

      <H2>4. Offers and payments</H2>
      <P>YEMA may display prices and commercial offers so users can understand the intended product. Online checkout and real payment processing are not currently activated in the open beta. Selecting an offer, plan or add-on records interest or onboarding context only and does not create a paid subscription, payment, order or access entitlement.</P>
      <P>Before real payments are enabled, YEMA will present the applicable payment provider, billing period, renewal, cancellation, refund and transaction terms before a user is charged. Current beta pages must not be interpreted as a completed payment contract.</P>

      <H2>5. Acceptable use</H2>
      <P>You agree not to:</P>
      <Ul items={[
        "Use YEMA for unlawful, abusive or fraudulent activity.",
        "Attempt to bypass authentication, workspace roles, child protections, class approvals or other access controls.",
        "Scrape, extract or reproduce platform content at scale without authorization.",
        "Share private class, group or invitation codes publicly where doing so would defeat their intended access control.",
        "Upload or send content that is unlawful, harmful, threatening, exploitative or infringes third-party rights.",
        "Use messaging or social features to harass, spam or mislead other users.",
      ]} />

      <H2>6. Learning, AI and examination status</H2>
      <P>YEMA may provide structured learning, exercises, feedback, simulations and AI-assisted features. AI-generated or automated feedback can contain errors and should not be treated as an official examination decision or professional guarantee. World-language journeys may be aligned to learning frameworks such as CEFR, but official exams and certifications remain the responsibility of independent examination bodies.</P>
      <P>For African languages, YEMA may use its own progression and product terminology. Those internal scales are learning tools and are not represented as official national or international standards.</P>

      <H2>7. Teachers, coaches, centers and sessions</H2>
      <P>Professional spaces are provided only to users with the required trusted role or approval. Classroom enrollments, coaching circles, family links and session records are scoped to the relevant authorized participants. A center workspace does not automatically override a teacher’s approval responsibilities where the product requires teacher approval.</P>

      <H2>8. User content, messages and audio</H2>
      <P>You retain rights you hold in content you submit. You grant YEMA the limited rights necessary to receive, process, store, display and transmit that content for the operation, security and delivery of the feature you chose. Some audio may be processed transiently; messaging or other user-submitted audio may be stored when the feature requires it. Do not submit content you are not entitled to use.</P>

      <H2>9. Beta availability</H2>
      <P>Open-beta software may contain incomplete features, defects or temporary interruptions. YEMA does not promise a numerical uptime or service-level commitment in these Terms. Features may be modified, limited or withdrawn as the product is tested and improved.</P>

      <H2>10. Privacy</H2>
      <P>Use of YEMA is also subject to the published Privacy Policy, including the rules applicable to family profiles, messaging and open-beta operation.</P>

      <H2>11. Account and data requests</H2>
      <P>You may contact <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> for account-related requests. Privacy and deletion requests may require identity verification and are handled according to the Privacy Policy and applicable law. These Terms do not promise an account-settings deletion control or a fixed deletion deadline unless such a control or deadline is actually provided.</P>

      <H2>12. Liability and applicable law</H2>
      <P>To the extent permitted by applicable law, YEMA is not responsible for outcomes that depend on third parties, including official examination results, visa decisions, employment decisions or the conduct of independent users. Nothing in these Terms excludes rights or liabilities that cannot legally be excluded.</P>
      <P>These Terms are governed subject to the laws applicable to YEMA and to the user. Mandatory consumer, child-protection, privacy or other statutory rights continue to apply where relevant.</P>

      <H2>13. Changes</H2>
      <P>We may update these Terms as the open beta and commercial product evolve. Material changes will be reflected in the published Terms and, where appropriate, communicated through the service or by email before they apply.</P>
    </LegalShell>
  );
}

function TermsFR() {
  return (
    <LegalShell locale="fr" eye="Mentions légales" title="Conditions d'utilisation" effective={EFFECTIVE_DATE} updated={EFFECTIVE_DATE} contactEmail={CONTACT_EMAIL} contactLine="Questions ? Contactez-nous à">
      <P>En accédant à {COMPANY} (&quot;YEMA&quot;, &quot;la plateforme&quot;), vous acceptez les présentes Conditions. YEMA fonctionne actuellement en bêta ouverte et certaines fonctionnalités peuvent évoluer avant une ouverture plus large.</P>
      <Callout variant="warning"><strong>Plateforme indépendante :</strong> YEMA n’est pas un organisme officiel d’examen et n’est affilié à aucun institut d’examen étatique. Les parcours, scores ou attestations internes YEMA ne constituent pas à eux seuls un diplôme officiel ni un résultat d’examen officiel.</Callout>

      <H2>1. Comptes adultes et profils famille</H2>
      <P>Un compte YEMA authentifié doit être créé et contrôlé par une personne juridiquement capable d’accepter les présentes Conditions. Un parent ou tuteur peut créer et gérer des profils enfants sous son compte adulte dans l’expérience Famille. Le parcours Famille ne crée pas de compte e-mail/mot de passe indépendant pour l’enfant.</P>
      <P>Le titulaire adulte est responsable de l’exactitude des informations fournies pour les profils enfants, de la supervision de leur usage de YEMA et de l’utilisation appropriée des contrôles parentaux et PIN disponibles.</P>

      <H2>2. Accès à la bêta ouverte</H2>
      <Ul items={[
        "Toute personne éligible à YEMA peut créer un compte via le parcours d’inscription publique.",
        "Certains parcours peuvent toujours utiliser une invitation personnelle et limitée dans le temps lorsqu’elle est requise pour la fonctionnalité ou l’espace concerné.",
        "L’accès peut être révoqué ou limité lorsque la sécurité, la prévention des abus ou les opérations de bêta le nécessitent.",
        "Les espaces professionnels Enseignant, Centre ou Coach Racines exigent l’approbation ou le rôle de confiance prévu par YEMA ; choisir un persona ne suffit pas à s’accorder cet accès.",
      ]} />

      <H2>3. Sécurité du compte</H2>
      <Ul items={[
        "Gardez les identifiants du compte adulte confidentiels et ne les communiquez pas à des personnes non autorisées.",
        "Utilisez les PIN et contrôles famille uniquement pour les profils enfants que vous êtes autorisé à gérer.",
        `Contactez ${CONTACT_EMAIL} si vous pensez qu’un compte ou un espace protégé a été compromis.`,
        "N’usurpez pas l’identité d’un élève, parent, enseignant, coach, représentant de centre ou administrateur YEMA.",
      ]} />

      <H2>4. Offres et paiements</H2>
      <P>YEMA peut afficher des prix et offres commerciales afin de présenter le produit prévu. Le checkout en ligne et le paiement réel ne sont pas encore activés dans la bêta ouverte. Choisir une offre, un plan ou un add-on enregistre uniquement une intention commerciale ou un contexte d’onboarding ; cela ne crée ni abonnement payant, ni paiement, ni commande, ni droit d’accès.</P>
      <P>Avant d’activer les paiements réels, YEMA présentera le prestataire de paiement applicable ainsi que les conditions de facturation, renouvellement, résiliation, remboursement et transaction avant tout débit. Les pages actuelles de bêta ne doivent pas être interprétées comme un contrat de paiement finalisé.</P>

      <H2>5. Utilisation acceptable</H2>
      <P>Vous vous engagez notamment à ne pas :</P>
      <Ul items={[
        "Utiliser YEMA pour une activité illégale, abusive ou frauduleuse.",
        "Contourner l’authentification, les rôles d’espace, protections enfant, approbations de classe ou autres contrôles d’accès.",
        "Extraire ou reproduire massivement le contenu de la plateforme sans autorisation.",
        "Partager publiquement des codes privés de classe, groupe ou invitation lorsqu’un tel partage neutralise le contrôle d’accès prévu.",
        "Envoyer un contenu illégal, nuisible, menaçant, exploitant ou portant atteinte aux droits de tiers.",
        "Utiliser la messagerie ou les fonctions sociales pour harceler, spammer ou tromper d’autres utilisateurs.",
      ]} />

      <H2>6. Apprentissage, IA et statut des examens</H2>
      <P>YEMA peut proposer des parcours structurés, exercices, retours, simulations et fonctions assistées par IA. Les contenus ou retours automatisés peuvent comporter des erreurs et ne constituent pas une décision officielle d’examen ni une garantie professionnelle. Les parcours de langues du monde peuvent être alignés sur des cadres tels que le CECRL, mais les examens et certifications officiels relèvent d’organismes indépendants.</P>
      <P>Pour les langues africaines, YEMA peut utiliser ses propres échelles et termes de progression. Ces échelles internes sont des outils pédagogiques et ne sont pas présentées comme des standards officiels nationaux ou internationaux.</P>

      <H2>7. Enseignants, coachs, centres et séances</H2>
      <P>Les espaces professionnels sont accessibles uniquement aux utilisateurs disposant du rôle ou de l’approbation de confiance requis. Les inscriptions de classe, cercles de coaching, liens famille et séances sont limités aux participants autorisés. L’espace Centre ne remplace pas automatiquement la responsabilité d’approbation de l’enseignant lorsqu’elle est exigée par le produit.</P>

      <H2>8. Contenus utilisateur, messages et audio</H2>
      <P>Vous conservez les droits que vous détenez sur les contenus envoyés. Vous accordez à YEMA les droits limités nécessaires pour recevoir, traiter, stocker, afficher et transmettre ces contenus afin de fournir et sécuriser la fonctionnalité choisie. Certains audios peuvent être traités de manière transitoire ; les audios de messagerie ou autres contenus utilisateur peuvent être stockés lorsque la fonctionnalité le nécessite. N’envoyez pas de contenu que vous n’êtes pas autorisé à utiliser.</P>

      <H2>9. Disponibilité de la bêta</H2>
      <P>Un logiciel en bêta ouverte peut contenir des fonctionnalités incomplètes, des défauts ou des interruptions temporaires. YEMA ne promet aucun taux de disponibilité chiffré ni SLA dans les présentes Conditions. Des fonctionnalités peuvent être modifiées, limitées ou retirées pendant les tests et l’amélioration du produit.</P>

      <H2>10. Confidentialité</H2>
      <P>L’utilisation de YEMA est également soumise à la Politique de confidentialité publiée, notamment pour les profils Famille, la messagerie et le fonctionnement de la bêta ouverte.</P>

      <H2>11. Demandes relatives au compte et aux données</H2>
      <P>Vous pouvez contacter <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> pour les demandes liées au compte. Les demandes de confidentialité ou de suppression peuvent nécessiter une vérification d’identité et sont traitées conformément à la Politique de confidentialité et au droit applicable. Les présentes Conditions ne promettent ni bouton de suppression dans les paramètres ni délai fixe lorsqu’ils ne sont pas réellement fournis.</P>

      <H2>12. Responsabilité et droit applicable</H2>
      <P>Dans la mesure permise par le droit applicable, YEMA n’est pas responsable des décisions relevant de tiers, notamment résultats d’examens officiels, décisions de visa, décisions d’emploi ou comportement d’utilisateurs indépendants. Rien dans les présentes Conditions n’exclut les droits ou responsabilités qui ne peuvent légalement être exclus.</P>
      <P>Les présentes Conditions s’appliquent sous réserve des lois applicables à YEMA et à l’utilisateur. Les droits impératifs en matière de consommation, protection des mineurs, confidentialité ou autres dispositions légales demeurent applicables lorsqu’ils le sont.</P>

      <H2>13. Modifications</H2>
      <P>Nous pouvons mettre à jour ces Conditions à mesure que la bêta ouverte et le produit commercial évoluent. Les changements importants seront reflétés dans les Conditions publiées et, lorsque cela est approprié, communiqués dans le service ou par e-mail avant leur application.</P>
    </LegalShell>
  );
}
