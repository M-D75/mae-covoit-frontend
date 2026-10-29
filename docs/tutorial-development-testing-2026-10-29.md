# Réactivation du tutoriel pour les essais locaux

Modification temporaire limitée au tutoriel, active automatiquement quand `NODE_ENV === 'development'` (serveur frontend local de développement). Aucune variable supplémentaire et aucun changement de `.env` ne sont nécessaires.

En développement :

- les anciens états `covia-help-v1:<compte>:<rôle>` et `covia-help-progress-v2:<compte>:<rôle>` ne sont ni lus ni écrits, en mémoire de cache comme dans localStorage ; ils ne sont pas effacés ;
- la progression des deux étapes reste dans la demande ouverte en mémoire ; une demande identique déjà ouverte n’est pas réinitialisée ;
- lorsque les vrais cadres apparaissent dans le profil, une aide démarre au plus une fois par entrée pour le compte présent ;
- Passer et Terminer ferment volontairement cette ouverture, sans nouvelle apparition au prochain rendu ; une demande provenant d’une réservation/publication ou d’un rejeu est également comptée comme l’ouverture de cette entrée ;
- quitter le profil puis y revenir, recharger la page, ou utiliser Revoir l’aide permet de recommencer. Le rejeu explicite repart de la première étape. Si aucun vrai cadre de trajet n’est disponible, aucun cadre fictif n’est créé.

Pour tester : ouvrir le frontend local de développement, entrer dans le profil avec un trajet réel affiché, avancer puis Passer ou Terminer. Vérifier que l’aide reste fermée sur cette page. Recharger, ou quitter puis revenir au profil : les anciennes clés enregistrées ne bloquent plus la réactivation. Revoir l’aide permet aussi un nouveau parcours sans rechargement.

En production (et hors mode développement), la mémorisation existante reste active, isolée par compte et rôle. Le démarrage automatique sur entrée de profil n’est pas ajouté en production. Aucun autre cache, session d’authentification, état de version ou de messagerie n’est modifié. Aucun effacement global de localStorage, aucun appel réseau ou action métier supplémentaire.

Fichiers : `src/services/contextualHelp.js` pour la garde de développement et la lecture/écriture du tutoriel ; `src/components/ContextualHelp.vue` pour la limite d’une ouverture par entrée et la réactivation locale. Tests : `tests/unit/tutorialTestingMode.spec.js`, plus les tests existants de guidage et de parcours de profil.
