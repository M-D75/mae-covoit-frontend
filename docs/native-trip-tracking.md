# Suivi natif — 28 octobre 2026

Implémentation locale, sans commit, push, déploiement, migration distante, modification de comptes ni essai PIN/paiement réel. Les comptes autorisés pour le simulateur restent le conducteur mourdas.mohamed@mae-solutions.yt et le passager mourdasm13@gmail.com, trajet Tsingoni → Mamoudzou. Leurs identifiants et le script facultatif de préparation sont dans `trip-simulation.md` ; aucune ancienne réservation n’est réactivée. Le suivi GPS natif est désactivé en simulation.

## Architecture et autorisations

Un pont Capacitor propre au projet acquiert ET transmet les positions en code natif : Android `LocationManager`, service de premier plan de type `location`, notification persistante avec action Arrêter et HTTP natif ; iOS `CLLocationManager`, mode d’arrière-plan `location`, indicateur système et `URLSession` éphémère. La WebView et Socket.IO ne sont pas chargés d’envoyer les positions pendant leur suspension. Aucune dépendance ou licence commerciale supplémentaire. Les API natives et Capacitor existant sont réutilisés ; les modules GPS qui ne font que rappeler JavaScript ne suffisent pas à cette architecture.

Activation volontaire depuis le trajet visible, après connexion et consentement. Android : localisation approximative/précise, puis notification Android 13+ requise par cette interface. Le service est lancé au premier plan et peut continuer en arrière-plan ; aucune permission de localisation permanente `ACCESS_BACKGROUND_LOCATION`, aucun redémarrage au démarrage du téléphone. iOS : autorisation Lorsque l’app est active, démarrage au premier plan, `allowsBackgroundLocationUpdates`, `showsBackgroundLocationIndicator` et `UIBackgroundModes=location`. L’autorisation Toujours n’est pas demandée puisqu’aucune relance après destruction n’est promise.

Le backend délivre, après vérification Supabase et du trajet, un jeton aléatoire limité à publier/arrêter le GPS d’un seul acteur sur un seul trajet. Validité au maximum six heures et avant la limite du trajet. Il ne permet ni lecture de profil, ni code de montée, confirmation, paiement ou changement de destinataire. Le serveur n’en conserve que le hash ; le natif le conserve en mémoire, sans fichier, préférence ni log. HTTPS et absence de redirections obligatoires. Le JWT général n’est pas confié au service natif. La session et les droits sont revérifiés à chaque position ou heartbeat. Limite GPS : 15 secondes de fraîcheur, séquence croissante, cadence minimale une seconde ; le relais valide aussi coordonnées et rôle.

Fenêtre de suivi : de deux heures avant le départ à la durée Google stockée en secondes + une heure après le départ (durée bornée entre dix minutes et douze heures ; à défaut, quatre heures). Ce délai est une limite technique ; il ne constitue pas une preuve d’arrivée. Les réservations retirées/refusées/annulées ou confirmées à bord ne peuvent plus émettre de GPS passager. Le conducteur continue le suivi du véhicule.

## Arrêts, reconnexion et limites

- Arrêt dans l’interface, action de notification Android, déconnexion, changement de compte/trajet, refus de permission, expiration ou refus serveur : arrêt du GPS natif, effacement du jeton et révocation serveur au mieux selon le réseau. La navigation vers les messages/profil peut laisser le suivi volontaire actif.
- Les positions ne sont jamais accumulées sur disque ni rejouées en rafale. Une seule mesure récente est conservée ; après une coupure, un vieux point est abandonné et un heartbeat sans coordonnées peut vérifier la session. Android envoie au plus toutes les quinze secondes, iOS sur mises à jour et heartbeat, au moins cinq secondes entre envois.
- À la reconnexion, les états de réservation sont relus sur le serveur. Un PIN confirmé y reste confirmé. Un PIN non transmis/validé n’est jamais déclaré réussi hors ligne. Ni un point GPS ni une entrée de village ne déclenchent paiement, arrivée ou fin métier. Le suivi ne comporte aucun appel financier ; les protections existantes de confirmation/règlement restent applicables.
- Une session expirée n’est pas renouvelée automatiquement. Après arrêt forcé, destruction du processus, redémarrage du téléphone ou du backend, elle doit être réactivée explicitement depuis le trajet et ses droits revérifiés. Aucune garantie de cadence ou de disponibilité sous économie d’énergie, restriction constructeur ou arrêt système.
- Le bouton conducteur **Fin du suivi natif** révoque les sessions natives de ce trajet et en interdit la réémission jusqu’à la limite technique dans cette instance serveur. Il ne termine pas le trajet métier, n’annule aucune réservation, ne coupe pas les sources web existantes et ne déclenche aucun règlement. Ce verrou est en mémoire : il ne survit pas au redémarrage serveur. Une clôture métier durable exige un état persistant dédié, hors de ce lot. Ne pas présenter ce bouton comme une arrivée automatique.
- Les sessions natives de ce lot exigent une instance backend unique, ou du routage stable vers celle qui les a créées ; aucun stockage distribué n’est ajouté. Un redémarrage/incompatibilité d’instance refuse la session, au lieu de la réactiver.

## Construction et recette sur appareils

Compiler les sources web vers les projets natifs avec la configuration d’environnement choisie et le parcours Capacitor habituel, puis reconstruire les binaires : une mise à jour web seule ne fournit pas ce nouveau plugin. Vérifier avant copie que l’URL backend est HTTPS et accessible depuis le téléphone ; `localhost` HTTP de l’ordinateur ne convient pas. Les `.env*` existants ne sont pas modifiés. Ne pas lancer le backend normal avec une base d’essai copiée en pensant bénéficier de l’isolation du simulateur.

Android : ouvrir le projet `android`, vérifier le service et permissions fusionnés, compiler Debug sans signature de production puis installer volontairement sur un téléphone de recette. iOS : ouvrir `ios/App/App.xcworkspace`, vérifier Background Modes > Location updates, la description française d’usage de localisation et le storyboard `CoviaBridgeViewController`. Fournir le fichier Firebase propre à l’environnement via la procédure habituelle ; le projet actuel le référence dans Téléchargements. Vérifier la cible minimale avec la version Xcode utilisée.

Recette manuelle à effectuer, conducteur et passager séparés : autoriser puis refuser les permissions, lancer au premier plan, verrouiller l’écran 5/15/30 minutes, observer les positions reçues sur l’autre téléphone et la notification/indicateur ; couper le réseau puis rétablir après quelques minutes, après la limite de session et après la limite du trajet ; vérifier absence de vieux points rejoués ; confirmer le PIN uniquement via le serveur autorisé puis vérifier l’arrêt GPS passager ; essayer arrêt, notification, déconnexion, navigation, changement de compte/trajet, arrêt forcé et redémarrage. Ne pas valider le comportement écran verrouillé sur le seul résultat de compilation ou un navigateur.

Publication : déclarer l’usage de localisation et les données partagées dans les fiches de confidentialité Apple/Google, fournir une explication visible et une démonstration du service au premier plan à Google Play si demandée, justifier la localisation d’arrière-plan dans la revue Apple. Ne pas déclarer ni solliciter une permission Toujours/non utilisée.

## Sources techniques consultées

- [Android : permissions de localisation](https://developer.android.com/develop/sensors-and-location/location/permissions), [restrictions de démarrage des services](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start), [types de service Android 14](https://developer.android.com/about/versions/14/changes/fgs-types-required).
- [Apple : allowsBackgroundLocationUpdates](https://developer.apple.com/documentation/corelocation/cllocationmanager/allowsbackgroundlocationupdates), [traitement de la localisation en arrière-plan](https://developer.apple.com/documentation/corelocation/handling-location-updates-in-the-background).
- Capacitor 6 : [plugin Android](https://capacitorjs.com/docs/v6/plugins/tutorial/android-implementation), [plugin iOS](https://capacitorjs.com/docs/v6/plugins/tutorial/ios-implementation).
- Google Play : [localisation](https://support.google.com/googleplay/android-developer/answer/9799150), [services au premier plan](https://support.google.com/googleplay/android-developer/answer/13392821).

## Validation locale

Compilation Java Android réussie. Compilation iOS simulateur réussie sur une copie de vérification du projet, avec cible temporaire iOS 15 compatible avec le SDK installé et sans la ressource Firebase externe inaccessible ; le projet réel garde sa cible et référence Firebase d’origine. Aucun test écran verrouillé sur appareil réel effectué, aucun binaire publié.

La légende complète est repliable avec un bouton compact Zones, sans remettre à zéro les visites ni les contours. Les badges de statut restent indépendants et les couleurs utilisent le thème Vuetify.

Résultat final des vérifications automatisées : 168 tests frontend dans 23 fichiers, 44 tests backend, contrôle de style et compilation web de production réussis. Contrôle en clair/sombre et du repli/dépli de la légende dans un navigateur sur une carte Leaflet avec contours fictifs ; aucun compte connecté ni code réel exposé.
