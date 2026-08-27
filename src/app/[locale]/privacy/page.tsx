"use client";

import { useLocale } from "next-intl";
import { Callout, H2, LegalShell, P, Ul } from "@/components/landing/LegalShell";

const EFFECTIVE_DATE = "14 août 2026";
const EFFECTIVE_DATE_EN = "August 14, 2026";
const CONTACT_EMAIL = "privacy@yema.app";
const COMPANY = "YEMA Languages";

export default function PrivacyPage() {
  const locale = useLocale();
  return locale === "en" ? <PrivacyEN /> : <PrivacyFR />;
}

function PrivacyEN() {
  return (
    <LegalShell locale="en" eye="Legal" title="Privacy Policy" effective={EFFECTIVE_DATE_EN} updated={EFFECTIVE_DATE_EN} contactEmail={CONTACT_EMAIL} contactLine="Questions or requests? Reach us at">
      <P>{COMPANY} (&quot;YEMA&quot;, &quot;we&quot;, &quot;us&quot;) explains here how personal data is handled in the current open-beta product. We apply applicable data-protection requirements and will update this notice when materially new processing, including online payments, is introduced.</P>
      <Callout variant="info"><strong>Current status:</strong> YEMA is operating as an open beta. Online payment is not currently activated.</Callout>

      <H2>1. Data we may process</H2>
      <Ul items={[
        "Adult account data: name, email address, profile information and trusted workspace roles.",
        "Learning data: selected language journeys, progress, exercises, quiz results and activity required to provide the service.",
        "Family data: child profiles created and managed by a parent or guardian, including first name, age range or age, selected languages, learning settings and PIN-security state.",
        "Class, center and coaching data: memberships, enrollment requests, assignments, sessions, feedback and other records needed for the relevant workspace.",
        "Messaging and user content: messages and, where the feature is enabled, audio or other content intentionally submitted through YEMA.",
        "Technical and security data: authentication/session information, security events and limited diagnostics necessary to operate and protect the service.",
      ]} />

      <H2>2. How we use data</H2>
      <Ul items={[
        "Authenticate users and route them to the correct YEMA workspace.",
        "Provide learning, family, classroom, coaching, messaging and open-beta features.",
        "Protect accounts and the platform against abuse, fraud and unauthorized access.",
        "Operate invitations, support requests and service-related communications.",
        "Improve product reliability and understand feature usage using the telemetry that is actually enabled.",
        "Meet applicable legal obligations and respond to valid rights requests.",
      ]} />

      <H2>3. Audio, AI and user content</H2>
      <P>Different YEMA features handle audio differently. Some learning or AI-assisted interactions may process audio transiently through enabled service providers. Messaging or other user-submitted audio may be stored when storage is required for that feature. We therefore do not claim that every audio recording is deleted immediately. Access and retention depend on the feature, its security controls and the purpose for which the content was submitted.</P>
      <P>AI-assisted features may process text or audio through third-party services when those features are enabled. AI output can be imperfect and is not treated as an official examination decision.</P>

      <H2>4. Children and family accounts</H2>
      <P>YEMA supports child profiles that are created and managed under an adult parent or guardian account. Children do not create independent YEMA email accounts through the family flow. The adult account holder is responsible for creating the child profile and for the information and permissions associated with that profile.</P>

      <H2>5. Service providers and sharing</H2>
      <P>We do not sell personal data. We may use infrastructure and service providers such as authentication/database, hosting, email or AI providers where a feature requires them. We share only the information reasonably necessary to operate that feature. Learning or class information may also be visible to an authorized teacher, coach, parent/guardian or center representative according to the workspace and permissions involved.</P>

      <H2>6. Payments</H2>
      <P>Online payments are not currently activated. YEMA does not currently ask users to complete a live checkout in the open-beta product. Before payment processing is enabled, the relevant checkout, provider information and any additional privacy terms will be presented and this notice will be updated where required.</P>

      <H2>7. Retention and deletion</H2>
      <P>We retain data only for as long as reasonably necessary for the feature, account, security, legal or operational purpose involved. Different categories may have different retention needs. We do not promise a fixed deletion or retention period here unless that period is actually implemented for the relevant feature.</P>
      <P>To request access, correction, deletion or another applicable privacy right, contact <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We may need to verify the requester before acting on account or child-profile data.</P>

      <H2>8. Cookies and authentication</H2>
      <P>YEMA uses session and security mechanisms required for authentication and protected workspaces. Additional analytics or optional technologies are used only when enabled for the product. We do not describe advertising tracking as part of the current open-beta product.</P>

      <H2>9. Security</H2>
      <P>YEMA uses technical and organizational controls including authenticated access, role checks, scoped server-side authorization and security logging for sensitive operations. No online system can guarantee absolute security.</P>

      <H2>10. Changes</H2>
      <P>We may update this notice as YEMA evolves. Material changes to data processing will be reflected in the published policy and, where appropriate, communicated through the service or by email.</P>
    </LegalShell>
  );
}

function PrivacyFR() {
  return (
    <LegalShell locale="fr" eye="Mentions légales" title="Politique de confidentialité" effective={EFFECTIVE_DATE} updated={EFFECTIVE_DATE} contactEmail={CONTACT_EMAIL} contactLine="Questions ou demandes ? Contactez-nous à">
      <P>{COMPANY} (&quot;YEMA&quot;, &quot;nous&quot;) explique ici comment les données personnelles sont traitées dans le produit actuellement disponible en bêta ouverte. Nous appliquons les exigences de protection des données qui nous sont applicables et mettrons cette notice à jour lors de l’introduction de traitements matériels nouveaux, notamment les paiements en ligne.</P>
      <Callout variant="info"><strong>Statut actuel :</strong> YEMA fonctionne en bêta ouverte. Le paiement en ligne n’est pas activé à ce jour.</Callout>

      <H2>1. Données que nous pouvons traiter</H2>
      <Ul items={[
        "Données du compte adulte : nom, adresse e-mail, informations de profil et rôles d’espace de confiance.",
        "Données d’apprentissage : parcours choisis, progression, exercices, résultats de quiz et activité nécessaire au service.",
        "Données famille : profils enfants créés et gérés par un parent ou tuteur, notamment prénom, âge ou tranche d’âge, langues choisies, réglages d’apprentissage et état de sécurité du PIN.",
        "Données classe, centre et coaching : appartenances, demandes d’inscription, devoirs, séances, retours et autres éléments nécessaires à l’espace concerné.",
        "Messagerie et contenus utilisateur : messages et, lorsque la fonctionnalité est activée, audio ou autres contenus volontairement envoyés dans YEMA.",
        "Données techniques et de sécurité : informations d’authentification/session, événements de sécurité et diagnostics limités nécessaires au fonctionnement et à la protection du service.",
      ]} />

      <H2>2. Utilisation des données</H2>
      <Ul items={[
        "Authentifier les utilisateurs et les orienter vers le bon espace YEMA.",
        "Fournir les fonctions d’apprentissage, famille, classe, coaching, messagerie et bêta ouverte.",
        "Protéger les comptes et la plateforme contre les abus, la fraude et les accès non autorisés.",
        "Gérer les invitations, demandes de support et communications liées au service.",
        "Améliorer la fiabilité du produit et comprendre l’usage des fonctionnalités à partir de la télémétrie réellement activée.",
        "Respecter les obligations légales applicables et répondre aux demandes valides d’exercice de droits.",
      ]} />

      <H2>3. Audio, IA et contenus utilisateur</H2>
      <P>Les fonctionnalités YEMA ne traitent pas toutes l’audio de la même façon. Certaines interactions d’apprentissage ou assistées par IA peuvent traiter un audio de manière transitoire via les prestataires activés. La messagerie ou d’autres fonctions peuvent conserver un audio envoyé par l’utilisateur lorsque ce stockage est nécessaire au service. Nous n’affirmons donc pas que tous les enregistrements sont supprimés immédiatement. L’accès et la conservation dépendent de la fonctionnalité, de ses contrôles de sécurité et de la finalité du contenu envoyé.</P>
      <P>Les fonctions assistées par IA peuvent traiter du texte ou de l’audio via des services tiers lorsqu’elles sont activées. Les sorties IA peuvent comporter des erreurs et ne constituent pas une décision officielle d’examen.</P>

      <H2>4. Enfants et comptes famille</H2>
      <P>YEMA permet à un parent ou tuteur adulte de créer et gérer des profils enfants sous son propre compte. Le parcours Famille ne crée pas de compte e-mail YEMA indépendant pour l’enfant. Le titulaire adulte du compte est responsable de la création du profil enfant et des informations et autorisations qui lui sont associées.</P>

      <H2>5. Prestataires et partage</H2>
      <P>Nous ne vendons pas les données personnelles. Nous pouvons utiliser des prestataires d’authentification/base de données, d’hébergement, d’e-mail ou d’IA lorsqu’une fonctionnalité le nécessite. Nous ne partageons que les informations raisonnablement nécessaires au fonctionnement de cette fonctionnalité. Les informations d’apprentissage ou de classe peuvent aussi être visibles par un enseignant, coach, parent/tuteur ou représentant de centre autorisé selon l’espace et les permissions concernés.</P>

      <H2>6. Paiements</H2>
      <P>Les paiements en ligne ne sont pas encore activés. YEMA ne demande actuellement aucun checkout réel dans le produit en bêta ouverte. Avant l’activation du paiement, le parcours de checkout, les informations du prestataire et les éventuelles conditions de confidentialité supplémentaires seront présentés et cette notice sera mise à jour si nécessaire.</P>

      <H2>7. Conservation et suppression</H2>
      <P>Nous conservons les données pendant une durée raisonnablement nécessaire à la fonctionnalité, au compte, à la sécurité, aux obligations légales ou au fonctionnement du service. Les catégories de données peuvent avoir des besoins différents. Nous ne promettons pas ici un délai fixe de conservation ou de suppression lorsqu’il n’est pas effectivement implémenté pour la fonctionnalité concernée.</P>
      <P>Pour demander l’accès, la rectification, la suppression ou exercer un autre droit applicable, contactez <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Nous pouvons vérifier l’identité du demandeur avant d’agir sur les données d’un compte ou d’un profil enfant.</P>

      <H2>8. Cookies et authentification</H2>
      <P>YEMA utilise les mécanismes de session et de sécurité nécessaires à l’authentification et aux espaces protégés. Les technologies analytiques ou optionnelles ne sont utilisées que lorsqu’elles sont effectivement activées. Nous ne présentons pas de suivi publicitaire comme faisant partie de la bêta ouverte actuelle.</P>

      <H2>9. Sécurité</H2>
      <P>YEMA utilise des mesures techniques et organisationnelles comprenant l’accès authentifié, des contrôles de rôles, des autorisations serveur limitées au bon périmètre et la journalisation d’opérations sensibles. Aucun service en ligne ne peut garantir une sécurité absolue.</P>

      <H2>10. Modifications</H2>
      <P>Cette notice peut évoluer avec YEMA. Les changements importants concernant le traitement des données seront reflétés dans la politique publiée et, lorsque cela est approprié, communiqués dans le service ou par e-mail.</P>
    </LegalShell>
  );
}
