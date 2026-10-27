# Code à quatre chiffres, thème et marqueurs — 27 octobre 2026

## Nouveau format et transition

Les nouveaux codes sont tirés par `crypto.randomInt(0, 10000)` puis complétés sur quatre caractères. Les zéros initiaux, y compris le code tout à zéro, sont conservés. Le champ conducteur propose quatre chiffres par défaut, clavier numérique et longueur maximale correspondante. Le code passager reste dans le panneau inférieur, en caractères monospace espacés, jusqu'à Cacher ou confirmation serveur.

Les codes déjà émis à six chiffres ne sont ni tronqués ni renouvelés. Le chiffrement AES-GCM, le HMAC `boarding:v1:`, la clé existante, l'enregistrement privé et la date d'expiration restent identiques. L'émission conserve son `ON CONFLICT DO NOTHING` : une consultation ou reconnexion ne remplace pas le code et ne remet pas les essais à zéro. Le conducteur peut sélectionner « Ancien code à 6 chiffres » pour une réservation qui affiche encore ce format. Un collage de six chiffres en mode quatre est arrêté avec une explication ; il n'est pas tronqué silencieusement. Le retour entre modes efface la saisie et son message local, sans modifier les essais en base.

Le serveur transporte une preuve uniquement pour une chaîne de quatre chiffres ou de six chiffres de transition. Pour une réservation non confirmée, la preuve doit toujours correspondre exactement à celle persistée : un code arbitraire de six chiffres ne peut pas valider un code de quatre chiffres. Les codes anciens cessent de fonctionner à leur expiration normale. La réinterrogation d'une réservation déjà confirmée conserve son comportement idempotent, sans demander un nouveau PIN.

Le nombre de combinaisons nouvelles passe de 1 000 000 à 10 000, comme demandé. La limite persistante de cinq erreurs, les autorisations passager/conducteur, le groupement des places, la fenêtre de validation de départ − 30 minutes à départ + 1 heure et les règles de paiement restent inchangés. Une soumission mal formée continue à atteindre le comptage des erreurs du service ; elle ne contourne pas le verrouillage.

**Aucune migration SQL nécessaire.** Les colonnes de preuve et de contenu chiffré sont du texte sans contrainte sur le nombre de chiffres. Aucun fichier de migration ni secret n'a été changé dans ce lot. Conserver impérativement la même clé de chiffrement pour relire les codes existants.

## Interface et thème

Les accès passager et conducteur portent désormais « Code » avec l'icône de clavier numérique MDI. Ils suivent la densité et les variantes Vuetify du projet, sans grand encadré bleu personnalisé. Le bouton indisponible reste focalisable et explique sa raison au clic, sans requête d'émission. Le bandeau supérieur est compact ; le panneau inférieur indique « En attente du véhicule ». Côté conducteur, les personnes acceptées sont « À récupérer », les confirmées « À bord », les autres états restent distingués. Aucun libellé n'invente une proximité, une approche ou une heure d'arrivée.

La cause du bloc blanc était le thème Vuetify du shell, maintenu en clair malgré la classe sombre de l'application. Le `v-app` suit maintenant réactivement `profil.darkMode` pour son thème Vuetify et sa classe personnalisée. Les nouveaux composants utilisent les variables `surface`, `on-surface` et `primary` : code intégré/dialogue, boutons, bandeau de suivi, légende et messages des zones, village actuel et panneau d'essai. Le réglage de l'application prime sur la préférence du système. Le fond Google/Leaflet n'a pas reçu de nouveau style nocturne ni de configuration d'API.

Le panneau d'essai reste replié, réduit et déplaçable entre quatre positions par son bouton de déplacement. Les commandes nouvelles gardent une cible d'au moins 44 pixels. Le panneau intégré de code reste au-dessus des couches de suivi ; le dialogue conducteur reste au-dessus de ce panneau.

## Voiture grise et piéton

La voiture est une vraie vue de dessus, orientée au nord à 0° et vers l'est à 90°, avec ancre centrale. Sa carrosserie est **grise par défaut (`#737373`)**, selon le choix utilisateur. Vitres, feux et éléments du dessin original conservent leurs teintes distinctes. Aucun détail latéral supplémentaire n’est ajouté. Le paramètre `actor.bodyColor` accepte uniquement une couleur hexadécimale de six caractères ; une valeur invalide retombe sur le gris. Aucun raccord automatique à la couleur déclarée du véhicule n'a été activé. Les variantes rouge et bleue de la planche sont des exemples de ce paramètre, pas une nouvelle préférence utilisateur.

Le piéton solide est lisible dans une pastille de contraste de 44 pixels, sans rotation. La voiture utilise 48 pixels. Les positions anciennes gardent leur atténuation et leur libellé explicite. Les deux moteurs consomment la même fonction `actorMarkerAsset`, avec SVG embarqués localement ; aucune requête d'icône par position.

Sources retenues et modifications :

- Voiture : [SHMECTOR.COM — Car Top View](https://shmector.com/free-vector/auto/car_top_view/11-0-138), CC0 1.0. L'archive de l'auteur, bien que sa fiche annonce aussi SVG, contenait CDR/EPS/AI. Les onze tracés EPS ont été convertis en SVG, orientés au nord, recolorés, sans ajout de détail à la silhouette. Le dessin reste vectoriel. Le SVG source normalisé est conservé dans `src/assets/maps/car-top-view.svg` ; son corps est embarqué dans `actorMarkerPaths.js`.
- Piéton : [Material Design Icons — walk](https://pictogrammers.com/library/mdi/icon/walk/), par Google, extrait du package `@mdi/js` 7.4.47 déjà installé. [Licence Apache 2.0](https://pictogrammers.com/docs/general/license/), notice du package et texte complet conservés dans `docs/licenses/`.

Le miroir SVG Repo a été examiné mais refusait le téléchargement ; le fichier intégré vient directement de l'auteur. UXWing n'a pas été retenu à cause de sa restriction de redistribution indépendante. Les voitures de profil Lucide/Tabler ne répondent pas à la rotation vue de dessus. La planche compare l'ancien symbole, le nouveau gris nord/est, deux couleurs possibles et le piéton sur surfaces claire/sombre.

Les catégories existantes de déclaration incluent Moto, Compact, Berline, SUV et Monospace. Un futur choix de formes pourra s'appuyer sur ces catégories, après sélection et vérification des dessins correspondants. Ce lot intègre une seule voiture ; aucune famille de modèles ni correspondance automatique n'a été inventée.

## Vérifications

- 162 tests front réussis, sur 22 fichiers : format quatre chiffres/zéros initiaux, mode explicite six chiffres, collage sans troncature, affichage ancien conservé, thème réactif du vrai template App, fermeture/effacement des codes, accès temporels, panneau déplaçable, couleurs limitées à la carrosserie, silhouette source sans ajout, orientation/ancre et rendu des nouveaux assets dans Google et Leaflet. Les régressions simulation, zones/village et tracé restent couvertes.
- Après la dernière simplification du SVG, 32 tests ciblés des marqueurs et des deux moteurs réussis ; compilation finale refaite.
- 39 tests serveur réussis : tirage uniforme sur 10 000 valeurs, chiffrement authentifié, preuve exacte, ancien contenu chiffré relisible, réaffichage/reconnexion sans remplacement et contrôles de routes.
- Suite SQL sur une base PostgreSQL locale jetable : huit erreurs concurrentes plafonnées à cinq, deux confirmations concurrentes rejouant le même état durable et dix courses annulation/confirmation conservant des états exclusifs. La fixture de migration testée est identique à la migration 028 du front. Cette base jetable a été arrêtée ; aucune base distante n'a été utilisée.
- Analyse statique et compilation de production réussies. Avertissements habituels de taille des ressources/précache et Sass/Browserslist dans les journaux.
- Contrôle visuel synthétique mobile à 380, 390 et 430 pixels, clair/sombre, code masqué par quatre puces, ancien affichage six puces, champ conducteur vide à quatre puis six chiffres, contraste des nouvelles surfaces, panneau d'essai et voiture grise. Les captures avant utilisent les anciens composants dans une scène de comparaison, pas un PIN utilisateur. Aucun code réel des captures fournies n'a été copié ou réaffiché.

## Chargement et limites

Les changements sont présents dans les dépôts habituels sur `codex/covia-dev`. Pour que les émissions nouvelles passent réellement à quatre chiffres, **redémarrer manuellement le backend de développement avec sa configuration actuelle**, puis actualiser les deux clients. Un ancien processus continue à générer six chiffres tant qu'il n'a pas chargé le nouveau code ; le front les prend en charge par le mode ancien. Les codes déjà émis restent inchangés jusqu'à leur expiration. Aucun serveur utilisateur n'a été arrêté ou redémarré par l'agent.

Aucune nouvelle dépendance de produit : MDI existait déjà. La conversion d'illustration a été faite avec des outils temporaires hors dépôt. Aucun changement `.env*`, `package.json` ou verrou de dépendances utilisateur, commit, push, déploiement, migration distante, confirmation réelle ou paiement réel. Les lots de progression et d'affichage précédents sont conservés. Les correctifs exportés sont limités à ce lot et déjà appliqués ; ne pas les réappliquer sur les fichiers courants.
