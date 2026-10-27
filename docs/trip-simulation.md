> Mise à jour : voir `trip-follow.md` pour le suivi du conducteur après PIN, les vitesses 100/200 km/h et les états multi-passagers. Le compte rendu initial ci-dessous décrit le lot précédent.

# Positions simulées et marqueurs de trajet — V1, 26 octobre 2026

## État de livraison

Implémentation locale dans les deux dépôts habituels, branche `codex/covia-dev`, sans commit supplémentaire. Aucune migration ni donnée distante modifiée, aucun backend applicatif lancé, aucun paiement ni notification réelle. Les clés et fichiers `.env*` ne sont pas modifiés.

Le simulateur injecte des positions dans la même méthode que le GPS, puis dans le vrai transport Socket.IO du trajet. Ce n’est pas une animation isolée de la carte. Le relais utilise l’utilisateur authentifié par Supabase, vérifie le trajet et ses réservations acceptées et détermine lui-même le rôle et les destinataires. Il ignore tout `from`, `to` ou rôle fourni par un client. Les anciennes trames sans métadonnées ne sont plus acceptées : frontend et backend de cette branche doivent être utilisés ensemble.

## Marqueurs partagés

`tripActorMarkers.js` fournit la visibilité et les SVG : voiture orientée selon le mouvement, piéton et propre position discrète. La rotation, les couleurs, les dimensions et l’ancrage central sont communs. Les deux adaptateurs ne font que traduire taille/ancrage/coordonnées vers leur SDK.

- Conducteur : son véhicule et les passagers acceptés restant à récupérer.
- Passager : le véhicule et sa propre position discrète, sans les autres passagers.
- Les lignes de réservation d’un passager sont considérées ensemble pour masquer son piéton : si une réservation indépendante reste non confirmée, le piéton reste présent.
- Seul `in_car` persisté en base après le véritable PIN serveur masque un piéton. Proximité GPS, mouvement, pause, reset et entrée dans une zone n’ont aucun effet sur la montée ou le règlement.
- Les états de réservation sont relus toutes les cinq secondes ; les positions sont échangées en direct. La réponse PIN actualise immédiatement la session conducteur. Les confirmations ne sont jamais remises à zéro par le simulateur.
- Au-delà de 10 secondes sans position, le marqueur est atténué et signalé comme ancien ; au-delà de 120 secondes, il disparaît. Les dates de réception viennent du serveur pour les autres acteurs.

La carte publique conserve son propre point local éventuel, sans acteurs du trajet ni flotte publique. Les contours de villages, repères de départ/arrivée et itinéraire restent affichés.

## Sécurité du mode d’essai

Le panneau exige à la fois un build frontend non production, `VUE_APP_SIMULATION_ENABLED=true`, et une autorisation renvoyée par le backend pour cet acteur et ce trajet. Aucun paramètre d’URL ne l’active.

Le backend exige **toutes** les conditions suivantes :

- `COVIA_SIMULATION_ENABLED=true` ;
- `NODE_ENV=development` ou `test` ;
- `API_SUPABASE_URL=https://ziaqkswbsjgnmmajnfyp.supabase.co` ;
- une clé Stripe serveur commençant par `sk_test_` ;
- des listes explicites `COVIA_SIMULATION_USERS`, `COVIA_SIMULATION_TRIPS` et `COVIA_SIMULATION_BOOKINGS`.

Une cible de production, une clé Stripe live ou une liste manquante provoque un refus de démarrage. Les credentials Supabase doivent également appartenir au projet test ; ils ne sont pas fournis dans ces livrables.

En mode simulation, les tâches de capture, transferts, remboursements et notifications au démarrage sont désactivées. Les notifications FCM sont neutralisées même si elles étaient appelées par un autre chemin ; les jetons copiés ne sont pas relus par la fonction d’envoi. Le webhook est refusé. Les routes métier HTTP non nécessaires à l’essai sont bloquées.

Par défaut le volet est **positions seulement** : la route PIN de confirmation est bloquée avant toute modification métier. Pour essayer le vrai PIN et son règlement, ajouter explicitement `COVIA_SIMULATION_PAYMENTS=test-confirmed`, après revue du jeu d’essai et de la clé Stripe test. La route utilise alors le vrai RPC PIN et les protections habituelles de règlement ; tous les sièges du groupe doivent figurer dans la liste autorisée. Aucun état `in_car` ou `captured` n’est fabriqué pour la démo.

Les compteurs du dump local examiné indiquent 22 anciens enregistrements Stripe (11 `captured`, 11 `canceled`) et 3 jetons d’appareils. Ce ne sont pas 22 captures en attente dans ce snapshot, et ce relevé ne constitue pas un audit de la base actuelle. Aucune de ces données n’a été supprimée ou réutilisée comme paiement de démonstration.

## Comptes choisis et préparation du jeu

Les deux comptes fournis ont été retrouvés **en lecture seule dans Covia-Dev** :

- Conducteur : compte `6`, utilisateur `3196a1d2-d0a0-4238-a300-647e9aac08f7`.
- Passager : compte `3`, utilisateur `2efc018a-c89b-4aea-9c93-666557a9efa1`.

Les trajets Tsingoni (70) → Mamoudzou (48) retrouvés pour ce conducteur sont anciens. Aucune réservation récente exploitable dans la fenêtre PIN n’a été trouvée. Les réservations annulées ne sont pas réactivées et la fenêtre du PIN n’est pas élargie.

`docs/testing/prepare-trip-simulation.sql` est un **script facultatif préparé, non exécuté**, à examiner puis lancer uniquement dans SQL Editor de Covia-Dev si ce jeu est souhaité. Vérifier le nom et la référence du projet dans l’URL avant toute exécution. Il crée un nouveau trajet à départ +10 minutes avec la route déjà stockée du trajet 341, puis une réservation via `create_booking_reservation` et l’acceptation métier existante. Il ne modifie aucun ancien trajet. Il utilise uniquement le solde de crédits test existant et annule toute la transaction si ce solde ne permet pas une vraie réservation en crédits. Il ne crédite pas artificiellement un compte et ne capture rien. Les IDs du nouveau trajet et de la réservation sont indiqués par la notice SQL : les utiliser dans les listes ci-dessous. Réexécuter le script créerait un autre jeu ; ne pas le relancer machinalement.

Si le solde est insuffisant, préparer un rechargement Stripe test par le parcours habituel dans un environnement de test sécurisé avant cet essai. Le mode simulation ne sert pas à créer de nouveaux paiements ou de nouveaux comptes.

## Lancement explicite après préparation

Le fichier `.env` backend par défaut ne correspond pas à Covia-Dev dans la configuration inspectée. **`.env.development.local`**, lui, contient la cible Covia-Dev et une clé Stripe test. Charger ce fichier explicitement ; ne pas se contenter de `node server.js`.

Depuis le backend, après remplacement des deux valeurs `ID_...` par les IDs du jeu effectivement préparé :

```sh
NODE_ENV=development \
COVIA_SIMULATION_ENABLED=true \
COVIA_SIMULATION_USERS=3196a1d2-d0a0-4238-a300-647e9aac08f7,2efc018a-c89b-4aea-9c93-666557a9efa1 \
COVIA_SIMULATION_TRIPS=ID_DU_NOUVEAU_TRAJET \
COVIA_SIMULATION_BOOKINGS=ID_DE_LA_NOUVELLE_RESERVATION \
node --env-file=.env.development.local server.js
```

Sans IDs valides, le garde refuse le démarrage. Ne jamais employer la référence de production `uowqusyfvjvxvtqbuxlx`. Le simple changement d’URL frontend ne prouve pas la cible du backend.

Depuis le frontend, avec sa configuration existante pointant vers le backend local et Covia-Dev :

```sh
VUE_APP_SIMULATION_ENABLED=true VUE_APP_MODE=local npm run serve
```

Pour essayer aussi le PIN, redémarrer le backend avec **en plus** `COVIA_SIMULATION_PAYMENTS=test-confirmed`. Ne le faire qu’après revue de la réservation et de l’environnement Stripe test. Les paiements tests restent de véritables opérations métier dans Covia-Dev ; leurs montants et confirmations ne doivent pas être confondus avec des données réelles.

## Procédure deux sessions

1. Ouvrir deux profils de navigateur séparés, ou une fenêtre normale et une privée. Se connecter avec le conducteur dans l’une et le passager dans l’autre, sans partager leurs tokens ni modifier un ID dans le navigateur.
2. Ouvrir le même nouveau trajet accepté dans chaque session. Le panneau affiche le rôle réellement autorisé ; son absence signifie que les conditions d’activation ne sont pas remplies.
3. Ouvrir « Essai du trajet ». Chaque session déplace uniquement son propre acteur. Démarrer le véhicule et le passager indépendamment. Le sélecteur d’allure choisit 0, 5, 25, 50, 100 ou 200 km/h ; l’accélération ×1, ×5 ou ×20 agit séparément sur le temps.
4. Utiliser la barre de position pour choisir un départ différent, ou saisir une position manuelle. L’interpolation suit la polyline déjà chargée et ne rappelle pas Google à chaque tick. Une position manuelle hors trajet revient ensuite vers le point de reprise le plus proche. Pause/reprise conservent la progression ; reset ne touche qu’à la position et au tracé local.
5. « Coupure GPS » interrompt la livraison des positions mais conserve le mouvement simulé ; à la reprise, la nouvelle position est fournie. « Coupure réseau du suivi » déconnecte réellement ce Socket.IO et suspend le polling d’état du trajet. Les envois hors connexion sont abandonnés, pas mis en file pour une rafale de positions anciennes. Cette commande vise le suivi du trajet, pas toute la connectivité du téléphone ; pour un essai global du PIN hors ligne, utiliser les outils réseau du navigateur ou le mode avion.
6. Observer la position ancienne après 10 secondes puis sa disparition après deux minutes. Reconnecter : un abonnement authentifié recharge le snapshot autorisé, sans afficher les autres passagers à un passager.
7. Si les paiements de test ont été confirmés explicitement, afficher le vrai code côté passager, le saisir côté conducteur et vérifier la réponse serveur. Le piéton disparaît après confirmation ; le véhicule reste. Fermer/réouvrir et reconnecter : la confirmation reste acquise. Essayer plusieurs passagers avec des comptes/réservations test distincts et des listes autorisées élargies explicitement.
8. Refaire le rendu avec Google puis Leaflet via `VUE_APP_MAP_PROVIDER` et redémarrage frontend. Les données/états de trajet sont les mêmes ; seule l’adaptation de rendu change. Aucune entrée de zone ne déclenche arrivée, paiement ou fin de trajet.

Le passage en arrière-plan met en pause la source et arrête le partage. Reprendre explicitement au retour. « Revenir au GPS réel » arrête le simulateur et revient à la demande de consentement habituelle.

## Validation et limites

Résultats du lot : **113 tests frontend dans 18 fichiers, 32 tests backend, contrôle de style et compilation de production réussis**. La compilation utilise le harnais local déjà documenté pour éviter la recherche de configuration PostCSS dans un dossier parent inaccessible, sans modifier la configuration du dépôt.

Les tests locaux couvrent isolation, droits par trajet, destinataires, anti-usurpation, cadence, paquets périmés/désordonnés, snapshots/reconnexion, interpolation, pause/arrêt/accélération, coupures, visibilité multi-passagers et rendu réel des deux adaptateurs. Un test emploie deux vraies connexions Socket.IO locales avec authentification de fixture ; il ne remplace pas la validation Supabase réelle.

L’essai UI complet avec les deux comptes Covia-Dev **n’a pas été effectué** : il nécessite le nouveau jeu et les listes d’activation, qui ne sont pas configurés ici. Aucun backend applicatif n’a été lancé par l’agent. Le script préparatoire n’a pas été exécuté. Les petits SVG sont des assets vectoriels générés par code, pas des images bitmap ; aucune génération d’image payante n’est nécessaire.

Le retour serveur PIN et les captures conservent le protocole existant. Le mode simulation désactivé ne neutralise aucune tâche normale de production ; ne pas lancer un backend d’essai avec le mode désactivé en pensant bénéficier de cette isolation.
