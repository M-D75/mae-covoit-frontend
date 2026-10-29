# Messagerie texte et notifications — 28 octobre 2026

## Périmètre et livraison

Travail local dans les deux dossiers principaux, branches actuelles. Aucun push, déploiement, commit ou migration distante. Les changements du suivi natif précédent restent présents et ne sont pas remplacés. Les `.env*` et les modifications préexistantes de `package.json` / `package-lock.json` backend sont préservés. Aucun nouvel envoi de push de progression, position périmée ou entrée dans un village.

Messagerie **texte uniquement**, avec les emojis saisis naturellement au clavier. Pas de photos, vocaux ou réponses rapides. Le tutoriel est uniquement un plan séparé : `tutorial-reflection-2026-10-28.md`.

## Constats et corrections

L’ancien serveur stockait les messages dans un objet RAM indexé uniquement par paire d’utilisateurs. Deux trajets d’une même paire se mélangeaient, le redémarrage perdait l’historique, et les index/horaires venaient du client. « vue message » remplaçait les messages par des objets clients après un contrôle limité au premier élément. Les non-lus étaient volatils ; leur chargement sur la carte était commenté. La déconnexion Socket.IO ne mettait pas réellement la présence à jour. Les notifications de chat utilisaient leur texte intégral et exigeaient un jeton déjà présent en RAM. Les notifications natives lisaient `actions.goTo`, alors que les routes métier envoyaient principalement `goTo` à plat. Les notifications locales partageaient l’ID 1 et la réservation produisait une confirmation locale susceptible de contredire son statut réel.

La migration **031** introduit un schéma privé à RLS, sans droits `anon` / `authenticated`, et une seule opération SQL publique exécutable par `service_role`. L’identité est issue du JWT validé par le backend. Le SQL recalcule la relation à partir du trajet et de sa réservation ; ni rôle, auteur, destinataire effectif, index, horaire ou statut ne sont repris d’un objet client. Une conversation est liée au trajet et à la paire conducteur/passager. Un passager ne voit pas les autres passagers.

Les réservations en attente peuvent échanger avec leur conducteur ; refus, absence, états financiers annulés/échoués et annulation bloquent les nouveaux échanges. L’envoi est fermé 24 h après le départ prévu. Cette limite de communication ne signifie pas arrivée ou fin du trajet. Les participants d’une conversation existante peuvent encore lire/signaler son historique non expiré après l’annulation ou la suppression du trajet. Après suppression du compte, ses conversations/messages disparaissent par les clés étrangères ; les extraits déjà signalés restent bornés par leur échéance initiale.

L’ancien protocole Socket.IO est refusé explicitement : aucun tableau « vue message » ne réécrit plus l’historique. Le nouveau protocole HTTP retourne un accusé après persistance SQL, avec ID serveur et dates serveur. Une clé UUID d’envoi reste identique lors d’un nouvel essai. La contrainte unique et le verrou SQL évitent les doublons concurrents ; changer le contenu d’une même clé provoque un conflit. L’interface distingue Envoi, Échec/confirmation indisponible, Enregistré et Lu. Enregistré ne promet pas la livraison sur le téléphone du destinataire. Aucun envoi automatique d’une file hors ligne : nouvel essai explicite, brouillon/envois en mémoire seulement.

L’historique comporte 50 messages par page, ordonnés par ID serveur, avec curseur stable pour les précédents. Les invalidations Socket.IO ne transportent pas de contenu ; elles déclenchent une relecture autorisée. Reconnexion et retour au premier plan rechargent l’état. Une relève périodique couvre une invalidation manquée. Les résultats tardifs d’un autre compte, trajet ou contact sont écartés.

Le client demande « lu » seulement si l’échange est la vue active, visible, au premier plan, avec focus, et pour les messages reçus effectivement visibles dans sa zone d’affichage. Le backend demande aussi une présence Socket.IO récente du même acteur/trajet/contact (expiration après 15 secondes). Le SQL ne marque que les IDs appartenant à ce destinataire, cette conversation et non expirés. Un message très long qui n’entre pas entièrement dans la zone ne sera pas marqué lu par ce contrôle conservateur.

Les non-lus viennent désormais de SQL ; la carte, les listes du conducteur et le sélecteur de contacts les rechargent. Le bouton chat de la carte possède aussi un libellé accessible. Le cache n’est plus persisté entre comptes ; la connexion/changement de compte efface l’ancien état. Le bouton chat d’une fiche passager ouvre sa paire exacte. Les réponses asynchrones de l’ancien propriétaire ne remplissent pas les non-lus du nouveau.

## Conservation et signalement

**Chaque message expire 15 jours après sa création serveur.** Ce délai ne repart ni à la lecture, ni à la reconnexion, ni à l’envoi d’un autre message. Toutes les lectures, non-lus, accusés et captures pour signalement filtrent les messages expirés, même avant la purge physique. L’interface écarte aussi les messages expirés de sa mémoire ; aucun historique ou brouillon texte n’est écrit dans localStorage.

Le formulaire joint au maximum les 50 derniers messages chargés de la paire affichée, un motif et jusqu’à 1 000 caractères de précisions. Le serveur choisit les vrais messages à partir des IDs autorisés, sans accepter de copie de texte fournie par le client. Un UUID de demande évite un signalement doublé après perte de réponse. Limites : dix messages par dix secondes par acteur, cinq signalements par jour.

**Le signalement entier expire avec le plus ancien message joint.** Il ne prolonge donc jamais la conservation d’un extrait au-delà de ses quinze jours initiaux. Le motif et les précisions sont supprimés avec lui. Un signalement peut expirer rapidement si un message joint est déjà ancien : c’est une limite de traitement assumée dans ce lot, à rendre visible aux responsables de la revue. Une conservation distincte, plus longue, serait une décision produit/confidentialité à autoriser séparément ; elle n’est pas activée.

La purge est appelée au démarrage backend et toutes les heures à la minute 7, hors simulateur. Si le backend reste arrêté, les accès expirés restent refusés ; la suppression physique attend son redémarrage. La migration facultative **032** prépare un job `pg_cron` côté base, pour ne pas dépendre du processus applicatif. Elle exige que le propriétaire ait déjà activé cette extension en TEST ; sinon elle échoue avec une explication, sans activation silencieuse. Surveiller l’exécution effective et les erreurs de purge avant toute production.

Il n’y a **pas de console d’administration de signalements livrée**. Le rapport est stocké dans `messaging_private.abuse_report`, accessible par une procédure administrative contrôlée côté base/serveur. Les utilisateurs authentifiés ordinaires, y compris un éventuel compte « admin » frontend, n’obtiennent aucun accès direct à cette table. Pour une revue SQL autorisée, toujours filtrer `retain_until > now()` ; les futures API d’administration devront faire de même. Aucun mail ou autre message n’est envoyé à un administrateur dans ce lot.

## Notifications et rappels

Les messages nouveaux persistés peuvent produire un push générique « Un message vous attend pour ce trajet », avec lien vers le trajet et la paire. Aucun texte du chat n’est copié dans le push ou les logs applicatifs. Une présence récente dans cette conversation évite son push ; l’affichage d’un autre contact ne supprime pas sa notification. La déconnexion réelle retire la présence, indépendamment d’un événement volontaire du client. Plusieurs sockets d’un compte peuvent recevoir l’invalidation sans qu’une déconnexion ancienne efface une autre session.

Les jetons sont relus dans la base pour les utilisateurs hors ligne, et non uniquement depuis le cache de sockets. Un token est affecté à un seul compte : migration des doublons anciens vers la dernière inscription, contrainte unique et libération lors d’une nouvelle inscription. La déconnexion supprime le token côté serveur au mieux et l’invalide côté Firebase, puis nettoie les notifications affichées. Le modèle existant reste **un token par compte**, pas une gestion complète multi-appareils.

Les envois passent par les notifications durables avec clé d’événement unique par destinataire. Un second appel de la même transition ne crée pas une nouvelle notification identique. Android : canaux Messages et Réservations/rappels, icône monochrome existante, remplacement par tag de conversation ; iOS : regroupement par thread et clé de remplacement. Les notifications locales ont des identifiants distincts et leurs clics lisent aussi les données à plat, avec compatibilité du format ancien. Les chemins sont limités à une liste sûre. L’autorisation serveur demeure obligatoire après chaque clic. Une fiche cible est repérée dans le planning lorsque le trajet est encore disponible.

Le rappel est à 30 minutes avant le vrai départ, pour une réservation acceptée ou le conducteur concerné. Le client ne choisit plus librement son titre, sa date ou ses données métier. Il est dédupliqué, annulé lors du refus/absence/annulation, et son lien réel est revérifié juste avant l’envoi. Sa durée de livraison expire au départ prévu pour limiter les rappels retardés. Un push déjà remis au fournisseur ne peut pas être retiré avec certitude en cas d’annulation concurrente. Les rappels anciens sans rattachement vérifiable sont annulés par la migration 031. Une confirmation locale immédiate en doublon de la réservation a été supprimée.

Limites : une notification n’est pas une transaction financière et une panne FCM ne remet pas en cause la réservation/le message persisté. L’état `processing` n’est pas automatiquement renvoyé après un crash ambigu, pour éviter une seconde notification déjà reçue ; cette préférence peut laisser un push manquant. Aucun fournisseur ne garantit « exactement une fois ». Pas de preuve sur appareils iOS/Android réels dans ce lot : canaux, regroupement, clic depuis app arrêtée et comportement des autorisations restent à recetter. La reprise d’un lien vers une carte exige que le trajet soit encore accessible dans les listes métier ; sinon retour au profil. Le chat non expiré peut rester accessible via son lien propre.

## Déploiement TEST à réaliser manuellement

1. Sauvegarder TEST, examiner les migrations 031 et 032 et leurs prérequis, notamment 011 et les colonnes métier déjà utilisées. Ne pas les exécuter sur production par simple copie. La migration 031 touche aussi la contrainte d’état des notifications et déduplique les anciens tokens.
2. Appliquer 031 sur TEST avec le rôle propriétaire. Facultativement activer `pg_cron` par le parcours administrateur habituel, puis appliquer 032 et vérifier le job. Le backend assure également la purge au démarrage et à l’heure.
3. Déployer ensuite ensemble frontend/backend compatibles, sans mélanger avec l’ancien protocole. Les anciennes données RAM non fiables ne sont pas importées. Sans 031, le nouveau chat refuse le service avec une erreur générique ; il ne retombe pas sur l’ancien stockage.
4. Refaire avec deux comptes autorisés, deux trajets de la même paire et un autre passager : refus des accès croisés, contacts exacts, envoi/retry après coupure, pagination, non-lus carte/profil, changement de compte, vue masquée et reprise. Tester expiration et purge sur données uniquement jetables, ainsi qu’un signalement proche de son échéance.
5. Recette notifications sur vrais appareils : présence dans la bonne/mauvaise conversation, fermeture sans pré-déconnexion, jeton trouvé en DB, changement de compte, clic à froid, regroupement par conversation, rappel annulé avant échéance et absence de push de suivi GPS.

## Sources techniques

- [PostgreSQL : politiques et refus par défaut](https://www.postgresql.org/docs/current/sql-createpolicy.html), [Supabase : RLS et droits de table](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Firebase : remplacement des notifications](https://firebase.google.com/docs/cloud-messaging/customize-messages/collapsible-message-types). Le remplacement des notifications n’est pas utilisé comme preuve de lecture ni comme stockage des messages.

## Vérifications réalisées

- **177 tests frontend** dans 25 fichiers, **50 tests backend**, contrôle de style et compilation web de production réussis.
- Migration 031 exécutée uniquement dans une base PostgreSQL locale jetable UTF-8 : isolation entre deux trajets d’une paire et entre passagers, droits RLS/RPC, quatre envois simultanés avec une même clé donnant un seul message, accusés du seul destinataire, pagination 50 + 6 sans recouvrement, annulation, expiration et purge physique des messages/rapports.
- Aperçu navigateur isolé avec données fictives : saisie texte et emoji, accusé Enregistré, formulaire de signalement avec durée explicite, contrôle clair/sombre et largeur réduite. Aucune conversation réelle ni notification externe envoyée.
- Le job pg_cron facultatif 032, les appels FCM réels, les clics à froid et les canaux sur téléphones restent à valider dans TEST. Aucun résultat local n’est présenté comme une validation de livraison native.
