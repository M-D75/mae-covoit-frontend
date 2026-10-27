# Accès au code de montée côté passager — 26 octobre 2026

## Cause et correction

Dans MapTrip, l'accès passager était une icône de clé placée dans le `v-else-if` du bouton d'annulation. Celui-ci est affiché tant que `isBeforeThreshold` est faux ; cette limite locale vaut quinze minutes avant le départ. Le bouton du code était donc masqué avant cette limite, sans explication, alors que le serveur possède sa propre fenêtre de disponibilité. Dans BottomMenuTrip, l'autre bouton de code était réservé au conducteur.

Le passager dispose maintenant d'un bouton textuel « Afficher mon code de montée » dans le bandeau supérieur du suivi et dans le panneau inférieur. Il n'est plus conditionné par la limite locale d'annulation. L'accès est réservé au passager du trajet, avec une réservation acceptée non confirmée. Les réservations en attente affichent une explication ; les réservations refusées ou signalées absentes ne donnent pas accès. Après confirmation de toutes ses réservations acceptées, l'état « À bord · montée confirmée » remplace le bouton. L'état serveur reçu en direct prévaut immédiatement.

Le rôle du dialogue vient de l'identité réelle du conducteur, et non du mode d'interface initial. La réservation est reconnue par l'identifiant numérique de compte, ou par l'UUID associé à son account.user_id si le profil est encore en cours de chargement. Ces deux identifiants ne sont pas comparés entre eux. La même résolution est utilisée pour vérifier la présence d'une réservation et dans le dialogue. L'absence observée est expliquée par la condition horaire UI ; aucune anomalie d'identifiant n'a été démontrée dans la session utilisateur.

L'entrée conducteur conserve son fonctionnement et porte maintenant « Saisir le code du passager ». Le dialogue continue à afficher le message du serveur lorsque le code n'est pas encore disponible. La fenêtre de disponibilité du PIN, l'autorisation serveur et les règles d'embarquement/paiement restent inchangées.

## Vérifications

20 tests ciblés réussis : accès avant/après l'ancienne limite, conducteur/carte publique exclus, comptes numériques et UUID, réservations d'autres passagers, acceptation/refus/absence, plusieurs places/réservations et confirmation, bouton réellement rendu et événement d'ouverture, présence et événement dans le vrai panneau inférieur, explication horaire du serveur dans le dialogue, régressions de localisation.

Analyse statique réussie. Compilation de production réussie (avertissements habituels de taille des ressources, Sass et Browserslist).

Contrôle visuel sur aperçu isolé avec les vrais composants PassengerBoardingAccess et BottomMenuTrip, aux formats ordinateur et mobile 390×844. La réservation, les contours et le GPS sont synthétiques. Le code n'a pas été chargé ni affiché ; aucune confirmation d'embarquement ou opération financière n'a été réalisée. La session Brave connectée n'a pas servi à ce contrôle.

## Pour l'essai utilisateur

Actualiser la page du suivi du trajet côté passager. Le bouton est visible dans le bandeau en haut et dans le panneau inférieur. Cliquer dessus ouvre le dialogue du code ; si le serveur refuse encore son affichage, la raison apparaît dans ce dialogue. Aucun redémarrage backend n'est nécessaire pour ce correctif d'interface. Aucun serveur utilisateur n'a été arrêté ou redémarré.

Fichiers principaux : MapTrip.vue, BottomMenuTrip.vue, BoardingCode.vue, PassengerBoardingAccess.vue et boardingUtils.js. Aucun changement `.env*`, dépendance, commit, push, migration, déploiement ou écriture distante dans ce lot. Les lots simulation, suivi, contours intermédiaires et favicon sont conservés.
