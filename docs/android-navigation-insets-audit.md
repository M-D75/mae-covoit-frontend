# Zones de sécurité Android — 13 octobre 2026

## Défaut observé

Sur le téléphone du propriétaire, les boutons système recouvrent l'action
« Supprimer mon compte ». L'écran des conditions avec « J'accepte » est
également signalé. Les deux utilisent `InfosGeneral` dans `Setting`.
La hauteur de la barre est disponible via le plugin SafeArea, mais ces pages
ne réservent pas de place en bas lorsqu'aucune navigation Vuetify n'est affichée.

## Correction et périmètre inspecté

| Surface | Traitement |
| --- | --- |
| Pages `v-main`, dont paramètres, conditions et données personnelles | Padding égal au maximum entre la réservation Vuetify et la zone système. Pas de double ajout sur les pages avec navigation applicative. |
| Panneaux `BottomMenu` et `BottomMenuTrip` | Zone de sécurité dans le contenu défilant. La partie déjà exclue par le clavier/viewport est déduite. |
| Sélecteur de village/date `PaneGetValue` | Zone système réservée et hauteur intérieure limitée au contenu du panneau. |
| Panneaux plein écran `PaneApear` et liste des contacts | Hauteur intérieure contenue, liste défilante et marge système. |
| Validation du recadrage d'avatar | Bouton remonté de la hauteur de la barre système. |
| Pied de page de connexion | Position remontée au-dessus de la barre système. |
| Dialogues et messages en bas d'écran | Zone de sécurité réservée. |
| Navigation principale et messagerie | Réservation native déjà présente ; la règle commune utilise un maximum pour ne pas la cumuler. |

La variable partagée `--safe-bottom` prend le maximum entre l'inset natif
et l'inset CSS du navigateur, avec zéro comme valeur de repli. Les insets
natifs sont rafraîchis au démarrage, au retour au premier plan et au
redimensionnement. Les échecs du plugin sont interceptés.

## Validation

Les 19 tests existants de positionnement des panneaux, de suivi du clavier
et de sélection des villages passent, ainsi que le lint des fichiers modifiés
et la compilation de production. Aucun navigateur contrôlable ni téléphone
connecté n'était disponible pour vérifier le rendu réel dans cette session.
La vérification sur un téléphone reste nécessaire : navigation à trois
boutons puis navigation gestuelle, défilement jusqu'à la dernière action,
ouverture/fermeture du clavier, rotation et retour au premier plan.

L'APK doit être reconstruit après compilation du frontend et synchronisation
Capacitor. Aucun changement de backend ni de schéma SQL pour cette correction.
