# Code dans le panneau et progression véhicule — 26 octobre 2026

## Code passager dans le panneau inférieur

Le dialogue passager était indépendant du panneau inférieur. Il est remplacé par une seule instance de BoardingCode en mode intégré, à l'emplacement des informations du trajet dans BottomMenuTrip. Les informations et la liste d'itinéraire sont retirées de cet emplacement pendant l'affichage. « Cacher le code » restaure les informations ; une confirmation reçue du serveur ferme aussi le code une fois toutes les réservations acceptées de ce passager confirmées. La saisie conducteur reste dans son dialogue distinct, élevé au-dessus du panneau et du simulateur.

La vue intégrée partage le même chargement et la même minuterie que le dialogue : pas de second composant de récupération. Fermeture, changement d'utilisateur/trajet, expiration de la fenêtre, passage en arrière-plan ou changement de mode du panneau démontent la vue passager. La minuterie est arrêtée, la lecture en cours annulée, la génération de requête invalidée et les codes/états locaux effacés. Une réponse tardive ne peut pas repeupler la vue fermée. Aucun code n'est stocké dans Vuex, dans un cache applicatif ou dans les journaux. Les contrôles serveur restent nécessaires et inchangés.

Les places d'une même réservation logique sont regroupées ; un représentant non encore confirmé est préféré si les états des places divergent. Le passager ne voit que ses réservations reconnues par identifiant de compte ou UUID associé. Les erreurs serveur/réseau et une action de réessai restent accessibles. L'expiration renvoyée par le serveur apparaît avec le code.

## Fenêtre exacte du bouton

Source : `supabase/migrations/028_booking_boarding_pin.sql`, opération de confirmation : ouverture à départ − 30 minutes, fermeture strictement après départ + 1 heure. Le bouton de cette interface est désormais verrouillé sur cette même fenêtre, avec les bornes incluses. L'horloge de suivi existante est rafraîchie chaque seconde. L'ancienne limite locale de quinze minutes concerne toujours l'annulation, pas l'accès au code.

Le serveur peut historiquement émettre le code avant l'ouverture de la validation ; cette règle serveur n'a pas été changée. Le nouveau verrou d'interface empêche ses deux accès passager de charger le code avant départ − 30 minutes. Il ne constitue pas une nouvelle permission serveur. Aucun changement SQL/backend n'a été nécessaire.

Le bouton reste visible et visuellement indisponible avant ouverture, après expiration, en attente d'acceptation ou si l'horaire manque. Il utilise aria-disabled plutôt que disabled HTML afin de recevoir le clic et d'expliquer la raison sans requête de code. Le bouton compact du bandeau ouvre cette explication dans le panneau, pour ne pas recouvrir la légende des zones. Après confirmation, l'état « À bord » remplace l'action devenue inutile. Une horloge locale incorrecte peut décaler l'indication ; le serveur conserve sa propre horloge et sa validation.

## Bulle de départ et village actuel

L'inspection en lecture seule de la vraie session Brave a identifié la bulle ouverte « Tsingoni », avec son bouton Fermer, au-dessus du marqueur de départ Google. Ce n'était pas la légende « Zones des villages ». La bulle redondante du départ a été retirée dans Google et Leaflet. Les marqueurs, la légende, les alertes et les autres informations de carte restent présents.

MapSurface émet maintenant l'état de village issu de son tracker existant. MapTrip le transmet à BottomMenuTrip, sans nouveau calcul d'intersection ni seconde boucle GPS. « Village actuel · … » apparaît discrètement avec les informations du trajet, uniquement pour une zone active confirmée et une position fiable. Une position devenue incertaine retire cette indication. Les alias utilisent le village canonique associé au contour ; l'identité reste fondée sur l'identifiant du contour, pas sur un nom homonyme. En cas de chevauchement, la zone d'entrée la plus avancée sur la route est préférée, puis l'identifiant départage les égalités. Les changements de contexte réinitialisent l'indication. En mode code elle reste disponible en mémoire locale et réapparaît avec les informations, si elle est toujours fiable.

## Tracé restant côté passager embarqué

L'ancien effacement cherchait des points de route à moins de dix mètres des positions enregistrées. Des échantillons espacés ou un grand saut de simulation pouvaient manquer tous ces points et laisser le tracé entier. La nouvelle progression projette la position sur les segments et retire le préfixe jusqu'au point projeté, même entre deux sommets éloignés. `originalPolyline` reste intact pour les contours, le cadrage et les remises à zéro.

À bord, seuls les échantillons du conducteur reçus pour ce trajet alimentent le tracé. Avant embarquement, le GPS piéton du passager ne le raccourcit pas. Le conducteur utilise sa propre position. Fraîcheur maximale dix secondes, précision connue de trente mètres maximum, tolérance latérale entre vingt-cinq et soixante mètres selon la précision. Les observations anciennes, dupliquées, imprécises ou hors route laissent le tracé à son dernier état connu.

La progression est monotone. Aux croisements, l'algorithme préfère la première branche plausible dans une fenêtre d'avance fondée sur le temps écoulé : plafond de 80 m/s pour le GPS réel et 1200 m/s pour la simulation accélérée (200 km/h ×20). Il refuse un saut impossible dans cet intervalle. À la première position sur une boucle exactement superposée, il choisit prudemment le premier passage ; sans historique il ne peut pas deviner un tour déjà effectué. Une longue absence de positions laisse une ambiguïté similaire. Ces limites évitent de supprimer arbitrairement une portion future.

Les variantes affichées ont chacune leur progression sur leur géométrie. Le choix de route, le trajet, l'utilisateur, l'entrée dans le suivi véhicule et la remise à zéro de simulation réinitialisent les trackers. La reconnexion conserve l'avance déjà observée et reprend sur un échantillon frais. Distance restante et durée proportionnelle utilisent la route sélectionnée. Le centre et le cadrage s'appuient sur la route entière : les mises à jour du tracé restant ne recentrent pas la carte. Le calcul de progression n’ajoute aucun appel Google ; la logique existante de recalcul hors itinéraire reste distincte. Aucune nouvelle validation d'arrivée, fin de trajet ou paiement.

## Vérifications et livraison

158 tests front réussis (22 fichiers), analyse statique réussie et compilation de production réussie. Les avertissements de taille de ressources/précache et de Sass/Browserslist figurent dans le journal. Les tests couvrent les bornes temporelles, absence de requête sur bouton indisponible, réponse tardive/annulation, fermeture sur confirmation, groupement des places, rendu intégré et dialogue conducteur, projection clairsemée, sauts, boucles, dérive GPS, remise à zéro, suivi passager, village confirmé/périmé et mise à jour des deux moteurs sans recadrage.

Contrôle visuel mobile 390×844 et ordinateur dans un aperçu isolé utilisant les vrais composants de panneau, code et carte Leaflet, avec contours/positions/réservation fictifs et code masqué par des puces. Vérifiés : explication avant ouverture, code à la place des informations, retour par Cacher, retour après confirmation fictive, village intermédiaire actif et disparition de la portion passée. Google est couvert par les tests de son vrai composant avec couches cartographiques simulées. Aucune lecture/génération de PIN réel, confirmation réelle ou transaction financière n'a été faite par l'agent. La session Brave réelle était déjà à bord avec position momentanément indisponible ; elle n'a pas servi à une nouvelle confirmation.

Actualiser le suivi pour charger le front corrigé. Aucun redémarrage utilisateur ni changement backend dans ce lot. La progression distante nécessite les champs de précision et de date du relais livrés dans le lot précédent : si un ancien processus ne les transmet pas, la progression reste suspendue plutôt que d'inventer une position fiable. Son éventuel redémarrage reste manuel.

Les fichiers sont déjà modifiés dans les dépôts habituels, branche codex/covia-dev. Aucun commit, push, déploiement, migration, écriture distante, changement de .env* ou de dépendances utilisateur. Les lots précédents sont conservés. Le correctif exporté est limité à ce nouveau lot et ne doit pas être réappliqué sur les fichiers courants.
