# Fiche Google Play — Covia

## Textes

- `title.txt` : nom de l’application.
- `short-description.txt` : brève description, 79 caractères hors saut de ligne final.
- `full-description.txt` : description complète, 1 833 caractères hors saut de ligne final.
- Contact : mourdas.mohamed@mae-solutions.yt.

## Visuels

- `icon-512.png` : icône existante de l’application, exportée en PNG RGBA 512 × 512, sans changement du logo.
- `feature-graphic-1024x500.png` : image de présentation, PNG RGB 1024 × 500, sans transparence.
- Texte alternatif de la bannière : « Covia, le covoiturage à Mayotte : une voiture partagée sur une route côtière au bord du lagon. »

## Captures d’écran préparées

Captures réelles prises dans l’émulateur Android avec le compte de démonstration confirmé par le propriétaire :

1. `screenshots/01-recherche.png` : recherche Sada → Mamoudzou, date et nombre de passagers.
2. `screenshots/02-carte-mayotte.png` : carte de Mayotte, localisation désactivée.
3. `screenshots/03-preparation-itineraire.png` : préparation du trajet conducteur Sada → Mamoudzou et choix de l’itinéraire.

Format : 1080 × 1920 pixels, PNG RGB sans transparence. Les interfaces n’ont pas été recréées ni retouchées ; seule la conversion technique du PNG en RGB a été effectuée. Aucun trajet n’a été publié et aucun paiement n’a été lancé pour ces captures.

Le profil et les écrans montrant son avatar trouvé sur Internet ont été exclus à la demande du propriétaire. Des captures de résultats avec un trajet disponible et de messagerie pourront compléter la série lorsque ces données de démonstration seront présentes.

Textes alternatifs :

- Recherche : « Recherche d’un covoiturage de Sada à Mamoudzou pour un passager. »
- Carte : « Carte de Mayotte et accès aux fonctions de localisation et de signalement. »
- Itinéraire : « Préparation d’un covoiturage de Sada à Mamoudzou avec choix du parcours sur la carte. »

Spécifications officielles : https://support.google.com/googleplay/android-developer/answer/9866151?hl=fr

## Création de la bannière

Outil : image_gen intégré, compétence imagegen. Illustration marketing originale ; aucune interface de l’application n’est générée.

Prompt :

> Use case: ads-marketing. Create the final Google Play feature graphic for Covia, a carpooling app for Mayotte. Wide panoramic 1024 by 500 pixels, exact aspect 2.048:1. Elegant editorial illustration, warm welcoming modern community mobility. On the right half a compact coral-red car with three diverse adult Mahoran passengers, on a winding coastal road, lush tropical green hills and turquoise lagoon inspired by Mayotte. Soft ivory and sand colors complement rich teal and mint, referencing the app's existing turquoise-and-gold seahorse identity without creating a new logo. Left half light warm ivory negative space with immaculate readable French typography, dark teal. Exact text: 'Covia' large, 'Ensemble, sur la même voie.' beneath, 'Le covoiturage à Mayotte' smaller. Keep all text and car within the central safe area, generous margins. Polished illustration with subtle texture, restrained detail, premium but approachable. No phones, no screenshots, no badges, no price, no ranking, no other text, no watermark. Render accents correctly.
