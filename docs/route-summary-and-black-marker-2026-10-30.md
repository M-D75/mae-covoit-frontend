# Résumé d’itinéraire et marqueur noir — 30 octobre 2026

Le composant partagé VillageRouteDetails affiche par défaut une carte ITINÉRAIRE avec deux lignes : départ et arrivée, illustrées par une flèche et une cible. Le bouton Voir les détails remplace cette carte par la frise existante. Retour à l’itinéraire et Échap reviennent au résumé ; le focus clavier suit l’ouverture et le retour. Le résumé et la frise ne sont jamais affichés ensemble.

Les deux menus — suivi et publication — utilisent ce même composant. Les villages, les couleurs et les phases restent issus de la seule propriété routeDetails fournie par MapSurface. Aucun calcul d’itinéraire ni appel Google supplémentaire n’est ajouté. Les changements de progression d’une même route conservent la frise ouverte ; une nouvelle route ou la priorité du code PIN referment les détails. En suivi, le panneau PIN conserve son affichage prioritaire exclusif. En publication, les phases restent prévisionnelles. La frise garde sa hauteur maximale de 340 px, adaptée au viewport, et son défilement interne. L’espace supplémentaire réservé sur la carte est mesuré par rapport à la hauteur réelle du résumé.

La carrosserie du marqueur passe à #171717 dans le générateur commun aux moteurs Google et Leaflet et dans l’asset statique src/assets/maps/car-top-view.svg. Les vitres, feux, détails, dimensions, ancrage et rotation du dessin sont conservés. Aucun fond, cercle ni roue supplémentaire. L’image d’accueil et les exports de campagne livrés restent intacts.

Validation : 42 tests ciblés réussis (tripSimulation, villageMapRendering, villageTimeline), contrôle de style des fichiers concernés réussi et compilation de production réussie. Les tests couvrent les deux adaptateurs, la cohérence du SVG statique, le résumé par défaut, le remplacement sans doublon, le retour et le focus, Échap, changement de route, progression, prévision de publication et priorité PIN.

Le contrôle mobile utilise les vrais BottomMenu et BottomMenuTrip, Vuetify, global.scss et tous les styles Vue non encapsulés de l’application, compilés sans erreur. Captures clair/sombre à environ 390 × 844 pixels CSS. Vérification DOM : zéro résumé et une seule frise après ouverture ; frise de 340 px avec overflow auto ; zéro résumé et zéro frise lorsque le PIN est prioritaire. Les données de trajet, le panneau PIN et la carte de fond du harnais sont fictifs. Ce contrôle ne constitue pas une session GPS ou Google SDK connectée.

Aperçus conservés dans : /Users/ekko-vi/.codex/visualizations/2026/10/15/01a1403f-c891-7220-afd0-be158e4914de/route-summary-black-2026-10-30/ . Les vues resume-clair-sombre.png et details-clair-sombre.png permettent la comparaison ; les captures séparées incluent aussi la publication et le panneau PIN prioritaire.

Aucun commit, push, déploiement, migration, fichier d’environnement, serveur utilisateur ou donnée distante modifié. Le serveur temporaire de capture est arrêté après vérification.
