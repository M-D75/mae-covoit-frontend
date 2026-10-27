# Allure et états d’embarquement — 26 octobre 2026

## Ce qui change

- Le panneau propose désormais 0, 5, 25, 50, **100 et 200 km/h**. La vitesse physique et l’accélération du temps restent distinctes.
- **Avant la montée**, conducteur et passager ont des déplacements indépendants : modifier l’allure de l’un ne doit pas déplacer l’autre.
- **Après le véritable PIN serveur**, le passager suit la position, le cap et l’allure reçus du conducteur par Socket.IO. Son moteur de simulation est mis en pause, son watcher GPS personnel est arrêté et ses commandes personnelles sont désactivées/masquées. Le contrôle de coupure réseau reste disponible pour tester la reconnexion.
- Le backend refuse les positions personnelles d’un passager dont toutes les réservations acceptées sont confirmées. Un ancien client ne peut donc plus faire courir un second piéton à côté du véhicule après la montée.
- Une notification privée de l’état persisté est envoyée aux sessions autorisées après confirmation. Le polling existant reste une reprise de secours. Aucun état d’embarquement n’est tiré du GPS ou d’une proximité.
- La vitesse affichée à bord est celle déclarée dans la dernière position du conducteur. Si elle n’est pas disponible, aucun nombre n’est inventé. La session passager n’anime pas un deuxième véhicule et ne republie pas la position du conducteur sous son identité.

Si la position conducteur manque, le passager reste « À bord » avec position indisponible. Il ne reprend jamais sa trajectoire personnelle pour combler cette absence. Les marqueurs conservent le comportement de position ancienne/expiration déjà prévu ; il n’y a pas d’extrapolation GPS.

## Icônes et plusieurs passagers

On garde une **voiture stable, orientée selon son cap**. L’état change dans un bandeau lisible plutôt que de transformer sans cesse l’icône de la voiture.

| Situation | Vue conducteur | Vue du passager A | Vue du passager B |
| --- | --- | --- | --- |
| Personne à bord | Voiture + piétons A et B ; « 0 à bord · 2 à récupérer » | Voiture + propre point ; « En attente du véhicule » | Voiture + propre point ; « En attente du véhicule » |
| A a validé son PIN | Voiture + piéton B ; « 1 à bord · 1 à récupérer » | Une voiture ; « À bord », suit le conducteur | Voiture + propre point ; reste en attente |
| A et B ont validé | Une voiture ; « 2 à bord · 0 à récupérer » | Une voiture ; « À bord » | Une voiture ; « À bord » |

Le résumé compte des **personnes**, regroupées par identité passager, pas le nombre de lignes/sièges. Une personne ayant plusieurs sièges n’est comptée qu’une fois. Si une réservation indépendante de cette personne reste non confirmée, elle reste à récupérer : les réservations indépendantes ne sont pas validées artificiellement ensemble. Les lignes refusées/absentes ne sont pas comptées.

Aucune liste des autres passagers n’est envoyée à un passager. Les zones des villages, repères départ/arrivée et itinéraire restent présents. Ni l’arrivée ni la fin de trajet ne sont traitées ici. Le bandeau n’annonce pas de places libres : ce résumé de personnes n’est pas un calcul de capacité du véhicule.

## Tester le changement sans refaire la montée

Le backend de votre essai **n’a pas été redémarré par l’agent**. Pour charger le nouveau refus des positions passager et la notification immédiate, redémarrer vous-même le backend avec exactement la configuration Covia-Dev, les listes autorisées et les mêmes gardes de simulation que pour votre essai. Ne pas lancer un backend sans ces gardes pour cette vérification.

Recharger aussi les deux fenêtres frontend. Le HMR ne garantit pas que tous les anciens timers du simulateur ont été recréés proprement. Les confirmations PIN persistées restent acquises ; aucune migration, réinitialisation de réservation ni nouveau PIN n’est nécessaire pour un passager déjà confirmé.

1. Sur un passager en attente, comparer deux allures différentes : les positions doivent rester indépendantes.
2. Dans la session conducteur, choisir 100 ou 200 km/h. L’accélération du temps peut rester ×1 pour isoler cet essai.
3. Pour un passager déjà confirmé, vérifier « À bord », disparition des commandes personnelles et réception du véhicule conducteur. Ne pas ressaisir son PIN.
4. Couper puis reconnecter le suivi de la session passager. L’état « À bord » doit revenir du serveur et le véhicule reprendre sur la dernière position reçue, sans redémarrer un piéton.
5. Pour une nouvelle montée ou plusieurs personnes, utiliser de nouvelles réservations test dans la fenêtre normale, avec les gardes et autorisations existantes. Ne pas remettre `in_car` à faux pour rejouer une réservation payée.

## Fichiers et vérification

- `src/components/trip/TripSimulationPanel.vue` : vitesses, explication attente/à bord et contrôles.
- `src/components/trip/MapTrip.vue` : suivi du conducteur après confirmation, arrêt de la source personnelle, bandeau d’état.
- `src/components/maps/tripActorMarkers.js` : résumé partagé par identité et marqueurs des deux moteurs.
- `src/services/tripSimulation.js` : vitesses proposées et vitesse normalisée de la source.
- Backend `lib/trip-simulation.js` et `server.js` : refus des positions après montée, transport de la vitesse et notification d’état privée.

**121 tests frontend et 34 tests backend réussis**, dont interpolation à 100/200 km/h, transition après réponse PIN serveur, suivi de la position conducteur, reconnexion sans nouveau piéton, groupes multi-sièges, passagers indépendants et mise à jour des deux vrais adaptateurs Google/Leaflet. Le panneau Vue est testé avec ses commandes désactivées à bord et son contrôle réseau conservé. Contrôle de style et compilation de production réussis, avec le harnais local PostCSS déjà documenté.

Aucun `.env*`, dépendance utilisateur, règlement PIN ou SQL métier modifié. Aucun serveur applicatif démarré/redémarré, paiement, écriture distante, commit, push ou déploiement effectué par ce lot. Les serveurs Socket.IO employés par les tests sont des fixtures locales isolées, sans Supabase ni Stripe. L’essai réel en cours de l’utilisateur n’a pas été manipulé par l’agent.
