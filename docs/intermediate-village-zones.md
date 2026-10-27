# Contours des villages traversés et progression véhicule

Lot du 26 octobre 2026, appliqué dans les dépôts habituels sur `codex/covia-dev`.

## Affichage commun

`MapSurface` fournit les contours à Google et Leaflet. La publication et le suivi de trajet utilisent ce composant. Départ vert, arrivée orange, villages intermédiaires violets discrets. La liste se déplie dans la légende. Les repères départ/arrivée et le tracé restent visibles si les contours ne chargent pas.

Le contour d'un village traversé indique un passage géométrique, pas un arrêt, une desserte, une arrivée ni une validation métier. Aucun lien avec les paiements ou la confirmation d'embarquement.

## Calcul et cache

Le catalogue vient du RPC public existant `get_village_effective_boundaries`, en une requête groupée, partagée entre appels concurrents et conservée dix minutes (une minute si vide). Les échecs ne sont pas mis en cache. Aucune migration SQL ni nouvelle requête Google n'est nécessaire pour ce calcul. Les requêtes habituelles de calcul d'itinéraire restent distinctes.

Les segments de la route sélectionnée sont découpés à chaque intersection avec les anneaux des Polygon/MultiPolygon. Chaque intervalle est classé intérieur/extérieur, avec prise en compte des trous. Les boîtes englobantes servent uniquement à éliminer les candidats impossibles. Un segment peut traverser un petit contour même si ses deux extrémités sont dehors. Une tangence ou un parcours sur la limite ne suffit pas ; au moins cinq mètres à l'intérieur sont requis. Les distances utilisent une projection affine adaptée à Mayotte ; ce n'est pas un bornage cadastral.

Les alias sont regroupés par `boundary_village_id`, jamais uniquement par nom : Hachénoi partage Tsingoni, Doujani partage M’Tsapéré. Les géométries des extrémités sont exclues des intermédiaires. Les candidats sont ordonnés sur la route sélectionnée. `originalPolyline` conserve la route entière pendant que le suivi raccourcit le tracé visible.

Le contrôle public effectué avant l'interruption a trouvé 73 lignes pour 71 contours distincts. La route stockée Tsingoni–Mamoudzou examinée traversait Mroalé, Combani, Miréréni, Vahibé, Passamainty et M’Tsapéré. Cela dépend de la variante choisie et des contours disponibles ; une route rurale hors emprise peut ne pas traverser le contour du village voisin.

## Entrée et sortie confirmées

Les phases sont locales : à venir, zone actuelle, quittée. Une entrée doit être observée avant toute sortie. Deux échantillons distincts au minimum et deux secondes de présence sont nécessaires pour confirmer une transition. La marge par rapport à la limite vaut le maximum de quinze mètres et de la précision GPS déclarée. Les positions de précision inconnue ou supérieure à trente mètres, ou datant de plus de dix secondes, suspendent la progression. Les doublons et dates dans le désordre ne la font pas avancer. Une interruption de plus de quinze secondes réinitialise la confirmation en cours.

Une zone quittée s'atténue (fond .025, contour .25, épaisseur 1). Une réentrée confirmée la réactive. Sans position fiable, la dernière zone active est signalée comme dernière zone observée ; aucune sortie n'est inventée. Un saut de simulation passant entièrement par-dessus un village ne valide pas sa visite. À très forte vitesse/accélération, certaines petites zones peuvent donc rester à venir.

Pour le conducteur, la source est sa position partagée. Pour le passager, même avant embarquement, la progression vient exclusivement du conducteur. Sa position piétonne n'influence jamais l'historique des villages. La publication n'a pas d'historique véhicule.

Changement de route, de trajet, d'utilisateur, remise à zéro de simulation ou retour au GPS réel : l'historique repart de zéro. Rien n'est persisté en base. Les changements de phase et les mises à jour GPS ne recentrent pas la caméra. Le cadrage utilise la route sélectionnée et ses contours, sans les autres variantes ni le catalogue global.

## Favicon

Le plugin PWA transformait le lien ICO existant et ajoutait des chemins d'icônes absents. Le lien explicite `shortcut icon` conserve l'ICO de marque. Le PNG 256 px contenu dans cet ICO a été extrait sans redesign dans `public/icons/covia-256.png`. Le manifeste et la configuration PWA pointent sur ce fichier existant ; les URL sont versionnées pour renouveler le cache.

La compilation générée contient les bons liens. Les requêtes HTTP locales vers ICO, PNG et manifeste répondent 200 avec les bons types. L'apparition dans l'onglet du navigateur utilisateur n'a pas été contrôlée. Le serveur front déjà lancé peut conserver l'ancienne configuration PWA jusqu'à son prochain redémarrage manuel.

## Vérifications et activation

135 tests front réussis, dont géométrie, trous, alias, précision, entrée/sortie, remise à zéro, source véhicule et rendu des deux adaptateurs. 35 tests serveur réussis, dont transmission de la précision GPS au direct et à la reconnexion. Analyse statique réussie. Compilation de production réussie ; avertissements existants de taille de ressources, Sass/Browserslist à consulter dans le journal.

Contrôle visuel réel du composant Leaflet dans un aperçu séparé avec contours et GPS synthétiques : départ actif, sortie atténuée, intermédiaire actif puis remise à zéro. Google est couvert par les tests de son vrai composant avec couches cartographiques simulées ; aucune session Google connectée n'a été utilisée pour ce contrôle.

Le relais serveur transmet désormais `accuracyMeters`. Un ancien processus serveur sans ce champ garde la progression distante suspendue. Pour observer la progression distante après livraison, recharger ce code lors d'un prochain redémarrage manuel du backend de développement. Aucun serveur utilisateur n'a été arrêté ou redémarré par cette intervention.

Aucun commit, push, déploiement, écriture distante, changement de `.env*` ou de dépendances utilisateur dans ce lot. Les modifications précédentes de simulation, suivi et RLS restent en place.
