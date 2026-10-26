> État au 26 octobre 2026 : les cartes ci-dessous sont intégrées au dépôt frontend habituel sur `codex/covia-dev`. Aucun serveur n’a été lancé pendant cette intégration. Les comptes rendus d’aperçu ci-dessous sont historiques. Voir `integration-locale-2026-10-26.md` pour l’état courant.

# Zones de villages dans les cartes de publication et de suivi

Implémentation isolée dans le worktree géré `village-boundary-maps`, à partir de `refont`. Aucun commit/push, aucune écriture Supabase, aucun changement du serveur. Le dossier principal et ses modifications d’environnement préexistantes sont préservés.

## Comportement

Les zones de départ (vert) et d’arrivée (orange) utilisent les géométries officielles déjà importées dans Supabase. Un léger remplissage laisse les rues et l’itinéraire visibles. Les polygones s’ajoutent aux deux repères de village : départ et arrivée restent toujours affichés à leurs points de référence. En cas de chargement, contour absent/invalide ou erreur réseau, les repères existants restent utilisables. Une légende indique le départ et l’arrivée, avec un bouton de reprise en cas d’échec ou d’absence de zone.

Le cadrage englobe les géométries complètes et l’itinéraire, avec de la place pour la légende, les boutons et le panneau inférieur lorsqu’il est ouvert. Les MultiPolygon et leurs trous sont conservés. Leaflet et Google reçoivent les mêmes sommets ; seul l’ordre des coordonnées est adapté, ainsi que le sens des trous nécessaire au rendu Google.

Le composant commun MapSurface charge la fonction publique `get_village_effective_boundaries` par GET via le SDK Supabase, filtrée sur les IDs des lieux sélectionnés. Les réponses en cours et les résultats sont partagés entre instances : pas de requête répétée pour un ID déjà demandé. Cache positif dix minutes ; absence de contour une minute ; échec réseau non conservé. La reprise explicite force la relecture. Une réponse tardive ne peut pas remplacer la sélection la plus récente.

Les identifiants des villages sont conservés dans les trajets normalisés et transmis à la carte. Dans la publication, l’ID choisi est attaché aux informations du point, en plus du nom et de la commune. Un éventuel repli d’identification exige le nom ET la commune, avec une correspondance unique ; jamais le seul nom Miréréni.

## Rattachements et limites géographiques

- Doujani, ID 18 : contour effectif de Mtsapéré, ID 43 ; légende « Doujani · zone de Mtsapéré ».
- Hachénoi, ID 21 : contour effectif de Tsingoni village, ID 70 ; légende « Hachénoi · zone de Tsingoni ».

Ces rattachements proviennent de la base, pas d’une approximation dans le frontend. Ils affichent toute la zone du village de référence et ne certifient pas le statut administratif ni l’emprise entière de la localité. Les contours incluent des espaces ruraux.

Les coordonnées de référence, le calcul d’itinéraire et les routes stockées restent inchangés. Les prix, paiements, validations de montée à bord et règles d’arrivée/fin de trajet ne sont pas modifiés. Les états `arrival_use_validated=false` n’empêchent pas l’affichage ; ils ne sont pas utilisés pour déclencher une action métier. Les polygones ne sont pas transformés en zones d’arrivée actives.

## Fichiers principaux

- `src/services/villageBoundaryService.js` : requête ciblée et cache partagé.
- `src/components/maps/villageZoneUtils.js` : identité, validation de forme, étiquettes et conversion commune des polygones.
- `src/components/maps/MapSurface.vue` : chargement, repli, légende, protection contre les réponses périmées.
- `src/components/maps/LeafletMapSurface.vue` et `GoogleMapSurface.vue` : rendu des zones et cadrage.
- `src/views/Publish.vue`, `src/components/trip/MapTrip.vue`, `src/store/search.js` et `src/services/travels.js` : conservation/transmission des IDs pour cet affichage.

## Vérifications réellement effectuées

- Suite complète : **88 tests passés, 16 fichiers**. Couverture des coordonnées, cache/concurrence/reprise, homonymes, rattachements, MultiPolygon/trous, templates des deux moteurs, cadrage, affichage de repli et réponses tardives. Les tests existants de routage et de sessions GPS restent passants.
- Après ajustement de la position de la légende pour éviter les boutons latéraux : **16 tests cartographiques ciblés passés** et lint des adaptateurs passé.
- Lint des nouveaux fichiers, services, composants cartographiques et tests modifiés : passé. `git diff --check` : passé.
- Compilation de production : réussie. Dans cet environnement, la commande standard rencontrait `EPERM` en cherchant une configuration CSS dans un dossier parent inaccessible de la dépendance réutilisée par lien symbolique. Une configuration temporaire, hors dépôt, a désactivé uniquement cette recherche tout en gardant les plugins CSS existants ; aucun changement de la configuration du projet. Les valeurs de connexion utilisées pour compiler sont fictives.
- Vérification Supabase réelle, lecture seule : la requête exacte du nouveau chargeur, avec le SDK et les IDs 18/21, retourne les deux géométries parentes et leurs libellés attendus.
- Aperçu Leaflet du véritable MapSurface/adaptateur, avec les géométries officielles Combani/Miréréni : contrôlé visuellement en largeur desktop et **390 × 844**. Réponses Supabase simulées uniquement dans ce harnais temporaire pour éviter les prérequis de compte ; lecture distante vérifiée séparément. Fond OpenStreetMap. Aucun calcul Google déclenché dans cet aperçu isolé.
- Adaptateur Google : compilé et testé avec ses composants simulés ; aucune session de carte Google facturable lancée pour la QA.

## QA de la session utilisateur et déploiement

La session connectée a ensuite été rendue accessible dans le navigateur intégré de ce chat projet. Son serveur initial sur `localhost:8080` provenait du dossier principal non modifié. Pour conserver l’authentification et tester la bonne version, ce serveur de développement a été relancé à la même adresse depuis le worktree, en lisant la configuration locale existante sans la copier dans le code. Le répertoire de travail du processus qui écoute 8080 a été vérifié : c’est bien le worktree `village-boundary-maps`.

Parcours visuel réel de préparation de publication effectué avec le compte de test déjà connecté : Combani → Hachénoi, sélection d’un véhicule existant et de la capacité, jusqu’à la carte. Les contours proviennent ici réellement de Supabase ; « Hachénoi · zone de Tsingoni » est affiché. Une erreur réseau transitoire a permis de vérifier le repli et la reprise ; les contours puis le calcul normal d’itinéraire ont répondu après reprise. Le cadrage a été ajusté pour garder les zones au-dessus du panneau inférieur. Aucun bouton de publication finale n’a été utilisé et aucun trajet n’a été créé.

La vue a été contrôlée à **389 × 843 pixels CSS** dans cette session. Le zoom préexistant de l’onglet étant de 67 %, le réglage de viewport a été adapté pour obtenir cette largeur CSS. Aucun mode mobile n’a été ajouté au produit et aucun réglage de DevTools n’a été manipulé. La session est laissée connectée à largeur téléphone, selon la demande de l’utilisateur. Les aperçus temporaires distincts ont été fermés.

La rubrique passager des trajets du compte de test indique « Aucune réservation récente » dans la vue consultée. Aucun trajet/réservation n’a été créé pour forcer une QA de navigation. Le suivi est donc vérifié par les tests automatisés des deux adaptateurs, de la transmission d’IDs et des sessions GPS, mais pas par un essai réel de trajet en cours avec ce compte. Aucune montée à bord, arrivée, annulation ou action de paiement n’a été exécutée. Les recherches de consommation ou d’attribution des clés Google restent suspendues.

Le serveur de développement 8080 sert actuellement le worktree et reste disponible pour la revue. Les modifications de code restent isolées dans ce worktree, sans commit/push ; le dossier principal conserve seulement ses modifications d’environnement préexistantes. Pour revenir à la version initiale, arrêter ce serveur temporaire et relancer le serveur de développement depuis le dossier principal.

L’application installée et la production ne sont pas mises à jour par ce serveur local. Pour les mettre à jour, reconstruire/déployer une version incluant ces fichiers (depuis le worktree, ou après intégration des modifications dans le checkout à construire). Recompiler uniquement l’ancien checkout ne les ajoute pas automatiquement. Aucune clé n’est ajoutée au code.

## Mise à jour du 17 octobre : zones + marqueurs + route

Les deux adaptateurs conservent désormais les marqueurs de départ et d’arrivée même si leurs contours sont disponibles. Les conditions qui masquaient ces points ont été retirées, ainsi que les propriétés de contrôle devenues inutiles. Aucun déplacement de point, changement de style de marqueur, de prix, de routage ou de règle métier.

La suite complète passe à **92 tests dans 16 fichiers**. Les tests de templates vérifient sur chaque moteur les deux marqueurs à leurs coordonnées exactes et les polylines de l’itinéraire avec zéro, un et deux contours, y compris leurs trous. Lint ciblé et git diff --check passés. La compilation de développement de l’aperçu est passée ; la compilation de production mentionnée plus haut concernait l’intégration initiale du 15 octobre.

Aperçu Google réel Tsingoni village (70) → Mamoudzou village (48) mis à jour à chaud : zones, deux marqueurs et route bleue visibles simultanément. Le tracé déjà chargé de 36 minutes / 18,34 km est conservé, sans nouveau calcul demandé. Aucune droite artificielle ajoutée. Aucun backend métier lancé, aucune publication, aucune réservation ou donnée Supabase modifiée. Changements dans le worktree uniquement ; aucune intégration au dossier principal, aucun commit/push.
