# Design PIN conducteur et messagerie — 29 octobre 2026

## Repères récupérés dans Git

L’ancien `Chat.vue` suivi par Git (`git show HEAD:src/views/trip/Chat.vue`) utilisait l’avatar/nom du contact en tête, des bulles sortantes cyan, une icône Font Awesome `location-arrow` tournée de 45 degrés, une horloge pour l’envoi, une coche puis une double coche. Ces repères visuels sont repris ; l’ancien transport de messages et son état RAM ne sont pas réintroduits.

## PIN conducteur

Dans `BoardingCode.vue`, chaque réservation est un groupe vertical : nom lisible, champ aligné, confirmation pleine largeur, option à six chiffres sur sa propre ligne. Les détails vides du champ ne créent plus d’espace inutile ; noms et libellés longs peuvent revenir à la ligne. Le texte du dialogue peut défiler et les actions restent séparées. Le mode passager intégré reste pris en charge.

Le script de validation du PIN est inchangé : génération, durée, tentatives, quatre chiffres par défaut, bascule explicite six chiffres, effacement lors du changement de mode, confirmation serveur et paiements ne sont pas modifiés. L’aperçu n’a validé aucun PIN, même fictif : seul un champ fictif a été rempli pour vérifier son état visuel.

## Messagerie

Le passager voit directement le nom et l’avatar de son contact chauffeur fournis par le RPC, sans sélecteur. Le conducteur du **trajet concerné** peut choisir un passager. Le mode conducteur global du profil n’accorde pas ce sélecteur. L’en-tête revient au contact sélectionné et au libellé du trajet. Aucun avatar distant de remplacement n’est chargé quand il manque : une icône de personne est utilisée.

Si les métadonnées du trajet sélectionné ne permettent pas de déterminer ce rôle, une lecture Supabase/RLS ciblée de `trip(id,driver_id)` est faite pour ce seul trajet. Elle n’autorise aucune action métier ; si elle échoue, le sélecteur reste masqué. Une réponse tardive après changement de compte ou trajet est ignorée. L’accès effectif aux conversations continue d’être contrôlé côté serveur/SQL pour chaque requête.

Les mots de statut sont remplacés visuellement par des icônes, avec ces noms accessibles exacts :

- horloge : « Envoi en cours » ;
- coche : « Enregistré sur le serveur » (pas une promesse de livraison) ;
- double coche : « Lu », seulement avec `readAt` fourni par le serveur ;
- erreur : « Échec d’envoi ou confirmation indisponible » ;
- état sans identifiant ni confirmation : « Confirmation indisponible ».

L’envoi reprend la flèche originale et possède le nom accessible « Envoyer le message ». Les bulles cyan, couleurs de surface, avatars et champs s’adaptent au thème. Le compositeur et la liste suivent la hauteur visible via l’observateur de fenêtre/clavier déjà utilisé par les panneaux de l’application ; les écouteurs sont retirés à la sortie. L’historique défile séparément et conserve ses envois en attente.

La conservation de quinze jours, les accusés de lecture limités à la vue active et aux messages visibles, la pagination, les signalements, l’authentification, la reprise avec le même identifiant anti-doublon et les contrôles métier sont conservés. Aucun backend, RPC ou schéma distant modifié.

## Validation

223 tests frontend réussis (30 fichiers). Tests : les icônes expriment l’état réel, le sélecteur ne dépend que du conducteur du bon trajet, les réponses de rôle tardives sont rejetées. Les tests existants couvrent envoi incertain/reprise sans doublon, lecture, expiration, signalements et validation PIN. Lint ciblé et compilation de production vérifiés.

Aperçu à 390 px, avec composants réels et comptes/messages/PIN entièrement fictifs : passager sans choix, conducteur avec choix, avatar/nom, quatre états de message, flèche d’envoi, PIN conducteur clair/sombre avec champ renseigné mais jamais confirmé. Les services réseau de cet aperçu sont remplacés par des fixtures. Le comportement du clavier matériel/natif sur téléphone réel reste à recetter ; cet aperçu ne constitue pas une confirmation de PIN ni un envoi distant.

Aucun compte, photo, message, paiement ou PIN réel n’a été modifié. Aucun commit, push, déploiement, modification de `.env` ou migration distante.
